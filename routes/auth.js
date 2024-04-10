const express = require('express');
const {validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const ExtractJwt = require('passport-jwt').ExtractJwt;
const JwtStrategy = require('passport-jwt').Strategy;
const crypto = require('crypto');
const { log, logError } = require('../utils');
const router = express.Router();

const COOKIE_NAME = '__dxts';
const COOKIE_MAX_AGE = 3600000;
const JWT_EXPIRY = '3h';
const JWT_STRATEGY_NAME = 'jwt_strategy';
const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromExtractors([
		(req) => {
			let token = null;
			if (req && req.cookies)
				token = req.cookies[COOKIE_NAME];

			return token;
		}
	]),
	secretOrKey: process.env.SECRET || crypto.randomBytes(32).toString('hex')
}

function initializeAuthRouter(Users) {
	passport.use(JWT_STRATEGY_NAME, new JwtStrategy(jwtOptions, async (payload, done) => {
		log("verifying token", 'yellow');
		const user = await Users.findOne({ where: { id: payload.id } });

		if (user)
			return done(null, user);

		else {
			log("User not found", 'red');
			return done(null, false);
		}
	}));

	const authenticateMiddleware = (req, res, next) => {
		passport.authenticate(JWT_STRATEGY_NAME, { session: false }, (err, user) => {
			if (err)
				return next(err);

			console.log("isUser", !!user);

			if (!user)
				return res.status(401).json({ success: false, error: "Unauthorized" });

			req.login(user, { session: false }, (loginErr) => {
				if (loginErr)
					return next(loginErr);

				return next();
			});
		})(req, res, next);
	}

	router.post('/login', async (req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				logError('ValidationResult errors: ', errors.array());

				return res.status(400).json({
					errors: errors.array(),
					errorType: "unknownError"
				});
			}

			const { username, password } = req.body;

			if(!username) {
				logError('Username not provided');

				return res.status(400).json({
					error: 'Username is required',
					errorType: "usernameError"
				});
			}

			if(!password) {
				logError('Password not provided');

				return res.status(400).json({
					error: 'Password is required',
					errorType: "passwordError"
				});
			}

			const user = await Users.findOne({ where: { username } });

			if (!user) {
				logError('User not found')

				return res.status(404).json({
					success: false,
					error: 'User not found',
					errorType: "usernameError"
				});
			}

			// Check if the password matches
			bcrypt.compare(password, user.password, async (compareError, result) => {
				if (compareError) {
					logError('Error comparing passwords: ', compareError);

					return res.status(500).json({
						success: false,
						error: compareError,
						errorType: "unknownError"
					});
				}

				if (!result) {
					logError('Incorrect password');

					return res.status(401).json({
						success: false,
						error: 'Incorrect username or password',
						errorType: "formError"
					});
				}

				await generateTokenAndHandleResponse(user, res);
			});
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error registering user', raw: err });
		}
	});

	router.post('/register', async (req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				logError('Error registering user', errors.array());

				return res.status(400).json({
					errors: errors.array() ,
					errorType: "unknownError"
				});
			}

			const { username, password, email, role } = req.body;

			if (!username) {
				logError('Username not provided');

				return res.status(400).json({
					error: 'Username is required',
					errorType: "usernameError"
				});
			}

			if (!password) {
				logError('Password not provided');

				return res.status(400).json({
					error: 'Password is required',
					errorType: "passwordError"
				});
			}

			// Check if the user already exists
			const user = await Users.findOne({ where: { username } });

			if (user) {
				logError('User already exists');

				return res.status(400).json({
					error: 'User already exists',
					errorType: "usernameError"
				});
			}

			// Hash the password before saving it
			bcrypt.hash(password, 10, async (hashErr, hashedPassword) => {
				if (hashErr) {
					logError('Error hashing password', hashErr);

					return res.status(500).json({
						error: 'Error hashing password',
						raw: hashErr,
						errorType: "unknownError"
					});
				}

				const user = await Users.create({
					username,
					password: hashedPassword,
					email,
					role: role || 'user'
				}).catch((err) => {
					logError('Error creating user', err.message)

					return res.status(500).json({
						success: false,
						error: 'Error creating user',
						raw: err.message,
						errorType: "unknownError"
					});
				});

				if (!user) {
					logError('Error creating user');

					return res.status(500).json({
						success: false,
						error: 'Error creating user',
						errorType: "unknownError"
					});
				}

				return res.json({
					success: true,
					message: "User registered successfully"
				});
			});
		}

		catch (err) {
			logError('Error registering user', err.message)

			return res.status(500).json({
				success: false,
				error: 'Error registering user',
				raw: err,
				errorType: "unknownError"
			});
		}
	});

	router.get('/verify', authenticateMiddleware, (req, res) => {
		log("GET /verify", 'yellow');

		res.json({ success: true, message: 'Authenticated successfully', role: req?.user?.role});
	});

	router.get('/logout', (req, res) => {
		log("GET /logout", 'yellow');

		res.clearCookie(COOKIE_NAME);

		req.logout((err) => {
			if (err) {
				return res.status(500).json({ success: false, error: 'Error logging out', raw: err });
			}

			return res.json({ success: true });
		});
	});

	return { authRouter: router, passport, authenticateMiddleware }
}

async function generateTokenAndHandleResponse(user, res) {
	try {
		const token = await signToken({ id: user.id });

		if (!token) {
			logError('Error generating token');

			return res.status(500).json({
				success: false,
				error: 'Error generating token',
				errorType: "unknownError"
			});
		}

		res.cookie(COOKIE_NAME, token, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: COOKIE_MAX_AGE
		});

		log("User logged in successfully", 'green')

		return res.json({
			success: true,
			message: "Logged in successfully"
		});
	}

	catch (err) {
		logError('Error caught generating token', err.message);

		return res.status(500).json({
			success: false,
			error: 'Error caught generating token',
			raw: err.message,
			errorType: "unknownError"
		});
	}
}

function signToken(payload) {
	return new Promise((resolve, reject) => {
		jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: JWT_EXPIRY }, (err, token) => {
			if (err) {
				reject(err);
			} else {
				resolve(token);
			}
		});
	});
}

module.exports = { initializeAuthRouter };
