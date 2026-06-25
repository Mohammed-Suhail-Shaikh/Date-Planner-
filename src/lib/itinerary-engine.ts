import curatedOptions from "../../config/curated-options.json";
import type { QuizAnswers, Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import {
  type BostonArea,
  areasCompatibleForEvening,
  EVENING_ALTERNATIVES_BY_AREA,
} from "./boston-areas";

export type CuratedOptions = typeof curatedOptions;

export function getCuratedOptions(): CuratedOptions {
  return curatedOptions;
}

type Venue = CuratedOptions["venues"][number] & { area?: BostonArea };

type RuleSlot = {
  type: "venue";
  venueId: string;
  offsetMinutes: number;
};

type ItineraryRule = {
  match: Partial<QuizAnswers>;
  slots: RuleSlot[];
};

type Constraints = {
  forbiddenVenuePairs?: [string, string][];
};

function getConstraints(): Constraints {
  return (curatedOptions as CuratedOptions & { constraints?: Constraints })
    .constraints ?? {};
}

function getVenue(id: string): Venue | undefined {
  return curatedOptions.venues.find((v) => v.id === id) as Venue | undefined;
}

function isForbiddenPair(a: string, b: string): boolean {
  const pairs = getConstraints().forbiddenVenuePairs ?? [];
  return pairs.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
}

function isEveningDate(answers: QuizAnswers): boolean {
  return answers.time === "evening";
}

function scoreRule(rule: ItineraryRule, answers: QuizAnswers): number {
  let score = 0;
  const match = rule.match;
  if (match.mood && match.mood === answers.mood) score += 2;
  if (match.energy && match.energy === answers.energy) score += 1;
  if (match.activity && match.activity === answers.activity) score += 3;
  if (match.time && match.time === answers.time) score += 2;
  return score;
}

function findBestRule(answers: QuizAnswers): RuleSlot[] {
  const rules = curatedOptions.itineraryRules as ItineraryRule[];
  let bestScore = 0;
  let bestSlots: RuleSlot[] = curatedOptions.fallbackRule.slots as RuleSlot[];

  for (const rule of rules) {
    const score = scoreRule(rule, answers);
    if (score > bestScore) {
      bestScore = score;
      bestSlots = rule.slots as RuleSlot[];
    }
  }

  return bestSlots.map((s) => ({ ...s }));
}

/**
 * Resolves venue IDs for proximity and forbidden-pair constraints.
 */
function optimizeVenueIds(
  slots: RuleSlot[],
  answers: QuizAnswers
): RuleSlot[] {
  if (slots.length === 0) return slots;

  const resolved = [...slots];
  const evening = isEveningDate(answers);
  const chosenIds: string[] = [];

  for (let i = 0; i < resolved.length; i++) {
    let venueId = resolved[i].venueId;

    if (i > 0) {
      const prevId = chosenIds[i - 1];
      const prevVenue = getVenue(prevId);
      const currVenue = getVenue(venueId);

      if (prevVenue?.area && currVenue?.area) {
        const forbidden = chosenIds.some((id) =>
          isForbiddenPair(venueId, id)
        );
        const tooFar =
          evening &&
          !areasCompatibleForEvening(prevVenue.area, currVenue.area);
        const needsSwap = forbidden || tooFar;

        if (needsSwap) {
          const replacement = findReplacementVenue(
            venueId,
            prevVenue.area,
            new Set(chosenIds),
            evening
          );
          if (replacement) venueId = replacement;
        }
      }
    }

    resolved[i] = { ...resolved[i], venueId };
    chosenIds.push(venueId);
  }

  return resolved;
}

function findReplacementVenue(
  originalId: string,
  anchorArea: BostonArea | undefined,
  usedIds: Set<string>,
  evening: boolean
): string | null {
  const original = getVenue(originalId);
  if (!anchorArea) return null;

  const candidates = new Set<string>();

  // Area-specific alternatives for evening second stops
  if (evening && EVENING_ALTERNATIVES_BY_AREA[anchorArea]) {
    for (const id of EVENING_ALTERNATIVES_BY_AREA[anchorArea]) {
      candidates.add(id);
    }
  }

  // Same-area venues with overlapping tags
  for (const v of curatedOptions.venues as Venue[]) {
    if (!v.area || v.area !== anchorArea) continue;
    if (original?.tags.some((t) => v.tags.includes(t))) {
      candidates.add(v.id);
    }
  }

  for (const id of candidates) {
    if (usedIds.has(id) || id === originalId) continue;
    if ([...usedIds].some((prev) => isForbiddenPair(id, prev))) continue;
    const v = getVenue(id);
    if (
      evening &&
      v?.area &&
      !areasCompatibleForEvening(anchorArea, v.area)
    ) {
      continue;
    }
    return id;
  }

  return null;
}

function getNextSaturday(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  return saturday;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function generateItinerary(answers: QuizAnswers): Itinerary {
  const rawSlots = findBestRule(answers);
  const ruleSlots = optimizeVenueIds(rawSlots, answers);
  const date = getNextSaturday();
  const timeDefault =
    curatedOptions.timeDefaults[
      answers.time as keyof typeof curatedOptions.timeDefaults
    ] ?? curatedOptions.timeDefaults.evening;

  const startTime = new Date(date);
  startTime.setHours(timeDefault.hour, timeDefault.minute, 0, 0);

  const slots: ItinerarySlot[] = ruleSlots.map((ruleSlot) => {
    const venue = getVenue(ruleSlot.venueId);
    if (!venue) {
      throw new Error(`Venue not found: ${ruleSlot.venueId}`);
    }

    const slotTime = new Date(startTime);
    slotTime.setMinutes(slotTime.getMinutes() + ruleSlot.offsetMinutes);

    return {
      id: uuidv4(),
      time: formatTime(slotTime),
      title: venue.name,
      location: venue.name,
      address: venue.address,
      notes: venue.notes,
      durationMinutes: venue.defaultDuration,
    };
  });

  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    slots,
  };
}
