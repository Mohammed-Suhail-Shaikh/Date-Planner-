/**
 * Boston area clusters for proximity logic.
 * Travel costs are approximate (~10 min per step):
 * 0 = same cluster, 1 = short hop (~10–15 min walk/T), 2+ = too far for fillers.
 */

export type BostonArea =
  | "downtown"
  | "back-bay"
  | "fenway"
  | "south-end"
  | "cambridge-central"
  | "cambridge-kendall"
  | "allston"
  | "somerville";

/** Max area cost for filler stops (~10–15 min from neighboring mains). */
export const FILLER_MAX_AREA_COST = 1;

/** Max area cost between consecutive main stops on evening dates */
export const EVENING_MAX_AREA_COST = 1;

/**
 * Area travel cost matrix (symmetric).
 * back-bay = Esplanade, Newbury, Copley, Boylston strip
 * fenway = MFA, Gardner, Kenmore / Longwood
 * south-end = Washington St corridor (e.g. Flour Bakery)
 */
const AREA_COST: Record<BostonArea, Record<BostonArea, number>> = {
  downtown: {
    downtown: 0,
    "back-bay": 1,
    fenway: 2,
    "south-end": 1,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 2,
    somerville: 2,
  },
  "back-bay": {
    downtown: 1,
    "back-bay": 0,
    fenway: 1,
    "south-end": 2,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 2,
    somerville: 2,
  },
  fenway: {
    downtown: 2,
    "back-bay": 1,
    fenway: 0,
    "south-end": 1,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 1,
    somerville: 2,
  },
  "south-end": {
    downtown: 1,
    "back-bay": 2,
    fenway: 1,
    "south-end": 0,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 2,
    somerville: 2,
  },
  "cambridge-central": {
    downtown: 2,
    "back-bay": 2,
    fenway: 2,
    "south-end": 2,
    "cambridge-central": 0,
    "cambridge-kendall": 1,
    allston: 2,
    somerville: 1,
  },
  "cambridge-kendall": {
    downtown: 2,
    "back-bay": 2,
    fenway: 2,
    "south-end": 2,
    "cambridge-central": 1,
    "cambridge-kendall": 0,
    allston: 2,
    somerville: 2,
  },
  allston: {
    downtown: 2,
    "back-bay": 2,
    fenway: 1,
    "south-end": 2,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 0,
    somerville: 2,
  },
  somerville: {
    downtown: 2,
    "back-bay": 2,
    fenway: 2,
    "south-end": 2,
    "cambridge-central": 1,
    "cambridge-kendall": 2,
    allston: 2,
    somerville: 0,
  },
};

export function areaTravelCost(a: BostonArea, b: BostonArea): number {
  return AREA_COST[a][b];
}

export function areasCompatibleForEvening(
  a: BostonArea,
  b: BostonArea
): boolean {
  return areaTravelCost(a, b) <= EVENING_MAX_AREA_COST;
}

export function areasWithinFillerRange(a: BostonArea, b: BostonArea): boolean {
  return areaTravelCost(a, b) <= FILLER_MAX_AREA_COST;
}

/** Too late or impractical for evening dates (rentals close, high-energy outdoors). */
export const EVENING_EXCLUDED_VENUE_IDS = new Set([
  "kayaking",
  "outdoor-activity",
]);

/** Evening-friendly second stops when dessert would be too far */
export const EVENING_ALTERNATIVES_BY_AREA: Record<BostonArea, string[]> = {
  downtown: ["sunset-walk", "Boston-view", "museum-gallery-wndr", "coffee-start"],
  "back-bay": ["sunset-walk", "Boston-view", "activity-fun", "filler-newbury-stroll"],
  fenway: ["sunset-walk", "Boston-view", "museum-gallery-1"],
  "south-end": ["filler-greenway", "filler-quincy-market"],
  "cambridge-central": ["dessert-spot", "harvard-square-stroll", "brunch-spot"],
  "cambridge-kendall": ["harvard-square-stroll", "dessert-spot", "museum-gallery-3"],
  allston: ["dinner-spot-indian-3"],
  somerville: ["live-music", "dinner-spot-indian-4"],
};
