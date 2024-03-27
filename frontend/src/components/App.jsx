import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyLogin, createStore, getStores, getThemes, createSchedule, getSchedules, updateSchedule, deleteSchedule } from '../utils';
import {
	Box,
	Modal,
	Grid,
	Button,
	CssBaseline,
	ModalDialog,
	ModalClose,
	DialogTitle,
	Stack,
	FormControl,
	FormLabel,
	Input,
	Typography,
	Card,
	CardContent,
	CardActions,
	Select,
	TextField,
	Chip,
	Option,
	Table
} from '@mui/joy'
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import '../app.scss'

// Modal.setAppElement('#root');

const App = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [stores, setStores] = useState([]);
	const [schedules, setSchedules] = useState([]);

	const [formError, setFormError] = useState("");

	const defaultFormData = {
		addStore: {
			name: '',
			url: '',
			token: '',
		},
		addSchedule: {
			store: '',
			theme: '',
			scheduledAtDate: dayjs(),
			scheduledAtTime: dayjs().add(1, 'hour'),
		}
	}

	// Add store form data
	const [addStoreFormData, setAddStoreFormData] = useState(defaultFormData.addStore);

	// Schedule form data
	const [scheduleFormData, setScheduleFormData] = useState(defaultFormData.addSchedule);
	const [scheduleFormThemeOptions, setScheduleFormOptions] = useState([]);
	const [currentSchedule, setCurrentSchedule] = useState(null);

	// Modals
	const MODALS = {
		'addStore': 1,
		'editStore': 2,
		'deleteStore': 3,
		'addSchedule': 4,
		'editSchedule': 5,
		'deleteSchedule': 6
	};

	const [currentModal, setCurrentModal] = useState(false);

	const openModal = async (modal, id = null) => {
		console.log('openModal:', modal)

		if (modal === MODALS['addSchedule'] && id) {
        const themes = await getThemes(id);
				const liveTheme = themes.find((theme) => theme.role === 'main');

        setScheduleFormOptions(themes);
        setScheduleFormData({
		        ...scheduleFormData,
		        store: id,
		        theme: liveTheme ? liveTheme.id : themes[0].id,
		        scheduledAtDate: dayjs(),
		        scheduledAtTime: dayjs().add(1, 'hour'),
				});
		}

		if (modal === MODALS['editSchedule'] && id) {
			const schedule = schedules.find((schedule) => schedule.id === id);
			setCurrentSchedule(schedule.id);

			if (schedule) {
				const themes = await getThemes(schedule.storeId);

				console.log('themes:', themes);
				console.log(schedule.themeId);

				setScheduleFormOptions(themes);
				setScheduleFormData({
					...scheduleFormData,
					store: schedule.storeId,
					theme: schedule.themeId,
					scheduledAtDate: dayjs(schedule.scheduledAtDate),
					scheduledAtTime: dayjs(schedule.scheduledAtTime),
				});
			}

			else {
				console.error('Schedule not found');
			}
		}

		if (modal === MODALS['deleteSchedule'] && id) {
			setCurrentSchedule(id);
		}

		setCurrentModal(modal);
	}

	const closeModals = () => {
		setCurrentModal(false);

		// Reset forms
		setAddStoreFormData(defaultFormData.addStore);
		setScheduleFormData(defaultFormData.addSchedule);
		setFormError("");
	}

	const handleChange = (e, newValue = null, targetName) => {
		console.log("Value onClick: ", newValue);
		console.log("Event onClick: ", e);

		if (e || newValue) {
			switch (currentModal) {
				case MODALS['addStore']:
					e && setAddStoreFormData({ ...addStoreFormData, [e.target.name]: e.target.value });
					break;
				case MODALS['addSchedule']:
				case MODALS['editSchedule']:
					setScheduleFormData({
						...scheduleFormData,
						[e ? e.target.name : targetName]: e ? e.target.name : newValue
					});
					break;
				default:
					break;
			}
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault();

		let isError = false;

		switch (currentModal) {
			case MODALS['addStore']:
				const { store, error } = await createStore(addStoreFormData);

				if (error) {
					isError = true;
					setFormError(error);
				}

				if (store)
					setStores([...stores, store]);

				break;
			case MODALS['addSchedule']:
				const { schedule, scheduleError } = await createSchedule(scheduleFormData);

				if (scheduleError) {
					isError = true;
					setFormError(scheduleError);
				}

				if (schedule)
					setSchedules([...schedules, schedule]);

				break;
			case MODALS['editSchedule']:
				const { schedule: updatedSchedule, updatedScheduleError } = await updateSchedule(currentSchedule, scheduleFormData);

				if (updatedScheduleError) {
					isError = true;
					setFormError(updatedScheduleError);
				}

				if (updatedSchedule) {
					const updatedSchedules = schedules.map((schedule) => {
						if (schedule.id === updatedSchedule.id)
							return updatedSchedule;

						return schedule;
					});

					console.log('updatedSchedules:', updatedSchedules)

					setSchedules(updatedSchedules);
				}

				break;
			default:
				break;
		}

		if (!isError)
			closeModals();
	}

	const handleDeleteSchedule = async (id) => {
		console.log('deleteSchedule:', id);

		const { schedule: deletedSchedule, scheduleError: deletedScheduleError } = await deleteSchedule(id);

		console.log('deletedSchedule obj:', deletedSchedule);

		if (deletedScheduleError) {
			setFormError(deletedScheduleError);
		}

		if (deletedSchedule) {
			const updatedSchedules = schedules.filter((schedule) => schedule.id !== deletedSchedule.id);

			console.log('updatedSchedules:', updatedSchedules)

			setSchedules(updatedSchedules);
			closeModals();
		}
	}

	const StoresCards = stores.map((store) => (
		<Grid item='true' xs={4} key={store.id}>
			<Card>
				<CardContent>
					<Typography><strong>Store Name:</strong> { store.name }</Typography>
					<Typography><strong>URL:</strong> { store.url }</Typography>
					<Typography><strong>id:</strong> { store.id }</Typography>
				</CardContent>

				<CardActions>
					<Button size='small' onClick={(e) => openModal(MODALS['addSchedule'], store.id || null)}>
						Schedule Theme
					</Button>
				</CardActions>
			</Card>
		</Grid>
	));

	// Check if the user is already logged in
	useEffect(() => {
		verifyLogin(navigate).then((isVerified) => {
			if (!isVerified)
				navigate('/login');

			getStores().then((stores) => {
				setStores(stores);

				getSchedules().then((schedules) => {
					console.log('schedules:', schedules);

					setSchedules(schedules);
					setIsLoading(false);

					closeModals();
				});
			});
		});
	}, []);

	return (
		isLoading ?
			<div>Loading...</div> :
			<>
				<CssBaseline enableColorScheme />

				<Box sx={{ display: 'flex', minHeight: '100dvh' }}>
					<Typography>Hi you're logged in!</Typography>

					<Box component="main" className="MainContent"
					     sx={{
						     px: { xs: 2, md: 6 },
						     pt: {
							     xs: 'calc(12px + var(--Header-height))',
							     sm: 'calc(12px + var(--Header-height))',
							     md: 3,
						     },
						     pb: { xs: 2, sm: 2, md: 3 },
						     flex: 1,
						     display: 'flex',
						     flexDirection: 'column',
						     minWidth: 0,
						     height: '100dvh',
						     gap: 1,
					     }}
					>
						<Box container spacing={2}>
							<Typography>Stores</Typography>

							{ stores.length > 0 ?
								<Grid container='true' spacing={2} className='stores__container'>
									{ StoresCards }
								</Grid> :
								<p>No stores found</p>
							}

							<Button variant='solid' onClick={() => {
								openModal(MODALS['addStore'])
								console.log(MODALS['addStore']);
							}} size="sm">
								Add Store
							</Button>
						</Box>

						<Box container spacing={2}>
							<Typography>Schedules</Typography>

							{ schedules.length > 0 ?
								<Table>
									<thead>
										<tr>
											<th>Schedule ID</th>
											<th>Store ID</th>
											<th>Theme ID</th>
											<th>Schedule Date</th>
											<th>Actions</th>
										</tr>
									</thead>

									<tbody>
										{schedules.map((row) => (
											<tr key={row.id}>
												<td>{row.id}</td>
												<td>{row.storeId}</td>
												<td>{row.themeId}</td>
												<td>{dayjs(row.scheduledAtDate).format('MM-DD-YYYY')} {dayjs(row.scheduledAtTime).format('h:mm A')}</td>
												<td>
													<Box sx={{ display: 'flex', gap: 1 }}>
														<Button
															size="sm"
															variant="plain"
															color="neutral"
															onClick={() => openModal(MODALS['editSchedule'], row.id || null)}
														>
															Edit
														</Button>
														<Button
															size="sm"
															variant="soft"
															color="danger"
															onClick={() => openModal(MODALS['deleteSchedule'], row.id || null)}
														>
															Delete
														</Button>
													</Box>
												</td>
											</tr>
										))}
									</tbody>
								</Table> :
								<p>No schedules found</p>
							}
						</Box>
					</Box>
				</Box>

				<Modal open={currentModal === MODALS['addStore']} onClose={() => closeModals()}>
					<ModalDialog>
						<DialogTitle>Add Store</DialogTitle>

						<ModalClose />

						<StoreForm
							addStoreFormData={addStoreFormData}
							handleChange={handleChange}
							handleSubmit={handleSubmit}
							formError={formError}
						/>
					</ModalDialog>
				</ Modal>

				<Modal open={currentModal === MODALS['addSchedule']} onClose={() => closeModals()}>
					<ModalDialog>
						<ModalClose />

						<DialogTitle>Schedule Theme</DialogTitle>

						<ScheduleForm
							scheduleFormData={scheduleFormData}
							scheduleFormThemeOptions={scheduleFormThemeOptions}
							handleChange={handleChange}
							handleSubmit={handleSubmit}
							formError={formError}
							buttonText='Schedule'
						/>
					</ModalDialog>
				</ Modal>

				<Modal open={currentModal === MODALS['editSchedule']} onClose={() => closeModals()}>
					<ModalDialog>
						<ModalClose />

						<DialogTitle>Edit Schedule</DialogTitle>

						<ScheduleForm
							scheduleFormData={scheduleFormData}
							scheduleFormThemeOptions={scheduleFormThemeOptions}
							handleChange={handleChange}
							handleSubmit={handleSubmit}
							formError={formError}
							buttonText='Update'
						/>
					</ModalDialog>
				</ Modal>

				<Modal open={currentModal === MODALS['deleteSchedule']} onClose={() => closeModals()}>
					<ModalDialog>
						<DialogTitle>Are you sure you want to delete this schedule?</DialogTitle>

						<Stack spacing={2}>
							<Button
								size="sm"
								variant="plain"
								color="neutral"
								onClick={() => closeModals()}
							>
								Cancel
							</Button>

							<Button
								size="sm"
								variant="soft"
								color="danger"
								onClick={() => handleDeleteSchedule(currentSchedule)}
							>
								Delete
							</Button>
						</Stack>
					</ModalDialog>
				</ Modal>
			</>
	);
};

const ScheduleForm = (props) => {
	const { scheduleFormData, scheduleFormThemeOptions, handleChange, handleSubmit, formError, buttonText } = props;

	return (
		<form onSubmit={handleSubmit}>
			<Stack spacing={2}>
				<FormControl>
					<FormLabel>Store ID</FormLabel>

					<Input
						autoFocus required
						type="text"
						id="store"
						name="store"
						value={scheduleFormData.store}
						onChange={handleChange}
						variant='outlined'
						disabled
					/>
				</FormControl>

				{
					scheduleFormThemeOptions.length > 0 && (
						<FormControl>
							<FormLabel>Theme</FormLabel>

							<Select
								id="theme" required
								variant='outlined'
								value={Number(scheduleFormData.theme)}
								endDecorator={
									(
										scheduleFormThemeOptions.find((t) => t.id === scheduleFormData.theme)?.role === 'main' &&
										<Chip
											size="sm"
											variant="outlined"
											color={'success'}
											sx={{
												ml: 'auto',
												borderRadius: '2px',
												minHeight: '20px',
												paddingInline: '4px',
												fontSize: 'xs',
												bgcolor: 'success.softBg',
											}}
										>
											live
										</Chip>
									)
								}
								onChange={(e, newValue) => handleChange(null, newValue, 'theme')}
							>
								{ scheduleFormThemeOptions.map((theme) => (
									<Option name="theme" key={theme.id} value={theme.id} label={theme.name}>
										{ theme.name }

										{ theme.role === 'main' && (
											<Chip
												size="sm"
												variant="outlined"
												color={'success'}
												sx={{
													ml: 'auto',
													borderRadius: '2px',
													minHeight: '20px',
													paddingInline: '4px',
													fontSize: 'xs',
													bgcolor: 'success.softBg',
												}}
											>
												live
											</Chip>
										)}
									</Option>
								))}
							</Select>
						</FormControl>
					)
				}

				<FormControl>
					<DatePicker
						label='Select Date'
						variant='outlined'
						value={scheduleFormData.scheduledAtDate}
						disablePast={true}
						onChange={(newValue) => handleChange(null, newValue, 'scheduledAtDate')}
					/>
				</FormControl>

				<FormControl>
					<TimePicker
						label='Select Time'
						variant='outlined'
						value={scheduleFormData.scheduledAtTime}
						onChange={(newValue) => handleChange(null, newValue, 'scheduledAtTime')}
					/>
				</FormControl>

				<Button type="submit">{ buttonText }</Button>

				{
					formError !== "" &&
					<Typography color='error'>{ formError }</Typography>
				}
			</Stack>
		</form>
	)
}

const StoreForm = (props) => {
	const { addStoreFormData, handleChange, handleSubmit, formError } = props;

	return (
		<form onSubmit={handleSubmit}>
			<Stack spacing={2}>
				<FormControl>
					<FormLabel>Store Name</FormLabel>

					<Input autoFocus required
						 type="text"
						 id="name"
						 name="name"
						 value={addStoreFormData.name}
						 onChange={handleChange}
					/>
				</FormControl>

				<FormControl>
					<FormLabel>URL</FormLabel>

					<Input required
					       type="text"
					       id="url"
					       name="url"
					       value={addStoreFormData.url}
					       onChange={handleChange}
					/>
				</FormControl>

				<FormControl>
					<FormLabel>Token</FormLabel>

					<Input required
					       type="text"
					       id="token"
					       name="token"
					       value={addStoreFormData.token}
					       onChange={handleChange}
					/>
				</FormControl>

				<Button type="submit">Add Store</Button>

				{
					formError !== "" &&
					<Typography color='error'>{ formError }</Typography>
				}
			</Stack>
		</form>
	)
}

export default App;
