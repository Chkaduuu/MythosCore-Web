const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isAuth, isModerator } = require('../middleware/auth');

router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM forum_categories ORDER BY position').all().map(cat => {
    cat.threadCount = db.prepare('SELECT COUNT(*) as c FROM forum_threads WHERE category_id=?').get(cat.id).c;
    cat.latestThread = db.prepare('SELECT ft.title, ft.id, u.username FROM forum_threads ft JOIN users u ON ft.user_id=u.id WHERE ft.category_id=? ORDER BY ft.created_at DESC LIMIT 1').get(cat.id);
    return cat;
  });
  const totalPosts = db.prepare('SELECT COUNT(*) as c FROM forum_posts').get().c;
  const totalMembers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  res.render('forum', { title: 'Forum', categories, totalPosts, totalMembers });
});

router.get('/category/:id', (req, res) => {
  const cat = db.prepare('SELECT * FROM forum_categories WHERE id=?').get(req.params.id);
  if (!cat) return res.redirect('/forum');
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const threads = db.prepare(`
    SELECT ft.*, u.username, u.avatar,
    (SELECT COUNT(*) FROM forum_posts WHERE thread_id=ft.id) as reply_count,
    (SELECT created_at FROM forum_posts WHERE thread_id=ft.id ORDER BY created_at DESC LIMIT 1) as last_reply
    FROM forum_threads ft JOIN users u ON ft.user_id=u.id
    WHERE ft.category_id=? ORDER BY ft.pinned DESC, ft.updated_at DESC LIMIT ? OFFSET ?
  `).all(cat.id, limit, offset);
  const total = db.prepare('SELECT COUNT(*) as c FROM forum_threads WHERE category_id=?').get(cat.id).c;
  res.render('forum-category', { title: cat.name, cat, threads, page, totalPages: Math.ceil(total / limit) });
});

router.get('/thread/new', isAuth, (req, res) => {
  const categories = db.prepare('SELECT * FROM forum_categories ORDER BY position').all();
  const catId = req.query.cat || '';
  res.render('forum-new-thread', { title: 'New Thread', categories, catId });
});

router.post('/thread/new', isAuth, (req, res) => {
  const { category_id, title, content } = req.body;
  if (!title || !content || !category_id) { req.flash('error', 'All fields required.'); return res.redirect('/forum/thread/new'); }
  const result = db.prepare('INSERT INTO forum_threads (category_id, user_id, title, content) VALUES (?,?,?,?)').run(category_id, req.user.id, title, content);
  res.redirect('/forum/thread/' + result.lastInsertRowid);
});

router.get('/thread/:id', (req, res) => {
  const thread = db.prepare('SELECT ft.*, u.username, u.avatar, u.role, u.site_rank, fc.name as cat_name, fc.id as cat_id FROM forum_threads ft JOIN users u ON ft.user_id=u.id JOIN forum_categories fc ON ft.category_id=fc.id WHERE ft.id=?').get(req.params.id);
  if (!thread) return res.status(404).render('error', { title: '404', message: 'Thread not found.', user: req.user });
  db.prepare('UPDATE forum_threads SET views=views+1 WHERE id=?').run(thread.id);
  const posts = db.prepare('SELECT fp.*, u.username, u.avatar, u.role, u.site_rank FROM forum_posts fp JOIN users u ON fp.user_id=u.id WHERE fp.thread_id=? ORDER BY fp.created_at ASC').all(thread.id);
  res.render('forum-thread', { title: thread.title, thread, posts });
});

router.post('/thread/:id/reply', isAuth, (req, res) => {
  const { content } = req.body;
  const thread = db.prepare('SELECT * FROM forum_threads WHERE id=?').get(req.params.id);
  if (!thread || thread.locked) { req.flash('error', 'Thread not found or locked.'); return res.redirect('/forum'); }
  if (!content) { req.flash('error', 'Reply cannot be empty.'); return res.redirect('/forum/thread/' + req.params.id); }
  db.prepare('INSERT INTO forum_posts (thread_id, user_id, content) VALUES (?,?,?)').run(thread.id, req.user.id, content);
  db.prepare("UPDATE forum_threads SET updated_at=CURRENT_TIMESTAMP WHERE id=?").run(thread.id);
  res.redirect('/forum/thread/' + req.params.id + '#bottom');
});

router.post('/thread/:id/delete', isModerator, (req, res) => {
  const thread = db.prepare('SELECT * FROM forum_threads WHERE id=?').get(req.params.id);
  if (!thread) return res.redirect('/forum');
  db.prepare('DELETE FROM forum_posts WHERE thread_id=?').run(thread.id);
  db.prepare('DELETE FROM forum_threads WHERE id=?').run(thread.id);
  req.flash('success', 'Thread deleted.');
  res.redirect('/forum/category/' + thread.category_id);
});

router.post('/thread/:id/pin', isModerator, (req, res) => {
  const thread = db.prepare('SELECT * FROM forum_threads WHERE id=?').get(req.params.id);
  if (!thread) return res.redirect('/forum');
  db.prepare('UPDATE forum_threads SET pinned=? WHERE id=?').run(thread.pinned ? 0 : 1, thread.id);
  res.redirect('/forum/thread/' + thread.id);
});

router.post('/thread/:id/lock', isModerator, (req, res) => {
  const thread = db.prepare('SELECT * FROM forum_threads WHERE id=?').get(req.params.id);
  if (!thread) return res.redirect('/forum');
  db.prepare('UPDATE forum_threads SET locked=? WHERE id=?').run(thread.locked ? 0 : 1, thread.id);
  res.redirect('/forum/thread/' + thread.id);
});

module.exports = router;
