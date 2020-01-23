const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
let db;

// DATABASE RELATED STRINGS
const databaseUri = 'mongodb://localhost:27017';
const databaseName = 'SSLT2019WINTER' 

// DATABASE CONNECTION
MongoClient.connect(databaseUri, {useUnifiedTopology: true}, (err, client) => {
    if (err) {
        throw err;
    }
    db = client.db(databaseName);
});

router.get('/title/:title', async (req, res) => {
    try {
        let lectures = await db.collection('lectures').find({ '교과목명': req.params.title }).toArray();
        if (lectures.length === 0) {
            res.sendStatus(400);
        }
        else {
            res.json(lectures);
        }
    }
    catch(err) {
        res.sendStatus(400);
    }
});

router.get('/code/:code', async (req, res) => {
    try {
        let lectures = await db.collection('lectures').find({ '교과목번호': req.params.code }).toArray();
        if (lectures.length === 0) {
            res.sendStatus(400);
        }
        else {
            res.json(lectures);
        }
    }
    catch(err) {
        res.sendStatus(400);
    }
    
    db.collection('lectures').find({ '교과목번호': req.params.code }).toArray((err, items) => {
        res.json(items);
    });
});

router.post('/', async (req, res) => {
    try {
        await db.collection('lectures').updateOne(
            { '_id': new ObjectID(req.body.lectureId) },
            { '$addToSet': { 'users': String(req.body.userId) } },
        );
        res.sendStatus(200);
    }
    catch(err) {
        console.log(`Error while adding user('id': ${req.body.userId}) to lecture('id': ${req.body.lectureId}) `);
        console.log(`Error message: ${err}`);
        res.sendStatus(400);
    }
});

router.post('/delete/', async (req, res) => {
    try {
        await db.collection('lectures').updateOne(
            { '_id': new ObjectID(req.body.lectureId) },
            { '$pull': { 'users': String(req.body.userId) } }
        );
        res.sendStatus(200);
    }
    catch(err) {
        console.log(`Error while deleting user('id': ${req.body.userId}) from lecture('id': ${req.body.lectureId}) `);
        console.log(`Error message: ${err}`);
        res.sendStatus(400);
    }
});


module.exports = router;