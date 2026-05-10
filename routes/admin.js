const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isAdmin, isModerator } = require('../middleware/auth');

const ALL_PERMISSIONS = ['delete_posts', 'pin_threads', 'lock_threads', 'manage_resources', 'ban_users', 'send_broadcasts'];

router.get('/', isAdmin, (req, res) => {
  const users = db.prepare('SELECT id,username,email,role,site_rank,subscription,created_at FROM users ORDER BY created_at DESC').all();
  const banners = db.prepare('SELECT * FROM banners ORDER BY position ASC').all();
  const stats = {
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    threads: db.prepare('SELECT COUNT(*) as c FROM forum_threads').get().c,
    resources: db.prepare('SELECT COUNT(*) as c FROM resources').get().c,
    messages: db.prepare('SELECT COUNT(*) as c FROM messages').get().c,
  };
  res.render('admin', { title: 'Admin Panel', users, banners, stats, permissions: ALL_PERMISSIONS });
});

// Update user role/rank/permissions
router.post('/user/:id/role', isAdmin, (req, res) => {
  const { role, site_rank, permissions } = req.body;
  const validRoles = ['user', 'moderator', 'admin'];
  if (!validRoles.includes(role)) return res.json({ success: false, message: 'Invalid role.' });
  const perms = Array.isArray(permissions) ? permissions.filter(p => ALL_PERMISSIONS.includes(p)) : [];
  db.prepare('UPDATE users SET role=?, site_rank=?, rank_permissions=? WHERE id=?').run(role, site_rank || role, JSON.stringify(perms), req.params.id);
  res.json({ success: true });
});

// Banners CRUD
router.post('/banner/add', isAdmin, (req, res) => {
  const { title, content, image_url, link_url } = req.body;
  db.prepare('INSERT INTO banners (title, content, image_url, link_url) VALUES (?,?,?,?)').run(title, content, image_url, link_url);
  req.flash('success', 'Banner added.');
  res.redirect('/admin');
});

router.post('/banner/:id/delete', isAdmin, (req, res) => {
  db.prepare('DELETE FROM banners WHERE id=?').run(req.params.id);
  req.flash('success', 'Banner deleted.');
  res.redirect('/admin');
});

router.post('/banner/:id/toggle', isAdmin, (req, res) => {
  const banner = db.prepare('SELECT * FROM banners WHERE id=?').get(req.params.id);
  if (banner) db.prepare('UPDATE banners SET active=? WHERE id=?').run(banner.active ? 0 : 1, banner.id);
  res.redirect('/admin');
});

// Delete user
router.post('/user/:id/delete', isAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.json({ success: false, message: 'Cannot delete yourself.' });
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
