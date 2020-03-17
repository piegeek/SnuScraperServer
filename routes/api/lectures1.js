const express = require('express');
const router = express.Router();

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

module.exports = router;