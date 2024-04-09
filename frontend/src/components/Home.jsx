import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyLogin } from '../utils';
import {Tabs, Card, BlockStack} from '@shopify/polaris';
import Stores from './Stores';
import Schedules from "./Schedules";
import Accounts from "./Accounts";

import '../app.scss'

const Home = () => {
	const navigate = useNavigate();

	const [update, setUpdate] = useState(false);

	useEffect(() => {
		verifyLogin(navigate)
			.then((role) => {
				if (!role) {
					navigate('/login');
				}
			});
	}, []);

	useEffect(() => {
		if (update) {
			setUpdate(false);
		}
	}, [update]);

	return (
			<BlockStack align='center' gap='800'>
				<Stores setUpdate={setUpdate} />

				<Schedules update={update} />
			</BlockStack>
	);
};

export default Home;
