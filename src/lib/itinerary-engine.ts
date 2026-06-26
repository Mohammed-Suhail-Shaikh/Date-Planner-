import curatedOptions from "../../config/curated-options.json";
import type { QuizAnswers, Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import { formatDateDisplay } from "./dates";
import {
  type BostonArea,
  areaTravelCost,
  areasCompatibleForEvening,
  areasWithinFillerRange,
  EVENING_ALTERNATIVES_BY_AREA,
  EVENING_EXCLUDED_VENUE_IDS,
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
  isFiller?: boolean;
  durationMinutes?: number;
};

type ItineraryRule = {
  match: Partial<QuizAnswers>;
  slots: RuleSlot[];
};

type Constraints = {
  forbiddenVenuePairs?: [string, string][];
};

type FillerConfig = {
  transitBufferMinutes: number;
  maxFillersPerItinerary: number;
  alwaysInsertBetweenMains: boolean;
  eveningDessertAfterLast: boolean;
};

type FillerKind = "coffee" | "food" | "dessert" | "walk";

export type { FillerKind };

type FullDayConfig = {
  dinnerHour: number;
  dinnerMinute: number;
  endHour: number;
  endMinute: number;
  minActivitiesBeforeDinner: number;
};

function getConstraints(): Constraints {
  return (curatedOptions as CuratedOptions & { constraints?: Constraints })
    .constraints ?? {};
}

function getFillerConfig(): FillerConfig {
  return (
    curatedOptions as CuratedOptions & { fillerConfig?: FillerConfig }
  ).fillerConfig ?? {
    transitBufferMinutes: 10,
    maxFillersPerItinerary: 5,
    alwaysInsertBetweenMains: true,
    eveningDessertAfterLast: true,
  };
}

function isFillerVenue(venue: Venue): boolean {
  return venue.tags.includes("filler");
}

function fillerKindTag(kind: FillerKind): string {
  return `filler-${kind}`;
}

function getFillerVenuesOfKind(kind: FillerKind): Venue[] {
  const tag = fillerKindTag(kind);
  return (curatedOptions.venues as Venue[]).filter(
    (v) => v.tags.includes("filler") && v.tags.includes(tag)
  );
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

function isVenueSuitableForEvening(venueId: string): boolean {
  if (EVENING_EXCLUDED_VENUE_IDS.has(venueId)) return false;
  const venue = getVenue(venueId);
  if (!venue) return true;
  if (venue.tags.includes("evening")) return true;
  if (
    venue.tags.includes("outdoors") &&
    venue.tags.includes("high-energy") &&
    !venue.tags.includes("evening")
  ) {
    return false;
  }
  return true;
}

function swapEveningInappropriateVenues(
  slots: RuleSlot[],
  answers: QuizAnswers,
  blockedVenueIds: Set<string> = new Set()
): RuleSlot[] {
  if (!isEveningDate(answers) || slots.length === 0) return slots;

  const resolved = slots.map((s) => ({ ...s }));
  const usedIds = new Set<string>();

  for (let i = 0; i < resolved.length; i++) {
    const venueId = resolved[i].venueId;
    const venue = getVenue(venueId);

    if (venue && isVenueSuitableForEvening(venueId)) {
      usedIds.add(venueId);
      continue;
    }

    const anchor =
      i > 0 ? getVenue(resolved[i - 1].venueId) : venue ?? undefined;
    const replacement = findReplacementVenue(
      venueId,
      anchor?.area,
      usedIds,
      true,
      blockedVenueIds
    );

    if (replacement) {
      resolved[i] = { ...resolved[i], venueId: replacement };
      usedIds.add(replacement);
    } else {
      usedIds.add(venueId);
    }
  }

  return resolved;
}

function isFullDay(answers: QuizAnswers): boolean {
  return answers.time === "full-day";
}

function getFullDayConfig(): FullDayConfig {
  return (
    curatedOptions as CuratedOptions & { fullDayConfig?: FullDayConfig }
  ).fullDayConfig ?? {
    dinnerHour: 18,
    dinnerMinute: 0,
    endHour: 20,
    endMinute: 0,
    minActivitiesBeforeDinner: 3,
  };
}

function minutesFromDayStart(
  hour: number,
  minute: number,
  startHour: number,
  startMinute: number
): number {
  return (hour - startHour) * 60 + (minute - startMinute);
}

function isDinnerVenue(venue: Venue): boolean {
  return venue.tags.includes("dinner");
}

function scoreVenueForAnswers(venue: Venue, answers: QuizAnswers): number {
  let score = 0;
  if (venue.tags.includes(answers.mood)) score += 3;
  if (venue.tags.includes(answers.energy)) score += 2;
  if (venue.tags.includes(answers.activity)) score += 3;
  if (venue.tags.includes(answers.time)) score += 2;
  return score;
}

function isDuplicateOfUsed(candidate: Venue, usedIds: Set<string>): boolean {
  for (const id of usedIds) {
    const existing = getVenue(id);
    if (!existing) continue;
    if (
      existing.id === candidate.id ||
      existing.name === candidate.name ||
      existing.address === candidate.address
    ) {
      return true;
    }
  }
  return false;
}

function pickVenueNearAnchor(
  anchor: Venue | undefined,
  answers: QuizAnswers,
  usedIds: Set<string>,
  filter: (v: Venue) => boolean
): Venue | null {
  const anchorArea = anchor?.area;
  const candidates = (curatedOptions.venues as Venue[])
    .filter(
      (v) =>
        !isFillerVenue(v) &&
        !usedIds.has(v.id) &&
        !isDuplicateOfUsed(v, usedIds) &&
        filter(v)
    )
    .filter((v) => {
      if (anchor && isForbiddenPair(v.id, anchor.id)) return false;
      if (!anchorArea || !v.area) return true;
      return areaTravelCost(anchorArea, v.area) <= 2;
    })
    .sort((a, b) => {
      const aArea = anchorArea && a.area === anchorArea ? 2 : 0;
      const bArea = anchorArea && b.area === anchorArea ? 2 : 0;
      if (bArea !== aArea) return bArea - aArea;
      return scoreVenueForAnswers(b, answers) - scoreVenueForAnswers(a, answers);
    });

  return candidates[0] ?? null;
}

/** Ensures full-day plans have enough activities before an anchored dinner. */
function expandForFullDay(
  slots: RuleSlot[],
  answers: QuizAnswers,
  blockedVenueIds: Set<string> = new Set()
): RuleSlot[] {
  const config = getFullDayConfig();
  const used = new Set(slots.map((s) => s.venueId));
  const mains = slots.map((s) => ({ ...s }));

  const nonDinnerCount = () =>
    mains.filter((s) => {
      const v = getVenue(s.venueId);
      return v && !isDinnerVenue(v);
    }).length;

  while (nonDinnerCount() < config.minActivitiesBeforeDinner) {
    const anchor = getVenue(mains[mains.length - 1].venueId);
    const activity =
      pickVenueNearAnchor(
        anchor,
        answers,
        used,
        (v) =>
          !isDinnerVenue(v) &&
          !blockedVenueIds.has(v.id) &&
          (v.tags.includes(answers.activity) ||
            v.tags.includes("culture") ||
            v.tags.includes("outdoors"))
      ) ??
      pickVenueNearAnchor(
        anchor,
        answers,
        used,
        (v) => !isDinnerVenue(v) && !blockedVenueIds.has(v.id)
      );
    if (!activity) break;
    mains.push({ type: "venue", venueId: activity.id, offsetMinutes: 0 });
    used.add(activity.id);
  }

  const hasDinner = mains.some((s) => {
    const v = getVenue(s.venueId);
    return v && isDinnerVenue(v);
  });

  if (!hasDinner) {
    const anchor = getVenue(mains[mains.length - 1].venueId);
    const dinner = pickVenueNearAnchor(
      anchor,
      answers,
      used,
      (v) => isDinnerVenue(v)
    );
    if (dinner) {
      mains.push({ type: "venue", venueId: dinner.id, offsetMinutes: 0 });
      used.add(dinner.id);
    }
  }

  const activities = mains.filter((s) => !isDinnerVenue(getVenue(s.venueId)!));
  const dinners = mains.filter((s) => isDinnerVenue(getVenue(s.venueId)!));
  return [...activities, ...dinners.slice(0, 1)];
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
  answers: QuizAnswers,
  blockedVenueIds: Set<string> = new Set()
): RuleSlot[] {
  if (slots.length === 0) return slots;

  const resolved = [...slots];
  const evening = isEveningDate(answers);
  const chosenIds: string[] = [];

  for (let i = 0; i < resolved.length; i++) {
    let venueId = resolved[i].venueId;
    const prevVenue = i > 0 ? getVenue(chosenIds[i - 1]) : undefined;
    const currVenue = getVenue(venueId);

    const forbidden =
      i > 0 && chosenIds.some((id) => isForbiddenPair(venueId, id));
    const tooFar =
      i > 0 &&
      evening &&
      prevVenue?.area &&
      currVenue?.area &&
      !areasCompatibleForEvening(prevVenue.area, currVenue.area);
    const blocked = blockedVenueIds.has(venueId);
    const needsSwap = forbidden || tooFar || blocked;

    if (needsSwap) {
      const replacement =
        findReplacementVenue(
          venueId,
          prevVenue?.area ?? currVenue?.area,
          new Set(chosenIds),
          evening,
          blockedVenueIds
        ) ??
        (blocked
          ? pickVenueNearAnchor(
              prevVenue,
              answers,
              new Set(chosenIds),
              (v) =>
                !blockedVenueIds.has(v.id) &&
                v.id !== venueId &&
                !isFillerVenue(v)
            )?.id ?? null
          : null);

      if (replacement) venueId = replacement;
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
  evening: boolean,
  blockedVenueIds: Set<string> = new Set()
): string | null {
  const original = getVenue(originalId);
  if (!anchorArea) return null;

  const candidates = new Set<string>();

  if (evening && EVENING_ALTERNATIVES_BY_AREA[anchorArea]) {
    for (const id of EVENING_ALTERNATIVES_BY_AREA[anchorArea]) {
      candidates.add(id);
    }
  }

  for (const v of curatedOptions.venues as Venue[]) {
    if (!v.area || v.area !== anchorArea) continue;
    if (isFillerVenue(v)) continue;
    if (original?.tags.some((t) => v.tags.includes(t))) {
      candidates.add(v.id);
    }
  }

  for (const id of candidates) {
    if (usedIds.has(id) || id === originalId) continue;
    if (blockedVenueIds.has(id)) continue;
    if (evening && EVENING_EXCLUDED_VENUE_IDS.has(id)) continue;
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

function isAfternoonOrFullDay(answers: QuizAnswers): boolean {
  return answers.time === "afternoon" || answers.time === "full-day";
}

function isFillerAreaOk(
  fillerArea: BostonArea,
  prevArea: BostonArea,
  nextArea: BostonArea
): boolean {
  return (
    areasWithinFillerRange(prevArea, fillerArea) &&
    areasWithinFillerRange(fillerArea, nextArea)
  );
}

function areaMatchScore(
  fillerArea: BostonArea,
  prevArea: BostonArea,
  nextArea: BostonArea
): number {
  const toPrev = areaTravelCost(fillerArea, prevArea);
  const toNext = areaTravelCost(fillerArea, nextArea);
  return 4 - Math.min(toPrev, 3) - Math.min(toNext, 3);
}

function scoreFillerVenue(venue: Venue, answers: QuizAnswers): number {
  let score = 0;
  if (venue.tags.includes(answers.mood)) score += 3;
  if (venue.tags.includes(answers.energy)) score += 2;
  if (venue.tags.includes(answers.activity)) score += 2;
  if (venue.tags.includes(answers.time)) score += 2;
  return score;
}

function kindsForBetweenSlot(
  answers: QuizAnswers,
  betweenIndex: number
): FillerKind[] {
  if (isAfternoonOrFullDay(answers)) {
    return betweenIndex % 2 === 0
      ? ["coffee", "food", "walk"]
      : ["food", "coffee", "walk"];
  }
  if (isEveningDate(answers)) {
    return ["coffee", "food"];
  }
  return ["coffee", "food", "dessert"];
}

export function pickFillerVenue(
  prevVenue: Venue,
  nextVenue: Venue | null,
  answers: QuizAnswers,
  usedIds: Set<string>,
  kinds: FillerKind[]
): Venue | null {
  if (!prevVenue.area) return null;
  const nextArea = nextVenue?.area ?? prevVenue.area;

  for (const kind of kinds) {
    const candidates = getFillerVenuesOfKind(kind)
      .filter((v) => {
        if (!v.area || usedIds.has(v.id)) return false;
        if (
          isForbiddenPair(v.id, prevVenue.id) ||
          (nextVenue && isForbiddenPair(v.id, nextVenue.id))
        ) {
          return false;
        }
        return isFillerAreaOk(v.area, prevVenue.area!, nextArea);
      })
      .sort((a, b) => {
        const areaDiff =
          areaMatchScore(b.area!, prevVenue.area!, nextArea) -
          areaMatchScore(a.area!, prevVenue.area!, nextArea);
        if (areaDiff !== 0) return areaDiff;
        return scoreFillerVenue(b, answers) - scoreFillerVenue(a, answers);
      });

    if (candidates[0]) return candidates[0];
  }

  return null;
}

export function formatFillerTitle(venue: Venue): string {
  if (venue.tags.includes("filler-coffee")) {
    return `Coffee at ${venue.name}`;
  }
  if (venue.tags.includes("filler-food")) {
    return `Grab a bite at ${venue.name}`;
  }
  if (venue.tags.includes("filler-dessert")) {
    return `Sweet treat at ${venue.name}`;
  }
  return venue.name;
}

/**
 * Rebuilds the timeline with food, coffee, and dessert fillers between
 * main stops — and a dessert cap on evening dates.
 */
function insertFillerSlots(
  mainSlots: RuleSlot[],
  answers: QuizAnswers
): RuleSlot[] {
  if (!mainSlots.length) return [];

  const config = getFillerConfig();
  const transit = config.transitBufferMinutes;
  const usedIds = new Set<string>();
  const result: RuleSlot[] = [];
  let fillersAdded = 0;
  let offset = mainSlots[0].offsetMinutes;
  let betweenIndex = 0;

  for (let i = 0; i < mainSlots.length; i++) {
    const venue = getVenue(mainSlots[i].venueId);
    if (!venue) continue;

    const duration = mainSlots[i].durationMinutes ?? venue.defaultDuration;

    result.push({
      type: "venue",
      venueId: mainSlots[i].venueId,
      offsetMinutes: offset,
      isFiller: false,
      durationMinutes: duration,
    });
    usedIds.add(mainSlots[i].venueId);
    offset += duration;

    const hasNextMain = i < mainSlots.length - 1;
    const shouldInsertBetween =
      config.alwaysInsertBetweenMains &&
      hasNextMain &&
      fillersAdded < config.maxFillersPerItinerary;

    if (shouldInsertBetween) {
      const nextVenue = getVenue(mainSlots[i + 1].venueId);
      if (nextVenue) {
        const kinds = kindsForBetweenSlot(answers, betweenIndex);
        const filler = pickFillerVenue(
          venue,
          nextVenue,
          answers,
          usedIds,
          kinds
        );

        if (filler) {
          offset += transit;
          const fillerDuration = filler.defaultDuration;
          result.push({
            type: "venue",
            venueId: filler.id,
            offsetMinutes: offset,
            isFiller: true,
            durationMinutes: fillerDuration,
          });
          usedIds.add(filler.id);
          fillersAdded++;
          betweenIndex++;
          offset += fillerDuration + transit;
          continue;
        }
      }
    }

    if (hasNextMain) {
      offset += transit;
    }
  }

  if (
    config.eveningDessertAfterLast &&
    fillersAdded < config.maxFillersPerItinerary &&
    (isEveningDate(answers) || isAfternoonOrFullDay(answers))
  ) {
    const lastMain = [...result].reverse().find((s) => !s.isFiller);
    if (lastMain) {
      const lastVenue = getVenue(lastMain.venueId);
      if (lastVenue) {
        const alreadyHasDessert = result.some((s) => {
          if (!s.isFiller) return false;
          const v = getVenue(s.venueId);
          return v?.tags.includes("filler-dessert");
        });

        if (!alreadyHasDessert) {
          const dessert = pickFillerVenue(
            lastVenue,
            null,
            answers,
            usedIds,
            ["dessert"]
          );
          if (dessert) {
            offset += transit;
            result.push({
              type: "venue",
              venueId: dessert.id,
              offsetMinutes: offset,
              isFiller: true,
              durationMinutes: dessert.defaultDuration,
            });
          }
        }
      }
    }
  }

  return result;
}

/** Full-day timeline: morning → afternoon → dinner at 6 PM → dessert (~8 PM). */
function insertFullDayTimeline(
  mainSlots: RuleSlot[],
  answers: QuizAnswers
): RuleSlot[] {
  if (!mainSlots.length) return [];

  const fillerConfig = getFillerConfig();
  const fullDayConfig = getFullDayConfig();
  const timeDefault = curatedOptions.timeDefaults["full-day"];
  const transit = fillerConfig.transitBufferMinutes;
  const maxFillers = 6;

  const dinnerStartMin = minutesFromDayStart(
    fullDayConfig.dinnerHour,
    fullDayConfig.dinnerMinute,
    timeDefault.hour,
    timeDefault.minute
  );

  const dinnerIdx = mainSlots.findIndex((s) => {
    const v = getVenue(s.venueId);
    return v && isDinnerVenue(v);
  });
  const preDinner =
    dinnerIdx >= 0 ? mainSlots.slice(0, dinnerIdx) : mainSlots;
  const dinnerMain = dinnerIdx >= 0 ? mainSlots[dinnerIdx] : null;

  const result: RuleSlot[] = [];
  const usedIds = new Set<string>();
  let offset = 0;
  let fillersAdded = 0;
  let betweenIndex = 0;

  for (let i = 0; i < preDinner.length; i++) {
    const venue = getVenue(preDinner[i].venueId);
    if (!venue) continue;

    const duration = preDinner[i].durationMinutes ?? venue.defaultDuration;

    result.push({
      type: "venue",
      venueId: preDinner[i].venueId,
      offsetMinutes: offset,
      isFiller: false,
      durationMinutes: duration,
    });
    usedIds.add(preDinner[i].venueId);
    offset += duration;

    if (i < preDinner.length - 1) {
      const nextVenue = getVenue(preDinner[i + 1].venueId);
      if (nextVenue && fillersAdded < maxFillers) {
        const filler = pickFillerVenue(
          venue,
          nextVenue,
          answers,
          usedIds,
          kindsForBetweenSlot(answers, betweenIndex)
        );
        if (filler) {
          offset += transit;
          result.push({
            type: "venue",
            venueId: filler.id,
            offsetMinutes: offset,
            isFiller: true,
            durationMinutes: filler.defaultDuration,
          });
          usedIds.add(filler.id);
          fillersAdded++;
          betweenIndex++;
          offset += filler.defaultDuration + transit;
          continue;
        }
      }
      offset += transit;
    }
  }

  if (dinnerMain) {
    const dinnerVenue = getVenue(dinnerMain.venueId);
    if (dinnerVenue) {
      offset = Math.max(offset + transit, dinnerStartMin);
      const dinnerDuration =
        dinnerMain.durationMinutes ?? dinnerVenue.defaultDuration;

      result.push({
        type: "venue",
        venueId: dinnerMain.venueId,
        offsetMinutes: offset,
        isFiller: false,
        durationMinutes: dinnerDuration,
      });
      usedIds.add(dinnerMain.venueId);
      offset += dinnerDuration;

      if (fillersAdded < maxFillers) {
        const dessert = pickFillerVenue(
          dinnerVenue,
          null,
          answers,
          usedIds,
          ["dessert"]
        );
        if (dessert) {
          offset += transit;
          result.push({
            type: "venue",
            venueId: dessert.id,
            offsetMinutes: offset,
            isFiller: true,
            durationMinutes: dessert.defaultDuration,
          });
        }
      }
    }
  }

  return result;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export type GenerateItineraryOptions = {
  blockedVenueIds?: Set<string>;
};

export function generateItinerary(
  answers: QuizAnswers,
  options?: GenerateItineraryOptions
): Itinerary {
  const blockedVenueIds = options?.blockedVenueIds ?? new Set<string>();
  const rawSlots = findBestRule(answers);
  let optimizedSlots = swapEveningInappropriateVenues(
    rawSlots,
    answers,
    blockedVenueIds
  );
  optimizedSlots = optimizeVenueIds(optimizedSlots, answers, blockedVenueIds);

  if (isFullDay(answers)) {
    optimizedSlots = expandForFullDay(
      optimizedSlots,
      answers,
      blockedVenueIds
    );
    optimizedSlots = optimizeVenueIds(
      optimizedSlots,
      answers,
      blockedVenueIds
    );
  }

  const ruleSlots = isFullDay(answers)
    ? insertFullDayTimeline(optimizedSlots, answers)
    : insertFillerSlots(optimizedSlots, answers);
  const dateIso = answers.selectedDate;
  const date = new Date(`${dateIso}T12:00:00`);
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
      title: ruleSlot.isFiller ? formatFillerTitle(venue) : venue.name,
      location: venue.name,
      address: venue.address,
      notes: venue.notes,
      durationMinutes: ruleSlot.durationMinutes ?? venue.defaultDuration,
      venueId: ruleSlot.venueId,
      mapsUrl: venue.mapsUrl,
      isFiller: ruleSlot.isFiller ?? false,
    };
  });

  return {
    date: formatDateDisplay(dateIso),
    dateIso,
    slots,
    flowers: answers.flowers,
    flowersSuggestion: answers.flowersSuggestion,
    dressing: answers.dressing,
  };
}
