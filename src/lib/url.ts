/** Default path segment for invite links (e.g. /d/mifrah). */
export const INVITE_PATH = "/d";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function hostToHttps(host: string): string {
  const trimmed = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${trimmed}`;
}

/**
 * Resolves the public app URL for invite links (server-side).
 * Prefers explicit config, then Vercel's clean production domain
 * (avoids team-scoped deployment URLs like *-username-projects.vercel.app).
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  }

  const productionHost =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) {
    return hostToHttps(productionHost);
  }

  if (process.env.VERCEL_URL) {
    return hostToHttps(process.env.VERCEL_URL);
  }

  return "http://localhost:3000";
}

/** Client-safe base URL when building links in the browser. */
export function getClientBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return hostToHttps(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function getInviteUrl(inviteId: string): string {
  return `${getBaseUrl()}${INVITE_PATH}/${inviteId}`;
}
