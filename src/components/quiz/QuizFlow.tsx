"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
import { OptionCard } from "./OptionCard";
import { getCuratedOptions } from "@/lib/itinerary-engine";
import type { QuizAnswers } from "@/lib/db/schema";

type QuizFlowProps = {
  name: string;
  onComplete: (answers: QuizAnswers) => void;
};

type Step =
  | { type: "welcome" }
  | { type: "mood" }
  | { type: "energy" }
  | { type: "activity" }
  | { type: "time" }
  | { type: "notes" }
  | { type: "email" };

const STEPS: Step[] = [
  { type: "welcome" },
  { type: "mood" },
  { type: "energy" },
  { type: "activity" },
  { type: "time" },
  { type: "notes" },
  { type: "email" },
];

const QUIZ_STEPS = STEPS.length - 1;

export function QuizFlow({ name, onComplete }: QuizFlowProps) {
  const options = getCuratedOptions();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [herEmail, setHerEmail] = useState("");

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
      dietaryNotes: dietaryNotes.trim() || undefined,
      herEmail: herEmail.trim(),
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-10">
      {step.type !== "welcome" && (
        <ProgressBar current={quizStepNumber} total={QUIZ_STEPS} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col"
        >
          {step.type === "welcome" && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted">
                A little surprise
              </p>
              <h1 className="font-display mb-4 text-5xl">
                Hey {name}
              </h1>
              <p className="mb-10 max-w-xs text-lg text-muted">
                Let&apos;s plan something special together. Answer a few quick
                questions and I&apos;ll put together a date just for you.
              </p>
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-accent px-8 py-3 text-white transition hover:opacity-90"
              >
                Let&apos;s go →
              </button>
            </div>
          )}

          {step.type === "mood" && (
            <QuizStep
              title="What's the mood?"
              subtitle="Pick what feels right"
              onBack={back}
            >
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 gap-3">
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
                rows={4}
                className="w-full rounded-2xl border border-border bg-card p-4 text-foreground outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={next}
                className="mt-6 w-full rounded-full bg-accent py-3 text-white transition hover:opacity-90"
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
                className="w-full rounded-2xl border border-border bg-card p-4 text-foreground outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleFinish}
                disabled={!herEmail.trim()}
                className="mt-6 w-full rounded-full bg-accent py-3 text-white transition hover:opacity-90 disabled:opacity-40"
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
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm text-muted hover:text-foreground"
      >
        ← Back
      </button>
      <h2 className="font-display mb-1 text-3xl">{title}</h2>
      <p className="mb-8 text-muted">{subtitle}</p>
      {children}
    </>
  );
}
