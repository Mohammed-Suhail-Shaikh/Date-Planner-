import curatedOptions from "../../config/curated-options.json";

/** Format YYYY-MM-DD for display */
export function formatDateDisplay(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type UnavailableDateRange = {
  start: string;
  end: string;
};

function getUnavailableDateRanges(): UnavailableDateRange[] {
  return (
    (curatedOptions as { constraints?: { unavailableDateRanges?: UnavailableDateRange[] } })
      .constraints?.unavailableDateRanges ?? []
  );
}

function monthDayKey(isoDate: string): number {
  const [, month, day] = isoDate.split("-").map(Number);
  return month * 100 + day;
}

function isDateInRange(isoDate: string, start: string, end: string): boolean {
  if (start.length === 10 && end.length === 10) {
    return isoDate >= start && isoDate <= end;
  }

  const value = monthDayKey(isoDate);
  const startKey = monthDayKey(`2000-${start}`);
  const endKey = monthDayKey(`2000-${end}`);

  if (startKey <= endKey) {
    return value >= startKey && value <= endKey;
  }

  return value >= startKey || value <= endKey;
}

export function isDateUnavailable(isoDate: string): boolean {
  return getUnavailableDateRanges().some((range) =>
    isDateInRange(isoDate, range.start, range.end)
  );
}

export function isDatePickable(isoDate: string): boolean {
  return isoDate >= todayIso() && !isDateUnavailable(isoDate);
}

export function isDateTakenByAnother(
  isoDate: string,
  bookedDateIsos?: Iterable<string>
): boolean {
  if (!bookedDateIsos) return false;
  for (const booked of bookedDateIsos) {
    if (booked === isoDate) return true;
  }
  return false;
}

/** Config + already-booked checks (use when another invite may hold the day). */
export function isDateAvailable(
  isoDate: string,
  bookedDateIsos?: Iterable<string>
): boolean {
  return isDatePickable(isoDate) && !isDateTakenByAnother(isoDate, bookedDateIsos);
}

export function getNextPickableDate(
  fromIso: string,
  bookedDateIsos?: Iterable<string>
): string {
  const cursor = new Date(`${fromIso}T12:00:00`);
  for (let i = 0; i < 366 * 2; i++) {
    const iso = toIsoDate(cursor);
    if (isDateAvailable(iso, bookedDateIsos)) return iso;
    cursor.setDate(cursor.getDate() + 1);
  }
  return fromIso;
}

export function getUnavailableDatesHint(): string | null {
  const ranges = getUnavailableDateRanges();
  if (!ranges.length) return null;

  const labels = ranges.map((range) => {
    if (range.start.length === 10 && range.end.length === 10) {
      return `${formatDateDisplay(range.start)} – ${formatDateDisplay(range.end)}`;
    }

    const formatPartial = (value: string) => {
      const d = new Date(`2000-${value}T12:00:00`);
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    };

    return `${formatPartial(range.start)} – ${formatPartial(range.end)}`;
  });

  return `Unavailable: ${labels.join("; ")}`;
}

/** Default picker value: upcoming Saturday, skipping blocked and booked dates */
export function getDefaultPickableDate(bookedDateIsos?: Iterable<string>): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  const saturdayIso = toIsoDate(saturday);
  if (isDateAvailable(saturdayIso, bookedDateIsos)) return saturdayIso;
  return getNextPickableDate(todayIso(), bookedDateIsos);
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Whole calendar days from `fromIso` until `toIso` (negative if in the past). */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`);
  const to = new Date(`${toIso}T12:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDaysUntil(
  targetIso: string,
  today: string = todayIso()
): string {
  const days = daysBetween(today, targetIso);
  if (days === 0) return "Today!";
  if (days === 1) return "1 day left";
  if (days === -1) return "1 day ago";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `${days} days left`;
}
