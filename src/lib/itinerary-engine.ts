import curatedOptions from "../../config/curated-options.json";
import type { QuizAnswers, Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";

export type CuratedOptions = typeof curatedOptions;

export function getCuratedOptions(): CuratedOptions {
  return curatedOptions;
}

type RuleSlot = {
  type: "venue";
  venueId: string;
  offsetMinutes: number;
};

type ItineraryRule = {
  match: Partial<QuizAnswers>;
  slots: RuleSlot[];
};

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

  return bestSlots;
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
  const ruleSlots = findBestRule(answers);
  const date = getNextSaturday();
  const timeDefault =
    curatedOptions.timeDefaults[
      answers.time as keyof typeof curatedOptions.timeDefaults
    ] ?? curatedOptions.timeDefaults.evening;

  const startTime = new Date(date);
  startTime.setHours(timeDefault.hour, timeDefault.minute, 0, 0);

  const slots: ItinerarySlot[] = ruleSlots.map((ruleSlot) => {
    const venue = curatedOptions.venues.find((v) => v.id === ruleSlot.venueId);
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
