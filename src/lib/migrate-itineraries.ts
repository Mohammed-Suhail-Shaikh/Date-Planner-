import curatedOptions from "../../config/curated-options.json";
import type { Itinerary, ItinerarySlot, QuizAnswers } from "@/lib/db/schema";
import { pickFillerVenue, type FillerKind, dedupeItineraryMainActivitySlots } from "@/lib/itinerary-engine";
import { areasWithinFillerRange } from "@/lib/boston-areas";
import type { BostonArea } from "@/lib/boston-areas";
import { resolveCuratedVenueForSlot } from "@/lib/venue-display";

type Venue = (typeof curatedOptions.venues)[number];

const DEFAULT_ANSWERS: QuizAnswers = {
  mood: "balanced",
  energy: "balanced",
  activity: "dinner",
  time: "evening",
  selectedDate: "2026-01-01",
  flowers: "tulips",
  dressing: "casual-comfy",
  herEmail: "",
};

/** Allston fillers replaced when a plan includes A Sanctuary Cafe on Charles Street. */
const ALLSTON_TO_BEACON_FILLER_MAP: Record<string, string> = {
  "filler-coffee-pavement-allston": "filler-coffee-tatte-beacon",
  "filler-food-roxy-allston": "filler-food-paramount-beacon",
};

function getVenueById(id: string): Venue | undefined {
  return curatedOptions.venues.find((v) => v.id === id) as Venue | undefined;
}

function mergeAnswers(answers?: Partial<QuizAnswers>): QuizAnswers {
  return { ...DEFAULT_ANSWERS, ...answers };
}

function itineraryHasBeaconSanctuary(itinerary: Itinerary): boolean {
  return itinerary.slots.some((slot) => resolveFullVenue(slot)?.id === "coffee-start");
}

function fillerTitle(venue: { name: string; tags: string[] }): string {
  if (venue.tags.includes("filler-coffee")) return `Coffee at ${venue.name}`;
  if (venue.tags.includes("filler-food")) return `Grab a bite at ${venue.name}`;
  if (venue.tags.includes("filler-dessert")) return `Sweet treat at ${venue.name}`;
  return venue.name;
}

function slotFromVenue(
  slot: ItinerarySlot,
  venue: Venue,
  isFiller: boolean
): ItinerarySlot {
  return {
    ...slot,
    venueId: venue.id,
    title: isFiller ? fillerTitle(venue) : venue.name,
    location: venue.name,
    address: venue.address,
    mapsUrl: venue.mapsUrl,
    notes: isFiller ? slot.notes || venue.notes : venue.notes,
    isFiller: isFiller || slot.isFiller,
  };
}

function resolveReplacementFiller(
  venueId: string,
  beaconPlan: boolean
): Venue | undefined {
  if (!beaconPlan) return undefined;
  const replacementId = ALLSTON_TO_BEACON_FILLER_MAP[venueId];
  if (!replacementId) return undefined;
  return getVenueById(replacementId);
}

function resolveFullVenue(slot: ItinerarySlot): Venue | undefined {
  const resolved = resolveCuratedVenueForSlot(slot);
  if (resolved?.id) return getVenueById(resolved.id);
  return undefined;
}

function isFillerSlot(slot: ItinerarySlot): boolean {
  if (slot.isCustom) return false;
  if (slot.isFiller) return true;
  const venue = resolveFullVenue(slot);
  return venue?.tags.includes("filler") ?? false;
}

function fillerKindsForVenue(venue: Venue): FillerKind[] {
  if (venue.tags.includes("filler-coffee")) return ["coffee"];
  if (venue.tags.includes("filler-food")) return ["food"];
  if (venue.tags.includes("filler-dessert")) return ["dessert"];
  if (venue.tags.includes("filler-walk")) return ["walk"];
  return ["coffee", "food", "dessert", "walk"];
}

function getAdjacentMainVenue(
  slots: ItinerarySlot[],
  index: number,
  direction: -1 | 1
): Venue | undefined {
  let i = index + direction;
  while (i >= 0 && i < slots.length) {
    if (!isFillerSlot(slots[i])) {
      return resolveFullVenue(slots[i]);
    }
    i += direction;
  }
  return undefined;
}

function fillerWithinRange(
  fillerArea: BostonArea,
  prevArea: BostonArea,
  nextArea: BostonArea
): boolean {
  return (
    areasWithinFillerRange(prevArea, fillerArea) &&
    areasWithinFillerRange(fillerArea, nextArea)
  );
}

function collectUsedVenueIds(slots: ItinerarySlot[]): Set<string> {
  const used = new Set<string>();
  for (const slot of slots) {
    const id = resolveFullVenue(slot)?.id;
    if (id) used.add(id);
  }
  return used;
}

/** Re-pick filler stops that are too far from neighboring main activities. */
function repickItineraryFillers(
  slots: ItinerarySlot[],
  answers?: Partial<QuizAnswers>
): ItinerarySlot[] {
  const result = slots.map((slot) => ({ ...slot }));
  const quizAnswers = mergeAnswers(answers);
  const usedIds = collectUsedVenueIds(result);

  for (let i = 0; i < result.length; i++) {
    if (!isFillerSlot(result[i])) continue;

    const prevVenue = getAdjacentMainVenue(result, i, -1);
    if (!prevVenue?.area) continue;

    const nextVenue = getAdjacentMainVenue(result, i, 1);
    const nextArea = (nextVenue?.area ?? prevVenue.area) as BostonArea;

    const currentVenue = resolveFullVenue(result[i]);

    if (
      currentVenue?.area &&
      fillerWithinRange(currentVenue.area as BostonArea, prevVenue.area as BostonArea, nextArea)
    ) {
      continue;
    }

    const kinds = currentVenue
      ? fillerKindsForVenue(currentVenue)
      : (["coffee", "food", "dessert", "walk"] as FillerKind[]);

    if (currentVenue?.id) usedIds.delete(currentVenue.id);

    const replacement = pickFillerVenue(
      prevVenue as Venue & { area: BostonArea },
      nextVenue ? (nextVenue as Venue & { area: BostonArea }) : null,
      quizAnswers,
      usedIds,
      kinds
    );

    if (replacement) {
      result[i] = slotFromVenue(result[i], replacement, true);
      usedIds.add(replacement.id);
    } else if (currentVenue?.id) {
      usedIds.add(currentVenue.id);
    }
  }

  return result;
}

export function normalizeItinerarySlot(
  slot: ItinerarySlot,
  beaconPlan: boolean
): ItinerarySlot {
  if (slot.isCustom) return slot;

  let venue = resolveFullVenue(slot);

  if (venue?.id && beaconPlan) {
    const replacement = resolveReplacementFiller(venue.id, true);
    if (replacement) venue = replacement;
  }

  if (!venue) return slot;

  const isFiller =
    slot.isFiller ||
    venue.tags.includes("filler") ||
    /^Coffee at |^Grab a bite at |^Sweet treat at /.test(slot.title);

  return slotFromVenue(slot, venue, isFiller);
}

export function normalizeItinerary(
  itinerary: Itinerary,
  answers?: Partial<QuizAnswers>
): Itinerary {
  const beaconPlan = itineraryHasBeaconSanctuary(itinerary);

  const slotsAfterVenueSync = itinerary.slots.map((slot) =>
    normalizeItinerarySlot(slot, beaconPlan)
  );

  const slotsAfterDedupe = dedupeItineraryMainActivitySlots(
    slotsAfterVenueSync,
    mergeAnswers(answers)
  );

  const slots = repickItineraryFillers(slotsAfterDedupe, answers);

  return { ...itinerary, slots };
}

export function itineraryNeedsNormalization(
  itinerary: Itinerary,
  answers?: Partial<QuizAnswers>
): boolean {
  const normalized = normalizeItinerary(itinerary, answers);
  return JSON.stringify(normalized.slots) !== JSON.stringify(itinerary.slots);
}
