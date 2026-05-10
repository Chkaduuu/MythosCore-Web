require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Passport config
require('./config/passport')(passport);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: '.' }),
  secret: process.env.SESSION_SECRET || 'mythoscore-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Flash
app.use(flash());

// Global locals
const db = require('./database/db');
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.siteName = 'MythosCore';
  res.locals.discordInvite = process.env.DISCORD_INVITE || 'https://discord.gg/your-invite-code';
  res.locals.unreadCount = req.user
    ? db.prepare("SELECT COUNT(*) as c FROM messages WHERE (recipient_id=? OR is_broadcast=1) AND read_at IS NULL AND sender_id!=?").get(req.user.id, req.user.id).c
    : 0;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/resources', require('./routes/resources'));
app.use('/forum', require('./routes/forum'));
app.use('/discord', require('./routes/discord'));
app.use('/subscribe', require('./routes/subscribe'));
app.use('/admin', require('./routes/admin'));
app.use('/profile', require('./routes/profile'));
app.use('/messages', require('./routes/messages'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: '404 Not Found', message: 'The page you are looking for does not exist.', user: req.user });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Server Error', message: 'Something went wrong. Please try again.', user: req.user });
});

app.listen(PORT, () => {
  console.log(`🟢 MythosCore running at http://localhost:${PORT}`);
});
