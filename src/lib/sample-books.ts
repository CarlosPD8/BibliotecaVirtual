import type { Book, Rating } from "./types";

// Shown while Supabase is not configured, so the library is never empty in
// local development. The same list is seeded into the database.
const rows: [string, string, Rating, number | null, string][] = [
  ["Don Quijote de la Mancha", "Miguel de Cervantes", 5, 14428305, "/works/OL503666W"],
  ["Cien años de soledad", "Gabriel García Márquez", 5, 12627383, "/works/OL274505W"],
  ["Ficciones", "Jorge Luis Borges", 5, 10832290, "/works/OL110971W"],
  ["La sombra del viento", "Carlos Ruiz Zafón", 4, 10107644, "/works/OL278437W"],
  ["El club Dumas", "Arturo Pérez-Reverte", 4, 5400241, "/works/OL857568W"],
  ["El nombre de la rosa", "Umberto Eco", 5, null, ""],
  ["Rayuela", "Julio Cortázar", 3, 1047466, "/works/OL14860424W"],
  ["La casa de los espíritus", "Isabel Allende", 4, 3205226, "/works/OL1905255W"],
  ["1984", "George Orwell", 5, 8745958, "/works/OL11326416W"],
  ["Crimen y castigo", "Fiódor Dostoyevski", 4, 12328823, "/works/OL26382038W"],
  ["Fortunata y Jacinta", "Benito Pérez Galdós", 3, 3866770, "/works/OL815451W"],
  ["Romancero gitano", "Federico García Lorca", 4, 5985528, "/works/OL10342791W"],
  ["El Señor de los Anillos", "J. R. R. Tolkien", 5, 14846613, "/works/OL42610493W"],
  ["Frankenstein", "Mary Shelley", 4, 12356249, "/works/OL450063W"],
  ["Moby Dick", "Herman Melville", 2, 10544254, "/works/OL102749W"],
  ["La metamorfosis", "Franz Kafka", 4, 14073660, "/works/OL35091705W"],
  ["Campos de Castilla", "Antonio Machado", 4, 904033, "/works/OL1344024W"],
  ["Los santos inocentes", "Miguel Delibes", 5, 7013710, "/works/OL1338306W"],
];

export const SAMPLE_BOOKS: Book[] = rows.map(([title, author, rating, cover, key], i) => ({
  id: `sample-${i + 1}`,
  title,
  author,
  rating,
  cover_url: cover ? `https://covers.openlibrary.org/b/id/${cover}-L.jpg` : null,
  ol_key: key || null,
  spine_color: null,
  created_at: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
}));

export const SAMPLE_ROWS = rows;
