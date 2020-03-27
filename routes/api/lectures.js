const path = require('path');
const express = require('express');
const router = express.Router();
const winston = require('winston');

const { Pool } = require('pg');

const config = require('../../config');
const asyncLog = require('../../asyncLog');
const checkJWT = require('../../middleware/checkJWT');

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
    const client = await pool.connect();
    
    try {
        const queryText = "SELECT * FROM lectures WHERE year = $1 AND season = $2 AND 교과목명 LIKE $3";
        const lectures = await client.query(queryText, [req.params.year, req.params.season, `%${req.params.title}%`]);
        const lecturesToSend = lectures.rows;

        if (lecturesToSend.length === 0) {
            next();
        }
        else {
            res.json(lecturesToSend);
            await asyncLog(logger, 'info', `SUCCESS ${decodeURI(req.originalUrl)} ${req.ip}`);
        }

    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip} => DATABASE ISSUE`);
    }
    
    client.release();
});

router.get('/title/:year/:season/:title', async (req, res) => {
    // Query for when the user didn't put spaces at the right place (eg: 수학1)
    const client = await pool.connect();
    
    try {
        const queryText = 'SELECT * FROM lectures WHERE year = $1 AND season = $2';
        const lectures = await client.query(queryText, [req.params.year, req.params.season]);

        const cleanedTitleData = new RegExp(req.params.title.split(' ').join(''));
        const lecturesToSend = lectures.rows.filter(item => item['교과목명'] && cleanedTitleData.test(item['교과목명'].split(' ').join('')) === true);

        if (lecturesToSend.length === 0) {
            res.sendStatus(400);
            await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip} => CAN'T FIND LECTURE`);
        }
        else {
            res.json(lecturesToSend);
            await asyncLog(logger, 'info', `SUCCESS ${decodeURI(req.originalUrl)} ${req.ip}`);
        }

    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip}=> DATABASE ISSUE`);
    }
    
    client.release();
});

router.get('/code/:year/:season/:code', async (req, res) => {
    const client = await pool.connect();

    try {
        const cleanedCodeData = req.params.code.trim();
        const queryText = 'SELECT * FROM lectures WHERE year = $1 AND season = $2 AND 교과목번호 = $3';
        const lectures = await client.query(queryText, [req.params.year, req.params.season, cleanedCodeData]);
        const lecturesToSend = lectures.rows;

        if (lecturesToSend.length == 0) {
            res.sendStatus(400);
            await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip} => CAN'T FIND LECTURE`);
        }
        else {
            res.json(lecturesToSend);
            await asyncLog(logger, 'info', `SUCCESS ${decodeURI(req.originalUrl)} ${req.ip}`);
        }

    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip} => DATABASE ISSUE`);
    }

    client.release();
});

router.post('/add/', checkJWT, async (req, res) => {
    const client = await pool.connect();

    try {
        // TODO: MAKE SURE username ATTRIBUTE ALLOWS NO DUPLICATES
        const users = await client.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [req.body.username]);
        const foundUser = users.rows[0];

        if (!foundUser) {
            res.sendStatus(400);
        }
        else {
            const insertQueryText = 'INSERT INTO registered(user_id, lecture_id) VALUES($1, $2)';
            await client.query(insertQueryText, [foundUser.id, req.body.lectureId]);
            res.sendStatus(200);
        }
    }
    catch(err) {
        res.sendStatus(400);
        // TODO: Remove use of arrow in logs, use default error message instead of custom
        await asyncLog(logger, 'error', `FAIL ${decodeURI(req.originalUrl)} ${req.ip} => DATABASE ISSUE`);
    }

    client.release();
});

router.post('/delete/', checkJWT, async (req, res) => {
    const client = await pool.connect();

    try {
        const users = await client.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [req.body.username]);
        const foundUser = users.rows[0];

        if (!foundUser) {
            res.sendStatus(400);
        }
        else {
            const deleteQueryText = 'DELETE FROM registered WHERE user_id = $1 AND lecture_id = $2';
            client.query(deleteQueryText, [foundUser.id, req.body.lectureId]);
            res.sendStatus(200);
        }

    }
    catch(err) {
        res.sendStatus(400);
    }
});

module.exports = router;