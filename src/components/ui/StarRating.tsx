import { Star } from "@phosphor-icons/react/dist/ssr";
import type { Rating } from "@/lib/types";

export const RATING_LABELS: Record<Rating, string> = {
  1: "No me gustó",
  2: "Flojo",
  3: "Correcto",
  4: "Me gustó",
  5: "Me encantó",
};

export function StarRating({ value, size = 18 }: { value: Rating; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-gold"
      role="img"
      aria-label={`${value} de 5 estrellas: ${RATING_LABELS[value]}`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          weight={n <= value ? "fill" : "regular"}
          className={n <= value ? "" : "opacity-40"}
          aria-hidden
        />
      ))}
    </span>
  );
}
