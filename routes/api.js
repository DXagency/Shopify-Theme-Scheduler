const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { log, logError } = require('../utils');
const dayjs = require('dayjs');
const { CronJob } = require('cron');

const SHOPIFY_API_URL = {
	getThemes: '/admin/api/2023-10/themes.json',
	updateTheme: '/admin/api/2023-10/themes/:id.json',
	getShopInfo: '/admin/api/2024-01/shop.json'
}
const scheduleJobs = [];

function initializeApiRoutes(models) {
	// On mount, check if there are any schedules that need cron jobs
	models.Schedule.findAll({ where: { enabled: true } })
		.then((dbSchedules) => {
			dbSchedules.forEach((schedule) => {
				const job = createCronJob(schedule, models);

				if (!job?.error)
					scheduleJobs.push({
						id: schedule?.id || null,
						cronJob: job
					});
			});
	});

	router.get('/hello', (req, res) => {
		res.send({ message: 'Hello World!'});
	});

	router.post('/store', async (req, res) => {
		try {
			const { name, url, token } = req.body;
			let error = false;

			if (!name || !url || !token)
				return res.status(400).json({ success: false, error: 'Missing required parameters' });

			if (await models.Stores.findOne({ where: { url } }))
				return res.status(400).json({ success: false, error: 'Store with that URL already exists' });

			// Check if token works with Shopify themes API
			const formattedUrl = url.replace('https://', '').replace('http://', '').replace('/', '');
			const API_URL = "https://" + formattedUrl + SHOPIFY_API_URL.getThemes;

			const response = await fetch(API_URL, {
				method: 'GET',
				headers: {
					'X-Shopify-Access-Token': token
				},
				credentials: 'include'
			}).catch((err) => {
				console.log("Error checking token", err);
				error = true;
			});

			if (error)
				return res.status(400).json({ success: false, error: 'Invalid token or store url' });

			const data = await response.json();

			const store = await models.Stores.create({ name, url, token });

			return res.status(200).json({ success: true, store: store, data: data });
		}

		catch (err) {
			console.log("Error creating store", err);
			return res.status(500).json({ success: false, error: 'Error creating store', raw: err });
		}
	});

	router.post('/store-v2', async (req, res) => {
		try {
			const { url, token } = req.body;

			let error = false;

			if (!url || !token)
				return res.status(400).json({ success: false, error: 'Missing required parameters' });

			const fetchOptions = {
				method: 'GET',
				headers: {
					'X-Shopify-Access-Token': token
				},
				credentials: 'include'
			};

			if (await models.Stores.findOne({ where: { url } }))
				return res.status(400).json({ success: false, error: 'This store already exists' });

			const formattedUrl = "https://" + url
					.replace('https://', '')
					.replace('http://', '')
					.replace('/', '')
					.replace('.myshopify.com', '')
					.concat('.myshopify.com');

			console.log("formattedUrl: ", formattedUrl)

			const SHOP_INFO_URL = formattedUrl + SHOPIFY_API_URL.getShopInfo;
			const shopInfoResponse = await fetch(SHOP_INFO_URL, fetchOptions).catch((err) => {
				console.log("Error checking token", err);
				error = true;
			});

			if (error)
				return res.status(400).json({ success: false, error: 'Invalid token or store url' });

			const shopInfoData = await shopInfoResponse.json();

			if (shopInfoData?.errors || !shopInfoData?.shop)
				return res.status(400).json({ success: false, error: 'Invalid token or store url', raw: shopInfoData });

			await models.Stores.create({
				shopifyId: shopInfoData.shop?.id,
				owner: shopInfoData.shop?.shop_owner,
				ownerEmail: shopInfoData.shop?.email,
				name: shopInfoData.shop?.name,
				url: formattedUrl,
				token
			});

			return res.status(200).json({ success: true, data: shopInfoData});
		}

		catch (err) {
			console.log("Error creating store", err);
			return res.status(500).json({ success: false, error: 'Error creating store', raw: err });
		}
	});

	router.get('/stores', async (req, res) => {
		try {
			const stores = await models.Stores.findAll();

			return res.status(200).json({ success: true, stores: stores });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error fetching stores', raw: err });
		}
	});

	router.get('/stores/:id', async (req, res) => {
		try {
			const store = await models.Stores.findOne({ where: { id: req.params.id }});

			return res.status(200).json({ success: true, store: store });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error fetching store', raw: err });
		}
	});

	router.put('/store/:id', async (req, res) => {
		try {
			const { name } = req.body;

			if (!req.params.id || !name)
				return res.status(400).json({ success: false, error: 'Missing required parameters' });

			const store = await models.Stores.findOne({ where: { id: req.params.id }});

			if (!store)
				return res.status(400).json({ success: false, error: 'Store not found' });

			store.name = name;
			store.save();

			return res.status(200).json({ success: true, store: store });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error updating store', raw: err });
		}
	});

	router.delete('/store/:id', async (req, res) => {
		try {
			if (!req.params.id)
				return res.status(400).json({ success: false, error: 'Missing required parameters' });

			const store = await models.Stores.findOne({ where: { id: req.params.id }});

			if (!store)
				return res.status(400).json({ success: false, error: 'Store not found' });

			store.destroy();

			return res.status(200).json({ success: true, store: store });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error deleting store', raw: err });
		}
	});

	router.get('/themes/:id', async (req, res) => {
		try {
			if (!req.params.id)
				return res.status(400).json({ success: false, error: 'Missing required parameters' });

			const store = await models.Stores.findOne({ where: { id: req.params.id }});

			if (!store)
				return res.status(400).json({ success: false, error: 'Store not found' });

			const formattedUrl = store.url.replace('https://', '').replace('http://', '').replace('/', '');
			const API_URL = "https://" + formattedUrl + SHOPIFY_API_URL.getThemes;

			const response = await fetch(API_URL, {
				method: 'GET',
				headers: {
					'X-Shopify-Access-Token': store.token
				},
				credentials: 'include'
			});

			const data = await response.json();

			return res.status(200).json({ success: true, themes: data?.themes || [] });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error fetching themes', raw: err });
		}
	});

	router.post('/schedule', async (req, res) => {
		try {
			const { store, theme, scheduledAtDate, scheduledAtTime } = req.body;

			if (!store || !theme || !scheduledAtDate || !scheduledAtTime)
				return res.status(400).json({ success: false, error: 'Missing required parameters' });

			const dateFormat = 'MM-DD-YYYY';
			const timeFormat = 'hh:mm A';
			const scheduledAt = dayjs(scheduledAtDate).format(dateFormat) + ' ' + dayjs(scheduledAtTime).format(timeFormat);

			console.log("POST /schedule");
			console.log("req.body", req.body);
			console.log('scheduledAt:', scheduledAt);
			console.log('scheduledAtDate:', dayjs(scheduledAtDate).format(dateFormat));
			console.log('scheduledAtTime:', dayjs(scheduledAtTime).format(timeFormat));

			const schedule = await models.Schedule.create({
				enabled: true,
				storeId: store,
				themeId: theme.toString(),
				scheduledAtDate: scheduledAtDate,
				scheduledAtTime: scheduledAtTime,
			});

			const job = createCronJob(schedule, models);

			if (!job?.error)
				scheduleJobs.push({
					id: schedule?.id || null,
					cronJob: job,
				});

			return res.status(200).json({ success: true, schedule: schedule });
		}

		catch (e) {
			return res.status(500).json({ success: false, error: 'Error scheduling theme', raw: e });
		}
  });

	router.get('/schedules', async (req, res) => {
		try {
			const schedules = await models.Schedule.findAll({
				where: {
					enabled: true
				}
			});

			return res.status(200).json({ success: true, schedules: schedules });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error fetching schedules', raw: err });
		}
	});

	router.put('/schedule/:id', async (req, res) => {
		try {
			const { theme, scheduledAtDate, scheduledAtTime } = req.body;

			if (!theme || !scheduledAtDate || !scheduledAtTime)
				return res.status(400).json({ success: false, error: 'Missing required parameters' });

			const schedule = await models.Schedule.findOne({ where: { id: req.params.id }});

			if (!schedule)
				return res.status(400).json({ success: false, error: 'Schedule not found' });

			schedule.themeId = theme;
			schedule.scheduledAtDate = scheduledAtDate;
			schedule.scheduledAtTime = scheduledAtTime;
			schedule.enabled = true;
			schedule.save();

			// Stop existing cron job
			const index = scheduleJobs.findIndex((scheduleJob) => scheduleJob.id === schedule.id);
			console.log("index", index);

			if (index > -1) {
				scheduleJobs[index].cronJob.stop();
				scheduleJobs.splice(index, 1);

				console.log('Stopped cron job for schedule', schedule.id);
			}

			const job = createCronJob(schedule, models);

			if (!job?.error)
				scheduleJobs.push({
					id: schedule?.id || null,
					cronJob: job
				});

			return res.status(200).json({ success: true, schedule: schedule });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error updating schedule', raw: err });
		}
	});

	router.delete('/schedule/:id', async (req, res) => {
		try {
			const schedule = await models.Schedule.findOne({ where: { id: req.params.id }});

			if (!schedule)
				return res.status(400).json({ success: false, error: 'Schedule not found' });

			schedule.enabled = false;
			schedule.save();

			// Stop existing cron job
			const index = scheduleJobs.findIndex((scheduleJob) => scheduleJob.id === schedule.id);
			console.log("index", index);

			if (index > -1) {
				scheduleJobs[index].cronJob.stop();
				scheduleJobs.splice(index, 1);

				console.log('Stopped cron job for schedule', schedule.id);
			}

			return res.status(200).json({ success: true, schedule: schedule });
		}

		catch (err) {
			return res.status(500).json({ success: false, error: 'Error deleting schedule', raw: err });
		}
	});

	router.get('*', (req, res) => {
		res.status(404).json({ success: false, error: 'Invalid API route' });
	});

	return { apiRouter: router};
}

function createCronJob(schedule, models) {
	const { scheduledAtDate, scheduledAtTime, themeId, storeId } = schedule;

	const dateFormat = 'MM-DD-YYYY';
	const timeFormat = 'hh:mm A';
	const scheduledAt = dayjs(scheduledAtDate).format(dateFormat) + ' ' + dayjs(scheduledAtTime).format(timeFormat);

	// check if scheduledAt is in the past
	if (dayjs(scheduledAt).isBefore(dayjs())) {
		// disable schedule in database
		schedule.enabled = false;
		schedule.save();
		return { error: 'Scheduled time is in the past' };
	}

	const cronTime = "0 " + dayjs(scheduledAt).format('mm HH DD MM') + " *";
	console.log("cronTime", cronTime);

	return CronJob.from({
		cronTime: cronTime,
		runOnce: true,
		start: true,
		onTick: async function () {
			try {
				console.log('Running cron job for schedule', schedule.id);
				const store = await models.Stores.findOne({where: {id: storeId}});

				if (!store) {
					console.log('Store not found for schedule', schedule.id);
					return { error: 'Store not found' };
				}

				const formattedUrl = store.url.replace('https://', '').replace('http://', '').replace('/', '');
				const API_URL = "https://" + formattedUrl + SHOPIFY_API_URL.getThemes;
				const API_URL_UPDATE = "https://" + formattedUrl + SHOPIFY_API_URL.updateTheme.replace(':id', themeId);

				const getThemesResponse = await fetch(API_URL, {
					method: 'GET',
					headers: {
						'X-Shopify-Access-Token': store.token
					},
					credentials: 'include'
				});
				const getThemesData = await getThemesResponse.json();

				console.log('data', getThemesData);
				console.log('data themes', getThemesData?.themes);

				getThemesData?.themes?.forEach((theme) => {
					console.log('----------');
					console.log('theme', theme.id);
					console.log('schedule id', themeId);
					console.log('IDs match ?', theme.id.toString() === themeId.toString());
					console.log('----------');
				});

				const theme = getThemesData?.themes?.find((theme) => theme.id.toString() === themeId.toString());

				if (!theme) {
					console.log('Theme not found for schedule', schedule.id);
					return { error: 'Theme not found' };
				}

				const updateThemeResponse = await fetch(API_URL_UPDATE, {
					method: 'PUT',
					headers: {
						'X-Shopify-Access-Token': store.token,
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({
						theme: {
							id: theme.id,
							role: 'main'
						}
					})
				});
				const updateThemeData = await updateThemeResponse.json();

				console.log('updateThemeData', updateThemeData);

				// disable schedule in database and update cache
				const updatedSchedule = await models.Schedule.findOne({where: {id: schedule.id}});
				updatedSchedule.enabled = false;
				updatedSchedule.save();

				const index = scheduleJobs.findIndex((scheduleJob) => scheduleJob.id === schedule.id);

				if (index > -1) {
					scheduleJobs[index].cronJob.stop();
					scheduleJobs.splice(index, 1);

					console.log('Stopped cron job for schedule', schedule.id);
				}

				return { success: true };
			}

			catch (e) {
				console.log("Error running cron job", e);
			}
		}
	});
}

module.exports = { initializeApiRoutes };
