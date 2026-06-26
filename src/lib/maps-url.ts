import { getCuratedOptions } from "@/lib/itinerary-engine";
import type { ItinerarySlot } from "@/lib/db/schema";
import { getSlotDisplayMapsUrl, resolveCuratedVenueForSlot } from "@/lib/venue-display";

export function buildGoogleMapsUrl(query: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(query.trim())}`;
}

export function getMapsUrlForSlot(slot: ItinerarySlot): string | null {
  const fromVenue = getSlotDisplayMapsUrl(slot);
  if (fromVenue) return fromVenue;

  const venue = resolveCuratedVenueForSlot(slot);
  if (venue) return buildGoogleMapsUrl(venue.address);

  const query = slot.address.trim() || slot.location.trim() || slot.title.trim();
  if (!query) return null;

  return buildGoogleMapsUrl(query);
}
