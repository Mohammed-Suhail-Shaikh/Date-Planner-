import { randomBytes } from "crypto";

const CHARSET = "abcdefghijklmnopqrstuvwxyz23456789";

/** Generates a short URL-safe invite code (default 6 chars). */
export function generateShortInviteId(length = 6): string {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += CHARSET[bytes[i] % CHARSET.length];
  }
  return id;
}

/** Unique invite ID — short random code only (e.g. "k3m9x2"). */
export function generateInviteId(): string {
  return generateShortInviteId();
}
