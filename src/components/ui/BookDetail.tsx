"use client";

import { ArrowSquareOut, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import type { PlacedBook } from "@/lib/layout";
import { CASE } from "@/lib/layout";
import { RATING_LABELS, StarRating } from "./StarRating";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

function location(placed: PlacedBook) {
  const bookcase = ROMAN[placed.caseIndex] ?? String(placed.caseIndex + 1);
  const shelfFromTop = CASE.shelves - placed.shelfIndex;
  return `Estantería ${bookcase}, balda ${shelfFromTop}`;
}

const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });

/** Reading card shown beside the book once it is in hand. */
export function BookDetail({ placed, onClose }: { placed: PlacedBook; onClose: () => void }) {
  const { book } = placed;
  const reduce = useReducedMotion();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus({ preventScroll: true });
  }, [book.id]);

  return (
    <motion.aside
      key={book.id}
      role="dialog"
      aria-modal="false"
      aria-labelledby="book-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 10, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
      className="plate pointer-events-auto fixed inset-x-3 bottom-3 max-h-[46dvh] overflow-y-auto p-6 md:inset-x-auto md:bottom-auto md:right-8 md:top-1/2 md:max-h-none md:w-[380px] md:-translate-y-1/2 md:p-8"
    >
      <button
        ref={closeButton}
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 grid size-10 place-items-center rounded-[3px] text-muted transition-[color,transform] duration-150 hover:text-ivory active:scale-[0.96]"
        aria-label="Devolver el libro a la estantería"
      >
        <X size={20} />
      </button>

      <p className="smallcaps pr-10 text-[13px] text-gold">{book.author}</p>
      <h2
        id="book-title"
        className="mt-2 text-balance pr-6 text-[34px] font-semibold leading-[1.08] text-ivory md:text-[40px]"
      >
        {book.title}
      </h2>

      <div className="mt-5 flex items-center gap-3">
        <StarRating value={book.rating} size={22} />
        <span className="text-lg italic text-muted">{RATING_LABELS[book.rating]}</span>
      </div>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-line pt-5 text-base">
        <dt className="text-faint">Ubicación</dt>
        <dd className="text-ivory">{location(placed)}</dd>
        <dt className="text-faint">Añadido</dt>
        <dd className="text-ivory">{dateFormat.format(new Date(book.created_at))}</dd>
      </dl>

      {book.ol_key && (
        <a
          href={`https://openlibrary.org${book.ol_key}`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-base text-gold underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ivory"
        >
          Ver en Open Library
          <ArrowSquareOut size={16} aria-hidden />
        </a>
      )}

      <p className="mt-6 hidden text-sm text-faint md:block">
        <kbd className="rounded-[3px] border border-line px-1.5 font-display text-xs">Esc</kbd> para
        devolverlo a su sitio
      </p>
    </motion.aside>
  );
}
