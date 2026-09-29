import type { Book } from "./types";

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export type SearchHit = {
  book: Book;
  field: "title" | "author";
};

/**
 * Matches every word of the query against title or author, ignoring case and
 * accents. Title matches rank above author matches, prefix matches above
 * inner matches.
 */
export function searchBooks(books: Book[], query: string, limit = 8): SearchHit[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const scored: { hit: SearchHit; score: number }[] = [];
  for (const book of books) {
    const title = normalize(book.title);
    const author = normalize(book.author);
    const haystack = `${title} ${author}`;
    if (!words.every((w) => haystack.includes(w))) continue;

    const inTitle = words.every((w) => title.includes(w));
    const field = inTitle ? "title" : "author";
    const target = inTitle ? title : author;
    const first = words[0];
    const prefix = target.startsWith(first) || target.includes(` ${first}`);
    scored.push({
      hit: { book, field },
      score: (inTitle ? 2 : 1) + (prefix ? 1 : 0),
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.hit.book.title.localeCompare(b.hit.book.title, "es"))
    .slice(0, limit)
    .map((s) => s.hit);
}
