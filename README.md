# Biblioteca de Palacio

Biblioteca personal en 3D: los libros que he leído, con su autor y mi valoración, colocados en las estanterías de una biblioteca de palacio. El buscador lleva la cámara hasta el libro y lo saca de la balda.

Next.js 16 · React Three Fiber · GSAP · Supabase · Vercel

## Desarrollo

```bash
npm install
npm run dev
```

Sin variables de entorno la web funciona con 18 libros de ejemplo (`src/lib/sample-books.ts`), útil para trabajar en la escena sin base de datos.

Para forzar un nivel de calidad gráfica: `?calidad=alta`, `?calidad=media` o `?calidad=baja`. Por defecto se elige según la GPU y baja sola si los FPS caen.

## Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden las migraciones de `supabase/migrations/` (tabla `books` con RLS: lectura pública, escritura solo de bibliotecarios).
3. En **Authentication → Users**, crea tu usuario con correo y contraseña.
4. Autorízalo como bibliotecario: `insert into public.librarians (user_id) select id from auth.users where email = 'tu@correo';`
5. En **Authentication → Sign In / Providers**, desactiva *Allow new users to sign up*, así nadie más puede registrarse.
6. (Opcional) Ejecuta `supabase/seed.sql` para cargar los libros de ejemplo a tu nombre.
7. Copia `.env.example` a `.env.local` y rellena la URL y la *publishable key* (Project Settings → API).

## Estructura

| Ruta | Qué hace |
|---|---|
| `src/app/page.tsx` | Carga los libros (estática, se revalida al editar) |
| `src/app/admin` | Alta, edición y borrado, con búsqueda de portadas en Open Library |
| `src/app/api/cover` | Proxy con caché para las portadas de Open Library |
| `src/proxy.ts` | Refresca la sesión y protege `/admin` |
| `src/lib/layout.ts` | Reparte los libros por estanterías y baldas, ordenados por apellido |
| `src/components/scene` | La escena 3D: sala, estanterías, libros, luces y la animación |
| `src/components/scene/BookDirector.tsx` | El timeline de GSAP que saca y devuelve el libro |

Texturas de madera y piel de [ambientCG](https://ambientcg.com) (CC0). Tipografía Cinzel y Cormorant Garamond (OFL).
