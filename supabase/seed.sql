-- Libros de ejemplo. Ejecutar DESPUÉS de crear tu usuario en Auth:
-- se asignan al primer usuario registrado.

insert into public.books (title, author, rating, cover_url, ol_key, owner)
select v.title, v.author, v.rating, v.cover_url, v.ol_key, u.id
from (values
  ('Don Quijote de la Mancha', 'Miguel de Cervantes', 5, 'https://covers.openlibrary.org/b/id/14428305-L.jpg', '/works/OL503666W'),
  ('Cien años de soledad', 'Gabriel García Márquez', 5, 'https://covers.openlibrary.org/b/id/12627383-L.jpg', '/works/OL274505W'),
  ('Ficciones', 'Jorge Luis Borges', 5, 'https://covers.openlibrary.org/b/id/10832290-L.jpg', '/works/OL110971W'),
  ('La sombra del viento', 'Carlos Ruiz Zafón', 4, 'https://covers.openlibrary.org/b/id/10107644-L.jpg', '/works/OL278437W'),
  ('El club Dumas', 'Arturo Pérez-Reverte', 4, 'https://covers.openlibrary.org/b/id/5400241-L.jpg', '/works/OL857568W'),
  ('El nombre de la rosa', 'Umberto Eco', 5, null, null),
  ('Rayuela', 'Julio Cortázar', 3, 'https://covers.openlibrary.org/b/id/1047466-L.jpg', '/works/OL14860424W'),
  ('La casa de los espíritus', 'Isabel Allende', 4, 'https://covers.openlibrary.org/b/id/3205226-L.jpg', '/works/OL1905255W'),
  ('1984', 'George Orwell', 5, 'https://covers.openlibrary.org/b/id/8745958-L.jpg', '/works/OL11326416W'),
  ('Crimen y castigo', 'Fiódor Dostoyevski', 4, 'https://covers.openlibrary.org/b/id/12328823-L.jpg', '/works/OL26382038W'),
  ('Fortunata y Jacinta', 'Benito Pérez Galdós', 3, 'https://covers.openlibrary.org/b/id/3866770-L.jpg', '/works/OL815451W'),
  ('Romancero gitano', 'Federico García Lorca', 4, 'https://covers.openlibrary.org/b/id/5985528-L.jpg', '/works/OL10342791W'),
  ('El Señor de los Anillos', 'J. R. R. Tolkien', 5, 'https://covers.openlibrary.org/b/id/14846613-L.jpg', '/works/OL42610493W'),
  ('Frankenstein', 'Mary Shelley', 4, 'https://covers.openlibrary.org/b/id/12356249-L.jpg', '/works/OL450063W'),
  ('Moby Dick', 'Herman Melville', 2, 'https://covers.openlibrary.org/b/id/10544254-L.jpg', '/works/OL102749W'),
  ('La metamorfosis', 'Franz Kafka', 4, 'https://covers.openlibrary.org/b/id/14073660-L.jpg', '/works/OL35091705W'),
  ('Campos de Castilla', 'Antonio Machado', 4, 'https://covers.openlibrary.org/b/id/904033-L.jpg', '/works/OL1344024W'),
  ('Los santos inocentes', 'Miguel Delibes', 5, 'https://covers.openlibrary.org/b/id/7013710-L.jpg', '/works/OL1338306W')
) as v(title, author, rating, cover_url, ol_key)
cross join (select id from auth.users order by created_at limit 1) as u;
