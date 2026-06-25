"use client";

import { useEffect, useState, useCallback } from "react";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { ItineraryPreview } from "@/components/itinerary/ItineraryPreview";
import { downloadItineraryPdf } from "@/components/pdf/DateItineraryPDF";
import type { Itinerary, QuizAnswers } from "@/lib/db/schema";

type View = "loading" | "quiz" | "preview" | "done" | "error";

type DatePageClientProps = {
  inviteId: string;
};

export function DatePageClient({ inviteId }: DatePageClientProps) {
  const [view, setView] = useState<View>("loading");
  const [name, setName] = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [herEmail, setHerEmail] = useState("");
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  const loadInvite = useCallback(async () => {
    try {
      const res = await fetch(`/api/invites/${inviteId}`);
      if (!res.ok) {
        setView("error");
        setError("This link doesn't seem to be valid.");
        return;
      }
      const data = await res.json();
      setName(data.invite.name);

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
    setItinerary(data.itinerary);
    setView("preview");
  }

  async function handleItineraryChange(updated: Itinerary) {
    setItinerary(updated);
    await fetch(`/api/invites/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-itinerary", itinerary: updated }),
    });
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
    return <QuizFlow name={name} onComplete={handleQuizComplete} />;
  }

  if (view === "preview" && itinerary) {
    return (
      <ItineraryPreview
        itinerary={itinerary}
        onChange={handleItineraryChange}
        onApprove={handleApprove}
        loading={approving}
      />
    );
  }

  if (view === "done" && itinerary) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-4xl">🎉</p>
        <h1 className="font-display mb-4 text-4xl">You&apos;re all set!</h1>
        <p className="mb-8 text-muted">
          Your date plan has been saved
          {calendarError
            ? ", but the calendar invite couldn't be sent yet."
            : ". A calendar invite is on its way to your email."}
        </p>
        {calendarError && (
          <p className="mb-6 rounded-xl bg-accent-light/50 px-4 py-3 text-sm text-muted">
            Calendar note: {calendarError}
          </p>
        )}
        <button
          type="button"
          onClick={() => downloadItineraryPdf(itinerary, name)}
          className="mb-4 w-full max-w-xs rounded-full border border-accent py-3 text-accent transition hover:bg-accent-light"
        >
          Download PDF again
        </button>
        <p className="font-display text-2xl text-muted">
          See you soon, {name}.
        </p>
      </main>
    );
  }

  return null;
}
