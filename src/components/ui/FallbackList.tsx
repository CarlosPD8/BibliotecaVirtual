"use client";

import { useMemo, useState } from "react";
import { sortForShelves, surname } from "@/lib/layout";
import { searchBooks } from "@/lib/search";
import type { Book } from "@/lib/types";
import { StarRating } from "./StarRating";

/** Plain catalogue for browsers without WebGL. Same data, same search. */
export function FallbackList({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(
    () => (query.trim() ? searchBooks(books, query, books.length).map((h) => h.book) : sortForShelves(books)),
    [books, query],
  );

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-24 md:px-8">
      <p className="text-lg text-muted">
        Tu navegador no puede mostrar la biblioteca en 3D, así que aquí tienes el catálogo.
      </p>
      <label className="mt-8 block">
        <span className="text-base text-muted">Buscar por título o autor</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="plate mt-2 h-12 w-full px-4 text-[19px] text-ivory placeholder:text-faint focus:outline-none"
          placeholder="Cervantes, Rayuela…"
        />
      </label>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {shown.map((book) => (
          <li key={book.id} className="plate p-4">
            <p className="smallcaps text-xs text-gold">{surname(book.author)}</p>
            <p className="mt-1 text-xl font-semibold leading-tight">{book.title}</p>
            <p className="italic text-muted">{book.author}</p>
            <div className="mt-2">
              <StarRating value={book.rating} size={15} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
