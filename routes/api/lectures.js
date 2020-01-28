const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const winston = require('winston');
const config = require('../../config');

let db;

// DATABASE RELATED STRINGS
const databaseUri = config.databaseUri;
const databaseName = config.databaseName 

// DATABASE CONNECTION
MongoClient.connect(databaseUri, {useUnifiedTopology: true}, (err, client) => {
    if (err) {
        throw err;
    }
    db = client.db(databaseName);
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
        new winston.transports.File({ filename: './../../log/error/error.log', level: 'error' }),
        new winston.transports.File({ filename: './../../log/activity/combined.log' })
    ]
}); 

router.get('/title/:title', async (req, res) => {
    try {                        
        const lectures = await db.collection('lectures').find().toArray();
        
        const cleanedTitleData = req.params.title.split(' ').join('');
        lecturesToSend = lectures.filter(item => item['교과목명'].split(' ').join('') === cleanedTitleData);

        if (lecturesToSend.length === 0) {
            logger.log({ level: 'error', message: `Fail for TITLE: ${req.params.title}, CLEANED_TITLE: ${cleanedTitleData}` });
            res.sendStatus(400);
        }
        else {
            logger.log({ level: 'info', message: `Success for TITLE: ${req.params.title}` });
            res.json(lecturesToSend);
        }
    }
    catch(err) {
        logger.log({ level: 'error', message: `DATABASE ERROR! CHECK IF SERVER IS CONNECTED TO THE DATABASE.` });
        res.sendStatus(400);
    }
});

router.get('/code/:code', async (req, res) => {
    try {
        const cleanedCodeData = req.params.code.split(' ').join('').toUpperCase();
        
        const lectures = await db.collection('lectures').find({ '교과목번호': cleanedCodeData }).toArray();
        if (lectures.length === 0) {
            logger.log({ level: 'error', message: `Fail for CODE: ${req.params.code}, CLEANED_CODE: ${cleanedCodeData}` });
            res.sendStatus(400);
        }
        else {
            logger.log({ level: 'info', message: `Success for CODE: ${req.params.code}` });
            res.json(lectures);
        }
    }
    catch(err) {
        logger.log({ level: 'error', message: `DATABASE ERROR! CHECK IF SERVER IS CONNECTED TO THE DATABASE.` });
        res.sendStatus(400);
    }
});

router.post('/', async (req, res) => {
    try {
        await db.collection('lectures').updateOne(
            { '_id': new ObjectID(req.body.lectureId) },
            { '$addToSet': { 'users': String(req.body.userId) } },
        );
        
        logger.log({ level: 'info', message: `Successfully added user('id': ${req.body.userId}) to lecture('id': ${req.body.lectureId})` });
        res.sendStatus(200);
    }
    catch(err) {
        logger.log({ level: 'error', message: `Error while adding user('id': ${req.body.userId}) to lecture('id': ${req.body.lectureId})` });
        logger.log({ level: 'error', message: `Error message: ${err}` });
        res.sendStatus(400);
    }
});

router.post('/delete/', async (req, res) => {
    try {
        await db.collection('lectures').updateOne(
            { '_id': new ObjectID(req.body.lectureId) },
            { '$pull': { 'users': String(req.body.userId) } }
        );

        logger.log({ level: 'info', message: `Successfully deleted user('id': ${req.body.userId}) from lecture('id': ${req.body.lectureId})` });
        res.sendStatus(200);
    }
    catch(err) {
        logger.log({ level: 'error', message: `Error while deleting user('id': ${req.body.userId}) from lecture('id': ${req.body.lectureId})` });
        logger.log({ level: 'error', message: `Error message: ${err}` });        
        res.sendStatus(400);
    }
});


module.exports = router;