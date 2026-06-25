"use client";

import { motion } from "framer-motion";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = (current / total) * 100;

  return (
    <div className="progress-romantic-track mb-8">
      <motion.div
        className="progress-romantic-fill"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </div>
  );
}
