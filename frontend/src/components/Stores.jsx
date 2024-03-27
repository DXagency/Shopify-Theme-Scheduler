import React, { useState, useEffect } from 'react';
import {
	Text,
	Toast,
	DataTable,
	BlockStack,
	Page,
	Button,
	ButtonGroup,
	Modal,
	FormLayout,
	TextField,
	InlineStack,
	Icon, InlineError,
	Tooltip, DatePicker, Popover
} from '@shopify/polaris';
import {createStoreV2, deleteStore, getStores, editStore} from '../utils';
import moment from "moment";

import {
	AlertCircleIcon,
	CalendarIcon,
	ClockIcon,
	DeleteIcon,
	EditIcon
} from '@shopify/polaris-icons';

const Stores = () => {
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
		error: ''
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
		selected: moment().format('HH:mm'),
		selectableTimes: []
	});

	// Get Every 15 minutes left in the day
	const allTimesInDay = Array.from({length: 24}, (v, k) => k).map((hour) => {
		return Array.from({length: 4}, (v, k) => k).map((quarter) => {
					return `${hour.toFixed(2)}:${(quarter * 15).toFixed(2)}`;
				});
	})

	console.log("All Times in Day:", allTimesInDay.flat());

	const addStoreModalTitle = 'Add Store';
	const editStoreModalTitle = 'Edit Store';

	const headings = ['Store Name', 'URL', 'Store Owner', 'Store ID', 'Actions'];
	const columnContentTypes = ['text', 'text', 'text', 'text', 'text'];

	const toastMarkup = toast.active ? (
			<Toast
				content={toast.content}
				onDismiss={ () => setToast({ active: false, content: '' })}
		/>
	) : null;

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
											<Icon source={ClockIcon} accessibilityLabel='Schedule Theme' />
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
						<TextField
								label='Store Name'
								autoComplete='off'
								value={editStoreModal.editName}
								disabled
						/>

						<TextField
								label='Shopify URL'
								autoComplete='off'
								value={editStoreModal.store?.url}
								disabled
						/>

						<Popover
								fullWidth
								fullHeight
								sectioned
                preventFocusOnClose
								active={selectedDate.datePickerActive}
								preferredAlignment={ 'center'}
								autofocusTarget='first-node'
								onClose={ () => setSelectedDate({...selectedDate, datePickerActive: false}) }
								activator={
									<TextField
										 autoComplete='off'
										 prefix={<Icon source={CalendarIcon} />}
										 label='Select Date'
										 onFocus={ () => setSelectedDate({...selectedDate, datePickerActive: true}) }
										 onBlur={ checkSelectedDateText }
										 value={selectedDate.selectedText}
										 onChange={ (value) => { setSelectedDate({...selectedDate, selectedText: value}) }}
									/>
								}
						>
							<Popover.Section>
								<DatePicker
										month={selectedDate.month}
										year={selectedDate.year}
										selected={selectedDate.selected}
										onChange={ (date) => handleDateSelection(date) }
										onMonthChange={ (month, year) => handleMonthChange(month, year) }
								/>
							</Popover.Section>
						</Popover>

						{ editStoreModal.error &&
								<InlineError
										message={editStoreModal.error}
										fieldID='EditStoreError'
								/>
						}
					</FormLayout>
				</Modal.Section>

				<Modal.Section>
				</Modal.Section>
			</Modal>

			{ toastMarkup }
		</Page>
	);

	function closeAllModals() {
		setAddStoreModal({ ...addStoreModal, modalActive: false });
		setEditStoreModal({ ...editStoreModal, modalActive: false });
		setDeleteStoreModal({ ...deleteStoreModal, modalActive: false });
		setCreateScheduleModal({ ...createScheduleModal, modalActive: false });
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
			setCreateScheduleModal({ ...createScheduleModal, store: store, modalActive: true });
		}
	}

	function handleMonthChange(month, year) {
		setSelectedDate({ ...selectedDate, month, year });
	}

	function handleDateSelection(date) {
		console.log("New Date:", date);
		console.log("New Date:", moment(date).format('MM/DD/YYYY'));

		setSelectedDate({
			...selectedDate,
			datePickerActive: false,
			selected: date,
			selectedText: moment(date.start).format('MM/DD/YYYY')
		});
	}

	function checkSelectedDateText() {
		// Check if the selected date is valid
		console.log("Selected Date:", selectedDate.selectedText);
		console.log("Selected Date (isValid):", moment(selectedDate.selectedText, 'MM/DD/YYYY').isValid());

		if (!moment(selectedDate.selectedText, 'MM/DD/YYYY').isValid()) {
			setSelectedDate({...selectedDate, selectedText: moment(selectedDate.selected.start).format('MM/DD/YYYY')})
		}
	}
};

export default Stores;
