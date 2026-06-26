import curatedOptions from "../../config/curated-options.json";
import { getDb } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import type { Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { resolveCuratedVenueForSlot } from "@/lib/venue-display";

type ConstraintsConfig = {
  monthlyLimitedVenues?: string[];
};

export function getMonthlyLimitedVenueIds(): Set<string> {
  const list =
    (curatedOptions as { constraints?: ConstraintsConfig }).constraints
      ?.monthlyLimitedVenues ?? [];
  return new Set(list);
}

export function monthKeyFromIso(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export function resolveVenueIdFromSlot(slot: ItinerarySlot): string | null {
  if (slot.venueId) return slot.venueId;
  return resolveCuratedVenueForSlot(slot)?.id ?? null;
}

export function extractLimitedVenueIdsFromItinerary(
  itinerary: Itinerary,
  limitedIds: Set<string> = getMonthlyLimitedVenueIds()
): string[] {
  const found: string[] = [];
  for (const slot of itinerary.slots) {
    if (slot.isFiller || slot.isCustom) continue;
    const id = resolveVenueIdFromSlot(slot);
    if (id && limitedIds.has(id)) found.push(id);
  }
  return found;
}

/** Venues already booked on another date in the same calendar month. */
export async function getBlockedMonthlyVenueIds(
  dateIso: string,
  excludeInviteId?: string
): Promise<Set<string>> {
  const limited = getMonthlyLimitedVenueIds();
  if (limited.size === 0) return new Set();

  const monthKey = monthKeyFromIso(dateIso);
  const db = getDb();
  const rows = await db.select().from(responses);
  const blocked = new Set<string>();

  for (const row of rows) {
    if (excludeInviteId && row.inviteId === excludeInviteId) continue;
    const itinerary = row.itinerary;
    if (!itinerary?.dateIso) continue;
    if (monthKeyFromIso(itinerary.dateIso) !== monthKey) continue;

    for (const id of extractLimitedVenueIdsFromItinerary(itinerary, limited)) {
      blocked.add(id);
    }
  }

  return blocked;
}
