"use client";

import { Books, Key } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildLayout } from "@/lib/layout";
import type { Book } from "@/lib/types";
import { BookDetail } from "./ui/BookDetail";
import { FallbackList } from "./ui/FallbackList";
import { LoadingVeil } from "./ui/LoadingVeil";
import { SearchBar } from "./ui/SearchBar";

const LibraryScene = dynamic(() => import("./scene/LibraryScene"), { ssr: false });

type Phase = "idle" | "opening" | "open" | "closing";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function LibraryExperience({
  books,
  source,
  error,
}: {
  books: Book[];
  source: "supabase" | "sample";
  error?: string;
}) {
  const layout = useMemo(() => buildLayout(books), [books]);
  const placedById = useMemo(() => new Map(layout.books.map((p) => [p.book.id, p])), [layout]);

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [walked, setWalked] = useState(false);
  const reducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    // Feature detection has to run in the browser, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(supportsWebGL());
  }, []);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setPhase("opening");
    setHoveredId(null);
  }, []);

  const close = useCallback(() => {
    setSelectedId(null);
    setPhase("closing");
  }, []);

  const onPresented = useCallback(() => setPhase("open"), []);
  const onReturned = useCallback(() => setPhase("idle"), []);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedId) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, close]);

  // The walking hint disappears after the first drag or arrow key.
  useEffect(() => {
    if (walked) return;
    const done = () => setWalked(true);
    window.addEventListener("pointerdown", done, { once: true });
    window.addEventListener("keydown", done, { once: true });
    return () => {
      window.removeEventListener("pointerdown", done);
      window.removeEventListener("keydown", done);
    };
  }, [walked]);

  const selected = selectedId ? placedById.get(selectedId) : undefined;
  const hovered = hoveredId && !selectedId ? placedById.get(hoveredId)?.book : undefined;

  if (webgl === false) {
    return (
      <>
        <Header count={books.length} />
        <FallbackList books={books} />
      </>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0">
        {webgl && (
          <LibraryScene
            layout={layout}
            selectedId={selectedId}
            locked={phase !== "idle"}
            reducedMotion={reducedMotion}
            onSelect={select}
            onHover={setHoveredId}
            onPresented={onPresented}
            onReturned={onReturned}
            onReady={onReady}
          />
        )}
      </div>

      {/* Soft vignette so the UI reads over the scene. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(12_8_6/0.55)_100%)]"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3 p-3 md:flex-row md:items-start md:justify-between md:p-6">
        <Header count={books.length} />
        <div className="pointer-events-auto">
          <SearchBar books={books} onPick={(book) => select(book.id)} />
        </div>
      </div>

      <AnimatePresence>
        {phase === "open" && selected && <BookDetail key={selected.book.id} placed={selected} onClose={close} />}
      </AnimatePresence>

      <AnimatePresence>
        {hovered && (
          <Caption key={hovered.id}>
            <span className="font-semibold text-ivory">{hovered.title}</span>
            <span className="italic text-muted"> de {hovered.author}</span>
          </Caption>
        )}
      </AnimatePresence>

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-3 md:p-6 ${
          phase !== "idle" ? "max-md:hidden" : ""
        }`}
      >
        <div className="min-h-6 text-sm text-faint">
          <AnimatePresence>
            {!walked && ready && !selectedId && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.8, duration: 0.6 } }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="hidden md:block"
              >
                Arrastra para recorrer la galería. Rueda para acercarte. Haz clic en un libro para sacarlo.
              </motion.p>
            )}
          </AnimatePresence>
          {source === "sample" && (
            <p className="mt-1">Libros de ejemplo: conecta Supabase para usar tu propia biblioteca.</p>
          )}
          {error && <p className="mt-1 text-danger">No se pudo cargar la biblioteca. Inténtalo de nuevo más tarde.</p>}
        </div>
        <Link
          href="/admin"
          className="plate pointer-events-auto inline-flex h-10 shrink-0 items-center gap-2 px-3 text-base text-muted transition-[color,transform] duration-150 hover:text-ivory active:scale-[0.97]"
        >
          <Key size={16} aria-hidden />
          Gestionar
        </Link>
      </div>

      {ready && books.length === 0 && !error && <EmptyState />}

      <LoadingVeil visible={!ready} />
    </div>
  );
}

function Header({ count }: { count: number }) {
  return (
    <header className="pointer-events-auto flex items-center gap-3 px-1">
      <Books size={26} weight="duotone" className="text-gold" aria-hidden />
      <div>
        <h1 className="smallcaps text-[17px] font-semibold leading-none text-ivory md:text-[19px]">
          Biblioteca de Palacio
        </h1>
        <p className="mt-1 text-sm italic leading-none text-muted">
          {count === 1 ? "1 volumen" : `${count} volúmenes`}
        </p>
      </div>
    </header>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="plate pointer-events-none absolute bottom-20 left-1/2 max-w-[90vw] -translate-x-1/2 truncate px-4 py-2 text-lg md:bottom-8"
    >
      {children}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
      <div className="plate pointer-events-auto max-w-sm p-8 text-center">
        <h2 className="text-3xl font-semibold">Estanterías vacías</h2>
        <p className="mt-3 text-lg text-muted">
          Aún no has guardado ningún libro. Añade el primero y aparecerá aquí, en su balda.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex h-11 items-center bg-gold px-5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-ink transition-transform duration-150 active:scale-[0.97]"
        >
          Añadir libro
        </Link>
      </div>
    </div>
  );
}
