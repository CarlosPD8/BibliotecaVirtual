import "server-only";
import { SAMPLE_BOOKS } from "./sample-books";
import { isSupabaseConfigured } from "./supabase/env";
import { createPublicClient } from "./supabase/public";
import type { Book } from "./types";

export const BOOK_COLUMNS = "id, title, author, rating, cover_url, ol_key, spine_color, created_at";

export type BooksResult = { books: Book[]; source: "supabase" | "sample"; error?: string };

export async function getBooks(): Promise<BooksResult> {
  if (!isSupabaseConfigured()) return { books: SAMPLE_BOOKS, source: "sample" };

  const { data, error } = await createPublicClient()
    .from("books")
    .select(BOOK_COLUMNS)
    .order("author")
    .returns<Book[]>();

  if (error) {
    console.error("No se pudieron cargar los libros", error);
    return { books: [], source: "supabase", error: error.message };
  }
  return { books: data ?? [], source: "supabase" };
}
