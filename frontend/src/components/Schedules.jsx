import React, {useState, useEffect, useCallback} from 'react';
import {
	BlockStack,
	Button,
	DataTable,
	Icon,
	InlineStack,
	Text,
	Tooltip,
	Modal,
	FormLayout,
	InlineError,
	SkeletonBodyText, Card, SkeletonDisplayText
} from '@shopify/polaris';
import {
	PlayCircleIcon,
	StopCircleIcon
} from '@shopify/polaris-icons';
import moment from 'moment';
import { getSchedules, updateScheduleAction } from '../utils';

const Schedules = (props) => {
	const startTitle = 'Start Schedule';
	const stopTitle = 'Stop Schedule';
	const pageTitle = 'Schedules';
	const updateScheduleActionTitle = 'Update Schedule Action';
	const headings = ['', 'Store Name', 'Theme', 'Scheduled At', 'Status'];
	const columnContentTypes = ['text', 'text', 'text', 'text', 'text'];

	const [schedules, setSchedules] = useState([]);
	const [updateActionModal, setUpdateActionModal] = useState({
		active: false,
		schedule: {},
		isInPast: false,
		action: '',
		error: ''
	});
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({
		page: 1,
		rowsPerPage: 5,
		rows: []
	});

	useEffect(refreshScheduleState, []);

	useEffect(() => {
		if (props.update) {
			refreshScheduleState();
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

					{ !loading ? schedules.length !== 0 ? (
							<DataTable
									columnContentTypes={columnContentTypes}
									headings={headings}
									rows={pagination.rows.map(schedule => {
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
									pagination={ schedules.length > pagination.rowsPerPage ? {
										label: `Page ${pagination.page} of ${Math.ceil(schedules.length / pagination.rowsPerPage)}`,
										hasPrevious: pagination.page > 1,
										hasNext: pagination.page < Math.ceil(schedules.length / pagination.rowsPerPage),
										onPrevious: () => handlePagination('prev'),
										onNext: () => handlePagination('next')
									} : false}
									sortable={[false, true, false, true, true]}
									onSort={handleSort}
							/>
					) : (
							<Card>
								<BlockStack gap='200'>
									<Text as='h2' variant='bodyLg'>
										No schedules found, create one to get started!
									</Text>
								</BlockStack>
							</Card>
					)
					: (
						<DataTable
							columnContentTypes={columnContentTypes}
							headings={headings}
							rows={
								Array(pagination.rowsPerPage).fill(0).map(() => {
									return headings.map(heading => <SkeletonDisplayText maxWidth='100%' size='small' key={heading} />);
								})
							}
						/>
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

				refreshScheduleState();
			});
	}

	function refreshScheduleState() {
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

			setLoading(false);
			setPagination({
				...pagination,
				page: 1,
				rows: getPaginatedRows(schedules, 1, pagination.rowsPerPage)
			});
			setSchedules(schedules);

			closeAllModals();
		});
	}

	function getPaginatedRows(rows, page, rowsPerPage) {
		const start = (page - 1) * rowsPerPage;
		const end = start + rowsPerPage;

		return rows.slice(start, end);
	}

	function handlePagination(direction = 'next') {
		const page = pagination.page + (direction === 'next' ? 1 : -1);
		const rows = getPaginatedRows(schedules, page, pagination.rowsPerPage);

		setPagination({ ...pagination, page, rows });
	}

	function handleSort(index, direction) {
		const sortedSchedules = schedules.sort((a, b) => {
			switch (index) {
				case 1:
					return direction === 'ascending' ? a.storeName.localeCompare(b.storeName) : b.storeName.localeCompare(a.storeName);
				case 3:
					return direction === 'ascending' ? moment(a.scheduledAt).diff(moment(b.scheduledAt)) : moment(b.scheduledAt).diff(moment(a.scheduledAt));
				case 4:
					return direction === 'ascending' ? a.enabled - b.enabled : b.enabled - a.enabled;
				default:
					return 0;
			}
		})

		setSchedules(sortedSchedules);
		setPagination({
			...pagination,
			page: 1,
			rows: getPaginatedRows(sortedSchedules, 1, pagination.rowsPerPage)
		});
	}
};

export default Schedules;
