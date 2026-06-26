"use client";

import { useEffect, useState, useCallback } from "react";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { ItineraryPreview } from "@/components/itinerary/ItineraryPreview";
import { downloadItineraryPdf } from "@/components/pdf/DateItineraryPDF";
import { formatDisplayName } from "@/lib/format-name";
import { getCuratedOptions } from "@/lib/itinerary-engine";
import type { Itinerary, QuizAnswers } from "@/lib/db/schema";

type View = "loading" | "quiz" | "preview" | "done" | "error";

type DatePageClientProps = {
  inviteId: string;
};

export function DatePageClient({ inviteId }: DatePageClientProps) {
  const [view, setView] = useState<View>("loading");
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [herEmail, setHerEmail] = useState("");
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  const loadInvite = useCallback(async () => {
    try {
      const res = await fetch(`/api/invites/${inviteId}`);
      if (!res.ok) {
        setView("error");
        setError("This link doesn't seem to be valid.");
        return;
      }
      const data = await res.json();
      setName(formatDisplayName(data.invite.name));
      setPhotos(Array.isArray(data.invite.photos) ? data.invite.photos : []);
      setBookedDates(Array.isArray(data.bookedDates) ? data.bookedDates : []);

      if (data.invite.status === "approved" && data.response?.itinerary) {
        setItinerary(data.response.itinerary);
        setHerEmail(data.response.herEmail || "");
        setView("done");
        return;
      }

      if (data.response?.itinerary) {
        setItinerary(data.response.itinerary);
        setHerEmail(data.response.herEmail || data.response.answers?.herEmail || "");
        setView("preview");
        return;
      }

      setView("quiz");
    } catch {
      setView("error");
      setError("Something went wrong. Please try again.");
    }
  }, [inviteId]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  async function handleQuizComplete(answers: QuizAnswers) {
    setHerEmail(answers.herEmail);
    const res = await fetch(`/api/invites/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit-quiz", answers }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Could not save your answers.");
    }
    setItinerary(data.itinerary);
    setView("preview");
  }

  async function handleItineraryChange(updated: Itinerary) {
    const previous = itinerary;
    setItinerary(updated);
    const res = await fetch(`/api/invites/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-itinerary", itinerary: updated }),
    });
    if (!res.ok) {
      const data = await res.json();
      if (previous) setItinerary(previous);
      throw new Error(data.error ?? "Could not update your date plan.");
    }
  }

  async function handleApprove() {
    if (!itinerary) return;
    setApproving(true);
    setCalendarError(null);

    const res = await fetch(`/api/invites/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        itinerary,
        herEmail,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setApproving(false);
      setCalendarError(data.error ?? "Could not approve this date plan.");
      return;
    }
    if (data.calendarError) {
      setCalendarError(data.calendarError);
    }

    await downloadItineraryPdf(itinerary, name);
    setApproving(false);
    setView("done");
  }

  if (view === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (view === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-muted">{error}</p>
      </main>
    );
  }

  if (view === "quiz") {
    return (
      <QuizFlow
        name={name}
        photos={photos}
        bookedDates={bookedDates}
        onComplete={handleQuizComplete}
      />
    );
  }

  if (view === "preview" && itinerary) {
    return (
      <ItineraryPreview
        itinerary={itinerary}
        bookedDates={bookedDates}
        onChange={handleItineraryChange}
        onApprove={handleApprove}
        onBackToQuiz={() => setView("quiz")}
        loading={approving}
      />
    );
  }

  if (view === "done" && itinerary) {
    const plannerName = getCuratedOptions().planner.name;

    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-10 text-center">
        <p className="mb-2 text-4xl">🎉</p>
        <h1 className="font-display text-gradient mb-2 text-[1.75rem] sm:text-4xl">You&apos;re all set!</h1>
        <p className="font-display text-gradient mb-1 text-2xl leading-none sm:mb-0">for</p>
        <p className="font-display text-gradient mb-6 whitespace-nowrap text-[clamp(1.5rem,9.5vw,2.75rem)] italic leading-tight sm:-mt-1 sm:text-[clamp(1.25rem,8vw,3.75rem)]">
          {itinerary.date}
        </p>
        <p className="mb-8 text-sm text-muted sm:text-base">
          {calendarError ? (
            <>
              Your date plan has been saved, but the calendar invite couldn&apos;t
              be sent yet.
            </>
          ) : (
            <>
              Your date plan has been saved.
              <br />
              A calendar invite is on its way to your email.
            </>
          )}
        </p>
        {calendarError && (
          <p className="panel-romantic mb-6 px-4 py-3 text-sm text-muted">
            Calendar note: {calendarError}
          </p>
        )}
        <button
          type="button"
          onClick={() => downloadItineraryPdf(itinerary, name)}
          className="btn-romantic-outline mb-4 w-full max-w-xs py-3"
        >
          Download PDF again
        </button>
        <div className="text-center">
          <p className="font-display text-gradient text-2xl">See you soon,</p>
          <span className="welcome-name welcome-name-closing">{name}.</span>
          <p className="font-display text-gradient mt-4 text-sm sm:text-xl">
            Created with love by{" "}
            <span className="font-script text-gradient text-lg sm:text-2xl">{plannerName}</span>
          </p>
        </div>
      </main>
    );
  }

  return null;
}
