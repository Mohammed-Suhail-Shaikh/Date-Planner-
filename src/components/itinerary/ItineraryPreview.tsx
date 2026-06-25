"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { getCuratedOptions } from "@/lib/itinerary-engine";
import { formatDateDisplay, getDefaultPickableDate, todayIso } from "@/lib/dates";

type ItineraryPreviewProps = {
  itinerary: Itinerary;
  onChange: (itinerary: Itinerary) => void;
  onApprove: () => void;
  onBackToQuiz?: () => void;
  loading?: boolean;
};

export function ItineraryPreview({
  itinerary,
  onChange,
  onApprove,
  onBackToQuiz,
  loading,
}: ItineraryPreviewProps) {
  const plannerName = getCuratedOptions().planner.name;

  function updateSlot(index: number, updates: Partial<ItinerarySlot>) {
    const slots = itinerary.slots.map((slot, i) =>
      i === index ? { ...slot, ...updates } : slot
    );
    onChange({ ...itinerary, slots });
  }

  function removeSlot(index: number) {
    const slots = itinerary.slots.filter((_, i) => i !== index);
    onChange({ ...itinerary, slots });
  }

  function addCustomSlot() {
    const last = itinerary.slots[itinerary.slots.length - 1];
    const newSlot: ItinerarySlot = {
      id: uuidv4(),
      time: last?.time ?? "TBD",
      title: "",
      location: "",
      address: "",
      notes: "",
      durationMinutes: 60,
      isCustom: true,
    };
    onChange({ ...itinerary, slots: [...itinerary.slots, newSlot] });
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-6 py-10 pb-16">
      {onBackToQuiz && (
        <button
          type="button"
          onClick={onBackToQuiz}
          className="mb-6 text-sm text-muted hover:text-foreground"
        >
          ← Back to quiz
        </button>
      )}

      <p className="mb-1 text-sm uppercase tracking-[0.2em] text-muted">
        Your date plan
      </p>
      <h1 className="font-display mb-4 text-4xl">{itinerary.date}</h1>
      <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-[0_4px_20px_rgba(155,111,212,0.08)]">
        <label htmlFor="itinerary-date" className="mb-2 block text-sm text-muted">
          Change date
        </label>
        <input
          id="itinerary-date"
          type="date"
          min={todayIso()}
          value={itinerary.dateIso ?? getDefaultPickableDate()}
          onChange={(e) => {
            const dateIso = e.target.value;
            if (!dateIso) return;
            onChange({
              ...itinerary,
              dateIso,
              date: formatDateDisplay(dateIso),
            });
          }}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <p className="mb-8 text-sm text-muted">
        Edit anything below, add your own spots, or go back to change your
        answers.
      </p>

      <div className="space-y-4">
        {itinerary.slots.map((slot, index) => (
          <EditableSlot
            key={slot.id}
            slot={slot}
            onChange={(updates) => updateSlot(index, updates)}
            onRemove={
              slot.isCustom ? () => removeSlot(index) : undefined
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addCustomSlot}
        className="mt-4 w-full rounded-2xl border border-dashed border-border py-3 text-sm text-muted transition hover:border-accent hover:text-accent"
      >
        + Add a place or plan
      </button>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-1 font-medium">Your ideas & suggestions</h2>
        <p className="mb-3 text-sm text-muted">
          Any places you&apos;d love to go, things you want to do, or notes for{" "}
          {plannerName}?
        </p>
        <textarea
          value={itinerary.customSuggestions ?? ""}
          onChange={(e) =>
            onChange({ ...itinerary, customSuggestions: e.target.value })
          }
          placeholder="e.g. I've always wanted to try that bookstore on Newbury St, or maybe a walk through the Public Garden..."
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </section>

      <button
        type="button"
        onClick={onApprove}
        disabled={loading}
        className="mt-8 w-full rounded-full bg-accent py-3 text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Saving..." : "Looks good! →"}
      </button>
    </div>
  );
}

function EditableSlot({
  slot,
  onChange,
  onRemove,
}: {
  slot: ItinerarySlot;
  onChange: (updates: Partial<ItinerarySlot>) => void;
  onRemove?: () => void;
}) {
  const [editing, setEditing] = useState(slot.isCustom ?? false);

  if (!editing) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            {slot.isCustom && (
              <p className="mb-1 text-xs uppercase tracking-wide text-accent">
                Your suggestion
              </p>
            )}
            <p className="text-sm font-medium text-accent">{slot.time}</p>
            <p className="font-display mt-1 text-xl">{slot.title}</p>
            {slot.address && (
              <p className="mt-1 text-sm text-muted">{slot.address}</p>
            )}
            {slot.notes && (
              <p className="mt-2 text-sm text-muted italic">{slot.notes}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-muted hover:text-accent"
            >
              edit
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-sm text-red-600 hover:underline"
              >
                remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-accent bg-accent-light/30 p-5">
      <input
        value={slot.time}
        onChange={(e) => onChange({ time: e.target.value })}
        placeholder="Time (e.g. 7:00 PM)"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <input
        value={slot.title}
        onChange={(e) => onChange({ title: e.target.value, location: e.target.value })}
        placeholder="Place or activity"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <input
        value={slot.address}
        onChange={(e) => onChange({ address: e.target.value })}
        placeholder="Address (optional)"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <textarea
        value={slot.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Notes"
        rows={2}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-accent hover:underline"
        >
          Done editing
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
