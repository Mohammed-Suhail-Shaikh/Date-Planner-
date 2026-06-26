import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, initDb } from "@/lib/db";
import { responses } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  itineraryNeedsNormalization,
  normalizeItinerary,
} from "@/lib/migrate-itineraries";

export async function POST() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDb();
  const db = getDb();
  const rows = await db.select().from(responses);

  let updated = 0;
  for (const row of rows) {
    if (
      !row.itinerary ||
      !itineraryNeedsNormalization(row.itinerary, row.answers ?? undefined)
    ) {
      continue;
    }

    await db
      .update(responses)
      .set({
        itinerary: normalizeItinerary(row.itinerary, row.answers ?? undefined),
      })
      .where(eq(responses.inviteId, row.inviteId));

    updated++;
  }

  return NextResponse.json({
    success: true,
    scanned: rows.length,
    updated,
  });
}
