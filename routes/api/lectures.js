const express = require('express');
const router = express.Router();
const db = require('../../index');

router.get('/:title', (req, res) => {
    console.log(db);
    lectures = db.lectures.find(
        {
            '교과목명': parseString(req.params.title)
        }
    );
    res.json(lectures);    
});

router.get('/:number', (req, res) => {

});

module.exports = router;