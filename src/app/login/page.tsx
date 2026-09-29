import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Entrar · Biblioteca de Palacio" };

// Depends on the visitor's session cookie.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isSupabaseConfigured() && (await getUser())) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,#2a1a10_0%,var(--ink)_65%)] px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-base text-muted transition-colors duration-150 hover:text-ivory">
          ← Volver a la biblioteca
        </Link>
        <div className="plate mt-4 p-8">
          <h1 className="text-3xl font-semibold">Entrar</h1>
          <p className="mt-2 text-lg text-muted">Solo el bibliotecario puede añadir o retirar libros.</p>
          {isSupabaseConfigured() ? (
            <LoginForm />
          ) : (
            <p className="mt-6 text-base text-danger">
              Supabase no está configurado. Añade las variables de entorno para poder entrar.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
