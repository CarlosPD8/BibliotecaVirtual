-- Solo los bibliotecarios pueden escribir, aunque alguien consiga crearse una cuenta.
-- Para autorizar a un usuario: insert into public.librarians (user_id) values ('<uuid>');

create table if not exists public.librarians (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.librarians enable row level security;

-- Cada usuario solo puede ver su propia fila; nadie puede escribir desde la API.
drop policy if exists "Ver mi fila" on public.librarians;
create policy "Ver mi fila" on public.librarians
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "El dueño inserta" on public.books;
create policy "El bibliotecario inserta" on public.books
  for insert to authenticated
  with check (
    (select auth.uid()) = owner
    and exists (select 1 from public.librarians l where l.user_id = (select auth.uid()))
  );

drop policy if exists "El dueño edita" on public.books;
create policy "El bibliotecario edita" on public.books
  for update to authenticated
  using (
    (select auth.uid()) = owner
    and exists (select 1 from public.librarians l where l.user_id = (select auth.uid()))
  )
  with check ((select auth.uid()) = owner);

drop policy if exists "El dueño borra" on public.books;
create policy "El bibliotecario borra" on public.books
  for delete to authenticated
  using (
    (select auth.uid()) = owner
    and exists (select 1 from public.librarians l where l.user_id = (select auth.uid()))
  );
