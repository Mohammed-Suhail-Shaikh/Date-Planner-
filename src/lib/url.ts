/** Default path segment for invite links (e.g. /d/abc123). */
export const INVITE_PATH = "/d";

/**
 * Resolves the public app URL for invite links.
 * Priority: NEXT_PUBLIC_APP_URL → VERCEL_URL (auto on Vercel) → localhost
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getInviteUrl(inviteId: string): string {
  return `${getBaseUrl()}${INVITE_PATH}/${inviteId}`;
}
