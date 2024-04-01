import React, { useState, useEffect } from 'react';
import {
	BlockStack,
	Button,
	DataTable,
	Icon,
	InlineStack,
	Text,
	Tooltip,
	Page,
	Modal,
	FormLayout, TextField, InlineError
} from '@shopify/polaris';
import { createScheduleV2, getSchedules, updateSchedule, deleteSchedule, updateScheduleAction } from '../utils';

import {
	PlayCircleIcon,
	StopCircleIcon
} from '@shopify/polaris-icons';

import moment from 'moment';

const Schedules = () => {
	const headings = ['', 'Store Name', 'Theme', 'Scheduled At', 'Status'];
	const columnContentTypes = ['text', 'text', 'text', 'text', 'text'];
	const startTitle = 'Start Schedule';
	const stopTitle = 'Stop Schedule';
	const pageTitle = 'Schedules';
	const updateScheduleActionTitle = 'Update Schedule Action';
	const defaultOffset = 31;

	const [schedules, setSchedules] = useState([]);
	const [updateActionModal, setUpdateActionModal] = useState({
		active: false,
		schedule: {},
		isInPast: false,
		action: '',
		error: ''
	});
	const [selectedDate, setSelectedDate] = useState({
		month: moment().month(),
		year: moment().year(),
		selected: new Date(),
		selectedText: moment().format('MM/DD/YYYY'),
		datePickerActive: false
	});
	const [selectedTime, setSelectedTime] = useState({
		hour: moment().add(defaultOffset, 'minutes').format('h'),
		hour24: moment().add(defaultOffset, 'minutes').format('HH'),
		minute: moment().add(defaultOffset, 'minutes').format('m'),
		meridiem: moment().add(defaultOffset, 'minutes').format('A'),
		selectedText: moment().add(defaultOffset, 'minutes').format('hh:mm A'),
		time24: moment().add(defaultOffset, 'minutes').format('HH:MM'),
		timePickerActive: false
	});

	useEffect(() => {
		getSchedules().then((schedules) => {
			console.log('schedules', schedules)
			setSchedules(schedules);
		});
	}, []);

	return (
			<Page title={pageTitle} primaryAction={
				<Button variant='primary' onClick={ () => openModal('add') }>New</Button>
			}>
				<BlockStack>
					<DataTable
							columnContentTypes={columnContentTypes}
							headings={headings}
							rows={schedules.map((schedule) => {
								return [
									<InlineStack gap='100'>
										{ schedule?.enabled ? (
												<Tooltip content={stopTitle}>
													<Button
														variant='plain'
														tone='critical'
														onClick={ () => openUpdateActionModal('stop', schedule)}
														disabled={!schedule?.enabled}
													>
														<Icon source={ StopCircleIcon } accessibilityLabel={stopTitle} />
													</Button>
												</Tooltip>
										) : (
												<Tooltip content={startTitle}>
													<Button
														variant='plain'
														tone='success'
														onClick={ () => openUpdateActionModal('start', schedule)}
														disabled={schedule?.enabled}
													>
														<Icon source={ PlayCircleIcon } accessibilityLabel={startTitle} />
													</Button>
												</Tooltip>
										)
										}
									</InlineStack>,
									schedule?.storeName || 'N/A',
									schedule?.themeName || 'N/A',
									moment(schedule?.scheduledAt).format('MMM Do, YYYY hh:mm a') || 'N/A',
									schedule?.enabled ? 'Enabled' : 'Stopped'
								];
							})}
					/>
				</BlockStack>

				<Modal open={ updateActionModal.active } title={ updateScheduleActionTitle } onClose={ closeAllModals }>
					<Modal.Section>
						<FormLayout>
							<Text as={'h3'}>
								Are you sure you want to
                <Text
										as='span'
										tone={updateActionModal.action === 'stop' ? 'critical' : ''}
										fontWeight='bold'
								> { updateActionModal.action.toUpperCase() } </Text>
								this schedule?
							</Text>

							{ updateActionModal.isInPast &&
									<BlockStack>
										<Text as='p'>
											<Text tone='critical' as='span'>This schedule is set in the past!</Text>
										</Text>
									</BlockStack>
							}

							{ updateActionModal.error &&
									<InlineError
											message={updateActionModal.error}
											fieldID='update-action-error'
									/>
							}
						</FormLayout>
					</Modal.Section>

					<Modal.Section>
						<InlineStack gap='400' align='end'>
							<Button variant='plain' onClick={closeAllModals}>Cancel</Button>
							<Button variant='primary' onClick={handleScheduleAction}>Save</Button>
						</InlineStack>
					</Modal.Section>
				</Modal>
			</Page>
	);

	function openModal(modal) {
		switch (modal) {
		}
	}

	function openUpdateActionModal(action, schedule) {
		const diff = moment(schedule.scheduledAt).diff(moment(), 'minutes');

		setUpdateActionModal({
			active: true,
			schedule: schedule,
			action: action,
			isInPast: diff < 0,
			error: ''
		});
	}

	function closeAllModals() {
		setUpdateActionModal({ active: false, schedule: {}, action: '', error: '' });
	}

	function handleScheduleAction() {
		updateScheduleAction(updateActionModal.schedule.id, updateActionModal.action)
			.then((data) => {
				if (data?.error) {
					setUpdateActionModal({ ...updateActionModal, error: data.error });
					return;
				}

				getSchedules().then((schedules) => {
					console.log('schedules', schedules)
					setSchedules(schedules);

					closeAllModals();
				});
			});
	}
};

export default Schedules;
