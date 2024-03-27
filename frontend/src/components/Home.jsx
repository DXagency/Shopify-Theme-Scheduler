import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyLogin } from '../utils';
import { Tabs, Card } from '@shopify/polaris';
import Stores from './Stores';
import Schedules from "./Schedules";
import Accounts from "./Accounts";

import '../app.scss'

const Home = () => {
	const navigate = useNavigate();

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
			<Card></Card>
	);
};

export default Home;
