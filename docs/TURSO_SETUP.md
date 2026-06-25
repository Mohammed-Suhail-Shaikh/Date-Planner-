# Turso Database Setup

Turso hosts your database in production. The local `file:./local.db` only works on your machine — Vercel needs Turso.

## 1. Create account

1. Go to [turso.tech](https://turso.tech) and sign up (free, no credit card)
2. Open the [dashboard](https://turso.tech/app)

## 2. Create database

1. Click **Create Database**
2. Name: `date-planner`
3. Region: pick one close to you (e.g. `aws-us-east-1`)
4. Click **Create**

## 3. Copy credentials

### Database URL (`TURSO_DATABASE_URL`)

From your database page, copy the URL. Example format:

```
libsql://date-planner-yourusername.aws-us-east-1.turso.io
```

### Auth token (`TURSO_AUTH_TOKEN`)

1. Open your database → **Tokens**
2. Click **Create Token**
3. Copy the token immediately (shown only once)

## 4. Add to environment

### Local (`.env.local`)

```env
TURSO_DATABASE_URL=libsql://date-planner-yourusername.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

Restart the dev server after changing env vars.

### Vercel

Project → **Settings** → **Environment Variables**:

| Key | Environments |
|---|---|
| `TURSO_DATABASE_URL` | Production, Preview |
| `TURSO_AUTH_TOKEN` | Production, Preview |

## 5. Tables

No manual migration needed. The app calls `initDb()` on first API request and creates:

- `invites` — one row per person you invite
- `responses` — quiz answers and itinerary per invite

## 6. Verify

1. Deploy or run locally with Turso env vars set
2. Go to `/admin` → create a test invite
3. If the invite appears in the list, Turso is working

## CLI alternative

```bash
# Install: https://docs.turso.tech/cli
turso auth login
turso db create date-planner
turso db show date-planner --url
turso db tokens create date-planner
```

## Free tier limits

- 5 GB storage
- 500M rows read / month
- 10M rows written / month

More than enough for personal date planning use.
