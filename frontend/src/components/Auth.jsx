import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthComponent = ({ mode }) => {
	const [formData, setFormData] = useState({ username: '', password: '' });
	const navigate = useNavigate();
	
	const api = 'http://localhost:3000/auth'
	
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};
	
	const handleSubmit = async (e) => {
		e.preventDefault();
		
		try {
			if (mode === 'register') {
				const response = await axios.post(`${api}/register`, formData);
				console.log('Registration successful:', response.data);
			}
			
			else {
				const response = await axios.post(`${api}/login`, formData);
				console.log('Login successful:', response.data);
				
				// Store the JWT token in local storage or cookies
				localStorage.setItem('token', response.data.token);
				
				// Redirect to a protected route (e.g., '/dashboard')
				navigate('/dashboard');
			}
		} catch (error) {
			console.error('Authentication error:', error.response.data);
		}
	};
	
	// Check if the user is already logged in
	useEffect(() => {
		const token = localStorage.getItem('token');
		
		if (mode === 'logout') {
			localStorage.removeItem('token');
			console.log('Logged out');
			navigate('/');
		}
		
		if (token) {
			navigate('/dashboard');
		}
	});
	
	return (
		<div>
			<h2>{mode === 'register' ? 'Register' : 'Login'}</h2>
			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="username">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						value={formData.username}
						onChange={handleChange}
					/>
				</div>
				<div>
					<label htmlFor="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
					/>
				</div>
				<button type="submit">{mode === 'register' ? 'Register' : 'Login'}</button>
			</form>
		</div>
	);
};

export default AuthComponent;
