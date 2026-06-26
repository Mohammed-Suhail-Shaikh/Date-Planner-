import { getCuratedOptions } from "@/lib/itinerary-engine";
import type { Itinerary } from "@/lib/db/schema";

export function formatDressingPreference(itinerary: Itinerary): string | null {
  if (!itinerary.dressing) return null;

  const option = getCuratedOptions().quiz.dressing.find(
    (d) => d.id === itinerary.dressing
  );

  return option?.label ?? itinerary.dressing;
}
