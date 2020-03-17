const express = require('express');

// CREATE APP
const app = express();

// MIDDLEWARE SETUP
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ROUTE SETUP
app.use('/api/lectures', require('./routes/api/lectures'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/lectures1', require('./routes/api/lectures1'));

// PORT SETUP
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server Started')); 