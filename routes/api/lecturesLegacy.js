const path = require('path');
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const winston = require('winston');
const config = require('../../config');
const asyncLog = require('../../asyncLog');

let db;

// DATABASE RELATED STRINGS
const databaseUri = config.databaseUri;
const databaseName = config.databaseName;
// const legacyDatabaseNames = config.legacyDatabaseNames;
const currentCollectionName = config.currentCollectionName;
const oldCollectionsNames = config.oldCollectionsNames

// DATABASE CONNECTION
MongoClient.connect(databaseUri, {useUnifiedTopology: true}, (err, client) => {
    if (err) {
        throw err;
    }
    db = client.db(databaseName);
    // legacyDBs = legacyDatabaseNames.map(dbName => client.db(dbName));
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

router.get('/title/:title', async (req, res, next) => {
    // Query without manipulating user input (eg: 수학, 수학 1)
    try {                        
        const lectures = await db.collection(currentCollectionName).find({ '교과목명': new RegExp(req.params.title) }).toArray();

        if (lectures.length === 0) {
            next();
        }
        else {
            res.json(lectures);
            await asyncLog(logger, 'info', `Success for TITLE: ${req.params.title}`);
        }
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `DATABASE ERROR! CHECK IF SERVER IS CONNECTED TO THE DATABASE.`);
    }
});

router.get('/title/:title', async (req, res) => {
    // Query for when the user didn't put spaces at the right place (eg: 수학1)
    try {
        const lectures = await db.collection(currentCollectionName).find().toArray();
        
        const cleanedTitleData = new RegExp(req.params.title.split(' ').join(''));
        const lecturesToSend = lectures.filter(item => cleanedTitleData.test(item['교과목명'].split(' ').join('')) === true);

        if (lecturesToSend.length === 0) {
            res.sendStatus(400);
            await asyncLog(logger, 'error', `Fail for TITLE: ${req.params.title}, CLEANED_TITLE: ${cleanedTitleData}`);
        }
        else {
            res.json(lecturesToSend);
            await asyncLog(logger, 'info', `Success for TITLE: ${req.params.title}`);
        }
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `DATABASE ERROR! CHECK IF SERVER IS CONNECTED TO THE DATABASE.`);
    }
});

router.get('/code/:code', async (req, res) => {
    try {
        const cleanedCodeData = req.params.code.split(' ').join('').toUpperCase();
        
        const lectures = await db.collection(currentCollectionName).find({ '교과목번호': cleanedCodeData }).toArray();
        if (lectures.length === 0) {
            res.sendStatus(400);
            await asyncLog(logger, 'error', `Fail for CODE: ${req.params.code}, CLEANED_CODE: ${cleanedCodeData}`);
        }
        else {
            res.json(lectures);
            await asyncLog(logger, 'info', `Success for CODE: ${req.params.code}`);
        }
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `DATABASE ERROR! CHECK IF SERVER IS CONNECTED TO THE DATABASE.`);
    }
});

router.get('/lectureId/:lectureId', async (req, res, next) => {
    try {
        const lecture = await db.collection(currentCollectionName).find({ '_id': new ObjectID(req.params.lectureId) }).toArray();
        
        if (lecture.length === 0) {
            next();
        }
        else {
            res.json(lecture);
            await asyncLog(logger, 'info', `Success for lectureId: ${req.params.lectureId}`);
        } 
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `DATABASE ERROR! CHECK IF SERVER IS CONNECTED TO THE DATABASE.`);
    }
});

router.get('/lectureId/:lectureId', async (req, res) => {
    try {
        let lecture;

        for (oldCollectionName of oldCollectionsNames) {
            lecture = await db.collection(oldCollectionName).find({ '_id': new ObjectID(req.params.lectureId) }).toArray();
        }

        if (lecture.length === 0 || lecture === undefined) {
            res.sendStatus(400);
            await asyncLog(logger, 'error', `Cant find lecture with lectureID: ${req.params.lectureId}.`);
        }
        else {
            res.json(lecture);
            await asyncLog(logger, 'info', `Success for lectureId: ${req.params.lectureId}`);
        }
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `DATABASE ERROR! CHECK IF SERVER IS CONNECTED TO THE DATABASE.`);
    }
});

router.post('/', async (req, res) => {
    try {
        await db.collection('lectures').updateOne(
            { '_id': new ObjectID(req.body.lectureId) },
            { '$addToSet': { 'users': String(req.body.userId) } },
        );
        
        res.sendStatus(200);
        await asyncLog(logger, 'info', `Successfully added user('id': ${req.body.userId}) to lecture('id': ${req.body.lectureId})`);
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `Error while adding user('id': ${req.body.userId}) to lecture('id': ${req.body.lectureId})`);
        await asyncLog(logger, 'error', `Error message: ${err}`);
    }
});

router.post('/delete/', async (req, res, next) => {
    try {
        await db.collection('lectures').updateOne(
            { '_id': new ObjectID(req.body.lectureId) },
            { '$pull': { 'users': String(req.body.userId) } }
        );
        next();
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `Error while deleting user('id': ${req.body.userId}) from lecture('id': ${req.body.lectureId})`);
        await asyncLog(logger, 'error', `Error message: ${err}`);    
    }
});

router.post('/delete/', async (req, res) => {
    try {
        for (oldCollectionName of oldCollectionsNames) {
            await db.collection(oldCollectionName).updateOne(
                { '_id': new ObjectID(req.body.lectureId) },
                { '$pull': { 'users': String(req.body.userId) } }
            );
        }

        res.sendStatus(200);
        await asyncLog(logger, 'info', `Successfully deleted user('id': ${req.body.userId}) from lecture('id': ${req.body.lectureId})`);
    }
    catch(err) {
        res.sendStatus(400);
        await asyncLog(logger, 'error', `Error while deleting user('id': ${req.body.userId}) from lecture('id': ${req.body.lectureId})`);
        await asyncLog(logger, 'error', `Error message: ${err}`);    
    }
});

module.exports = router;