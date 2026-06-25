"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { formatDateDisplay, getDefaultPickableDate, todayIso } from "@/lib/dates";

type ItineraryPreviewProps = {
  itinerary: Itinerary;
  onChange: (itinerary: Itinerary) => void;
  onApprove: () => void;
  onBackToQuiz?: () => void;
  loading?: boolean;
};

function slotVariant(slot: ItinerarySlot): "main" | "filler" {
  return slot.isFiller ? "filler" : "main";
}

export function ItineraryPreview({
  itinerary,
  onChange,
  onApprove,
  onBackToQuiz,
  loading,
}: ItineraryPreviewProps) {
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

      <p className="label-eyebrow mb-1">Your date plan</p>
      <h1 className="font-display text-gradient mb-4 text-4xl">{itinerary.date}</h1>
      <div className="card-romantic mb-8 p-4">
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
          className="input-romantic w-full px-4 py-2.5 text-sm"
        />
      </div>
      <p className="mb-8 text-sm text-muted">
        Edit anything below, add your own spots, or go back to change your
        answers.
      </p>

      <div className="roadmap-timeline">
        <div className="roadmap-spine" aria-hidden />
        {itinerary.slots.map((slot, index) => {
          const variant = slotVariant(slot);
          const isFiller = variant === "filler";

          return (
            <div
              key={slot.id}
              className={`roadmap-item ${isFiller ? "roadmap-item-filler" : "roadmap-item-main"}`}
            >
              <div className="roadmap-marker">
                {isFiller ? (
                  <div className="roadmap-branch-wrap" aria-hidden>
                    <div className="roadmap-branch" />
                    <div className="roadmap-node roadmap-node-filler" />
                  </div>
                ) : (
                  <div className="roadmap-node roadmap-node-main" aria-hidden />
                )}
              </div>
              <div className="roadmap-content">
                <EditableSlot
                  slot={slot}
                  variant={variant}
                  onChange={(updates) => updateSlot(index, updates)}
                  onRemove={
                    slot.isCustom ? () => removeSlot(index) : undefined
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addCustomSlot}
        className="mt-4 w-full rounded-2xl border border-dashed border-accent-rose/40 py-3 text-sm text-muted transition hover:border-accent hover:text-accent"
      >
        + Add a place or plan
      </button>

      <section className="card-romantic mt-8 p-5">
        <h2 className="mb-1 font-medium">Your ideas & suggestions</h2>
        <p className="mb-3 text-sm text-muted">
          Any places you&apos;d love to go, things you want to do, or notes for
          me?
        </p>
        <textarea
          value={itinerary.customSuggestions ?? ""}
          onChange={(e) =>
            onChange({ ...itinerary, customSuggestions: e.target.value })
          }
          placeholder="e.g. I've always wanted to try that bookstore on Newbury St, or maybe a walk through the Public Garden..."
          rows={4}
          className="input-romantic w-full px-4 py-3 text-sm"
        />
      </section>

      <button
        type="button"
        onClick={onApprove}
        disabled={loading}
        className="btn-romantic mt-8 w-full py-3"
      >
        {loading ? "Saving..." : "Looks good! →"}
      </button>
    </div>
  );
}

function EditableSlot({
  slot,
  variant,
  onChange,
  onRemove,
}: {
  slot: ItinerarySlot;
  variant: "main" | "filler";
  onChange: (updates: Partial<ItinerarySlot>) => void;
  onRemove?: () => void;
}) {
  const [editing, setEditing] = useState(slot.isCustom ?? false);
  const isMain = variant === "main";

  if (!editing) {
    return (
      <div
        className={
          isMain ? "roadmap-card-main" : "roadmap-card-filler"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {slot.isCustom && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide accent-gradient-text">
                Your suggestion
              </p>
            )}
            {slot.isFiller && !slot.isCustom && (
              <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wider accent-gradient-text">
                Quick stop
              </p>
            )}
            <p
              className={`accent-gradient-text font-medium ${isMain ? "text-sm" : "text-xs"}`}
            >
              {slot.time}
            </p>
            <p
              className={`roadmap-slot-title font-display mt-0.5 ${isMain ? "text-2xl" : "text-base"}`}
            >
              {slot.title}
            </p>
            {slot.address && (
              <p className="roadmap-slot-address mt-1 text-sm text-muted">
                {slot.address}
              </p>
            )}
            {slot.notes && (
              <p className="roadmap-slot-notes mt-2 text-sm text-muted italic">
                {slot.notes}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-muted transition hover:text-accent"
            >
              edit
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs text-red-600 hover:underline"
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
    <div
      className={`card-romantic-editing space-y-3 ${isMain ? "p-5" : "p-4"}`}
    >
      <input
        value={slot.time}
        onChange={(e) => onChange({ time: e.target.value })}
        placeholder="Time (e.g. 7:00 PM)"
        className="input-romantic w-full px-3 py-2 text-sm"
      />
      <input
        value={slot.title}
        onChange={(e) => onChange({ title: e.target.value, location: e.target.value })}
        placeholder="Place or activity"
        className="input-romantic w-full px-3 py-2 text-sm"
      />
      <input
        value={slot.address}
        onChange={(e) => onChange({ address: e.target.value })}
        placeholder="Address (optional)"
        className="input-romantic w-full px-3 py-2 text-sm"
      />
      <textarea
        value={slot.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Notes"
        rows={isMain ? 2 : 1}
        className="input-romantic w-full px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="link-romantic text-sm hover:underline"
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
