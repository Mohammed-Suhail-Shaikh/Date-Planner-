import { getDb } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import type { Itinerary, QuizAnswers } from "@/lib/db/schema";
import { isDatePickable, isDateTakenByAnother } from "@/lib/dates";

export function resolveBookedDateFromResponse(
  answers?: QuizAnswers | null,
  itinerary?: Itinerary | null
): string | null {
  if (itinerary?.dateIso) return itinerary.dateIso;
  if (answers?.selectedDate) return answers.selectedDate;
  return null;
}

/** Calendar days already claimed by another invite's quiz or itinerary. */
export async function getBookedDateIsos(
  excludeInviteId?: string
): Promise<Set<string>> {
  const db = getDb();
  const rows = await db.select().from(responses);
  const booked = new Set<string>();

  for (const row of rows) {
    if (excludeInviteId && row.inviteId === excludeInviteId) continue;
    const dateIso = resolveBookedDateFromResponse(row.answers, row.itinerary);
    if (dateIso) booked.add(dateIso);
  }

  return booked;
}

export async function getDateAvailabilityError(
  isoDate: string,
  excludeInviteId?: string
): Promise<string | null> {
  if (!isDatePickable(isoDate)) {
    return "Selected date is not available.";
  }

  const booked = await getBookedDateIsos(excludeInviteId);
  if (isDateTakenByAnother(isoDate, booked)) {
    return "That date is already booked with someone else.";
  }

  return null;
}
