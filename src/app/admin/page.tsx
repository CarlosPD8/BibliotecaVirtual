import { Books, SignOut } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookForm } from "@/components/admin/BookForm";
import { BookList } from "@/components/admin/BookList";
import { BOOK_COLUMNS } from "@/lib/books";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Gestionar · Biblioteca de Palacio" };

// Depends on the visitor's session cookie.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data, error } = await supabase
    .from("books")
    .select(BOOK_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<Book[]>();
  const books = data ?? [];

  return (
    <main className="min-h-dvh bg-[radial-gradient(ellipse_at_top,#2a1a10_0%,var(--ink)_60%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-3 transition-opacity duration-150 hover:opacity-80">
          <Books size={24} weight="duotone" className="text-gold" aria-hidden />
          <span className="smallcaps text-[15px] font-semibold md:text-[17px]">Biblioteca de Palacio</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="h-10 px-3 text-base leading-10 text-muted transition-colors duration-150 hover:text-ivory">
            Ver la biblioteca
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="plate inline-flex h-10 items-center gap-2 px-3 text-base text-muted transition-[color,transform] duration-150 hover:text-ivory active:scale-[0.97]"
            >
              <SignOut size={16} aria-hidden />
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 md:px-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="add-title" className="plate p-6 md:p-8 lg:sticky lg:top-6">
          <h1 id="add-title" className="text-3xl font-semibold">
            Añadir un libro
          </h1>
          <p className="mt-2 mb-6 text-lg text-muted">Aparecerá en su balda, ordenado por el apellido del autor.</p>
          <BookForm />
        </section>

        <section aria-labelledby="list-title">
          <h2 id="list-title" className="text-3xl font-semibold">
            En las estanterías <span className="text-xl font-normal italic text-muted">({books.length})</span>
          </h2>
          <div className="mt-6">
            {error ? (
              <p className="text-danger">No se pudieron cargar los libros: {error.message}</p>
            ) : (
              <BookList books={books} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
