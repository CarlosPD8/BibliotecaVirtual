"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { message: string; email?: string } | null;

const credentials = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe la contraseña."),
});

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured()) return { message: "Supabase no está configurado todavía." };

  const email = String(formData.get("email") ?? "").trim();
  const parsed = credentials.safeParse({ email, password: formData.get("password") ?? "" });
  if (!parsed.success) return { message: parsed.error.issues[0].message, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { message: "Correo o contraseña incorrectos.", email };
  }
  redirect("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
