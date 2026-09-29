"use client";

import { Star } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { RATING_LABELS } from "@/components/ui/StarRating";
import type { Rating } from "@/lib/types";

/** Label above, control, then helper or error text below. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string[];
  hint?: string;
  children: (id: string, describedBy?: string) => React.ReactNode;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error?.[0] ?? hint;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-base text-muted">
        {label}
      </label>
      {children(id, note ? noteId : undefined)}
      {note && (
        <p id={noteId} className={`text-sm ${error?.length ? "text-danger" : "text-faint"}`}>
          {note}
        </p>
      )}
    </div>
  );
}

export function PrimaryButton({
  pending,
  children,
  type = "submit",
}: {
  pending?: boolean;
  children: React.ReactNode;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-[3px] bg-gold px-5 font-display text-sm font-semibold uppercase tracking-[0.12em] whitespace-nowrap text-ink transition-[transform,opacity] duration-150 hover:bg-[#e3c173] active:scale-[0.97] disabled:opacity-60"
    >
      {pending ? "Un momento…" : children}
    </button>
  );
}

/** Five gilt stars as a radio group; arrow keys move between them. */
export function RatingInput({ name, defaultValue }: { name: string; defaultValue?: Rating }) {
  const [value, setValue] = useState<Rating | null>(defaultValue ?? null);
  const [hover, setHover] = useState<Rating | null>(null);
  const shown = hover ?? value;
  const group = useId();

  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Valoración" className="flex" onMouseLeave={() => setHover(null)}>
        {([1, 2, 3, 4, 5] as Rating[]).map((n) => (
          <label
            key={n}
            className="cursor-pointer p-1 text-gold transition-transform duration-100 active:scale-[0.9]"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => setValue(n)}
              className="peer sr-only"
              id={`${group}-${n}`}
            />
            <span className="block rounded-[3px] peer-focus-visible:outline-2 peer-focus-visible:outline-gold">
              <Star
                size={26}
                weight={shown !== null && n <= shown ? "fill" : "regular"}
                className={shown !== null && n <= shown ? "" : "opacity-45"}
                aria-hidden
              />
            </span>
            <span className="sr-only">{`${n} ${n === 1 ? "estrella" : "estrellas"}: ${RATING_LABELS[n]}`}</span>
          </label>
        ))}
      </div>
      <span className="text-lg italic text-muted" aria-live="polite">
        {shown ? RATING_LABELS[shown] : "Sin valorar"}
      </span>
    </div>
  );
}
