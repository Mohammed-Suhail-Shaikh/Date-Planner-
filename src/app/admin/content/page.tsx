"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import type { CuratedOptions } from "@/lib/itinerary-engine";

export default function AdminContentPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [content, setContent] = useState<CuratedOptions | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  async function loadContent() {
    const res = await fetch("/api/content");
    if (res.ok) {
      const data = await res.json();
      setContent(data);
      setJsonText(JSON.stringify(data, null, 2));
      setAuthed(true);
    }
    setChecking(false);
  }

  useEffect(() => {
    loadContent();
  }, []);

  function downloadJson() {
    setJsonError("");
    try {
      JSON.parse(jsonText);
      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "curated-options.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setJsonError("Invalid JSON — fix errors before downloading.");
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <AdminLogin
        onSuccess={() => {
          setChecking(true);
          loadContent();
        }}
      />
    );
  }

  if (!content) return null;

  const venueMap = Object.fromEntries(content.venues.map((v) => [v.id, v]));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <AdminNav active="content" onSignOut={() => setAuthed(false)} />

      <p className="mb-8 text-sm text-muted">
        Preview what invitees see in the quiz and what itineraries get built.
        Edit venues below in JSON, download, then replace{" "}
        <code className="text-foreground">config/curated-options.json</code>{" "}
        in the project and push to deploy.
      </p>

      <section className="card-romantic mb-8 p-6">
        <h2 className="mb-4 font-medium">Planner</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Name</dt>
            <dd>{content.planner.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd>{content.planner.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Location</dt>
            <dd>{content.planner.defaultLocation}</dd>
          </div>
        </dl>
      </section>

      <section className="card-romantic mb-8 p-6">
        <h2 className="mb-4 font-medium">Quiz options</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <OptionGroup title="Moods" items={content.quiz.moods} />
          <OptionGroup title="Energy" items={content.quiz.energies} />
          <OptionGroup title="Activities" items={content.quiz.activities} />
          <OptionGroup title="Times" items={content.quiz.times} />
        </div>
      </section>

      <section className="card-romantic mb-8 p-6">
        <h2 className="mb-4 font-medium">Venues ({content.venues.length})</h2>
        <ul className="space-y-4">
          {content.venues.map((venue) => (
            <li
              key={venue.id}
              className="card-romantic p-4"
            >
              <p className="font-medium">{venue.name}</p>
              <p className="text-sm text-muted">{venue.address}</p>
              <p className="mt-2 text-sm">{venue.notes}</p>
              <p className="mt-2 text-xs text-muted">
                {venue.defaultDuration} min · tags: {venue.tags.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-romantic mb-8 p-6">
        <h2 className="mb-4 font-medium">Itinerary rules</h2>
        <ul className="space-y-4">
          {content.itineraryRules.map((rule, i) => (
            <li key={i} className="card-romantic p-4 text-sm">
              <p className="mb-2 font-medium">
                When{" "}
                {Object.entries(rule.match)
                  .map(([k, v]) => `${k} = ${v}`)
                  .join(", ")}
              </p>
              <ol className="list-inside list-decimal space-y-1 text-muted">
                {rule.slots.map((slot, j) => {
                  const venue = venueMap[slot.venueId];
                  return (
                    <li key={j}>
                      +{slot.offsetMinutes}min →{" "}
                      {venue?.name ?? slot.venueId}
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Fallback:{" "}
          {content.fallbackRule.slots
            .map((s) => venueMap[s.venueId]?.name ?? s.venueId)
            .join(" → ")}
        </p>
      </section>

      <section className="card-romantic p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-medium">Edit JSON</h2>
          <button
            type="button"
            onClick={downloadJson}
            className="btn-romantic px-4 py-2 text-sm"
          >
            Download JSON
          </button>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={20}
          className="input-romantic w-full p-4 font-mono text-xs leading-relaxed"
          spellCheck={false}
        />
        {jsonError && (
          <p className="mt-2 text-sm text-red-600">{jsonError}</p>
        )}
        <p className="mt-3 text-xs text-muted">
          After editing: download → replace config/curated-options.json → commit
          → push. Google login for admin coming after first deploy.
        </p>
      </section>
    </main>
  );
}

function OptionGroup({
  title,
  items,
}: {
  title: string;
  items: { emoji: string; label: string; description: string }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="text-sm">
            {item.emoji} <span className="font-medium">{item.label}</span>
            <span className="text-muted"> — {item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminNav({
  active,
  onSignOut,
}: {
  active: "invites" | "content";
  onSignOut: () => void;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-gradient text-3xl font-bold">Date Planner</h1>
        <nav className="mt-3 flex gap-4 text-sm">
          <Link
            href="/admin"
            className={
              active === "invites"
                ? "link-romantic font-medium"
                : "text-muted hover:text-accent"
            }
          >
            Invites
          </Link>
          <Link
            href="/admin/content"
            className={
              active === "content"
                ? "link-romantic font-medium"
                : "text-muted hover:text-accent"
            }
          >
            Date content
          </Link>
        </nav>
      </div>
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          onSignOut();
        }}
        className="text-sm text-muted hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
