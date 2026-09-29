import "server-only";
import { coverUrlFromId } from "./covers";

export type CoverCandidate = {
  coverUrl: string;
  thumbUrl: string;
  olKey: string;
  title: string;
  author: string | null;
  year: number | null;
  spanish: boolean;
};

type SearchDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  editions?: { docs?: { cover_i?: number; language?: string[] }[] };
};

const FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "editions",
  "editions.cover_i",
  "editions.language",
].join(",");

/**
 * Cover candidates for a title and author, Spanish editions first. Each work
 * can contribute its own cover and the cover of its best-matching Spanish
 * edition, so the owner can pick the copy they actually read.
 */
export async function findCovers(title: string, author: string, limit = 8): Promise<CoverCandidate[]> {
  const params = new URLSearchParams({ title, limit: "10", lang: "es", fields: FIELDS });
  if (author.trim()) params.set("author", author);

  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    headers: { "User-Agent": "BibliotecaDePalacio/1.0" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Open Library respondió ${response.status}`);
  const data = (await response.json()) as { docs?: SearchDoc[] };

  const seen = new Set<number>();
  const out: CoverCandidate[] = [];
  const push = (coverId: number | undefined, doc: SearchDoc, spanish: boolean) => {
    if (!coverId || seen.has(coverId)) return;
    seen.add(coverId);
    out.push({
      coverUrl: coverUrlFromId(coverId, "L"),
      thumbUrl: coverUrlFromId(coverId, "M"),
      olKey: doc.key,
      title: doc.title,
      author: doc.author_name?.[0] ?? null,
      year: doc.first_publish_year ?? null,
      spanish,
    });
  };

  for (const doc of data.docs ?? []) {
    const edition = doc.editions?.docs?.[0];
    const editionSpanish = Boolean(edition?.language?.includes("spa"));
    if (editionSpanish) push(edition?.cover_i, doc, true);
    push(doc.cover_i, doc, false);
    if (!editionSpanish) push(edition?.cover_i, doc, false);
  }

  return out.sort((a, b) => Number(b.spanish) - Number(a.spanish)).slice(0, limit);
}
