# Google Calendar Setup

One-time setup to send calendar invites from your Gmail when someone approves a date.

## Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (free)
3. Enable **Google Calendar API** (APIs & Services → Library)
4. Configure OAuth consent screen (External, add your email as test user)
5. Create **OAuth 2.0 Client ID** (Web application)
   - Authorized redirect URI: `http://localhost:3000` (for local auth script)
6. Download client ID and secret

## Get a refresh token

Run the auth helper script (to be added) or use [Google OAuth Playground](https://developers.google.com/oauthplayground):

1. Use your own OAuth credentials
2. Authorize `https://www.googleapis.com/auth/calendar`
3. Exchange authorization code for tokens
4. Copy the **refresh token**

## Add to `.env.local`

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

Also update `planner.email` in `config/curated-options.json` to your Gmail address.

## Notes

- Calendar API is free for personal use
- Invites are sent from your Google Calendar when she approves
- Without these env vars, everything else still works (quiz, PDF, itinerary)
