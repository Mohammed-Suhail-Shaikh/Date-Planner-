"use client";

import { motion } from "framer-motion";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = (current / total) * 100;

  return (
    <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-border/80">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-vivid"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}
