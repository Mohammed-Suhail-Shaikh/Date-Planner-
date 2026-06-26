"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { formatDateDisplay, getDefaultPickableDate, getUnavailableDatesHint, isDatePickable, todayIso } from "@/lib/dates";
import { formatFlowersPreference } from "@/lib/format-flowers";
import { formatDressingPreference } from "@/lib/format-dressing";
import { getMapsUrlForSlot } from "@/lib/maps-url";
import { getSlotDisplayAddress, getSlotDisplayTitle } from "@/lib/venue-display";

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
  const flowersLine = formatFlowersPreference(itinerary);
  const dressingLine = formatDressingPreference(itinerary);
  const unavailableHint = getUnavailableDatesHint();
  const [dateError, setDateError] = useState("");

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

  function addCustomActivity(fields: {
    time: string;
    title: string;
    address: string;
    notes: string;
  }) {
    if (!fields.title.trim()) return;

    const last = itinerary.slots[itinerary.slots.length - 1];
    const newSlot: ItinerarySlot = {
      id: uuidv4(),
      time: fields.time.trim() || last?.time || "TBD",
      title: fields.title.trim(),
      location: fields.title.trim(),
      address: fields.address.trim(),
      notes: fields.notes.trim(),
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
            if (!isDatePickable(dateIso)) {
              setDateError("That date isn't available — please pick another day.");
              return;
            }
            setDateError("");
            onChange({
              ...itinerary,
              dateIso,
              date: formatDateDisplay(dateIso),
            });
          }}
          className="input-romantic w-full px-4 py-2.5 text-sm"
        />
        {unavailableHint ? (
          <p className="mt-2 text-xs text-muted">{unavailableHint}</p>
        ) : null}
        {dateError ? (
          <p className="mt-2 text-sm text-red-600">{dateError}</p>
        ) : null}
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

        <div className="roadmap-item roadmap-item-main">
          <div className="roadmap-marker">
            <div className="roadmap-node roadmap-node-add" aria-hidden />
          </div>
          <div className="roadmap-content">
            <AddActivityBox onAdd={addCustomActivity} />
          </div>
        </div>
      </div>

      {(flowersLine || dressingLine) && (
        <div className="itinerary-extras mt-8 flex flex-col gap-3">
          {flowersLine ? (
            <div className="card-romantic p-5">
              <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wider accent-gradient-text">
                Flowers for our date
              </p>
              <p className="text-sm text-muted">What you&apos;d like me to bring</p>
              <p className="font-display mt-2 text-xl text-foreground">
                {flowersLine}
              </p>
            </div>
          ) : null}
          {dressingLine ? (
            <div className="card-romantic p-5">
              <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wider accent-gradient-text">
                Outfit vibe
              </p>
              <p className="text-sm text-muted">How we&apos;re dressing for the date</p>
              <p className="font-display mt-2 text-xl text-foreground">
                {dressingLine}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div className="card-romantic mt-8 p-5">
        <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wider accent-gradient-text">
          Your ideas & suggestions
        </p>
        <p className="mb-3 text-sm text-muted">
          Any places you&apos;d love to go, things you want to do, or notes
          for me?
        </p>
        <textarea
          value={itinerary.customSuggestions ?? ""}
          onChange={(e) =>
            onChange({ ...itinerary, customSuggestions: e.target.value })
          }
          placeholder="e.g. I've always wanted to try that bookstore on Newbury St, or maybe a walk through the Public Garden..."
          rows={4}
          className="input-romantic w-full min-w-0 max-w-full rounded-xl sm:rounded-2xl"
        />
      </div>

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

function AddActivityBox({
  onAdd,
}: {
  onAdd: (fields: {
    time: string;
    title: string;
    address: string;
    notes: string;
  }) => void;
}) {
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ time, title, address, notes });
    setTime("");
    setTitle("");
    setAddress("");
    setNotes("");
  }

  return (
    <form onSubmit={handleSubmit} className="roadmap-card-add">
      <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wider accent-gradient-text">
        Add an activity
      </p>
      <p className="mb-4 text-sm text-muted">
        Something else you&apos;d love to do on our date?
      </p>
      <div className="space-y-3">
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Time (optional, e.g. 8:00 PM)"
          className="input-romantic w-full px-3 py-2 text-sm"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Activity or place *"
          required
          className="input-romantic w-full px-3 py-2 text-sm"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address (optional)"
          className="input-romantic w-full px-3 py-2 text-sm"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="input-romantic w-full px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={!title.trim()}
        className="btn-romantic-outline mt-4 w-full py-2.5 text-sm disabled:opacity-40"
      >
        + Add to plan
      </button>
    </form>
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
  const mapsUrl = getMapsUrlForSlot(slot);

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
                Your activity
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
              {getSlotDisplayTitle(slot)}
            </p>
            {getSlotDisplayAddress(slot) && (
              <p className="roadmap-slot-address mt-1 text-sm text-muted">
                {getSlotDisplayAddress(slot)}
              </p>
            )}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-romantic mt-2 inline-block text-sm font-medium hover:underline"
              >
                Open in Google Maps →
              </a>
            ) : null}
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
