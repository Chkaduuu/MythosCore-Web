const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isAuth } = require('../middleware/auth');

const CATEGORIES = ['Setups', 'Plugins', 'Configs', 'Scripts', 'Maps', 'Resource Packs', 'Mods', 'Other'];

router.get('/', (req, res) => {
  const cat = req.query.cat || 'Setups';
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  const activeCat = CATEGORIES.includes(cat) ? cat : 'Setups';
  const resources = db.prepare(`
    SELECT r.*, u.username, u.avatar FROM resources r
    JOIN users u ON r.user_id = u.id
    WHERE r.category = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(activeCat, limit, offset);
  const total = db.prepare('SELECT COUNT(*) as c FROM resources WHERE category=?').get(activeCat).c;
  res.render('resources', { title: 'Resources', categories: CATEGORIES, activeCat, resources, page, totalPages: Math.ceil(total / limit) });
});

router.get('/upload', isAuth, (req, res) => {
  res.render('resources-upload', { title: 'Upload Resource', categories: CATEGORIES });
});

router.post('/upload', isAuth, (req, res) => {
  const { category, title, description, download_url } = req.body;
  if (!title || !category) { req.flash('error', 'Title and category required.'); return res.redirect('/resources/upload'); }
  db.prepare('INSERT INTO resources (user_id, category, title, description, download_url) VALUES (?,?,?,?,?)').run(req.user.id, category, title, description, download_url);
  req.flash('success', 'Resource uploaded!');
  res.redirect(`/resources?cat=${category}`);
});

router.get('/:id', (req, res) => {
  const resource = db.prepare('SELECT r.*, u.username, u.avatar FROM resources r JOIN users u ON r.user_id=u.id WHERE r.id=?').get(req.params.id);
  if (!resource) return res.status(404).render('error', { title: '404', message: 'Resource not found.', user: req.user });
  db.prepare('UPDATE resources SET downloads=downloads+1 WHERE id=?').run(resource.id);
  res.render('resource-detail', { title: resource.title, resource, categories: CATEGORIES });
});

module.exports = router;
