import { MAX_INVITE_PHOTOS } from "@/lib/compress-image";

const DATA_URL_RE = /^data:image\/(jpeg|png|webp|gif);base64,/i;

export function parseInvitePhotos(photos: unknown): string[] {
  if (!photos) return [];
  if (!Array.isArray(photos)) {
    throw new Error("Photos must be an array.");
  }
  if (photos.length > MAX_INVITE_PHOTOS) {
    throw new Error(`You can upload at most ${MAX_INVITE_PHOTOS} photos.`);
  }

  const valid = photos.filter(
    (p): p is string => typeof p === "string" && DATA_URL_RE.test(p)
  );

  if (valid.length !== photos.length) {
    throw new Error("One or more photos are invalid.");
  }

  return valid;
}
