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
			console.log("errors", errors);

			if (!errors.isEmpty()) {
				logError('Error registering user', errors.array());
				return res.status(400).json({ errors: errors.array() });
			}

			const { username, password } = req.body;
			console.log("username", username);
			console.log("password", password);

			// Find the user in your database
			const user = await Users.findOne({ where: { username } });

			if (!user)
				return res.status(404).json({ success: false, error: 'User not found' });

			// Check if the password matches
			bcrypt.compare(password, user.password, async (compareError, result) => {
				if (compareError)
					return res.status(500).json({ success: false, error: 'Error comparing passwords', raw: compareError });

				if (!result)
					return res.status(401).json({ success: false, error: 'Incorrect password' });

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
				return res.status(400).json({ errors: errors.array() });
			}

			const { username, password, email } = req.body;

			if (!username || !password) {
				return res.status(400).json({ error: 'Username and password are required' });
			}

			// Check if the user already exists
			const user = await Users.findOne({ where: { username } });

			if (user)
				return res.status(400).json({ error: 'User already exists' });

			// Hash the password before saving it
			bcrypt.hash(password, 10, async (hashErr, hashedPassword) => {
				if (hashErr) {
					logError('Error hashing password', hashErr);
					return res.status(500).json({ error: 'Error hashing password', raw: hashErr });
				}

				const user = await Users.create({
					username, password:
					hashedPassword,
					email
				}).catch((err) => {
					return res.status(500).json({ success: false, error: 'Error creating user', raw: err.message });
				});

				await generateTokenAndHandleResponse(user, res);
			});
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error registering user', raw: err });
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

	async function generateTokenAndHandleResponse(user, res) {
		try {
			const token = await signToken({ id: user.id });

			res.cookie(COOKIE_NAME, token, {
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: COOKIE_MAX_AGE
			});

			log("User logged in successfully", 'green')

			return res.json({ success: true, message: "Logged in successfully" });
		} catch (err) {
			return res.status(500).json({ success: false, error: 'Error occurred', raw: err.message });
		}
	}
}

module.exports = { initializeAuthRouter };
