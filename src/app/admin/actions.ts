"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAllowedCoverUrl } from "@/lib/covers";
import { LEATHERS } from "@/lib/leather";
import { findCovers, type CoverCandidate } from "@/lib/openlibrary";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<"title" | "author" | "rating" | "cover_url", string[]>>;
} | null;

const bookSchema = z.object({
  title: z.string().trim().min(1, "Escribe el título.").max(300, "El título es demasiado largo."),
  author: z.string().trim().min(1, "Escribe el autor.").max(200, "El nombre es demasiado largo."),
  rating: z.coerce
    .number({ message: "Elige de 1 a 5 estrellas." })
    .int()
    .min(1, "Elige de 1 a 5 estrellas.")
    .max(5, "Elige de 1 a 5 estrellas."),
  cover_url: z
    .string()
    .trim()
    .transform((v) => v || null)
    .refine((v) => v === null || isAllowedCoverUrl(v), "Portada no válida.")
    .nullable(),
  ol_key: z
    .string()
    .trim()
    .transform((v) => (v && /^\/works\/OL\d+W$/.test(v) ? v : null))
    .nullable(),
});

function readBook(formData: FormData) {
  return bookSchema.safeParse({
    title: formData.get("title") ?? "",
    author: formData.get("author") ?? "",
    rating: formData.get("rating") ?? "",
    cover_url: formData.get("cover_url") ?? "",
    ol_key: formData.get("ol_key") ?? "",
  });
}

/** Every action re-checks the session: the proxy's redirect is only a first line. */
async function authorised() {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase no está configurado todavía." } as const;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Tu sesión ha caducado. Vuelve a entrar." } as const;
  // RLS enforces this too; checking here gives a clear message instead of a failed write.
  const { data: librarian } = await supabase
    .from("librarians")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!librarian) return { error: "Esta cuenta no tiene permiso para editar la biblioteca." } as const;
  return { supabase } as const;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createBook(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorised();
  if ("error" in auth) return { ok: false, message: auth.error };

  const parsed = readBook(formData);
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const spine_color = LEATHERS[Math.floor(Math.random() * LEATHERS.length)];
  const { error } = await auth.supabase.from("books").insert({ ...parsed.data, spine_color });
  if (error) {
    console.error("createBook", error);
    return { ok: false, message: "No se pudo guardar el libro. Inténtalo de nuevo." };
  }

  refresh();
  return { ok: true, message: `«${parsed.data.title}» ya está en su balda.` };
}

export async function updateBook(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorised();
  if ("error" in auth) return { ok: false, message: auth.error };

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Libro no encontrado." };

  const parsed = readBook(formData);
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { error } = await auth.supabase.from("books").update(parsed.data).eq("id", id.data);
  if (error) {
    console.error("updateBook", error);
    return { ok: false, message: "No se pudieron guardar los cambios." };
  }

  refresh();
  return { ok: true, message: "Cambios guardados." };
}

export async function deleteBook(id: string): Promise<FormState> {
  const auth = await authorised();
  if ("error" in auth) return { ok: false, message: auth.error };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Libro no encontrado." };

  const { error } = await auth.supabase.from("books").delete().eq("id", id);
  if (error) {
    console.error("deleteBook", error);
    return { ok: false, message: "No se pudo retirar el libro." };
  }

  refresh();
  return { ok: true, message: "Libro retirado de la biblioteca." };
}

export async function searchCovers(
  title: string,
  author: string,
): Promise<{ covers: CoverCandidate[]; error?: string }> {
  const auth = await authorised();
  if ("error" in auth) return { covers: [], error: auth.error };
  if (!title.trim()) return { covers: [], error: "Escribe primero el título." };
  try {
    return { covers: await findCovers(title.trim().slice(0, 300), author.trim().slice(0, 200)) };
  } catch (e) {
    console.error("searchCovers", e);
    return { covers: [], error: "Open Library no responde ahora mismo." };
  }
}
