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
        console.error(err);
        return;
    }
    db = client.db(databaseName);
});

router.get('/title/:title', (req, res) => {
    db.collection('lectures').find({ '교과목명': req.params.title }).toArray((err, items) => {
        res.json(items);
    });
});

router.get('/code/:code', (req, res) => {
    db.collection('lectures').find({ '교과목번호': req.params.code }).toArray((err, items) => {
        res.json(items);
    });
});

router.post('/', (req, res) => {
    db.collection('lectures').updateOne(
        { '_id': new ObjectID(req.body.lectureId) },
        { '$addToSet': { 'users': String(req.body.userId) } },
    )
    .then(() => {
        return res.json({ success: true });
    })
    .catch(err => {
        console.log(`Error while adding user('id': ${req.body.userId}) to lecture('id': ${req.body.lectureId}) `);
    })

});

router.post('/delete/', (req, res) => {
    db.collection('lectures').updateOne(
        { '_id': new ObjectID(req.body.lectureId) },
        { '$pull': { 'users': String(req.body.userId) } }
    )
    .then(() => {
        return res.json({ success: true });
    })
    .catch(err => {
        console.log(`Error while deleting user('id': ${req.body.userId}) from lecture('id': ${req.body.lectureId}) `);
    })
});

module.exports = router;