const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Register
router.post('/register', (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.json({ success: false, message: 'All fields are required.' });
  if (password.length < 6)
    return res.json({ success: false, message: 'Password must be at least 6 characters.' });

  const existing = db.prepare('SELECT id FROM users WHERE email=? OR username=?').get(email, username);
  if (existing)
    return res.json({ success: false, message: 'Email or username already taken.' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  req.login(user, err => {
    if (err) return next(err);
    res.json({ success: true, message: 'Account created!' });
  });
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.json({ success: false, message: info?.message || 'Login failed.' });
    req.login(user, err => {
      if (err) return next(err);
      res.json({ success: true, message: 'Logged in!' });
    });
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => { if (err) return next(err); res.redirect('/'); });
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth_error=google' }),
  (req, res) => res.redirect('/')
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/?auth_error=github' }),
  (req, res) => res.redirect('/')
);

// Current user (for JS)
router.get('/me', (req, res) => {
  if (req.user) res.json({ loggedIn: true, user: { id: req.user.id, username: req.user.username, role: req.user.role, avatar: req.user.avatar } });
  else res.json({ loggedIn: false });
});

module.exports = router;
