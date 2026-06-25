import { getCuratedOptions } from "@/lib/itinerary-engine";
import type { Itinerary } from "@/lib/db/schema";

export function formatFlowersPreference(itinerary: Itinerary): string | null {
  if (!itinerary.flowers) return null;

  const flower = getCuratedOptions().quiz.flowers.find(
    (f) => f.id === itinerary.flowers
  );
  const label = flower?.label ?? itinerary.flowers;

  if (itinerary.flowersSuggestion?.trim()) {
    return `${label} — ${itinerary.flowersSuggestion.trim()}`;
  }

  return label;
}
