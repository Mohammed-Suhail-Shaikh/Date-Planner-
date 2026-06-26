import { getCuratedOptions } from "@/lib/itinerary-engine";
import type { ItinerarySlot } from "@/lib/db/schema";

type VenueWithLegacy = {
  id: string;
  name: string;
  address: string;
  mapsUrl?: string;
  legacyNames?: string[];
  legacyAddresses?: string[];
};

function extractFillerVenueName(title: string): string | null {
  const coffee = title.match(/^Coffee at (.+)$/);
  if (coffee) return coffee[1];
  const food = title.match(/^Grab a bite at (.+)$/);
  if (food) return food[1];
  const dessert = title.match(/^Sweet treat at (.+)$/);
  if (dessert) return dessert[1];
  return null;
}

function venuesWithLegacy(): VenueWithLegacy[] {
  return getCuratedOptions().venues as VenueWithLegacy[];
}

/** Match a slot to its curated venue, including legacy Sanctuary Cat Café data. */
export function resolveCuratedVenueForSlot(
  slot: ItinerarySlot
): VenueWithLegacy | undefined {
  if (slot.venueId) {
    const byId = venuesWithLegacy().find((v) => v.id === slot.venueId);
    if (byId) return byId;
  }

  return venuesWithLegacy().find((v) => {
    if (v.name === slot.title || v.name === slot.location) return true;
    if (v.address === slot.address) return true;
    if (v.legacyNames?.includes(slot.title) || v.legacyNames?.includes(slot.location)) {
      return true;
    }
    if (v.legacyAddresses?.includes(slot.address)) return true;

    const fillerName = extractFillerVenueName(slot.title);
    if (fillerName && (v.name === fillerName || v.legacyNames?.includes(fillerName))) {
      return true;
    }

    return false;
  });
}

export function getSlotDisplayTitle(slot: ItinerarySlot): string {
  return resolveCuratedVenueForSlot(slot)?.name ?? slot.title;
}

export function getSlotDisplayAddress(slot: ItinerarySlot): string {
  const venue = resolveCuratedVenueForSlot(slot);
  if (venue) return venue.address;
  return slot.address;
}

export function getSlotDisplayMapsUrl(slot: ItinerarySlot): string | null {
  const venue = resolveCuratedVenueForSlot(slot);
  if (venue?.mapsUrl) return venue.mapsUrl;
  if (slot.mapsUrl?.trim()) return slot.mapsUrl.trim();
  return null;
}
