"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchBooks } from "@/lib/search";
import type { Book } from "@/lib/types";
import { StarRating } from "./StarRating";

export function SearchBar({
  books,
  onPick,
}: {
  books: Book[];
  onPick: (book: Book) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const reduce = useReducedMotion();

  const hits = useMemo(() => searchBooks(books, query), [books, query]);
  const showList = open && query.trim().length > 0;

  // "/" focuses the search from anywhere, as on most catalogue sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pick = (book: Book) => {
    onPick(book);
    setOpen(false);
    input.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const hit = hits[active];
      if (hit) {
        e.preventDefault();
        pick(hit.book);
      }
    } else if (e.key === "Escape") {
      e.stopPropagation();
      if (query) setQuery("");
      else input.current?.blur();
    }
  };

  return (
    <div className="relative w-full md:w-[380px]">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Buscar por título o autor
      </label>
      <div className="plate flex h-12 items-center gap-2 px-3 transition-colors duration-200 focus-within:border-line-strong">
        <MagnifyingGlass size={20} className="shrink-0 text-gold" aria-hidden />
        <input
          ref={input}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-list`}
          aria-activedescendant={showList && hits[active] ? `${listId}-${hits[active].book.id}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Buscar título o autor"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[19px] text-ivory placeholder:text-faint focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              input.current?.focus();
            }}
            className="grid size-8 place-items-center rounded-[3px] text-muted transition-[color,transform] duration-150 hover:text-ivory active:scale-[0.96]"
            aria-label="Borrar búsqueda"
          >
            <X size={16} />
          </button>
        ) : (
          <kbd className="hidden rounded-[3px] border border-line px-1.5 font-display text-xs text-faint md:block">
            /
          </kbd>
        )}
      </div>

      <AnimatePresence>
        {showList && (
          <motion.ul
            id={`${listId}-list`}
            role="listbox"
            aria-label="Resultados"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "top center" }}
            className="plate absolute inset-x-0 top-[calc(100%+6px)] max-h-[min(60dvh,440px)] overflow-y-auto py-1"
          >
            {hits.length === 0 && (
              <li className="px-4 py-3 text-muted">
                Ningún libro coincide con &laquo;{query.trim()}&raquo;.
              </li>
            )}
            {hits.map((hit, i) => (
              <li
                key={hit.book.id}
                id={`${listId}-${hit.book.id}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(hit.book)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-100 ${
                  i === active ? "bg-gold/10" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[19px] font-semibold leading-tight text-ivory">
                    {hit.book.title}
                  </span>
                  <span className="block truncate text-base italic text-muted">{hit.book.author}</span>
                </span>
                <StarRating value={hit.book.rating} size={13} />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
