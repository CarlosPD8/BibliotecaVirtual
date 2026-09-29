import type { NextRequest } from "next/server";
import { isAllowedCoverUrl } from "@/lib/covers";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Same-origin proxy for Open Library covers. Open Library answers through two
 * redirects to archive.org; caching the final image on Vercel's CDN makes the
 * pulled-out book show its cover almost instantly on later visits.
 * Only covers.openlibrary.org is allowed so this is not an open proxy.
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src || !isAllowedCoverUrl(src)) {
    return new Response("Portada no permitida", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(src, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "BibliotecaDePalacio/1.0" },
    });
  } catch {
    return new Response("Open Library no responde", { status: 504 });
  }

  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) {
    return new Response("Portada no encontrada", { status: 404 });
  }

  const body = await upstream.arrayBuffer();
  // Open Library returns a 1x1 placeholder when a cover id has no image.
  if (body.byteLength < 1000 || body.byteLength > MAX_BYTES) {
    return new Response("Portada no disponible", { status: 404 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
    },
  });
}
