const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isAuth, isModerator } = require('../middleware/auth');

router.get('/', isAuth, (req, res) => {
  const inbox = db.prepare(`
    SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id=u.id
    WHERE (m.recipient_id=? OR m.is_broadcast=1) AND m.sender_id != ?
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id);
  const sent = db.prepare(`
    SELECT m.*, u.username as recipient_name FROM messages m
    LEFT JOIN users u ON m.recipient_id=u.id
    WHERE m.sender_id=? ORDER BY m.created_at DESC
  `).all(req.user.id);
  const unread = db.prepare("SELECT COUNT(*) as c FROM messages WHERE (recipient_id=? OR is_broadcast=1) AND read_at IS NULL AND sender_id!=?").get(req.user.id, req.user.id).c;
  res.render('messages', { title: 'Messages', inbox, sent, unread });
});

router.get('/compose', isAuth, (req, res) => {
  const users = db.prepare('SELECT id,username FROM users WHERE id!=? ORDER BY username').all(req.user.id);
  const to = req.query.to || '';
  res.render('messages-compose', { title: 'New Message', users, to });
});

router.post('/send', isAuth, (req, res) => {
  const { recipient_id, subject, content } = req.body;
  if (!content) { req.flash('error', 'Message cannot be empty.'); return res.redirect('/messages/compose'); }
  db.prepare('INSERT INTO messages (sender_id, recipient_id, subject, content, is_broadcast) VALUES (?,?,?,?,0)').run(req.user.id, recipient_id || null, subject, content);
  req.flash('success', 'Message sent!');
  res.redirect('/messages');
});

// Admin/Mod broadcast
router.get('/broadcast', isModerator, (req, res) => {
  const users = db.prepare('SELECT id,username FROM users ORDER BY username').all();
  res.render('messages-broadcast', { title: 'Broadcast Message', users });
});

router.post('/broadcast', isModerator, (req, res) => {
  const { subject, content, target } = req.body;
  if (!content) { req.flash('error', 'Message cannot be empty.'); return res.redirect('/messages/broadcast'); }
  if (target === 'all') {
    db.prepare('INSERT INTO messages (sender_id, recipient_id, subject, content, is_broadcast) VALUES (?,NULL,?,?,1)').run(req.user.id, subject, content);
  } else {
    db.prepare('INSERT INTO messages (sender_id, recipient_id, subject, content, is_broadcast) VALUES (?,?,?,?,0)').run(req.user.id, parseInt(target), subject, content);
  }
  req.flash('success', 'Broadcast sent!');
  res.redirect('/messages');
});

router.get('/:id', isAuth, (req, res) => {
  const msg = db.prepare('SELECT m.*, u.username as sender_name, u.avatar as sender_avatar FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?').get(req.params.id);
  if (!msg) return res.redirect('/messages');
  if (msg.recipient_id === req.user.id && !msg.read_at) {
    db.prepare("UPDATE messages SET read_at=CURRENT_TIMESTAMP WHERE id=?").run(msg.id);
  }
  res.render('message-detail', { title: msg.subject || 'Message', msg });
});

module.exports = router;
