"use client";

import { motion } from "framer-motion";

type OptionCardProps = {
  emoji: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

export function OptionCard({
  emoji,
  label,
  description,
  selected,
  onClick,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
        selected
          ? "border-accent bg-accent-light shadow-[0_4px_20px_rgba(155,111,212,0.22)]"
          : "border-border bg-card shadow-[0_2px_12px_rgba(155,111,212,0.06)] hover:border-accent/50 hover:shadow-[0_4px_16px_rgba(155,111,212,0.12)]"
      }`}
    >
      <span className="mb-2 text-2xl">{emoji}</span>
      <span className="font-medium">{label}</span>
      <span className="mt-1 text-sm text-muted">{description}</span>
    </motion.button>
  );
}
