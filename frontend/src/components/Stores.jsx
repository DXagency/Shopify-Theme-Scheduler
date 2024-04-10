import {
	Text,
	Toast,
	DataTable,
	BlockStack,
	Button,
	Modal,
	FormLayout,
	TextField,
	InlineStack,
	Icon, InlineError,
	Tooltip,
	DatePicker,
	Popover,
	Select,
	SkeletonBodyText,
	Card
} from '@shopify/polaris';
import {
	CalendarTimeIcon,
	CalendarIcon,
	ClockIcon,
	DeleteIcon,
	EditIcon,
	ThemeTemplateIcon,
	LiveIcon
} from '@shopify/polaris-icons';
import {
	createStoreV2,
	deleteStore,
	getStores,
	editStore,
	getThemes,
	createScheduleV2
} from '../utils';
import React, { useState, useEffect } from 'react';
import moment from "moment";

const Stores = (props) => {
	const defaultDaysOffset = 31;
	const addStoreModalTitle = 'Add Store';
	const editStoreModalTitle = 'Edit Store';
	const columnContentTypes = ['text', 'text', 'text', 'text', 'text'];
	const headings = ['Store Name', 'URL', 'Store Owner', 'Store ID', ''];

	const [stores, setStores] = useState([]);
	const [addStoreModal, setAddStoreModal] = useState({
		modalActive: false,
		url: '',
		apiKey: '',
		error: ''
	});
	const [editStoreModal, setEditStoreModal] = useState({
		modalActive: false,
		store: {},
		editName: '',
		error: ''
	});
	const [deleteStoreModal, setDeleteStoreModal] = useState({
		modalActive: false,
		store: {}
	});
	const [createScheduleModal, setCreateScheduleModal] = useState({
		modalActive: false,
		store: {},
		theme: {},
		error: '',
		scheduledAtMessage: ''
	});
	const [liveThemeModal, setLiveThemeModal] = useState({
		modalActive: false,
		store: {},
		theme: '',
		error: '',
		loading: false
	});
	const [selectedDate, setSelectedDate] = useState({
		month: moment().month(),
		year: moment().year(),
		selected: new Date(),
		selectedText: moment().format('MM/DD/YYYY'),
		datePickerActive: false
	});
	const [selectedTime, setSelectedTime] = useState({
		hour: moment().add(defaultDaysOffset, 'minutes').format('h'),
		hour24: moment().add(defaultDaysOffset, 'minutes').format('HH'),
		minute: moment().add(defaultDaysOffset, 'minutes').format('m'),
		meridiem: moment().add(defaultDaysOffset, 'minutes').format('A'),
		selectedText: moment().add(defaultDaysOffset, 'minutes').format('hh:mm A'),
		time24: moment().add(defaultDaysOffset, 'minutes').format('HH:MM'),
		timePickerActive: false
	});
	const [selectedTheme, setSelectedTheme] = useState({
		theme: '',
		options: [],
		loading: false
	});
	const [toast, setToast] = useState({
		active: false,
		content: '',
		error: false
	});
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({
		page: 1,
		rowsPerPage: 5,
		rows: []
	});

	const selectDateActivator = (
			<TextField
					autoComplete='off'
					label='Date'
					prefix={ <Icon source={CalendarIcon} /> }
					value={ selectedDate.selectedText }
					onFocus={ () => setSelectedDate({...selectedDate, datePickerActive: true}) }
					onChange={ (value) => { setSelectedDate({...selectedDate, selectedText: value}) }}
			/>
	);

	const selectTimeActivator = (
			<TextField
				autoComplete='off'
				label='Time'
				prefix={ <Icon source={ClockIcon} /> }
				value={ selectedTime.selectedText }
				onFocus={ () => setSelectedTime({...selectedTime, timePickerActive: true}) }
			/>
	);

	const toastMarkup = toast.active ? (
		<Toast
				content={toast.content}
				error={toast.error}
				onDismiss={ () => setToast({ active: false, content: '', error: false })}
		/>
	) : null;

	useEffect(refreshStoreState, []);

	return (
		<BlockStack title='Stores' gap='400'>
			<InlineStack gap='400' align='space-between'>
				<Text as='h2' variant="headingXl">
					Shopify Stores
				</Text>

				<Button variant='primary' onClick={ () => openModal('add') }>Add Store</Button>
			</InlineStack>

			<BlockStack>
				{ !loading ? stores.length === 0 ?
					(
						<Card>
							<BlockStack gap='200'>
								<Text as='h2' variant='bodyLg'>
									No stores found, add a new store to get started!
								</Text>

								<InlineStack>
									<Button variant='primary' onClick={ () => openModal('add') }>Add Store</Button>
								</InlineStack>
							</BlockStack>
						</Card>
					) : (
						<DataTable
								columnContentTypes={columnContentTypes}
								headings={headings}
								rows={pagination.rows.map((store) => {
									return [
										store?.name || 'N/A',
										store?.url || 'N/A',
										store?.owner || 'N/A',
										store?.shopifyId || 'N/A',
										<InlineStack gap="400" align='center' key={store.id}>
											<Tooltip content='Schedule Theme'>
												<Button variant='plain' tone='primary' onClick={ () => setSelectedStore(store, 'schedule') }>
													<Icon source={CalendarTimeIcon} accessibilityLabel='Schedule Theme' />
												</Button>
											</Tooltip>

											<Tooltip content='View Live Theme'>
												<Button variant='plain'
														tone='primary'
														onClick={ () => setSelectedStore(store, 'live')}
														loading={liveThemeModal.loading}
												>
													<Icon source={LiveIcon} />
												</Button>
											</Tooltip>

											<Tooltip content='Edit Store'>
												<Button variant='plain' tone='primary' onClick={ () => setSelectedStore(store)}>
													<Icon source={EditIcon} />
												</Button>
											</Tooltip>

											<Tooltip content='Delete Store'>
												<Button variant='plain' tone='critical' onClick={() => setSelectedStore(store, 'delete')}>
													<Icon source={DeleteIcon} />
												</Button>
											</Tooltip>
										</InlineStack>,
									];
								})}
								pagination={ stores.length > pagination.rowsPerPage ? {
									label: `Page ${pagination.page} of ${Math.ceil(stores.length / pagination.rowsPerPage)}`,
									hasPrevious: pagination.page > 1,
									hasNext: pagination.page < Math.ceil(stores.length / pagination.rowsPerPage),
									onPrevious: () => handlePagination('prev'),
									onNext: () => handlePagination('next')
								} : false}
						/>
					)
				: (
						<DataTable columnContentTypes={columnContentTypes} headings={headings} rows={
							Array(5).fill(0).map(() => {
								return headings.map(heading => {
									if (heading === '') {
										return <InlineStack gap="400" align='center' key={heading}>
											<Tooltip content='Schedule Theme'>
												<Button variant='plain' tone='primary' disabled>
													<Icon source={CalendarTimeIcon} accessibilityLabel='Schedule Theme' />
												</Button>
											</Tooltip>

											<Tooltip content='Edit Store'>
												<Button variant='plain' tone='primary' disabled>
													<Icon source={EditIcon} />
												</Button>
											</Tooltip>

											<Tooltip content='Delete Store'>
												<Button variant='plain' tone='critical' disabled>
													<Icon source={DeleteIcon} />
												</Button>
											</Tooltip>
										</InlineStack>
									}

									return <SkeletonBodyText lines={1} key={heading} />;
								});
							})
						} />
				)}

			</BlockStack>

			<Modal open={ addStoreModal.modalActive } title={ addStoreModalTitle } onClose={ closeAllModals }>
				<Modal.Section>
					<FormLayout>
						<TextField
								label='Shopify URL'
								autoComplete='off'
								value={addStoreModal.url}
								onChange={ (value) => handleAddStoreModalChange('url', value) }
								suffix={'.myshopify.com'}
						/>

						<TextField
								label='API Key'
								autoComplete='off'
								value={addStoreModal.apiKey}
								onChange={ (value) => handleAddStoreModalChange('apiKey', value) }
						/>

						{ addStoreModal.error &&
								<InlineError
										message={addStoreModal.error}
										fieldID='AddStoreError'
								/>
						}
					</FormLayout>
				</Modal.Section>

				<Modal.Section>
					<InlineStack gap='400' align='end'>
						<Button variant='plain' onClick={closeAllModals}>Cancel</Button>
						<Button variant='primary' onClick={ handleCreateStore }>Create</Button>
					</InlineStack>
				</Modal.Section>
			</Modal>

			<Modal open={ editStoreModal.modalActive } title={ editStoreModalTitle } onClose={ closeAllModals }>
				<Modal.Section>
					<FormLayout>
						<TextField
								label='Store Name'
								autoComplete='off'
								value={editStoreModal.editName}
								onChange={ (value) => handleEditStoreModalChange('editName', value) }
						/>

						<TextField
								label='Shopify URL'
								autoComplete='off'
								value={editStoreModal.store?.url}
								disabled
						/>

						{ editStoreModal.error &&
								<InlineError
										message={editStoreModal.error}
										fieldID='EditStoreError'
								/>
						}
					</FormLayout>
				</Modal.Section>

				<Modal.Section>
					<InlineStack gap='400' align='end'>
						<Button variant='plain' onClick={closeAllModals}>Cancel</Button>
						<Button variant='primary' onClick={handleEditStore}>Save</Button>
					</InlineStack>
				</Modal.Section>
			</Modal>

			<Modal open={ deleteStoreModal.modalActive } title='Delete Store' onClose={ closeAllModals }>
				<Modal.Section>
					<Text as='p'>
						Are you sure you want to delete <strong>{ deleteStoreModal.store.name }</strong> from the list of stores?
					</Text>
				</Modal.Section>

				<Modal.Section>
					<InlineStack gap='400' align='end'>
						<Button variant='plain' onClick={closeAllModals}>Cancel</Button>
						<Button variant="primary" tone="critical" onClick={handleDeleteStore}>Delete</Button>
					</InlineStack>
				</Modal.Section>
			</Modal>

			<Modal open={ createScheduleModal.modalActive } title='Schedule Theme Publish' onClose={ closeAllModals }>
				<Modal.Section>
					<FormLayout>
						<Select
								label='Theme'
								disabled={ selectedTheme.loading }
								value={ selectedTheme.theme }
								onChange={ handleThemeSelection }
								options={ selectedTheme.options }
						/>

						<FormLayout.Group condensed>
							<Popover
									fullHeight sectioned preventFocusOnClose
									fullWidth={false}
									preferInputActivator={false}
									preferredAlignment='center'
									autofocusTarget='container'
									active={ selectedDate.datePickerActive }
									activator={ selectDateActivator }
									onClose={ () => setSelectedDate({...selectedDate, datePickerActive: false}) }
							>
								<Popover.Section>
									<DatePicker
											month={selectedDate.month}
											year={selectedDate.year}
											selected={selectedDate.selected}
											onChange={ (date) => handleDateSelection(date) }
											onMonthChange={ (month, year) => handleMonthChange(month, year) }
									/>

									<InlineStack align='end' gap='400'>
										<Button variant='plain' onClick={ () => setSelectedDate({...selectedDate, datePickerActive: false}) }>Close</Button>
									</InlineStack>
								</Popover.Section>
							</Popover>

							<Popover
									fullHeight sectioned preventFocusOnClose
									fullWidth={false}
									preferInputActivator={false}
									preferredAlignment='center'
									autofocusTarget='container'
									active={ selectedTime.timePickerActive }
									activator={ selectTimeActivator }
									onClose={ () => setSelectedTime({...selectedTime, timePickerActive: false}) }
							>
								<Popover.Section>
									<FormLayout>
										<FormLayout.Group condensed>
											<TextField
													autoComplete='off'
													label='Hour'
													type='number'
													min={ 1 }
													max={ 12 }
													value={ selectedTime.hour }
													onChange={(value) => {
														handleTimeSelection(value, selectedTime.minute, selectedTime.meridiem)
													}}
											/>

											<TextField
													autoComplete='off'
													label='Minute'
													type='number'
													min={ 0 }
													max={ 59 }
													value={ selectedTime.minute }
													onChange={(value) => {
														handleTimeSelection(selectedTime.hour, value, selectedTime.meridiem)
													}}
											/>

											<Select
													label='Meridiem'
													options={[
														{ label: 'AM', value: 'AM' },
														{ label: 'PM', value: 'PM' }
													]}
													value={ selectedTime.meridiem }
													onChange={(value) => {
														handleTimeSelection(selectedTime.hour, selectedTime.minute, value)
													}}
											/>
										</FormLayout.Group>

										<FormLayout.Group >
											<InlineStack align='end' gap='400'>
												<Button variant='plain' onClick={ () => setSelectedTime({...selectedTime, timePickerActive: false}) }>Close</Button>
											</InlineStack>
										</FormLayout.Group>

									</FormLayout>
								</Popover.Section>
							</Popover>
						</FormLayout.Group>

						<TextField
								disabled
								label='Store Name'
								autoComplete='off'
								value={ createScheduleModal.store?.name }
						/>

						<TextField
								disabled
								label='Shopify URL'
								autoComplete='off'
								value={ createScheduleModal.store?.url }
						/>

						{ editStoreModal.error &&
								<InlineError
										message={editStoreModal.error}
										fieldID='EditStoreError'
								/>
						}
					</FormLayout>
				</Modal.Section>

				<Modal.Section>
					<InlineStack gap='400' align='space-between'>
						<Text as='p'>
							{ createScheduleModal.scheduledAtMessage }
						</Text>

						<InlineStack gap='400' align='end'>
							<Button variant='plain' onClick={closeAllModals}>Cancel</Button>
							<Button variant="primary" onClick={handleSchedulePublish}>
								Schedule Publish
							</Button>
						</InlineStack>
					</InlineStack>
				</Modal.Section>
			</Modal>

			<Modal size='small' title='Current Live Theme' titleHidden
				 open={ liveThemeModal.modalActive }
				 onClose={ closeAllModals }
				 primaryAction={{
					 content: 'Close',
					 onAction: closeAllModals
				 }}
			>
				<Modal.Section>
					<Text as='h3'>
						Current Live Theme is <strong>{ liveThemeModal.theme.name }</strong>
					</Text>
				</Modal.Section>
			</Modal>

			{ toastMarkup }
		</BlockStack>
	);

	function closeAllModals() {
		setAddStoreModal({
			...addStoreModal,
			modalActive: false,
			url: '',
			apiKey: '',
			error: ''
		});

		setEditStoreModal({
			...editStoreModal,
			modalActive: false,
			store: {},
			editName: ''
		});

		setDeleteStoreModal({
			...deleteStoreModal,
			modalActive: false,
			store: {}
		});

		setCreateScheduleModal({
			...createScheduleModal,
			modalActive: false,
			store: {},
			theme: {},
			error: '',
			scheduledAtMessage: ''
		});

		setLiveThemeModal({
			...liveThemeModal,
			modalActive: false,
			store: {},
			theme: '',
			error: '',
			loading: false
		});

		// Reset selected date and time to 30 minutes from now
		setSelectedDate({
			...selectedDate,
			selectedText: moment().format('MM/DD/YYYY')
		});

		setSelectedTime({
			...selectedTime,
			hour: moment().add(defaultDaysOffset, 'minutes').format('h'),
			hour24: moment().add(defaultDaysOffset, 'minutes').format('HH'),
			minute: moment().add(defaultDaysOffset, 'minutes').format('m'),
			meridiem: moment().add(defaultDaysOffset, 'minutes').format('A'),
			selectedText: moment().add(defaultDaysOffset, 'minutes').format('hh:mm A'),
			time24: moment().add(defaultDaysOffset, 'minutes').format('HH:MM'),
		});
	}

	function openModal(modal) {
		switch (modal) {
			case 'add':
				setAddStoreModal({ ...addStoreModal, modalActive: true });
				break;

			case 'edit':
				setEditStoreModal({ ...editStoreModal, modalActive: true });
				break;

			case 'delete':
				setDeleteStoreModal({ ...deleteStoreModal, modalActive: true });
				break;

			case 'schedule':
				setCreateScheduleModal({ ...createScheduleModal, modalActive: true });
				break;

			default:
				break;
		}
	}

	function handleAddStoreModalChange(key, value) {
		if (key === 'url') {
			value = value
					.replace('https://', '')
					.replace('http://', '')
					.replace('.myshopify.com', '')
					.replace('.com', '')
					.replace('.ca', '')
					.replace('.co.uk', '')
					.replace('.shopify', '')
					.replace('.store', '');
		}

		setAddStoreModal({...addStoreModal, [key]: value});
	}

	function handleEditStoreModalChange(key, value) {
		setEditStoreModal({...editStoreModal, [key]: value});
	}

	function handleCreateStore() {
		createStoreV2(addStoreModal.url, addStoreModal.apiKey).then((data) => {
			if (data?.error) {
				setAddStoreModal({...addStoreModal, error: data.error});

				return;
			}

			setAddStoreModal({
				...addStoreModal,
				modalActive: false,
				url: '',
				apiKey: '',
				error: ''
			});

			setToast({ ...toast, active: true, content: 'Store Added!' })

			refreshStoreState();
		});
	}

	function handleEditStore() {
		editStore(editStoreModal.store.id, editStoreModal.editName).then((data) => {
			if (data?.error) {
				setEditStoreModal({...editStoreModal, error: data.error});

				return;
			}

			setEditStoreModal({
				...editStoreModal,
				modalActive: false,
				store: {},
				editName: '',
				error: ''
			});

			setToast({ ...toast, active: true, content: 'Store Updated!' })

			refreshStoreState();
		});
	}

	function handleDeleteStore() {
		deleteStore(deleteStoreModal.store.id).then((data) => {
			if (data?.error) {
				setDeleteStoreModal({...deleteStoreModal, error: data.error});

				return;
			}

			setDeleteStoreModal({
				...deleteStoreModal,
				modalActive: false,
				store: {}
			});

			setToast({ ...toast, active: true, content: 'Store Deleted Successfully!' })

			refreshStoreState();
		});
	}

	function setSelectedStore(store, modal = 'edit') {
		if (modal === 'edit') {
			setEditStoreModal({ ...editStoreModal, store: store,  modalActive: true, editName: store.name })
		}

		else if (modal === 'delete') {
			setDeleteStoreModal({ ...deleteStoreModal, store: store, modalActive: true });
		}

		else if (modal === 'schedule') {
			setCreateScheduleModal({
				...createScheduleModal,
				store: store,
				modalActive: true,
				scheduledAtMessage: calculateScheduledAtMessage(selectedDate.selected?.start, selectedTime.hour24, selectedTime.minute)
			});

			setSelectedTheme({ ...selectedTheme, loading: true });

			getThemes(store.id).then((themes) => {
				const optionsMapped = themes.map((theme) => {
					return {
						label: theme.role === 'main' ? theme.name + " - Live" : theme.name,
						value: theme.role === 'main' ? '' : theme.id.toString(),
						prefix: <Icon source={ ThemeTemplateIcon } />,
						disabled: theme.role === 'main'
					}
				});

				setSelectedTheme({
					...selectedTheme,
					options: optionsMapped,
					loading: false,
					theme: optionsMapped.find(theme => theme.disabled === false)?.value
				});
			});
		}

		else if (modal === 'live') {
			setLiveThemeModal({
				...liveThemeModal,
				store: store,
				loading: true
			})

			getThemes(store.id).then((themes) => {
				const liveTheme = themes.find(theme => theme.role === 'main');

				if (!liveTheme) {
					setToast({ active: true, content: 'No live theme found for this store', error: true });

					return;
				}

				setLiveThemeModal(prev => {
					return {
					...prev,
					modalActive: true,
					theme: liveTheme,
					loading: false
				}})
			});
		}
	}

	function handleMonthChange(month, year) {
		setSelectedDate({ ...selectedDate, month, year });
	}

	function handleDateSelection(date) {
		setSelectedDate({
			...selectedDate,
			datePickerActive: false,
			selected: date,
			selectedText: moment(date.start).format('MM/DD/YYYY')
		});

		setCreateScheduleModal({
			...createScheduleModal,
			scheduledAtMessage: calculateScheduledAtMessage(date.start, selectedTime.hour24, selectedTime.minute)
		});
	}

	function handleTimeSelection(hour, minute, meridiem) {
		hour = hour > 12 || hour < 1 ? 1 : hour;
		minute = minute > 60 || minute < 0 ? 0 : minute;
		meridiem = meridiem !== 'AM' && meridiem !== 'PM' ? 'AM' : meridiem;

		const timeText = `${ hour }:${ minute } ${ meridiem }`
		const time24 = moment(timeText, 'hh:mm A').format('HH:mm');
		const hour24 = moment(timeText, 'hh:mm A').format('HH');

		setSelectedTime({
			...selectedTime,
			hour,
			minute,
			meridiem,
			selectedText: moment(timeText, 'hh:mm A').format('hh:mm A'),
			time24,
			hour24,
		});

		setCreateScheduleModal({
			...createScheduleModal,
			scheduledAtMessage: calculateScheduledAtMessage(selectedDate.selected?.start, hour24, minute)
		});
	}

	function handleThemeSelection(theme) {
		setSelectedTheme({ ...selectedTheme, theme });
	}

	function handleSchedulePublish() {
		// Combine selectedDate and selectedTime into a single date object
		let scheduledAt = moment(selectedDate.selectedText, 'MM/DD/YYYY');
		scheduledAt.set('hour', parseInt(selectedTime.hour24));
		scheduledAt.set('minute', parseInt(selectedTime.minute));

		const themeName = selectedTheme.options.find(option => option.value === selectedTheme.theme)?.label;

		createScheduleV2(
				createScheduleModal.store.id,
				selectedTheme.theme,
				scheduledAt.toISOString(),
				createScheduleModal.store.name,
				themeName
		).then((data) => {
			if (data?.error) {
				console.log('Error creating schedule: ', data.error);
				setCreateScheduleModal({...createScheduleModal, error: data.error});
				return;
			}

			setCreateScheduleModal({
				...createScheduleModal,
				modalActive: false,
				store: {},
				theme: {},
				error: ''
			});

			props.setUpdate(true);

			setToast({ active: true, content: 'Theme Scheduled for Publish!' });
		});
	}

	function calculateScheduledAtMessage(date, hour24, minute) {
		const formattedDate = moment(date).format('MM/DD/YYYY');
		const scheduledAt = moment(formattedDate, 'MM/DD/YYYY');
		scheduledAt.set('hour', parseInt(hour24));
		scheduledAt.set('minute', parseInt(minute));

		const diff = scheduledAt.diff(moment(), 'minutes');
		const diffHours = Math.floor(diff / 60);
		const diffDays = Math.floor(diff / 1440);
		const diffHoursInDay = Math.floor((diff % 1440) / 60);
		const diffDaysSuffix = diffDays > 1 ? 's' : '';
		const diffHoursSuffix = diffHours > 1 ? 's' : '';
		const diffHoursInDaySuffix = diffHoursInDay > 1 ? 's' : '';
		const diffMinutesSuffix = diff > 1 ? 's' : '';

		const messagePrefix = 'Scheduled time is ';

		 if (diff < 0) {
			return 'Scheduled time has already passed';
		}

		 else if (diff === 0 ) {
			 return messagePrefix + 'now';
		 }

		 else if (diff > 1440 && (Math.floor((diff % 1440) / 60)) !== 0) {
			 return messagePrefix + `${diffDays} day${diffDaysSuffix} and ${diffHoursInDay} hour${diffHoursInDaySuffix} from now`;
		 }

		 else if (diff > 1440) {
			 return messagePrefix + `${diffDays} day${diffDaysSuffix} from now`;
		 }

		 else if (diff > 60) {
			 return messagePrefix + `${diffHours} hour${diffHoursSuffix} from now`;
		 }

		 else {
			 return messagePrefix + `${ diff } minute${diffMinutesSuffix} from now`;
		 }
	}

	function refreshStoreState() {
		getStores().then((stores) => {
			setLoading(false);

			setPagination(val => {
				return {
					...val,
					page: 1,
					rows: getPaginatedRows(stores, 1, val.rowsPerPage)
				}
			});
			setStores(stores);

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
		const rows = getPaginatedRows(stores, page, pagination.rowsPerPage);

		setPagination({ ...pagination, page, rows });
	}
};

export default Stores;
