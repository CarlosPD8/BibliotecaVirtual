"use client";

import { AnimatePresence, motion } from "motion/react";

/** Dark room with a single candle while the textures load. */
export function LoadingVeil({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="veil"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] } }}
          className="fixed inset-0 z-30 grid place-items-center bg-ink"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-6">
            <svg width="44" height="96" viewBox="0 0 44 96" aria-hidden>
              <defs>
                <radialGradient id="halo" cx="50%" cy="30%" r="50%">
                  <stop offset="0%" stopColor="#ffcf8a" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#ffcf8a" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="22" cy="20" r="20" fill="url(#halo)" />
              <path
                className="flame"
                d="M22 6 C27 14 28 20 22 28 C16 20 17 14 22 6 Z"
                fill="#ffd89a"
              />
              <rect x="21.2" y="27" width="1.6" height="5" fill="#2a1d14" />
              <rect x="15" y="32" width="14" height="52" rx="1.5" fill="#e9dcc2" />
              <rect x="8" y="84" width="28" height="4" rx="1" fill="#a9853c" />
            </svg>
            <p className="smallcaps text-sm text-muted">Encendiendo las velas</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
