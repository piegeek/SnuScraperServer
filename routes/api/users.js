const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { Pool, Client } = require('pg');

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

router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const users = await client.query('SELECT * FROM users');
        console.log(users);
        res.json(users.rows);
    }
    catch(err) {
        console.log(err);
    }
    client.release();
});

router.get('/authorize/', checkJWT, (req, res) => {
    res.sendStatus(200);
});

// TODO: Check if HTTP status code is correct
router.post('/login/', async (req, res) => {
    try {
        const client = await pool.connect();
        const plainTextPassword = req.body.password;

        const queryText = 'SELECT * FROM users WHERE username=$1 LIMIT 1';
        const user = await client.query(queryText, [req.body.username]);
        const passwordMatch = await bcrypt.compare(plainTextPassword, user.rows[0].password);
        
        if (passwordMatch) {
            // Create and send a non-expiring token
            const jwtToken = jwt.sign({ username: req.body.username }, config.secret);
            res.json({ jwtToken: jwtToken });
        }
        else { res.sendStatus(400) }

        client.release();
    }
    catch(err) {
        res.sendStatus(400);
        console.log(err)
    }
});

router.post('/register/', async (req, res) => {
    try {
        const client = await pool.connect();
        const plainTextPassword = req.body.password;
        const hashedPassword = await bcrypt.hash(plainTextPassword, config.saltRounds);

        await client.query('BEGIN');
        const insertText = 'INSERT INTO users(username, email, password) VALUES($1, $2, $3)';
        const values = [req.body.username, req.body.email, hashedPassword];
        await client.query(insertText, values);
        await client.query('COMMIT');
        
        res.sendStatus(200);
        client.release();
    }
    catch(err) {
        await client.query('ROLLBACK');
        res.sendStatus(400);
        console.log(err);
    }
});

module.exports = router;