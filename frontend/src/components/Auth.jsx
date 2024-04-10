import {
	BlockStack,
	Text,
	Card,
	Form,
	FormLayout,
	TextField,
	Button,
	InlineStack,
	InlineError,
	Toast,
	Box,
	SkeletonDisplayText,
	Select
} from '@shopify/polaris';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {verifyLogin, logout} from "../utils";
import logo from "../assets/logo.svg";

const AuthComponent = ({ mode }) => {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		role: 'user'
	});
	const [formError, setFormError] = useState({
		username: '',
		password: '',
		form: ''
	});
	const [showPassword, setShowPassword] = useState(false);
	const [verified, setVerified] = useState(false);
	const [toast, setToast] = useState({
		active: false,
		content: '',
		error: false
	});

	const toastMarkup = toast.active ? (
		<Toast
			content={toast.content}
			error={toast.error}
			onDismiss={() => setToast({ active: false, content: '', error: false })}
		/>
	) : null;

	const navigate = useNavigate();

	const api = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : '/';

	const handleSubmit = async (e) => {
		e.preventDefault();

		setFormError({
			username: '',
			password: '',
			form: ''
		});

		try {
			if (mode === 'register') {
				await axios.post(`${api}auth/register`, formData);

				setFormData({
					username: '',
					password: '',
					role: 'user'
				})

				setToast({
					active: true,
					content: 'User Registered',
					error: false
				})
			}

			else {
				await axios.post(`${api}auth/login`, formData);

				navigate('/');
			}
		} catch (e) {
			console.error('Authentication error:', e.response.data);

			switch (e.response.data.errorType) {
				case 'usernameError':
					setFormError(prev => {
						return {
							...prev,
							username: e.response.data.error
						}
					});
					break;

				case 'passwordError':
					setFormError(prev => {
						return {
							...prev,
							password: e.response.data.error
						}
					});
					break;

				case 'formError':
					setFormError(prev => {
						return {
							...prev,
							form: e.response.data.error
						}
					});
					break;

				default:
					setFormError(prev => {
						return {
							...prev,
							form: 'An unknown error occurred. Please try again.'
						}
					});
					break;
			}

			// TODO: Display error message and error toast
			setToast({
				active: true,
				content: (mode === 'register' ? 'Registration' : 'Login') + ' Failed',
				error: true
			})
		}
	};

	useEffect(() => {
		if (mode === 'logout') {
			logout().then(() => {
				navigate('/login');
			})
		}

		verifyLogin().then((role) => {
			if (role) {
				if (mode === 'login') {
					navigate('/');
				}
			}

			if (mode === 'register' && role !== 'admin') {
				navigate('/');
			}

			setVerified(true);
		});
	}, []);

	return (
		<Box paddingBlock='800'>
			<BlockStack gap='400'>
				<InlineStack align='center' gap='400' blockAlign='center'>
					<img src={logo} alt='logo' />
				</InlineStack>

				<Card>
					{
						verified ? (
								<BlockStack gap='400'>
									<Text as='h2' variant='headingLg'>
										{mode === 'register' ? 'Register User' : 'Login'}
									</Text>

									<Form onSubmit={handleSubmit}>
										<FormLayout>
											<TextField
													label='Username'
													autoComplete='off'
													value={formData.username}
													onChange={(value) => {
														setFormData({
															...formData,
															username: value
														})
													}}
													error={formError.username}
											/>

											<TextField
													label='Password'
													type={showPassword ? 'text' : 'password'}
													autoComplete='off'
													suffix={
														<Button variant='plain' onClick={() => setShowPassword(!showPassword)}>
															{ showPassword ? 'Hide' : 'Show' }
														</Button>
													}
													value={formData.password}
													onChange={(value) => {
														setFormData({
															...formData,
															password: value
														})
													}}
													error={formError.password}
											/>

											{
												mode === 'register' && (
													<Select
															label='Role'
															value={formData.role}
															onChange={(value) => {
																setFormData({
																	...formData,
																	role: value
																})
															}}
															options={[
																{ label: 'User', value: 'user' },
																{ label: 'Admin', value: 'admin' }
															]}
													/>
												)
											}

											<Button variant='primary' submit>
												{mode === 'register' ? 'Register User' : 'Login'}
											</Button>

											{
												formError.form && (
														<InlineError
																message={formError.form}
																fieldID='form-error'
														/>
												)
											}
										</FormLayout>
									</Form>
								</BlockStack>
						) : (
								<BlockStack gap='400'>
									<Form onSubmit={() => {}}>
										<FormLayout>
											<SkeletonDisplayText size='small' />

											<SkeletonDisplayText maxWidth='100%' />

											<SkeletonDisplayText size='small' />

											<SkeletonDisplayText maxWidth='100%' />

											<Button variant='primary' submit loading>
												{mode === 'register' ? 'Register User' : 'Login'}
											</Button>
										</FormLayout>
									</Form>
								</BlockStack>
						)
					}
				</Card>
			</BlockStack>

			{ toastMarkup }
		</Box>
	);
};

export default AuthComponent;
