import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_URL = "https://science.nasa.gov/apod";

// NASA moved APOD off api.nasa.gov (no API key needed now). The endpoint returns a list of
// recent entries, newest first. per_page and _fields are standard WordPress REST params that
// keep the response small, because each full entry also carries a whole HTML page.
const API_URL =
  "https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1" +
  "&_fields=date,title,explanation,copyright,media_type,url,hdurl,thumbnail_url";

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'",
  "&rsquo;": "\u2019", "&lsquo;": "\u2018", "&nbsp;": " ",
};

// The new API returns HTML (links, <strong>, <br>) in explanation and copyright; the site wants plain text.
function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m) => {
      if (m[1] === "#") {
        const n = m[2].toLowerCase() === "x" ? parseInt(m.slice(3, -1), 16) : parseInt(m.slice(2, -1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[m.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

// Keep just the explanation paragraph: drop the "Explanation:" label and the APOD notices after it.
function explanationText(html: string): string {
  const first = html.split(/<br\s*\/?>\s*<br\s*\/?>/i)[0];
  return plain(first).replace(/^Explanation:\s*/i, "");
}

// hdurl points at the full-size original (can be several thousand pixels wide). The asset host
// resizes via ?w=, so ask for a hero-sized version instead.
function hero(url: string): string {
  try {
    const u = new URL(url);
    const w = Number(u.searchParams.get("w"));
    if (w > 2000) {
      u.searchParams.set("w", "2000");
      u.searchParams.delete("h");
    }
    return u.toString();
  } catch {
    return url;
  }
}

type Payload = {
  title: string;
  date: string;
  explanation: string;
  copyright?: string;
  mediaType: string;
  image: string | null;
  src: string | null;
  pageUrl: string;
};

// Keeps serving the last good response if NASA rate-limits or times out.
let lastGood: Payload | null = null;

export async function GET() {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`NASA responded ${res.status}`);
    const json = await res.json();
    const d = Array.isArray(json) ? json[0] : json;
    if (!d) throw new Error("NASA returned no entries");

    // On video days APOD has no photo, so use the thumbnail when there is one.
    // Note: in the new API `url` is the article page, not the image, so the photo is `hdurl`.
    const raw: string | null =
      d.media_type === "image" ? (d.hdurl ?? null) : (d.thumbnail_url ?? null);
    const image = raw ? hero(raw) : null;

    const payload: Payload = {
      title: String(d.title ?? "Astronomy Picture of the Day"),
      date: String(d.date ?? ""),
      explanation: explanationText(String(d.explanation ?? "")),
      copyright: d.copyright ? plain(String(d.copyright)) || undefined : undefined,
      mediaType: String(d.media_type ?? "image"),
      image,
      src: image ? `/api/apod/image?u=${encodeURIComponent(image)}` : null,
      pageUrl: PAGE_URL,
    };
    lastGood = payload;
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    if (lastGood) return NextResponse.json(lastGood);
    return NextResponse.json({ error: "APOD unavailable" }, { status: 502 });
  }
}
