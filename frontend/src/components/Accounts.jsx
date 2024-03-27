import React, { useState, useEffect } from 'react';
import { Text } from '@shopify/polaris';

const Accounts = () => {
	console.log('Accounts');

	useEffect(() => {}, []);

	return (
		<Text as="h2" variant="bodyMd">
			Hi Accounts
		</Text>
	);
};

export default Accounts;
