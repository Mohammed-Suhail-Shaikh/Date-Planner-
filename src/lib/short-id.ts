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
