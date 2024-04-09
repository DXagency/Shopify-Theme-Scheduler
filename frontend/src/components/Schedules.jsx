import React, { useState, useEffect } from 'react';
import {
	BlockStack,
	Button,
	DataTable,
	Icon,
	InlineStack,
	Text,
	Tooltip,
	Modal,
	FormLayout, InlineError,
	SkeletonBodyText
} from '@shopify/polaris';
import { getSchedules, updateScheduleAction } from '../utils';

import {
	PlayCircleIcon,
	StopCircleIcon
} from '@shopify/polaris-icons';

import moment from 'moment';

const Schedules = (props) => {
	const headings = ['', 'Store Name', 'Theme', 'Scheduled At', 'Status'];
	const columnContentTypes = ['text', 'text', 'text', 'text', 'text'];
	const startTitle = 'Start Schedule';
	const stopTitle = 'Stop Schedule';
	const pageTitle = 'Schedules';
	const updateScheduleActionTitle = 'Update Schedule Action';

	const [schedules, setSchedules] = useState([]);
	const [isSchedulesEmpty, setIsSchedulesEmpty] = useState(false);
	const [updateActionModal, setUpdateActionModal] = useState({
		active: false,
		schedule: {},
		isInPast: false,
		action: '',
		error: ''
	});

	useEffect(updateScheduleState, []);

	useEffect(() => {
		if (props.update) {
			updateScheduleState();
		}
	}, [props]);

	return (
			<>
				<BlockStack gap='400'>
					<InlineStack gap='400' align='space-between'>
						<Text as='h2' variant="headingXl">
							{ pageTitle }
						</Text>
					</InlineStack>

					{ schedules.length !== 0 ? (
							<DataTable
									columnContentTypes={columnContentTypes}
									headings={headings}
									rows={schedules.map(schedule => {
										return [
											<InlineStack gap='100' key={schedule.id}>
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
																	disabled={moment(schedule?.scheduledAt).diff(moment(), 'minutes') < 0}
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
					) : (
							<DataTable columnContentTypes={columnContentTypes} headings={headings} rows={
								Array(20).fill(0).map(() => {
									return headings.map(heading => <SkeletonBodyText lines={1} key={heading} />);
								})
							} />
					)}
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
			</>
	);

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

				updateScheduleState();
			});
	}

	function updateScheduleState() {
		getSchedules().then((schedules) => {
			schedules.sort((a, b) => {
				if (a.enabled && !b.enabled) {
					return -1;
				}

				if (moment(b.scheduledAt).diff(moment(a.scheduledAt)) === 0) {
					return b.id - a.id;
				}

				return moment(b.scheduledAt).diff(moment(a.scheduledAt));
			});

			setSchedules(schedules);

			closeAllModals();
		});
	}
};

export default Schedules;
