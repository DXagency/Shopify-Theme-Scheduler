import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {BlockStack, Text, Card, FormLayout, TextField, Button, InlineStack} from '@shopify/polaris';
import {verifyLogin, logout} from "../utils";

const AuthComponent = ({ mode }) => {
	const [formData, setFormData] = useState({
		username: '',
		password: ''
	});
	const [showPassword, setShowPassword] = useState(false);
	const [verified, setVerified] = useState(false);
	const navigate = useNavigate();

	const api = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : '/';

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			if (mode === 'register') {
				await axios.post(`${api}auth/register`, formData);

				// TODO: Success Toast
			}

			else {
				const response = await axios.post(`${api}auth/login`, formData);

				localStorage.setItem('token', response.data.token);

				navigate('/');
			}
		} catch (error) {
			console.error('Authentication error:', error.response.data);

			// TODO: Display error message and error toast
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
		<Card>
			{
				verified ? (
						<BlockStack gap='400'>
							<Text as='h2' variant='headingLg'>
								{mode === 'register' ? 'Register User' : 'Login'}
							</Text>

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
								/>
							</FormLayout>

							<InlineStack>
								<Button variant='primary' onClick={handleSubmit}>
									{mode === 'register' ? 'Register User' : 'Login'}
								</Button>
							</InlineStack>

						</BlockStack>
				) : (
						<Text as='p'>Loading...</Text>
				)
			}


		</Card>
	);
};

export default AuthComponent;
