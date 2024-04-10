import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyLogin } from '../utils';
import {BlockStack, InlineStack, Spinner, Text, Box, Link } from '@shopify/polaris';
import Stores from './Stores';
import Schedules from "./Schedules";
import Accounts from "./Accounts";

import '../app.scss'
import logo from "../assets/logo.svg";

const Home = () => {
	const navigate = useNavigate();

	const [update, setUpdate] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		verifyLogin()
			.then((role) => {
				if (!role) {
					console.log('Not authenticated');

					navigate('/login');
				}

				else {
					setIsAuthenticated(true);
				}
			});
	}, []);

	useEffect(() => {
		if (update) {
			setUpdate(false);
		}
	}, [update]);

	return (
			<Box>
				{ isAuthenticated ? (
						<BlockStack align='center' gap='800'>
							<InlineStack align='center' gap='400' blockAlign='center'>
								<img src={logo} alt='logo' />
							</InlineStack>

							<Stores setUpdate={setUpdate} />

							<Schedules update={update} />
						</BlockStack>
				) : (
						<BlockStack gap='400'>
							<InlineStack align='center' gap='400' blockAlign='center'>
								<Spinner accessibilityLabel="Spinner example" size="small" />
							</InlineStack>

							<InlineStack align='center' gap='400' blockAlign='center'>
								<Text as='h2' variant='headingXl'>
									Verifying login...
								</Text>
							</InlineStack>
						</BlockStack>
				)}
			</Box>
	);
};

export default Home;
