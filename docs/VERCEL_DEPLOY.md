# Deploy to Vercel

Step-by-step guide to deploy Date Planner for free.

## Prerequisites

- Code pushed to GitHub: [Date-Planner-](https://github.com/Mohammed-Suhail-Shaikh/Date-Planner-)
- Turso database created — see [TURSO_SETUP.md](./TURSO_SETUP.md)
- Turso **Database URL** and **Auth Token** ready

## 1. Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `Mohammed-Suhail-Shaikh/Date-Planner-`
3. Framework: **Next.js** (auto-detected)
4. Root directory: `./`

## 2. Environment variables

Add these before clicking **Deploy**:

| Variable | Required | Example / notes |
|---|---|---|
| `ADMIN_PASSWORD` | Yes | Strong password for `/admin` |
| `TURSO_DATABASE_URL` | Yes | `libsql://date-planner-....turso.io` |
| `TURSO_AUTH_TOKEN` | Yes | From Turso → Tokens |
| `NEXT_PUBLIC_APP_URL` | Optional | `https://date-planner.vercel.app` — auto-falls back to Vercel URL if omitted |
| `GOOGLE_CLIENT_ID` | Optional | Calendar invites — see [GOOGLE_SETUP.md](./GOOGLE_SETUP.md) |
| `GOOGLE_CLIENT_SECRET` | Optional | Calendar invites |
| `GOOGLE_REFRESH_TOKEN` | Optional | Calendar invites |

Set required vars for **Production** and **Preview**.

## 3. Deploy

Click **Deploy** and wait for the build to finish.

## 4. Post-deploy checklist

- [ ] Open `https://your-app.vercel.app/admin`
- [ ] Sign in with `ADMIN_PASSWORD`
- [ ] Create a test invite — link should use your Vercel domain
- [ ] Open the invite link and complete the quiz flow
- [ ] Edit `config/curated-options.json` with your real venues and push to redeploy

## 5. Customize content

Edit [`config/curated-options.json`](../config/curated-options.json):

```json
{
  "planner": {
    "name": "Your Name",
    "email": "you@gmail.com",
    "defaultLocation": "Your City"
  }
}
```

Commit and push — Vercel redeploys automatically.

## 6. Optional: custom domain

Vercel → Project → **Settings** → **Domains** → add your domain.

If you use a custom domain, set:

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Then redeploy so invite links use the correct URL.

## Troubleshooting

| Problem | Fix |
|---|---|
| Admin login works but create invite fails | Check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel env vars |
| Invite links show `localhost` | Redeploy; app uses `VERCEL_URL` automatically on server. Admin copy-link uses browser origin. |
| Calendar invite fails on approve | Expected without Google OAuth — PDF and itinerary still work |
| Build fails | Check Vercel build logs; run `npm run build` locally first |

## Redeploy after env changes

Vercel → **Deployments** → latest deployment → **⋯** → **Redeploy**

Environment variable changes require a redeploy to take effect.
