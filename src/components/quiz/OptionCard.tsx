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
      whileTap={{ scale: 0.98 }}
      className={`relative isolate flex w-full min-w-0 items-center gap-3 rounded-xl p-4 text-left transition-all duration-300 sm:flex-col sm:items-start sm:gap-0 sm:rounded-2xl sm:p-5 ${
        selected ? "card-romantic-selected" : "card-romantic hover:shadow-[var(--shadow-romantic-lg)]"
      }`}
    >
      <span className="shrink-0 text-2xl leading-none sm:mb-2">{emoji}</span>
      <span className="min-w-0 flex-1 sm:flex-none">
        <span className="block text-sm font-medium leading-snug sm:text-base">{label}</span>
        <span className="mt-1 hidden text-sm leading-snug text-muted sm:block">
          {description}
        </span>
      </span>
    </motion.button>
  );
}
