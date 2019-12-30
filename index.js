const express = require('express');
const MongoClient = require('mongodb').MongoClient;
let db;

// DATABASE RELATED STRINGS
const databaseUri = 'mongodb://localhost:27017';
const databaseName = 'SnuScraperLocalTest' 

// CREATE APP
const app = express();

// MIDDLEWARE SETUP
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ROUTE SETUP
app.use('/api/lectures', require('./routes/api/lectures'));

// DATABASE CONNECTION AND PORT SETUP
const PORT = process.env.PORT || 5000;

MongoClient.connect(databaseUri, {useUnifiedTopology: true}, (err, client) => {
    if (err) {
        console.log(err);
        return;
    }
    db = client.db(databaseName);
    app.listen(PORT, () => console.log('Server Started'));
});

console.log(db);

module.exports = db;