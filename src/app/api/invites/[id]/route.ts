import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, initDb } from "@/lib/db";
import { invites, responses, type Itinerary, type QuizAnswers } from "@/lib/db/schema";
import { generateItinerary } from "@/lib/itinerary-engine";
import { getBlockedMonthlyVenueIds } from "@/lib/monthly-venue-limits";
import { getDateAvailabilityError, getBookedDateIsos } from "@/lib/booked-dates";
import { createCalendarEvent } from "@/lib/google-calendar";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  itineraryNeedsNormalization,
  normalizeItinerary,
} from "@/lib/migrate-itineraries";

type RouteContext = { params: Promise<{ id: string }> };

async function saveItineraryIfNormalized(
  db: ReturnType<typeof getDb>,
  inviteId: string,
  itinerary: Itinerary,
  answers?: Partial<QuizAnswers> | null
): Promise<Itinerary> {
  const normalized = normalizeItinerary(itinerary, answers ?? undefined);
  if (itineraryNeedsNormalization(itinerary, answers ?? undefined)) {
    await db
      .update(responses)
      .set({ itinerary: normalized })
      .where(eq(responses.inviteId, inviteId));
  }
  return normalized;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  await initDb();
  const db = getDb();

  const invite = await db
    .select()
    .from(invites)
    .where(eq(invites.id, id))
    .limit(1);

  if (!invite.length) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const response = await db
    .select()
    .from(responses)
    .where(eq(responses.inviteId, id))
    .limit(1);

  let responseRow = response[0] ?? null;
  if (responseRow?.itinerary) {
    const normalized = await saveItineraryIfNormalized(
      db,
      id,
      responseRow.itinerary,
      responseRow.answers
    );
    responseRow = { ...responseRow, itinerary: normalized };
  }

  const bookedDates = [...(await getBookedDateIsos(id))];

  return NextResponse.json({
    invite: invite[0],
    response: responseRow,
    bookedDates,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  await initDb();
  const db = getDb();

  const invite = await db
    .select()
    .from(invites)
    .where(eq(invites.id, id))
    .limit(1);

  if (!invite.length) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (body.action === "submit-quiz") {
    const answers = body.answers as QuizAnswers;
    const dateError = await getDateAvailabilityError(answers.selectedDate, id);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }
    const blockedVenueIds = await getBlockedMonthlyVenueIds(
      answers.selectedDate,
      id
    );
    const itinerary = normalizeItinerary(
      generateItinerary(answers, { blockedVenueIds }),
      answers
    );

    await db
      .insert(responses)
      .values({
        inviteId: id,
        answers,
        itinerary,
        herEmail: answers.herEmail,
      })
      .onConflictDoUpdate({
        target: responses.inviteId,
        set: {
          answers,
          itinerary,
          herEmail: answers.herEmail,
        },
      });

    await db
      .update(invites)
      .set({ status: "in_progress" })
      .where(eq(invites.id, id));

    return NextResponse.json({ itinerary });
  }

  if (body.action === "update-itinerary") {
    const existing = await db
      .select({ answers: responses.answers })
      .from(responses)
      .where(eq(responses.inviteId, id))
      .limit(1);

    const itinerary = normalizeItinerary(
      body.itinerary as Itinerary,
      existing[0]?.answers ?? undefined
    );
    if (itinerary.dateIso) {
      const dateError = await getDateAvailabilityError(itinerary.dateIso, id);
      if (dateError) {
        return NextResponse.json({ error: dateError }, { status: 400 });
      }
    }

    await db
      .insert(responses)
      .values({ inviteId: id, itinerary })
      .onConflictDoUpdate({
        target: responses.inviteId,
        set: { itinerary },
      });

    return NextResponse.json({ itinerary });
  }

  if (body.action === "approve") {
    const existing = await db
      .select({ answers: responses.answers })
      .from(responses)
      .where(eq(responses.inviteId, id))
      .limit(1);

    const itinerary = normalizeItinerary(
      body.itinerary as Itinerary,
      existing[0]?.answers ?? undefined
    );
    const herEmail = body.herEmail as string;

    if (itinerary.dateIso) {
      const dateError = await getDateAvailabilityError(itinerary.dateIso, id);
      if (dateError) {
        return NextResponse.json({ error: dateError }, { status: 400 });
      }
    }

    await db
      .insert(responses)
      .values({
        inviteId: id,
        itinerary,
        herEmail,
        approvedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: responses.inviteId,
        set: {
          itinerary,
          herEmail,
          approvedAt: new Date(),
        },
      });

    await db
      .update(invites)
      .set({ status: "approved" })
      .where(eq(invites.id, id));

    let calendarResult = null;
    let calendarError = null;

    try {
      calendarResult = await createCalendarEvent(
        itinerary,
        herEmail,
        invite[0].name
      );
    } catch (err) {
      calendarError =
        err instanceof Error ? err.message : "Calendar invite failed";
    }

    return NextResponse.json({
      success: true,
      calendar: calendarResult,
      calendarError,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await initDb();
  const db = getDb();

  const invite = await db
    .select()
    .from(invites)
    .where(eq(invites.id, id))
    .limit(1);

  if (!invite.length) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await db.delete(responses).where(eq(responses.inviteId, id));
  await db.delete(invites).where(eq(invites.id, id));

  return NextResponse.json({ success: true });
}
