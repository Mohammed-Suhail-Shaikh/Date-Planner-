import { google } from "googleapis";
import type { Itinerary } from "@/lib/db/schema";
import { getCuratedOptions } from "@/lib/itinerary-engine";

function parseTimeOnDate(dateStr: string, timeStr: string): Date {
  const base = new Date(dateStr);
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    base.setHours(18, 30, 0, 0);
    return base;
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  base.setHours(hours, minutes, 0, 0);
  return base;
}

export async function createCalendarEvent(
  itinerary: Itinerary,
  herEmail: string,
  inviteeName: string
): Promise<{ eventId: string; htmlLink: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Calendar is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env.local"
    );
  }

  const planner = getCuratedOptions().planner;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const firstSlot = itinerary.slots[0];
  const lastSlot = itinerary.slots[itinerary.slots.length - 1];

  const start = parseTimeOnDate(itinerary.date, firstSlot.time);
  const end = parseTimeOnDate(itinerary.date, lastSlot.time);
  end.setMinutes(end.getMinutes() + lastSlot.durationMinutes);

  const description = [
    ...itinerary.slots.map(
      (s) =>
        `${s.time} — ${s.title}\n${s.address}${s.notes ? `\n${s.notes}` : ""}`
    ),
    itinerary.customSuggestions
      ? `Her suggestions:\n${itinerary.customSuggestions}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    requestBody: {
      summary: `Date with ${inviteeName}`,
      description,
      location: firstSlot.address,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [
        { email: planner.email },
        { email: herEmail },
      ],
    },
  });

  return {
    eventId: response.data.id || "",
    htmlLink: response.data.htmlLink || "",
  };
}
