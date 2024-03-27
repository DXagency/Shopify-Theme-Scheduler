const SERVER = 'http://localhost:3000/';
const API = {
	auth_verify: SERVER + 'auth/verify',
	auth_login: SERVER + 'auth/login',
	auth_register: SERVER + 'auth/register',

	getStores: SERVER + 'api/stores',
	getStore: SERVER + 'api/stores/:id',
	createStore: SERVER + 'api/store',
	createStoreV2: SERVER + 'api/store-v2',
	editStore: SERVER + 'api/store/:id',

	getThemes: SERVER + 'api/themes/:id',
	createSchedule: SERVER + 'api/schedule',
	createScheduleV2: SERVER + 'api/schedule-v2',
	getSchedules: SERVER + 'api/schedules',
	updateSchedule: SERVER + 'api/schedule/:id',
}

export const verifyLogin = async () => {
	try {
		const response = await fetch(API.auth_verify, {
			method: 'GET',
			credentials: 'include'
		})

		const data = await response.json();

		return !!data.success;
	}

	catch (err) {
		console.log('Error: ', err);
		return false;
	}
}

export const createStore = async (formData) => {
	try {
		const { name, url, token } = formData;

		if (!name || !url || !token) {
			console.log('Missing required parameters');
			return null;
		}

		const response = await fetch(API.createStore, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name, url, token })
		})

		const data = await response.json();

		console.log("data", data);

		if (data?.error) {
			console.log('Error creating store: ', data.error);
			return { error: data.error };
		}

		return { store: data?.store || null } ;
	}

	catch (err) {
		console.log('Error creating store: ', err)
		return { error: err };
	}
}

export const createStoreV2 = async (url, token) => {
	try {
		const response = await fetch(API.createStoreV2, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ url, token })
		})

		const data = await response.json();

		if (data?.error) {
			return { error: data.error };
		}

		return { success: data?.success } ;
	}

	catch (err) {
		console.log('Error creating store: ', err)
		return { error: err };
	}
}

export const editStore = async (id, name) => {
	try {
		const response = await fetch(API.editStore.replace(':id', id), {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name })
		})

		const data = await response.json();

		if (data?.error) {
			return { error: data.error };
		}

		return { success: data?.success } ;
	}

	catch (err) {
		console.log('Error updating store: ', err)
		return { error: err };
	}
}

export const deleteStore = async (id) => {
	try {
		const response = await fetch(API.editStore.replace(':id', id), {
			method: 'DELETE',
			credentials: 'include'
		})

		const data = await response.json();

		if (data?.error) {
			return { error: data.error };
		}

		return { success: data?.success } ;
	}

	catch (err) {
		console.log('Error deleting store: ', err)
		return { error: err };
	}
}

export const getStores = async () => {
	try {
		const response = await fetch(API.getStores, {
			method: 'GET',
			credentials: 'include'
		})

		const data = await response.json();

		console.log("data", data);

		return data?.stores || []
	}

	catch (err) {
		console.log('Error fetching stores: ', err)
		return [];
	}
}

export const getThemes = async (id) => {
	try {
		const response = await fetch(API.getThemes.replace(':id', id), {
			method: 'GET',
			credentials: 'include'
		})

		const data = await response.json();

		console.log("data", data);

		return data?.themes || []
	}

	catch (err) {
		console.log('Error fetching themes: ', err)
		return [];
	}
}

export const getStoreById = async (id) => {
	try {
		const response = await fetch(API.getStore.replace(':id', id), {
			method: 'GET',
			credentials: 'include'
		})

		const data = await response.json();

		return data?.store || null;
	}

	catch (err) {
		console.log('Error fetching store by id: ', err)
		return null;
	}
}

// Returns shedule and scheduleError todo: add jsdoc

/**
 * @param formData
 * @returns {Promise<{error}|{schedule: null, scheduleError: string}|{schedule: (*|null)}>}
 */
export const createSchedule = async (formData) => {
	try {
		const { store, theme, scheduledAtDate, scheduledAtTime } = formData;

		if (!store || !theme || !scheduledAtDate || !scheduledAtTime) {
			console.log('Missing required parameters');
			return { scheduleError: 'Missing required parameters', schedule: null };
		}

		const response = await fetch(API.createSchedule, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ store, theme, scheduledAtDate, scheduledAtTime })
		})

		const data = await response.json();

		console.log("data", data);

		if (data?.error) {
			console.log('Error creating schedule: ', data.error);
			return { scheduleError: data.error, schedule: null };
		}

		return { schedule: data?.schedule || null, scheduleError: null } ;
	}

	catch (err) {
		console.log('Error creating schedule: ', err)
		return { scheduleError: err, schedule: null };
	}
}

export const createScheduleV2 = async (id, theme, scheduledAt, storeName = '', themeName = '') => {
	try {
		const response = await fetch(API.createScheduleV2, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id, theme, scheduledAt, storeName, themeName })
		})

		const data = await response.json();

		console.log("Create Schedule Data: ", data);

		if (data?.error) {
			console.log('Error creating schedule: ', data.error);
			return { scheduleError: data.error, schedule: null };
		}

		return { schedule: data?.schedule || null, scheduleError: null } ;
	}

	catch (err) {
		console.log('Error creating schedule: ', err)
		return { scheduleError: err, schedule: null };
	}
}

export const getSchedules = async () => {
	try {
		const response = await fetch(API.getSchedules, {
			method: 'GET',
			credentials: 'include'
		})

		const data = await response.json();

		return data?.schedules || []
	}

	catch (err) {
		console.log('Error fetching schedules: ', err)
		return [];
	}
}

export const updateSchedule = async (id, formData) => {
	try {
		const { theme, scheduledAtDate, scheduledAtTime } = formData;

		if (!theme || !scheduledAtDate || !scheduledAtTime) {
			console.log('Missing required parameters');
			return { scheduleError: 'Missing required parameters', schedule: null };
		}

		const response = await fetch(API.updateSchedule.replace(':id', id), {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ theme, scheduledAtDate, scheduledAtTime })
		})

		const data = await response.json();

		console.log("data", data);

		if (data?.error) {
			console.log('Error updating schedule: ', data.error);
			return { scheduleError: data.error, schedule: null };
		}

		return { schedule: data?.schedule || null, scheduleError: null } ;
	}

	catch (err) {
		console.log('Error updating schedule: ', err)
		return { scheduleError: err, schedule: null };
	}
}

export const deleteSchedule = async (id) => {
	try {
		const response = await fetch(API.updateSchedule.replace(':id', id), {
			method: 'DELETE',
			credentials: 'include'
		})

		const data = await response.json();

		console.log("data", data);

		if (data?.error) {
			console.log('Error deleting schedule: ', data.error);
			return { scheduleError: data.error };
		}

		return { schedule: data?.schedule || null } ;
	}

	catch (err) {
		console.log('Error deleting schedule: ', err)
		return { scheduleError: err };
	}
}
