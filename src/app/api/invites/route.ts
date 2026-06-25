import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, initDb } from "@/lib/db";
import { invites } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { getBaseUrl } from "@/lib/url";
import { generateInviteId } from "@/lib/short-id";

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

  return NextResponse.json({ invites: allInvites });
}

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await initDb();
  const db = getDb();

  let id = generateInviteId(name.trim());
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db
      .select({ id: invites.id })
      .from(invites)
      .where(eq(invites.id, id))
      .limit(1);
    if (!existing.length) break;
    id = generateInviteId(name.trim());
  }

  await db.insert(invites).values({
    id,
    name: name.trim(),
    status: "pending",
  });

  const url = `${getBaseUrl()}/date/${id}`;

  return NextResponse.json({ id, name: name.trim(), url });
}
