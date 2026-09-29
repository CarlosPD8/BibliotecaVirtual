-- Las políticas RLS filtran por owner: índice para la clave foránea.
create index if not exists books_owner_idx on public.books (owner);
