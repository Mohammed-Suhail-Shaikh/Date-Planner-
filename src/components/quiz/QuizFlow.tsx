"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
import { OptionCard } from "./OptionCard";
import { getCuratedOptions } from "@/lib/itinerary-engine";
import { getDefaultPickableDate, getUnavailableDatesHint, isDatePickable, todayIso } from "@/lib/dates";
import { PhotoCollage } from "./PhotoCollage";
import type { QuizAnswers } from "@/lib/db/schema";

type QuizFlowProps = {
  name: string;
  photos?: string[];
  onComplete: (answers: QuizAnswers) => void;
};

type Step =
  | { type: "welcome" }
  | { type: "mood" }
  | { type: "energy" }
  | { type: "activity" }
  | { type: "time" }
  | { type: "date" }
  | { type: "flowers" }
  | { type: "dressing" }
  | { type: "notes" }
  | { type: "email" };

const STEPS: Step[] = [
  { type: "welcome" },
  { type: "mood" },
  { type: "energy" },
  { type: "activity" },
  { type: "time" },
  { type: "date" },
  { type: "flowers" },
  { type: "dressing" },
  { type: "notes" },
  { type: "email" },
];

const QUIZ_STEPS = STEPS.length - 1;

export function QuizFlow({ name, photos = [], onComplete }: QuizFlowProps) {
  const options = getCuratedOptions();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    selectedDate: getDefaultPickableDate(),
  });
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [flowersSuggestion, setFlowersSuggestion] = useState("");
  const [herEmail, setHerEmail] = useState("");
  const [dateError, setDateError] = useState("");
  const unavailableHint = getUnavailableDatesHint();

  const step = STEPS[stepIndex];
  const quizStepNumber = stepIndex;

  function next() {
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
  }

  function back() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function selectAndAdvance(field: keyof QuizAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setTimeout(next, 200);
  }

  function handleFinish() {
    if (!herEmail.trim()) return;
    onComplete({
      mood: answers.mood!,
      energy: answers.energy!,
      activity: answers.activity!,
      time: answers.time!,
      selectedDate: answers.selectedDate!,
      flowers: answers.flowers!,
      flowersSuggestion: flowersSuggestion.trim() || undefined,
      dressing: answers.dressing!,
      dietaryNotes: dietaryNotes.trim() || undefined,
      herEmail: herEmail.trim(),
    });
  }

  return (
    <div
      className={`mx-auto flex min-h-screen w-full max-w-lg flex-col box-border py-6 sm:py-10 ${
        step.type === "welcome"
          ? "max-w-full px-1 sm:max-w-lg sm:px-6"
          : "px-4 sm:px-6"
      } overflow-x-hidden sm:overflow-visible`}
    >
      {step.type !== "welcome" && (
        <ProgressBar current={quizStepNumber} total={QUIZ_STEPS} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex w-full min-w-0 flex-1 flex-col"
        >
          {step.type === "welcome" && (
            <div className="flex flex-1 flex-col items-center justify-center overflow-visible">
              <PhotoCollage photos={photos}>
                <div className="text-center">
                  <p className="label-eyebrow mb-4">A little surprise for you</p>
                  <h1 className="mb-0 overflow-visible">
                    <span className="welcome-name">
                      {name}
                    </span>
                  </h1>
                  <p className="welcome-intro mx-auto mb-10 text-muted">
                    Let&apos;s plan something special together. Answer a few quick
                    questions and I&apos;ll put together a date just for you.
                  </p>
                  <button
                    type="button"
                    onClick={next}
                    className="btn-romantic px-8 py-3"
                  >
                    Let&apos;s go →
                  </button>
                </div>
              </PhotoCollage>
            </div>
          )}

          {step.type === "mood" && (
            <QuizStep
              title="What's the mood?"
              subtitle="Pick what feels right"
              onBack={back}
            >
              <div className="grid w-full grid-cols-2 gap-3">
                {options.quiz.moods.map((m) => (
                  <OptionCard
                    key={m.id}
                    emoji={m.emoji}
                    label={m.label}
                    description={m.description}
                    selected={answers.mood === m.id}
                    onClick={() => selectAndAdvance("mood", m.id)}
                  />
                ))}
              </div>
            </QuizStep>
          )}

          {step.type === "energy" && (
            <QuizStep
              title="Energy level?"
              subtitle="How active should we be?"
              onBack={back}
            >
              <div className="grid w-full grid-cols-1 gap-3">
                {options.quiz.energies.map((e) => (
                  <OptionCard
                    key={e.id}
                    emoji={e.emoji}
                    label={e.label}
                    description={e.description}
                    selected={answers.energy === e.id}
                    onClick={() => selectAndAdvance("energy", e.id)}
                  />
                ))}
              </div>
            </QuizStep>
          )}

          {step.type === "activity" && (
            <QuizStep
              title="What sounds fun?"
              subtitle="Choose an activity"
              onBack={back}
            >
              <div className="grid w-full grid-cols-2 gap-3">
                {options.quiz.activities.map((a) => (
                  <OptionCard
                    key={a.id}
                    emoji={a.emoji}
                    label={a.label}
                    description={a.description}
                    selected={answers.activity === a.id}
                    onClick={() => selectAndAdvance("activity", a.id)}
                  />
                ))}
              </div>
            </QuizStep>
          )}

          {step.type === "time" && (
            <QuizStep
              title="When works best?"
              subtitle="Pick a time window"
              onBack={back}
            >
              <div className="grid w-full grid-cols-1 gap-3">
                {options.quiz.times.map((t) => (
                  <OptionCard
                    key={t.id}
                    emoji={t.emoji}
                    label={t.label}
                    description={t.description}
                    selected={answers.time === t.id}
                    onClick={() => selectAndAdvance("time", t.id)}
                  />
                ))}
              </div>
            </QuizStep>
          )}

          {step.type === "date" && (
            <QuizStep
              title="Pick your date"
              subtitle="Choose the day that works for you"
              onBack={back}
            >
              <div className="card-romantic w-full min-w-0 p-4 sm:p-5">
                <label htmlFor="quiz-date" className="mb-2 block text-sm text-muted">
                  Date
                </label>
                <input
                  id="quiz-date"
                  type="date"
                  min={todayIso()}
                  value={answers.selectedDate ?? getDefaultPickableDate()}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (!selectedDate) return;
                    if (!isDatePickable(selectedDate)) {
                      setDateError("That date isn't available — please pick another day.");
                      return;
                    }
                    setDateError("");
                    setAnswers((prev) => ({ ...prev, selectedDate }));
                  }}
                  className="input-romantic w-full min-w-0 max-w-full rounded-xl sm:rounded-2xl"
                />
                {unavailableHint ? (
                  <p className="mt-2 text-xs text-muted">{unavailableHint}</p>
                ) : null}
                {dateError ? (
                  <p className="mt-2 text-sm text-red-600">{dateError}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={next}
                disabled={
                  !answers.selectedDate ||
                  !isDatePickable(answers.selectedDate) ||
                  !!dateError
                }
                className="btn-romantic mt-8 w-full max-w-full py-3 sm:mt-6"
              >
                Continue →
              </button>
            </QuizStep>
          )}

          {step.type === "flowers" && (
            <QuizStep
              title="What flowers should I bring?"
              subtitle="Pick your favourite"
              onBack={back}
            >
              <div className="grid w-full grid-cols-2 gap-3">
                {options.quiz.flowers.map((f) => (
                  <OptionCard
                    key={f.id}
                    emoji={f.emoji}
                    label={f.label}
                    description={f.description}
                    selected={answers.flowers === f.id}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, flowers: f.id }))
                    }
                  />
                ))}
              </div>
              <div className="card-romantic mt-8 w-full min-w-0 p-4 sm:mt-6 sm:p-4">
                <label
                  htmlFor="flowers-suggestion"
                  className="mb-2 block text-sm text-muted"
                >
                  {answers.flowers === "roses"
                    ? "What colour would you like?"
                    : "Any notes? (optional)"}
                </label>
                <textarea
                  id="flowers-suggestion"
                  value={flowersSuggestion}
                  onChange={(e) => setFlowersSuggestion(e.target.value)}
                  placeholder={
                    answers.flowers === "roses"
                      ? "e.g. red, pink, white, yellow..."
                      : "e.g. pastel colours, no pollen allergies..."
                  }
                  rows={2}
                  className="input-romantic w-full min-w-0 max-w-full rounded-xl sm:rounded-2xl"
                />
              </div>
              <button
                type="button"
                onClick={next}
                disabled={
                  !answers.flowers ||
                  (answers.flowers === "roses" && !flowersSuggestion.trim())
                }
                className="btn-romantic mt-8 w-full max-w-full py-3 sm:mt-6"
              >
                Continue →
              </button>
            </QuizStep>
          )}

          {step.type === "dressing" && (
            <QuizStep
              title="How are we dressing for the date?"
              subtitle="Pick an outfit vibe"
              onBack={back}
            >
              <div className="grid w-full grid-cols-2 gap-3">
                {options.quiz.dressing.map((d) => (
                  <OptionCard
                    key={d.id}
                    emoji={d.emoji}
                    label={d.label}
                    description={d.description}
                    selected={answers.dressing === d.id}
                    onClick={() => selectAndAdvance("dressing", d.id)}
                  />
                ))}
              </div>
            </QuizStep>
          )}

          {step.type === "notes" && (
            <QuizStep
              title="Anything I should know?"
              subtitle="Dietary preferences, allergies, etc. (optional)"
              onBack={back}
            >
              <textarea
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g. vegetarian, no seafood..."
                rows={3}
                className="input-romantic w-full min-w-0 max-w-full rounded-xl sm:rounded-2xl"
              />
              <button
                type="button"
                onClick={next}
                className="btn-romantic mt-5 w-full max-w-full py-3 sm:mt-6"
              >
                Continue →
              </button>
            </QuizStep>
          )}

          {step.type === "email" && (
            <QuizStep
              title="Your email"
              subtitle="So I can send you a calendar invite"
              onBack={back}
            >
              <input
                type="email"
                value={herEmail}
                onChange={(e) => setHerEmail(e.target.value)}
                placeholder="you@email.com"
                className="input-romantic w-full min-w-0 max-w-full rounded-xl sm:rounded-2xl"
              />
              <button
                type="button"
                onClick={handleFinish}
                disabled={!herEmail.trim()}
                className="btn-romantic mt-5 w-full max-w-full py-3 sm:mt-6"
              >
                See my date plan →
              </button>
            </QuizStep>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function QuizStep({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-muted transition hover:text-accent sm:mb-6"
      >
        ← Back
      </button>
      <h2 className="font-display text-gradient mb-1 text-2xl font-bold sm:text-3xl">
        {title}
      </h2>
      <p className="mb-6 text-sm text-muted sm:mb-8 sm:text-base">{subtitle}</p>
      {children}
    </div>
  );
}
