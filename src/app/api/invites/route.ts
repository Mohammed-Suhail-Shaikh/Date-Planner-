import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, initDb } from "@/lib/db";
import { invites } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { getBaseUrl, getInviteUrl } from "@/lib/url";
import { inviteIdCandidates } from "@/lib/short-id";
import { formatDisplayName } from "@/lib/format-name";
import { parseInvitePhotos } from "@/lib/invite-photos";

export async function GET() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDb();
  const db = getDb();
  const allInvites = await db
    .select()
    .from(invites)
    .orderBy(desc(invites.createdAt));

  return NextResponse.json({ invites: allInvites, baseUrl: getBaseUrl() });
}

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, photos: rawPhotos } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let photos: string[] = [];
  try {
    photos = parseInvitePhotos(rawPhotos);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid photos." },
      { status: 400 }
    );
  }

  await initDb();
  const db = getDb();

  const trimmedName = formatDisplayName(name);
  const candidates = inviteIdCandidates(trimmedName);
  let id = candidates[candidates.length - 1];
  for (const candidate of candidates) {
    const existing = await db
      .select({ id: invites.id })
      .from(invites)
      .where(eq(invites.id, candidate))
      .limit(1);
    if (!existing.length) {
      id = candidate;
      break;
    }
  }

  await db.insert(invites).values({
    id,
    name: trimmedName,
    photos,
    status: "pending",
  });

  const url = getInviteUrl(id);

  return NextResponse.json({ id, name: trimmedName, url });
}
