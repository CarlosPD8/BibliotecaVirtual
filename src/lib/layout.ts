import { leatherFor, LEATHERS } from "./leather";
import { seeded } from "./random";
import type { Book } from "./types";

// World units are metres. The gallery wall runs along X, bookcase backs sit
// on z = 0 and shelves open towards +Z where the camera lives.
export const CASE = {
  innerWidth: 2.2,
  pilaster: 0.34,
  height: 4.4,
  depth: 0.44,
  plinth: 0.36,
  shelfPitch: 0.52,
  board: 0.035,
  shelves: 7,
  /** Shelves that hold the owner's books; the floor and top shelves are decorative. */
  readingShelves: [1, 2, 3, 4, 5],
} as const;

/** Top of the lower bookcases' carcass, frieze and cornice. */
export const CARCASS_TOP = CASE.plinth + CASE.shelves * CASE.shelfPitch + CASE.board;
export const FRIEZE_H = 0.38;
export const CORNICE_TOP = CARCASS_TOP + FRIEZE_H + 0.22;

/** The gallery above the cornice: a balcony with shallower cases. */
export const UPPER = {
  floor: CORNICE_TOP + 0.1,
  depth: 0.32,
  shelfPitch: 0.5,
  shelves: 3,
  balconyDepth: 1.05,
} as const;

export function upperShelfY(shelfIndex: number) {
  return UPPER.floor + 0.1 + shelfIndex * UPPER.shelfPitch + CASE.board / 2;
}

export const MIN_CASES = 7;
const MAX_REAL_PER_SHELF = 22;
const SHELF_MARGIN = 0.03;
const GAP = 0.0025;

export type BookSlot = {
  x: number;
  y: number; // bottom of the book, sitting on the shelf
  z: number; // centre depth
  thickness: number;
  height: number;
  depth: number;
  color: string;
  caseIndex: number;
  shelfIndex: number;
};

export type PlacedBook = BookSlot & { book: Book };

export type LibraryLayout = {
  cases: number;
  caseCentres: number[];
  wallWidth: number;
  books: PlacedBook[];
  fillers: BookSlot[];
  /** Surname range shown on each bookcase frieze, or null for an empty case. */
  plaques: (string | null)[];
};

export function caseStride() {
  return CASE.innerWidth + CASE.pilaster;
}

export function shelfY(shelfIndex: number) {
  return CASE.plinth + shelfIndex * CASE.shelfPitch + CASE.board / 2;
}

function bookSize(key: string) {
  const r = seeded(key);
  return {
    height: 0.23 + r() * 0.11,
    thickness: 0.032 + r() * 0.04,
    depth: 0.17 + r() * 0.07,
  };
}

function fillerSize(r: () => number) {
  // Occasional folio or slim pamphlet keeps the rhythm irregular.
  const tall = r() < 0.12;
  const slim = r() < 0.18;
  return {
    height: tall ? 0.36 + r() * 0.06 : 0.2 + r() * 0.13,
    thickness: slim ? 0.018 + r() * 0.012 : 0.03 + r() * 0.05,
    depth: 0.16 + r() * 0.1,
  };
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * amount)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Libraries file by surname. Without structured name data the last word is
 * the most reliable guess ("Miguel de Cervantes" → Cervantes,
 * "Arturo Pérez-Reverte" → Pérez-Reverte).
 */
export function surname(author: string) {
  const words = author.trim().split(/\s+/);
  return words[words.length - 1] ?? author;
}

export function sortForShelves(books: Book[]) {
  const opts = { sensitivity: "base" } as const;
  return [...books].sort(
    (a, b) =>
      surname(a.author).localeCompare(surname(b.author), "es", opts) ||
      a.author.localeCompare(b.author, "es", opts) ||
      a.title.localeCompare(b.title, "es", opts),
  );
}

/**
 * Lays the collection out in reading order (bookcase by bookcase, shelf by
 * shelf, sorted by author) and pads every shelf with anonymous volumes so the
 * wall always looks full, however small the collection is.
 */
export function buildLayout(input: Book[]): LibraryLayout {
  const sorted = sortForShelves(input);
  const readingPerCase = CASE.readingShelves.length;
  const cases = Math.max(
    MIN_CASES,
    Math.ceil(sorted.length / (readingPerCase * MAX_REAL_PER_SHELF)),
  );
  const stride = caseStride();
  const caseCentres = Array.from({ length: cases }, (_, c) => (c - (cases - 1) / 2) * stride);

  const readingSlots = cases * readingPerCase;
  const books: PlacedBook[] = [];
  const fillers: BookSlot[] = [];

  for (let c = 0; c < cases; c++) {
    for (let s = 0; s < CASE.shelves; s++) {
      const readingIndex = CASE.readingShelves.indexOf(s as (typeof CASE.readingShelves)[number]);
      let shelfBooks: Book[] = [];
      if (readingIndex >= 0) {
        // Spread the collection evenly over every reading shelf.
        const slot = c * readingPerCase + readingIndex;
        const from = Math.floor((slot * sorted.length) / readingSlots);
        const to = Math.floor(((slot + 1) * sorted.length) / readingSlots);
        shelfBooks = sorted.slice(from, to);
      }

      const r = seeded(`shelf-${c}-${s}`);
      const left = caseCentres[c] - CASE.innerWidth / 2 + SHELF_MARGIN;
      const right = caseCentres[c] + CASE.innerWidth / 2 - SHELF_MARGIN;
      const y = shelfY(s) + CASE.board / 2;
      const front = CASE.depth - 0.025;

      const realSizes = shelfBooks.map((b) => bookSize(b.id));
      const realWidth = realSizes.reduce((sum, b) => sum + b.thickness + GAP, 0);
      const usable = right - left;
      const blockStart = left + (usable - realWidth) * (0.12 + r() * 0.6);

      // Some shelves end with a short empty run, like a real working library.
      const emptyTail = r() < 0.35 ? 0.08 + r() * 0.22 : 0;

      let x = left;
      const pushFiller = (limit: number) => {
        while (true) {
          const size = fillerSize(r);
          if (x + size.thickness > limit) break;
          const base = LEATHERS[Math.floor(r() * LEATHERS.length)];
          fillers.push({
            ...size,
            x: x + size.thickness / 2,
            y,
            z: front - size.depth / 2,
            color: shade(base, 0.7 + r() * 0.5),
            caseIndex: c,
            shelfIndex: s,
          });
          x += size.thickness + GAP;
        }
      };

      if (shelfBooks.length > 0) {
        pushFiller(blockStart);
        x = Math.max(x, blockStart);
        shelfBooks.forEach((book, i) => {
          const size = realSizes[i];
          books.push({
            ...size,
            book,
            x: x + size.thickness / 2,
            y,
            z: front - size.depth / 2,
            color: leatherFor(book.id, book.spine_color),
            caseIndex: c,
            shelfIndex: s,
          });
          x += size.thickness + GAP;
        });
      }
      pushFiller(right - emptyTail);
    }
  }

  // Gallery above: anonymous volumes only, packed a little tighter.
  for (let c = 0; c < cases; c++) {
    for (let s = 0; s < UPPER.shelves; s++) {
      const r = seeded(`upper-${c}-${s}`);
      const left = caseCentres[c] - CASE.innerWidth / 2 + SHELF_MARGIN;
      const right = caseCentres[c] + CASE.innerWidth / 2 - SHELF_MARGIN;
      const y = upperShelfY(s) + CASE.board / 2;
      const front = UPPER.depth - 0.02;
      let x = left;
      while (true) {
        const size = fillerSize(r);
        size.height = Math.min(size.height, UPPER.shelfPitch - 0.08);
        size.depth = Math.min(size.depth, UPPER.depth - 0.04);
        if (x + size.thickness > right) break;
        const base = LEATHERS[Math.floor(r() * LEATHERS.length)];
        fillers.push({
          ...size,
          x: x + size.thickness / 2,
          y,
          z: front - size.depth / 2,
          color: shade(base, 0.7 + r() * 0.5),
          caseIndex: c,
          shelfIndex: CASE.shelves + s,
        });
        x += size.thickness + GAP;
      }
    }
  }

  const plaques = caseCentres.map((_, c) => {
    const inCase = books.filter((b) => b.caseIndex === c);
    if (inCase.length === 0) return null;
    const first = surname(inCase[0].book.author);
    const last = surname(inCase[inCase.length - 1].book.author);
    return first === last ? first : `${first} - ${last}`;
  });

  return { cases, caseCentres, wallWidth: cases * stride, books, fillers, plaques };
}
