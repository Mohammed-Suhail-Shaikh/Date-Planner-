# Date Planner

A minimal personality-quiz-style date planning website. Create unique links for each person, they take a quiz, get a curated itinerary, can edit it, then download a PDF and receive a Google Calendar invite.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` (already done if you cloned with defaults):

```
ADMIN_PASSWORD=your-secret-password
TURSO_DATABASE_URL=file:./local.db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Test the flow

1. Go to [http://localhost:3000/admin](http://localhost:3000/admin)
2. Sign in with password: `your-secret-password` (from `.env.local`)
3. Create an invite for a name (e.g. "Sarah")
4. Copy the generated link and open it in a new tab
5. Complete the quiz → preview itinerary → edit if needed → approve
6. PDF downloads automatically; calendar invite requires Google setup (see below)

## Customize your dates

Edit [`config/curated-options.json`](config/curated-options.json) to change:

- Quiz options (moods, activities, times)
- Venues (names, addresses, tags)
- Itinerary rules (which combinations map to which venues)
- Your name and email for calendar invites

## Google Calendar (optional for local testing)

Calendar invites require Google Cloud OAuth setup. Without it, the app still works — PDF downloads and itinerary saving work fine; you'll see a note that the calendar invite couldn't be sent.

See `docs/GOOGLE_SETUP.md` after deployment setup.

## Deploy to Vercel (free)

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add env vars from `.env.example`
4. Create a free [Turso](https://turso.tech) database and set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`

## Project structure

- `config/curated-options.json` — your curated date content
- `src/app/date/[inviteId]` — invitee quiz + preview flow
- `src/app/admin` — create links, track status
- `src/lib/itinerary-engine.ts` — matches quiz answers to venues
- `local.db` — SQLite database (created automatically on first use)
