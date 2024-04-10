const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const { Client } = require('pg');

dotenv.config();

const { UsersModel, ScheduleModel, StoresModel } = require("./models");
const { initializeAuthRouter } = require('./routes/auth');
const { initializeApiRoutes } = require('./routes/api');
const { log, logError, logCatch } = require('./utils');

const APP = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const STATIC_REACT_FILES = '/frontend/build';
const DATABASE_CONFIG = {
    database: process.env.DB || null,
    user: process.env.USER,
    password: process.env.PASS,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
}
const DATABASE_CLIENT = new Client(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
} : {
    user: DATABASE_CONFIG.user,
    host: DATABASE_CONFIG.host,
    database: DATABASE_CONFIG.database,
    password: DATABASE_CONFIG.password,
    port: DATABASE_CONFIG.port,
});
const SEQUELIZE = process.env.DATABASE_URL ? new Sequelize(process.env.DATABASE_URL, {
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // <<<<<<< YOU NEED THIS
        }
    },
}): new Sequelize(DATABASE_CONFIG.database, DATABASE_CONFIG.user, DATABASE_CONFIG.password, {
    host: DATABASE_CONFIG.host,
    dialect: DATABASE_CONFIG.dialect,
    port: DATABASE_CONFIG.port,
    logging: false
});
const MODELS = {
    Users: UsersModel(SEQUELIZE),
    Schedule: ScheduleModel(SEQUELIZE),
    Stores: StoresModel(SEQUELIZE)
}
const { authRouter, passport, authenticateMiddleware } = initializeAuthRouter(MODELS.Users);
const { apiRouter } = initializeApiRoutes(MODELS);

connectDatabase()
    .then(startServer)
    .catch(logCatch);

async function connectDatabase() {
    log('{ -- SERVER INSTANTIATION -- }', 'magenta');

    try {
        log('Starting initial connection test...', 'lightCyan');
        await DATABASE_CLIENT.connect(null);

        if (DATABASE_CONFIG.database) {
            log('Connected to database server successfully, creating database...', 'cyan');
            await DATABASE_CLIENT.query('CREATE DATABASE ' + DATABASE_CONFIG.database);
        }

        log('Database created successfully, syncing models...', 'cyan');
        await syncModels();
    }

    catch (error) {
        if (error?.code !== '42P04') {
            logError('An error occurred while creating the database:', error);

            return process.exit(1);
        }

        log('Database already exists, syncing models...', 'cyan');
        await syncModels();
    }

    finally {
        await DATABASE_CLIENT.end();
    }

    async function syncModels() {
        try {
            await SEQUELIZE.sync({ force: false, alter: true, logging: false })
        }

        catch(error) {
            logError('An error occurred while synchronizing the models to the database:', error)

            return process.exit(1);
        }

        finally {
            log('Database tables synchronized successfully', 'lightGreen');
        }
    }
}

function startServer() {
    APP.use(bodyParser.json());
    APP.use(cookieParser());
    APP.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
    }));
    APP.use(passport.initialize({}));
    APP.use('/auth', authRouter);
    APP.use('/api', authenticateMiddleware, apiRouter);
    APP.use(express.static(path.join(__dirname, STATIC_REACT_FILES)));

    APP.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, STATIC_REACT_FILES, 'index.html'));
    });

    APP.listen(process.env.PORT, () => {
        log(`Example app listening on port ${ process.env.PORT }`, 'lightBlue')
    })
}



