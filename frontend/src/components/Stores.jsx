import {
	Text,
	Toast,
	DataTable,
	BlockStack,
	Page,
	Button,
	Modal,
	FormLayout,
	TextField,
	InlineStack,
	Icon, InlineError,
	Tooltip, DatePicker, Popover,
	Select
} from '@shopify/polaris';
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

import {
	CalendarTimeIcon,
	CalendarIcon,
	ClockIcon,
	DeleteIcon,
	EditIcon,
	ViewIcon,
	HideIcon,
	ThemeTemplateIcon
} from '@shopify/polaris-icons';

const Stores = () => {
	const addStoreModalTitle = 'Add Store';
	const editStoreModalTitle = 'Edit Store';
	const headings = ['Store Name', 'URL', 'Store Owner', 'Store ID', 'Actions'];
	const columnContentTypes = ['text', 'text', 'text', 'text', 'text'];
	const defaultOffset = 31;

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
	const [toast, setToast] = useState({
		active: false,
		content: ''
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
	const [selectedTheme, setSelectedTheme] = useState({
		theme: '',
		options: [],
		loading: false
	});

	const toastMarkup = toast.active ? (
			<Toast
				content={toast.content}
				onDismiss={ () => setToast({ active: false, content: '' })}
		/>
	) : null;

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

	useEffect(() => {
		getStores().then((stores) => {
			setStores(stores);
		});
	}, []);

	return (
		<Page title='Stores' primaryAction={
			<Button variant='primary' onClick={ () => openModal('add') }>New</Button>
		}>
			<BlockStack>
				<DataTable
						columnContentTypes={columnContentTypes}
						headings={headings}
						rows={stores.map((store) => {
							return [
								store?.name || 'N/A',
								store?.url || 'N/A',
								store?.owner || 'N/A',
								store?.shopifyId || 'N/A',
								<InlineStack gap="400">
									<Tooltip content='Schedule Theme'>
										<Button variant='plain' tone='primary' onClick={ () => setSelectedStore(store, 'schedule') }>
											<Icon source={CalendarTimeIcon} accessibilityLabel='Schedule Theme' />
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
								</InlineStack>
							];
						})}
				/>
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

			{ toastMarkup }
		</Page>
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

		// Reset selected date and time to 30 minutes from now
		setSelectedDate({
			...selectedDate,
			selectedText: moment().format('MM/DD/YYYY')
		});

		setSelectedTime({
			...selectedTime,
			hour: moment().add(defaultOffset, 'minutes').format('h'),
			hour24: moment().add(defaultOffset, 'minutes').format('HH'),
			minute: moment().add(defaultOffset, 'minutes').format('m'),
			meridiem: moment().add(defaultOffset, 'minutes').format('A'),
			selectedText: moment().add(defaultOffset, 'minutes').format('hh:mm A'),
			time24: moment().add(defaultOffset, 'minutes').format('HH:MM'),
		});
	}

	function openModal(modal) {
		if (modal === 'add') {
			setAddStoreModal({ ...addStoreModal, modalActive: true });
		}
		else if (modal === 'edit') {
			setEditStoreModal({ ...editStoreModal, modalActive: true });
		}
		else if (modal === 'delete') {
			setDeleteStoreModal({ ...deleteStoreModal, modalActive: true });
		}
		else if (modal === 'schedule') {
			setCreateScheduleModal({ ...createScheduleModal, modalActive: true });
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

			setToast({ active: true, content: 'Store Added!' })

			getStores().then((stores) => {
				setStores(stores);
			});
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

			setToast({ active: true, content: 'Store Updated!' })

			getStores().then((stores) => {
				setStores(stores);
			});
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

			setToast({ active: true, content: 'Store Deleted Successfully!' })

			getStores().then((stores) => {
				setStores(stores);
			});
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
};

export default Stores;
