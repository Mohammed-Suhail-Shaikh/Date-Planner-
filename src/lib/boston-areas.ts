/**
 * Boston area clusters for evening proximity logic.
 * Travel costs are approximate vibe-killers (not exact minutes).
 * 0 = same cluster, 1 = short hop (walk/T ~10-15 min), 2+ = too far for an evening date flow.
 */

export type BostonArea =
  | "downtown"
  | "back-bay-fenway"
  | "cambridge-central"
  | "cambridge-kendall"
  | "allston"
  | "somerville";

/** Max area cost between consecutive stops on evening dates */
export const EVENING_MAX_AREA_COST = 1;

/**
 * Area travel cost matrix (symmetric).
 * Based on: downtown ↔ Back Bay ~15 min walk/T; Cambridge ↔ downtown ~15-20 min T;
 * Allston/Somerville ↔ downtown ~25-35 min; Kendall ↔ Central Cambridge ~10 min T.
 */
const AREA_COST: Record<BostonArea, Record<BostonArea, number>> = {
  downtown: {
    downtown: 0,
    "back-bay-fenway": 1,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 2,
    somerville: 2,
  },
  "back-bay-fenway": {
    downtown: 1,
    "back-bay-fenway": 0,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 1,
    somerville: 2,
  },
  "cambridge-central": {
    downtown: 2,
    "back-bay-fenway": 2,
    "cambridge-central": 0,
    "cambridge-kendall": 1,
    allston: 2,
    somerville: 1,
  },
  "cambridge-kendall": {
    downtown: 2,
    "back-bay-fenway": 2,
    "cambridge-central": 1,
    "cambridge-kendall": 0,
    allston: 2,
    somerville: 2,
  },
  allston: {
    downtown: 2,
    "back-bay-fenway": 1,
    "cambridge-central": 2,
    "cambridge-kendall": 2,
    allston: 0,
    somerville: 2,
  },
  somerville: {
    downtown: 2,
    "back-bay-fenway": 2,
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

/** Evening-friendly second stops when dessert would be too far */
export const EVENING_ALTERNATIVES_BY_AREA: Record<BostonArea, string[]> = {
  downtown: ["sunset-walk", "Boston-view", "museum-gallery-wndr"],
  "back-bay-fenway": ["sunset-walk", "Boston-view", "dessert-spot", "activity-fun"],
  "cambridge-central": ["dessert-spot", "brunch-spot"],
  "cambridge-kendall": ["kayaking", "museum-gallery-3"],
  allston: ["coffee-start"],
  somerville: ["live-music", "dinner-spot-indian-4"],
};
