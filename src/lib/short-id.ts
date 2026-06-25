import { randomBytes } from "crypto";

const CHARSET = "abcdefghijklmnopqrstuvwxyz23456789";

/** Generates a short URL-safe invite code (default 7 chars). */
export function generateShortInviteId(length = 7): string {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += CHARSET[bytes[i] % CHARSET.length];
  }
  return id;
}

/** Turn a display name into a URL slug (e.g. "Mary Jane" → "mary-jane"). */
export function slugifyName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  return slug || "invite";
}

/** Full invite ID: name slug + short code (e.g. "china-k3m9x2p"). */
export function generateInviteId(name: string): string {
  return `${slugifyName(name)}-${generateShortInviteId()}`;
}
