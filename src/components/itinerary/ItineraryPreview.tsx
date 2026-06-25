"use client";

import { useState } from "react";
import type { Itinerary, ItinerarySlot } from "@/lib/db/schema";

type ItineraryPreviewProps = {
  itinerary: Itinerary;
  onChange: (itinerary: Itinerary) => void;
  onApprove: () => void;
  onBack?: () => void;
  loading?: boolean;
};

export function ItineraryPreview({
  itinerary,
  onChange,
  onApprove,
  onBack,
  loading,
}: ItineraryPreviewProps) {
  function updateSlot(index: number, updates: Partial<ItinerarySlot>) {
    const slots = itinerary.slots.map((slot, i) =>
      i === index ? { ...slot, ...updates } : slot
    );
    onChange({ ...itinerary, slots });
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-6 py-10">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm text-muted hover:text-foreground"
        >
          ← Back
        </button>
      )}

      <p className="mb-1 text-sm uppercase tracking-[0.2em] text-muted">
        Your date plan
      </p>
      <h1 className="font-display mb-8 text-4xl">{itinerary.date}</h1>

      <div className="space-y-4">
        {itinerary.slots.map((slot, index) => (
          <EditableSlot
            key={slot.id}
            slot={slot}
            onChange={(updates) => updateSlot(index, updates)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onApprove}
        disabled={loading}
        className="mt-10 w-full rounded-full bg-accent py-3 text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Saving..." : "Looks good! →"}
      </button>
    </div>
  );
}

function EditableSlot({
  slot,
  onChange,
}: {
  slot: ItinerarySlot;
  onChange: (updates: Partial<ItinerarySlot>) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">{slot.time}</p>
            <p className="font-display mt-1 text-xl">{slot.title}</p>
            <p className="mt-1 text-sm text-muted">{slot.address}</p>
            {slot.notes && (
              <p className="mt-2 text-sm text-muted italic">{slot.notes}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-sm text-muted hover:text-accent"
          >
            edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-accent bg-accent-light/30 p-5">
      <input
        value={slot.time}
        onChange={(e) => onChange({ time: e.target.value })}
        placeholder="Time"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <input
        value={slot.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Title"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <input
        value={slot.address}
        onChange={(e) => onChange({ address: e.target.value })}
        placeholder="Address"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <textarea
        value={slot.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Notes"
        rows={2}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-sm text-accent hover:underline"
      >
        Done editing
      </button>
    </div>
  );
}
