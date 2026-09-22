import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// The browser can only read pixel data from same-origin images, so the palette
// extractor loads the photo through this proxy. Only NASA (and YouTube thumbnails
// for video days) are allowed, so it can't be used to fetch arbitrary URLs.
const ALLOWED = (host: string) =>
  host === "nasa.gov" || host.endsWith(".nasa.gov") || host === "img.youtube.com";

const MAX_BYTES = 15 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) return new Response("Missing image URL", { status: 400 });

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return new Response("Invalid image URL", { status: 400 });
  }
  if (url.protocol === "http:") url.protocol = "https:";
  if (url.protocol !== "https:" || !ALLOWED(url.hostname)) {
    return new Response("Image host not allowed", { status: 400 });
  }

  try {
    const upstream = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10000) });
    const type = upstream.headers.get("content-type") ?? "";
    const length = Number(upstream.headers.get("content-length") ?? 0);
    if (!upstream.ok || !type.startsWith("image/")) {
      return new Response("Upstream image unavailable", { status: 502 });
    }
    if (length > MAX_BYTES) return new Response("Image too large", { status: 413 });

    return new Response(upstream.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response("Could not fetch image", { status: 502 });
  }
}
