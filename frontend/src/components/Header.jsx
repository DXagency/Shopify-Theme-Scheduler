import React, { useState, useEffect } from 'react';
import {InlineStack, Text} from '@shopify/polaris';
import { useLocation, useNavigate, Link } from "react-router-dom";
import {verifyLogin} from "../utils";

import logo from '../assets/logo.svg';

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const navigationItems = [];
	const navigationElements = navigationItems.map((item, index) => {
		return (
			<Link to={item.path} monochrome removeUnderline key={index}
				className={location.pathname === item.path ? 'active' : ''}
			>
				<Text as='span' tone={location.pathname === item.path ? 'critical' : 'magic'}>
					{item.label}
				</Text>
			</Link>
		);
	});

	useEffect(() => {
		verifyLogin(navigate)
				.then((isVerified) => {
					if (!isVerified) {
						navigate('/login');
					}
				});

		return () => {}
	}, []);

	return (
		<InlineStack align='center' gap='400' blockAlign='center'>
			<img src={logo} alt='logo' />
		</InlineStack>
	);
};

export default Header;
