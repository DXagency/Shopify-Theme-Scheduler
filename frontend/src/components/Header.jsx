import React, { useEffect } from 'react';
import {InlineStack, Text} from '@shopify/polaris';
import { useLocation, useNavigate, Link } from "react-router-dom";
import {verifyLogin} from "../utils";

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const navigationItems = [];
	const navigationElements = navigationItems.map((item, index) => {
		return (
			<Link monochrome removeUnderline to={item.path} key={index}
					className={location.pathname === item.path ? 'active' : ''}
			>
				<Text as='span' tone={location.pathname === item.path ? 'critical' : 'magic'}>
					{item.label}
				</Text>
			</Link>
		);
	});

	return (
		<InlineStack align='center' gap='400' blockAlign='center'>
			{ navigationElements }
		</InlineStack>
	);
};

export default Header;
