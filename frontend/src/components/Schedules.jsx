import React, { useState, useEffect } from 'react';
import {BlockStack, DataTable, Text} from '@shopify/polaris';
import { createSchedule, getSchedules, updateSchedule, deleteSchedule } from '../utils';

import moment from 'moment';

const Schedules = () => {
	const [schedules, setSchedules] = useState([]);
	const headings = ['ID', 'Store', 'Theme', 'Scheduled At', 'Status'];
	const columnContentTypes = ['text', 'text', 'text', 'text', 'text'];

	useEffect(() => {
		getSchedules().then((schedules) => {
			console.log('schedules', schedules)
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
								schedule?.storeName || 'N/A',
								schedule?.themeName || 'N/A',
								moment(schedule?.scheduledAt).format('MMM do, YYYY hh:mm a') || 'N/A',
								schedule?.enabled ? 'Enabled' : 'Disabled'
							];
						})}
				/>
			</BlockStack>
	);
};

export default Schedules;
