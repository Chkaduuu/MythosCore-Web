const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('discord', { title: 'Discord' });
});

module.exports = router;
