# MythosCore — Minecraft Server Website

Full-featured Minecraft server website with forum, resources, subscriptions, admin panel, and direct messages.

## 📋 Features

- **Home** — Banner carousel, server stats, recent threads
- **Resources** — Categorized downloads (Setups, Plugins, Configs, Scripts, Maps, Resource Packs, Mods, Other)
- **Forum** — Threaded forum with categories, replies, pin/lock (mod tools)
- **Discord** — Redirect page to your Discord server
- **Subscribe** — 3 subscription tiers (Adventurer, Knight, Legend)
- **Auth Modal** — Login/Register + Google & GitHub OAuth
- **Admin Panel** — Manage users, assign roles/ranks/permissions, manage banners, send broadcasts
- **Profile** — Edit username, bio, avatar photo, change password
- **Direct Messages** — User-to-user messaging, admin/mod broadcasts

## 🚀 Setup in GitHub Codespace

### Step 1 — Open in Codespace
1. Push these files to a GitHub repository
2. Click **Code → Codespaces → Create codespace on main**

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Any long random string |
| `GOOGLE_CLIENT_ID` | From [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GITHUB_CLIENT_ID` | From [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | From GitHub Developer Settings |
| `BASE_URL` | Your Codespace URL (e.g. `https://your-codespace-3000.app.github.dev`) |
| `DISCORD_INVITE` | Your Discord invite link |
| `PORT` | `3000` (default) |

> **Google/GitHub OAuth are optional.** The site works fully with just email/password login.

### Step 4 — Run the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

### Step 5 — Access the site
Open port `3000` in your Codespace. The site will be at:
```
https://your-codespace-3000.app.github.dev
```

---

## 🔐 Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google+ API** or **People API**
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Authorized redirect URIs: `https://your-codespace-url.app.github.dev/auth/google/callback`
7. Copy Client ID and Secret to `.env`

## 🐙 Setting up GitHub OAuth

1. Go to [GitHub Settings → Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Homepage URL: your Codespace URL
4. Authorization callback URL: `https://your-codespace-url.app.github.dev/auth/github/callback`
5. Copy Client ID and Secret to `.env`

---

## 👑 Default Admin Account

When the server starts for the first time, a default admin is created:

| Field | Value |
|-------|-------|
| Email | `admin@mythoscore.local` |
| Password | `admin123` |

**⚠️ Change the password immediately after first login!**

1. Log in with the credentials above
2. Go to **My Profile → Change Password**

---

## 📁 Project Structure

```
mythoscore/
├── server.js              # Main server entry
├── config/
│   └── passport.js        # OAuth strategies
├── database/
│   └── db.js              # SQLite database + seed data
├── middleware/
│   └── auth.js            # Auth middleware
├── routes/
│   ├── index.js           # Home page
│   ├── auth.js            # Login/Register/OAuth
│   ├── resources.js       # Resources
│   ├── forum.js           # Forum
│   ├── discord.js         # Discord redirect
│   ├── subscribe.js       # Subscriptions
│   ├── admin.js           # Admin panel
│   ├── profile.js         # User profiles
│   └── messages.js        # Direct messages
├── views/                 # EJS templates
├── public/
│   ├── css/style.css      # Main stylesheet
│   ├── js/main.js         # Frontend JS
│   └── uploads/           # User avatar uploads
└── .env.example           # Environment variable template
```

## 🛠 Clean URLs

All URLs are clean (no `.php`, `.html` extensions):
- `/` — Home
- `/resources` — Resources
- `/forum` — Forum
- `/forum/thread/42` — Individual thread
- `/discord` — Discord
- `/subscribe` — Subscribe
- `/admin` — Admin panel
- `/profile` — Your profile
- `/profile/5` — User profile by ID
- `/messages` — Inbox
- `/auth/google` — Google login

## 🗄 Database

The site uses **SQLite** (file: `mythoscore.db`) — no external database needed!

Data is automatically seeded on first run:
- Default forum categories
- 3 subscription plans
- 3 sample banners
- Default admin account
