import { LibraryExperience } from "@/components/LibraryExperience";
import { getBooks } from "@/lib/books";

// Rendered statically and refreshed by revalidatePath after every change in
// /admin; the timer also picks up edits made directly in Supabase.
export const revalidate = 300;

export default async function Home() {
  const { books, source, error } = await getBooks();
  return <LibraryExperience books={books} source={source} error={error} />;
}
