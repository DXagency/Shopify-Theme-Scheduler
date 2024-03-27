import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { verifyLogin } from '../utils';

const AuthComponent = ({ mode }) => {
	const [formData, setFormData] = useState({ username: '', password: '' });
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();
	const API = 'http://localhost:3000/auth/login'
	
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};
	
	const handleSubmit = async (e) => {
		e.preventDefault();
		
		try {
			const response = await axios.post(API, formData);
			console.log('Login successful:', response);
			navigate('/');
		} catch (error) {
			console.error('Authentication error:', error.response.data);
		}
	};
	
	// Check if the user is already logged in
	useEffect(() => {
		verifyLogin(navigate).then((isVerified) => {
			if (isVerified)
				navigate('/');
			
			setIsLoading(false);
		});
	}, []);
	
	return (
		isLoading ? <div>Loading...</div> :
		<div>
			<h2>Login</h2>
			
			<form onSubmit={handleSubmit}>
				<label>
					<span>Username</span>
					
					<input
						type="text"
						id="username"
						name="username"
						value={formData.username}
						onChange={handleChange}
					/>
				</label>
				
				<label>
					<span>Password</span>
					
					<input
						type="password"
						id="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
					/>
				</label>
				
				<button type="submit">Login</button>
				
				<button type="button" onClick={() => navigate('/register')}>
					Register
				</button>
			</form>
		</div>
	);
};

export default AuthComponent;
