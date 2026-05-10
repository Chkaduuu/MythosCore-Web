const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE active=1 ORDER BY position ASC').all();
  const recentThreads = db.prepare(`
    SELECT ft.*, u.username, u.avatar, fc.name as cat_name
    FROM forum_threads ft
    JOIN users u ON ft.user_id = u.id
    JOIN forum_categories fc ON ft.category_id = fc.id
    ORDER BY ft.created_at DESC LIMIT 5
  `).all();
  const stats = {
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    threads: db.prepare('SELECT COUNT(*) as c FROM forum_threads').get().c,
    resources: db.prepare('SELECT COUNT(*) as c FROM resources').get().c,
  };
  res.render('index', { title: 'Home', banners, recentThreads, stats });
});

module.exports = router;
