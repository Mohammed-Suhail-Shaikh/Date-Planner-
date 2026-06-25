# Google Admin Login (post-deploy)

Planned upgrade: replace password login with **Google OAuth** so only `mdsuhail2003@gmail.com` can access `/admin`.

## Why after first deploy?

- Password login is enough to ship v1
- Google OAuth needs redirect URIs for both `localhost` and your Vercel URL
- Easier to configure once the production URL is known

## What will be protected

- `/admin` — invites
- `/admin/content` — date content preview
- All `/api/invites` and `/api/content` routes

## Implementation plan (v2)

1. Add NextAuth.js (or Auth.js) with Google provider
2. Restrict sign-in to your Gmail in `signIn` callback
3. Remove `ADMIN_PASSWORD` flow
4. Update Vercel env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`

Calendar invites already use separate Google credentials — admin login can share the same Cloud project.
