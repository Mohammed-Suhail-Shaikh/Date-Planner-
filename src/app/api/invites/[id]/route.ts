import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, initDb } from "@/lib/db";
import { invites, responses, type Itinerary, type QuizAnswers } from "@/lib/db/schema";
import { generateItinerary } from "@/lib/itinerary-engine";
import { createCalendarEvent } from "@/lib/google-calendar";
import { isAdminAuthenticated } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

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

  return NextResponse.json({
    invite: invite[0],
    response: response[0] ?? null,
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
    const itinerary = generateItinerary(answers);

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
    const itinerary = body.itinerary as Itinerary;

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
    const itinerary = body.itinerary as Itinerary;
    const herEmail = body.herEmail as string;

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
