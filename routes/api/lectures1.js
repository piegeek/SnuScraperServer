const path = require('path');
const express = require('express');
const router = express.Router();
const winston = require('winston');

const { Pool } = require('pg');

const config = require('../../config');
const asyncLog = require('../../asyncLog');

const pool = new Pool({
    user: config.databaseUsername,
    host: config.databaseHost,
    database: config.databaseIdentity,
    password: config.databasePassword,
    port: config.databasePort
});

// CREATE LOGGER
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../../log/error/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '../../log/activity/combined.log') })
    ]
}); 

router.get('/title/:year/:season/:title', async (req, res, next) => {
    // Query without manipulating user input (eg: 수학, 수학 1)
    try {
        const client = await pool.connect();
        const queryText = "SELECT * FROM lectures WHERE year = $1 AND season = $2 AND lecture_info ->> '교과목명' LIKE $3";
        const lectures = await client.query(queryText, [req.params.year, req.params.season, `%${req.params.title}%`]);
        const lecturesToSend = lectures.rows;

        if (lecturesToSend.length === 0) {
            next();
        }
        else {
            res.json(lecturesToSend);
            await asyncLog(logger, 'info', `SUCCESS ${decodeURI(req.originalUrl)} ${req.ip}`);
        }

        client.release();
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip} => DATABASE ISSUE`);
    }
});

router.get('/title/:year/:season/:title', async (req, res) => {
    // Query for when the user didn't put spaces at the right place (eg: 수학1)
    try {
        const client = await pool.connect();
        const queryText = 'SELECT * FROM lectures WHERE year = $1 AND season = $2';
        const lectures = await client.query(queryText, [req.params.year, req.params.season]);

        const cleanedTitleData = new RegExp(req.params.title.split(' ').join(''));
        const lecturesToSend = lectures.rows.filter(item => cleanedTitleData.test(item.lecture_info['교과목명'].split(' ').join('')) === true);

        if (lecturesToSend.length === 0) {
            res.sendStatus(400);
            await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip} => CAN'T FIND LECTURE`);
        }
        else {
            res.json(lecturesToSend);
            await asyncLog(logger, 'info', `SUCCESS ${decodeURI(req.originalUrl)} ${req.ip}`);
        }

        client.release();
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip}=> DATABASE ISSUE`);
    }
});

module.exports = router;