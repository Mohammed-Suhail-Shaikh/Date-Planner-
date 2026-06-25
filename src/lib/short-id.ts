import { randomBytes } from "crypto";

const CHARSET = "abcdefghijklmnopqrstuvwxyz23456789";

/** Generates a short URL-safe code (default 2 chars). */
export function generateShortInviteId(length = 2): string {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += CHARSET[bytes[i] % CHARSET.length];
  }
  return id;
}

/** First-name slug for URLs (e.g. "Mary Jane" → "mary"). */
export function slugifyName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const slug = first
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);

  return slug || "invite";
}

/**
 * Candidate invite IDs, shortest first: bare name, then name + 2-char suffix.
 * e.g. ["mifrah", "mifrah-k3", "mifrah-x2", ...]
 */
export function inviteIdCandidates(name: string, suffixAttempts = 8): string[] {
  const slug = slugifyName(name);
  const candidates = [slug];
  for (let i = 0; i < suffixAttempts; i++) {
    candidates.push(`${slug}-${generateShortInviteId(2)}`);
  }
  candidates.push(`${slug}-${generateShortInviteId(4)}`);
  return candidates;
}
