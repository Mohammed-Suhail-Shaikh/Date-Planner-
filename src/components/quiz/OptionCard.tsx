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
      whileHover={{ y: selected ? 0 : -2 }}
      className={`flex flex-col items-start rounded-2xl p-5 text-left transition-all duration-300 ${
        selected ? "card-romantic-selected" : "card-romantic hover:shadow-[var(--shadow-romantic-lg)]"
      }`}
    >
      <span className="mb-2 text-2xl">{emoji}</span>
      <span className="font-medium">{label}</span>
      <span className="mt-1 text-sm text-muted">{description}</span>
    </motion.button>
  );
}
