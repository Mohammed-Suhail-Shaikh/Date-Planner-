import { NextResponse } from "next/server";
import { getCuratedOptions } from "@/lib/itinerary-engine";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getCuratedOptions());
}
