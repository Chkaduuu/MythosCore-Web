const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../database/db');

module.exports = function(passport) {
  // Local strategy
  passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return done(null, false, { message: 'No account found with that email.' });
    if (!user.password_hash) return done(null, false, { message: 'This account uses social login.' });
    if (!bcrypt.compareSync(password, user.password_hash)) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  }));

  // Google strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`
    }, (accessToken, refreshToken, profile, done) => {
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
      if (!user) {
        const email = profile.emails?.[0]?.value || `${profile.id}@google.oauth`;
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (user) {
          db.prepare('UPDATE users SET google_id = ?, avatar = ? WHERE id = ?').run(profile.id, profile.photos?.[0]?.value || user.avatar, user.id);
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        } else {
          const username = profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + profile.id.slice(-4);
          db.prepare('INSERT INTO users (username, email, google_id, avatar) VALUES (?, ?, ?, ?)').run(username, email, profile.id, profile.photos?.[0]?.value || '/img/default-avatar.png');
          user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
        }
      }
      return done(null, user);
    }));
  }

  // GitHub strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id') {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/github/callback`
    }, (accessToken, refreshToken, profile, done) => {
      let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(String(profile.id));
      if (!user) {
        const email = profile.emails?.[0]?.value || `${profile.id}@github.oauth`;
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (user) {
          db.prepare('UPDATE users SET github_id = ?, avatar = ? WHERE id = ?').run(String(profile.id), profile.photos?.[0]?.value || user.avatar, user.id);
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        } else {
          const username = (profile.username || 'user') + '_' + String(profile.id).slice(-4);
          db.prepare('INSERT INTO users (username, email, github_id, avatar) VALUES (?, ?, ?, ?)').run(username, email, String(profile.id), profile.photos?.[0]?.value || '/img/default-avatar.png');
          user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(String(profile.id));
        }
      }
      return done(null, user);
    }));
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    done(null, user);
  });
};
