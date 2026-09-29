export type Rating = 1 | 2 | 3 | 4 | 5;

export type Book = {
  id: string;
  title: string;
  author: string;
  rating: Rating;
  cover_url: string | null;
  ol_key: string | null;
  spine_color: string | null;
  created_at: string;
};
