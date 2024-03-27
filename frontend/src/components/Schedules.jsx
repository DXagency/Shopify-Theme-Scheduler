import React, { useState, useEffect } from 'react';
import {BlockStack, DataTable, Text} from '@shopify/polaris';
import { createSchedule, getSchedules, updateSchedule, deleteSchedule } from '../utils';

const Schedules = () => {
	const [schedules, setSchedules] = useState([]);
	const headings = ['ID', 'Name', 'URL', 'Status'];
	const columnContentTypes = ['text', 'text', 'text', 'text'];

	useEffect(() => {
		getSchedules().then((schedules) => {
			setSchedules(schedules);
		});
	}, []);

	return (
			<BlockStack>
				<DataTable
						columnContentTypes={columnContentTypes}
						headings={headings}
						rows={schedules.map((schedule) => {
							return [
								schedule?.id || 'N/A',
								schedule?.name || 'N/A',
								schedule?.url || 'N/A',
								schedule?.status || 'N/A'
							];
						})}
				/>
			</BlockStack>
	);
};

export default Schedules;
