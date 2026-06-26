"use client";

import { motion } from "framer-motion";

type PhotoCollageProps = {
  photos: string[];
  children: React.ReactNode;
};

export function PhotoCollage({ photos, children }: PhotoCollageProps) {
  const count = Math.min(photos.length, 6);

  if (!count) {
    return <div className="welcome-solo">{children}</div>;
  }

  return (
    <div className={`welcome-scene photo-scatter-wrap photo-scatter-wrap--${count}`}>
      {photos.slice(0, 6).map((src, i) => (
        <div
          key={`${src.slice(0, 32)}-${i}`}
          className={`photo-scatter-item photo-scatter-item--${i}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.5, type: "spring", stiffness: 120 }}
            className="photo-scatter-motion"
          >
            <div className="photo-scatter-tilt">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="photo-scatter-img" draggable={false} />
            </div>
          </motion.div>
        </div>
      ))}
      <div className="welcome-scene-content">{children}</div>
    </div>
  );
}
