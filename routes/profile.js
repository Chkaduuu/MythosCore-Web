const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuth } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, 'avatar_' + req.user.id + '_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
}});

router.get('/', isAuth, (req, res) => {
  const userThreads = db.prepare('SELECT ft.*, fc.name as cat_name FROM forum_threads ft JOIN forum_categories fc ON ft.category_id=fc.id WHERE ft.user_id=? ORDER BY ft.created_at DESC LIMIT 10').all(req.user.id);
  res.render('profile', { title: 'My Profile', userThreads });
});

router.get('/:id', (req, res) => {
  const profile = db.prepare('SELECT id,username,avatar,bio,role,site_rank,subscription,created_at FROM users WHERE id=?').get(req.params.id);
  if (!profile) return res.status(404).render('error', { title: '404', message: 'User not found.', user: req.user });
  const userThreads = db.prepare('SELECT ft.*, fc.name as cat_name FROM forum_threads ft JOIN forum_categories fc ON ft.category_id=fc.id WHERE ft.user_id=? ORDER BY ft.created_at DESC LIMIT 10').all(profile.id);
  res.render('profile-view', { title: profile.username, profile, userThreads });
});

router.post('/update', isAuth, upload.single('avatar'), (req, res) => {
  const { username, bio } = req.body;
  let avatar = req.user.avatar;
  if (req.file) {
    if (req.user.avatar && req.user.avatar.startsWith('/uploads/') && !req.user.avatar.includes('default')) {
      const old = path.join(__dirname, '..', 'public', req.user.avatar);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    avatar = '/uploads/' + req.file.filename;
  }
  if (username && username !== req.user.username) {
    const taken = db.prepare('SELECT id FROM users WHERE username=? AND id!=?').get(username, req.user.id);
    if (taken) { req.flash('error', 'Username already taken.'); return res.redirect('/profile'); }
  }
  db.prepare('UPDATE users SET username=?, bio=?, avatar=? WHERE id=?').run(username || req.user.username, bio || '', avatar, req.user.id);
  req.flash('success', 'Profile updated!');
  res.redirect('/profile');
});

router.post('/password', isAuth, (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (!req.user.password_hash) { req.flash('error', 'Social login accounts cannot change password here.'); return res.redirect('/profile'); }
  if (!bcrypt.compareSync(current_password, req.user.password_hash)) { req.flash('error', 'Current password is incorrect.'); return res.redirect('/profile'); }
  if (new_password.length < 6) { req.flash('error', 'New password must be at least 6 characters.'); return res.redirect('/profile'); }
  if (new_password !== confirm_password) { req.flash('error', 'Passwords do not match.'); return res.redirect('/profile'); }
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  req.flash('success', 'Password changed!');
  res.redirect('/profile');
});

module.exports = router;
