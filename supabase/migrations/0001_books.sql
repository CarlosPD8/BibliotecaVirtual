-- Biblioteca de Palacio: tabla de libros con lectura pública y escritura solo del dueño.

create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 300),
  author      text not null check (char_length(author) between 1 and 200),
  rating      smallint not null check (rating between 1 and 5),
  cover_url   text check (cover_url is null or cover_url like 'https://covers.openlibrary.org/%'),
  ol_key      text,
  spine_color text check (spine_color is null or spine_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at  timestamptz not null default now(),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade
);

create index if not exists books_author_idx on public.books (author);

alter table public.books enable row level security;

drop policy if exists "Lectura pública" on public.books;
create policy "Lectura pública" on public.books
  for select to anon, authenticated
  using (true);

drop policy if exists "El dueño inserta" on public.books;
create policy "El dueño inserta" on public.books
  for insert to authenticated
  with check ((select auth.uid()) = owner);

drop policy if exists "El dueño edita" on public.books;
create policy "El dueño edita" on public.books
  for update to authenticated
  using ((select auth.uid()) = owner)
  with check ((select auth.uid()) = owner);

drop policy if exists "El dueño borra" on public.books;
create policy "El dueño borra" on public.books
  for delete to authenticated
  using ((select auth.uid()) = owner);
