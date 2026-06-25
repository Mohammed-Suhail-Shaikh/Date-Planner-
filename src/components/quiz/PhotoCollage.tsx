"use client";

import { motion } from "framer-motion";

type PhotoCollageProps = {
  photos: string[];
};

const LAYOUTS: Array<{
  className: string;
  imgClassName?: string;
}> = [
  { className: "col-span-2 row-span-2" },
  { className: "col-span-1 row-span-1 -rotate-3" },
  { className: "col-span-1 row-span-1 rotate-2 translate-y-2" },
  { className: "col-span-1 row-span-1 rotate-1" },
  { className: "col-span-1 row-span-1 -rotate-2 translate-y-1" },
  { className: "col-span-2 row-span-1 rotate-1" },
];

export function PhotoCollage({ photos }: PhotoCollageProps) {
  if (!photos.length) return null;

  const count = Math.min(photos.length, 6);
  const layoutClass =
    count === 1
      ? "photo-collage photo-collage--1"
      : count === 2
        ? "photo-collage photo-collage--2"
        : count === 3
          ? "photo-collage photo-collage--3"
          : "photo-collage photo-collage--many";

  return (
    <div className={`${layoutClass} mb-8 w-full max-w-sm`}>
      {photos.slice(0, 6).map((src, i) => (
        <motion.div
          key={`${src.slice(0, 32)}-${i}`}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.45 }}
          className={`photo-collage-item ${LAYOUTS[i]?.className ?? ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="photo-collage-img"
            draggable={false}
          />
        </motion.div>
      ))}
    </div>
  );
}
