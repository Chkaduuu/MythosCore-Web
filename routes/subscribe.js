const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const plans = db.prepare('SELECT * FROM subscriptions ORDER BY price ASC').all().map(p => {
    p.features = JSON.parse(p.features);
    return p;
  });
  res.render('subscribe', { title: 'Subscribe', plans });
});

module.exports = router;
