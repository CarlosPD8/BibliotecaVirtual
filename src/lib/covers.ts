const COVER_HOST = "covers.openlibrary.org";

export function isAllowedCoverUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === COVER_HOST;
  } catch {
    return false;
  }
}

/** Same-origin URL for a stored cover, so WebGL can sample it without CORS surprises. */
export function proxiedCover(url: string | null): string | null {
  if (!url || !isAllowedCoverUrl(url)) return null;
  return `/api/cover?src=${encodeURIComponent(url)}`;
}

export function coverUrlFromId(coverId: number, size: "S" | "M" | "L" = "L") {
  return `https://${COVER_HOST}/b/id/${coverId}-${size}.jpg`;
}
