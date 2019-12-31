const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
let db;

// DATABASE RELATED STRINGS
const databaseUri = 'mongodb://localhost:27017';
const databaseName = 'SnuScraperLocalTest' 

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

module.exports = router;