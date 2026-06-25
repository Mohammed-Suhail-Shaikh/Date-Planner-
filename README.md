# Date Planner

A minimal personality-quiz-style date planning website. Create unique links for each person, they take a quiz, get a curated itinerary, can edit it, then download a PDF and receive a Google Calendar invite.

## Features

- Personality-test quiz flow (mood, vibe, activity, time)
- Curated itinerary from your config file
- Editable itinerary preview
- PDF download on approval
- Google Calendar invite (optional)
- Admin panel — create/delete invites, track status
- Unique link per person

## Quick start (local)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) — default password is in `.env.local`.

## Deploy to Vercel + Turso (free)

1. **Turso** — [docs/TURSO_SETUP.md](docs/TURSO_SETUP.md)
2. **Vercel** — [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)

### Vercel environment variables (minimum)

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD` | Admin login password |
| `TURSO_DATABASE_URL` | `libsql://...` from Turso |
| `TURSO_AUTH_TOKEN` | Token from Turso dashboard |

Optional: `NEXT_PUBLIC_APP_URL`, `GOOGLE_*` for calendar — see `.env.example`.

## Customize your dates

Edit [`config/curated-options.json`](config/curated-options.json):

- Quiz options (moods, activities, times)
- Venues (names, addresses, tags)
- Itinerary rules (which combos map to which venues)
- Your name and email (`planner` section)

## Docs

| Doc | Purpose |
|---|---|
| [docs/TURSO_SETUP.md](docs/TURSO_SETUP.md) | Create Turso database + get credentials |
| [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) | Deploy to Vercel step-by-step |
| [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md) | Google Calendar OAuth (optional) |

## Project structure

```
config/curated-options.json   # Your date content
src/app/date/[inviteId]       # Invitee quiz + preview
src/app/admin                 # Create/manage invites
src/lib/itinerary-engine.ts   # Quiz → itinerary logic
src/lib/db/                   # Turso / SQLite database
```

## Scripts

```bash
npm run dev      # Local development
npm run build    # Production build
npm run start    # Run production build locally
```
