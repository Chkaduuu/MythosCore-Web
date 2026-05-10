const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, '..', 'mythoscore.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    github_id TEXT UNIQUE,
    avatar TEXT DEFAULT '/img/default-avatar.png',
    bio TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    site_rank TEXT DEFAULT 'user',
    rank_permissions TEXT DEFAULT '[]',
    subscription TEXT DEFAULT 'free',
    subscription_expires TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS forum_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '💬',
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS forum_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES forum_categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    download_url TEXT,
    image_url TEXT,
    downloads INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER,
    subject TEXT,
    content TEXT NOT NULL,
    is_broadcast INTEGER DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    image_url TEXT,
    link_url TEXT,
    active INTEGER DEFAULT 1,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    features TEXT DEFAULT '[]',
    color TEXT DEFAULT '#4ade80',
    rank_name TEXT
  );
`);

// Seed default forum categories
const catCount = db.prepare('SELECT COUNT(*) as c FROM forum_categories').get();
if (catCount.c === 0) {
  const insertCat = db.prepare('INSERT INTO forum_categories (name, description, icon, position) VALUES (?, ?, ?, ?)');
  insertCat.run('Announcements', 'Server news and updates', '📢', 0);
  insertCat.run('General Discussion', 'Talk about anything Minecraft', '💬', 1);
  insertCat.run('Help & Support', 'Need help? Ask here!', '❓', 2);
  insertCat.run('Suggestions', 'Suggest new features or changes', '💡', 3);
  insertCat.run('Ban Appeals', 'Appeal your ban here', '⚖️', 4);
  insertCat.run('Introductions', 'Introduce yourself to the community', '👋', 5);
}

// Seed default subscriptions
const subCount = db.prepare('SELECT COUNT(*) as c FROM subscriptions').get();
if (subCount.c === 0) {
  const insertSub = db.prepare('INSERT INTO subscriptions (name, price, description, features, color, rank_name) VALUES (?, ?, ?, ?, ?, ?)');
  insertSub.run('Adventurer', 5.99, 'Perfect for new players', JSON.stringify([
    'Custom nickname color',
    '2x claim blocks',
    'Access to /fly in lobby',
    'Priority queue',
    'Special forum badge'
  ]), '#4ade80', 'Adventurer');
  insertSub.run('Knight', 12.99, 'For dedicated players', JSON.stringify([
    'Everything in Adventurer',
    '5x claim blocks',
    '/fly on survival',
    'Custom particle effects',
    'Private forum section',
    '10% shop discount'
  ]), '#818cf8', 'Knight');
  insertSub.run('Legend', 24.99, 'Ultimate experience', JSON.stringify([
    'Everything in Knight',
    'Unlimited claim blocks',
    'Creative mode access',
    '/speed & /vanish commands',
    'Custom join message',
    'Exclusive cosmetics',
    '25% shop discount',
    'Direct admin support'
  ]), '#f59e0b', 'Legend');
}

// Seed default banners
const bannerCount = db.prepare('SELECT COUNT(*) as c FROM banners').get();
if (bannerCount.c === 0) {
  const insertBanner = db.prepare('INSERT INTO banners (title, content, active, position) VALUES (?, ?, ?, ?)');
  insertBanner.run('Welcome to MythosCore!', 'Join our epic Minecraft server and embark on an adventure like no other.', 1, 0);
  insertBanner.run('New Season Launched!', 'Season 5 is live! New map, new features, new adventures await.', 1, 1);
  insertBanner.run('Subscribe & Get Perks', 'Support the server and unlock exclusive privileges and cosmetics.', 1, 2);
}

// Create default admin if none exists
const adminCheck = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin'").get();
if (adminCheck.c === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT OR IGNORE INTO users (username, email, password_hash, role, site_rank) VALUES (?, ?, ?, 'admin', 'admin')").run('admin', 'admin@mythoscore.local', hash);
  console.log('✅ Default admin created: admin / admin123 — CHANGE PASSWORD IMMEDIATELY!');
}

module.exports = db;
