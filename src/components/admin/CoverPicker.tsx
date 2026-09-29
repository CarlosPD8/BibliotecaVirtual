"use client";

import { Check, MagnifyingGlass, Prohibit } from "@phosphor-icons/react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { searchCovers } from "@/app/admin/actions";
import type { CoverCandidate } from "@/lib/openlibrary";

/**
 * Looks the book up on Open Library and lets the owner pick the edition they
 * read. Choosing nothing leaves a tooled leather cover.
 */
export function CoverPicker({
  title,
  author,
  defaultCover,
  defaultKey,
}: {
  title: string;
  author: string;
  defaultCover?: string | null;
  defaultKey?: string | null;
}) {
  const [cover, setCover] = useState(defaultCover ?? "");
  const [olKey, setOlKey] = useState(defaultKey ?? "");
  const [candidates, setCandidates] = useState<CoverCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const search = () =>
    startTransition(async () => {
      setError(null);
      const result = await searchCovers(title, author);
      setCandidates(result.covers);
      if (result.error) setError(result.error);
      else if (result.covers.length === 0) setError("Open Library no tiene portadas para este libro.");
    });

  const choose = (c: CoverCandidate | null) => {
    setCover(c?.coverUrl ?? "");
    setOlKey(c?.olKey ?? "");
  };

  return (
    <div className="grid gap-3">
      <input type="hidden" name="cover_url" value={cover} />
      <input type="hidden" name="ol_key" value={olKey} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={search}
          disabled={pending || !title.trim()}
          className="inline-flex h-10 items-center gap-2 rounded-[3px] border border-line px-4 text-base text-ivory transition-[border-color,transform,opacity] duration-150 hover:border-line-strong active:scale-[0.97] disabled:opacity-50"
        >
          <MagnifyingGlass size={16} aria-hidden />
          {pending ? "Buscando…" : candidates ? "Buscar de nuevo" : "Buscar portada"}
        </button>
        {cover && (
          <span className="flex items-center gap-2 text-base text-muted">
            <Image src={cover.replace("-L.jpg", "-S.jpg")} alt="" width={22} height={32} unoptimized className="rounded-[2px]" />
            Portada elegida
          </span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {candidates && candidates.length > 0 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Portadas encontradas">
          <li>
            <button
              type="button"
              onClick={() => choose(null)}
              aria-pressed={!cover}
              className={`grid aspect-[2/3] w-full place-items-center rounded-[3px] border text-faint transition-[border-color,transform] duration-150 active:scale-[0.97] ${
                !cover ? "border-gold" : "border-line hover:border-line-strong"
              }`}
            >
              <span className="grid justify-items-center gap-1 text-xs">
                <Prohibit size={18} aria-hidden />
                Sin portada
              </span>
            </button>
          </li>
          {candidates.map((c) => {
            const selected = cover === c.coverUrl;
            return (
              <li key={c.coverUrl}>
                <button
                  type="button"
                  onClick={() => choose(c)}
                  aria-pressed={selected}
                  aria-label={`${c.title}${c.year ? `, ${c.year}` : ""}${c.spanish ? ", edición en español" : ""}`}
                  className={`relative block aspect-[2/3] w-full overflow-hidden rounded-[3px] border transition-[border-color,transform] duration-150 active:scale-[0.97] ${
                    selected ? "border-gold" : "border-line hover:border-line-strong"
                  }`}
                >
                  <Image src={c.thumbUrl} alt="" fill sizes="96px" unoptimized className="object-cover" />
                  {selected && (
                    <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-gold text-ink">
                      <Check size={12} weight="bold" aria-hidden />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
