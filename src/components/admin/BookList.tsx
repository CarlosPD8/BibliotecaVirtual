"use client";

import { PencilSimple, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useMemo, useState, useTransition } from "react";
import { deleteBook } from "@/app/admin/actions";
import { StarRating } from "@/components/ui/StarRating";
import { sortForShelves } from "@/lib/layout";
import { searchBooks } from "@/lib/search";
import type { Book } from "@/lib/types";
import { BookForm } from "./BookForm";

export function BookList({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(
    () => (query.trim() ? searchBooks(books, query, books.length).map((h) => h.book) : sortForShelves(books)),
    [books, query],
  );

  if (books.length === 0) {
    return (
      <p className="text-lg text-muted">
        Todavía no hay libros. Añade el primero con el formulario y aparecerá en su balda.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-base text-muted">Filtrar</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Título o autor"
          className="input"
        />
      </label>
      <ul className="grid gap-2">
        {shown.map((book) => (
          <BookRow key={book.id} book={book} />
        ))}
      </ul>
      {shown.length === 0 && <p className="text-muted">Ningún libro coincide.</p>}
    </div>
  );
}

function BookRow({ book }: { book: Book }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const stopEditing = useCallback(() => setEditing(false), []);

  const remove = () =>
    startTransition(async () => {
      const result = await deleteBook(book.id);
      if (!result?.ok) setError(result?.message ?? "No se pudo retirar el libro.");
    });

  if (editing) {
    return (
      <li className="plate p-5">
        <BookForm book={book} onDone={stopEditing} />
      </li>
    );
  }

  return (
    <li className="plate flex items-center gap-4 p-3">
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[2px] bg-panel-solid">
        {book.cover_url && (
          <Image
            src={book.cover_url.replace("-L.jpg", "-M.jpg")}
            alt=""
            fill
            sizes="44px"
            unoptimized
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold leading-tight">{book.title}</p>
        <p className="truncate italic text-muted">{book.author}</p>
        <StarRating value={book.rating} size={13} />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      {confirming ? (
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-base text-muted sm:inline">¿Retirarlo?</span>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="h-9 rounded-[3px] bg-danger px-3 text-base font-semibold text-ink transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            {pending ? "…" : "Sí, retirar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-9 px-2 text-base text-muted hover:text-ivory"
          >
            No
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 gap-1">
          <IconButton label={`Editar ${book.title}`} onClick={() => setEditing(true)}>
            <PencilSimple size={18} />
          </IconButton>
          <IconButton label={`Retirar ${book.title}`} onClick={() => setConfirming(true)}>
            <Trash size={18} />
          </IconButton>
        </div>
      )}
    </li>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 place-items-center rounded-[3px] text-muted transition-[color,transform] duration-150 hover:text-ivory active:scale-[0.96]"
    >
      {children}
    </button>
  );
}
