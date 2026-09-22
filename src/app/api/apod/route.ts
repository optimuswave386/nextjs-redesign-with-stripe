import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_URL = "https://apod.nasa.gov/apod/astropix.html";

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
  const key = process.env.NASA_API_KEY || "DEMO_KEY";
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(key)}&thumbs=true`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) throw new Error(`NASA responded ${res.status}`);
    const d = await res.json();

    // On video days APOD has no photo, so use the thumbnail when there is one.
    const image: string | null =
      d.media_type === "image" ? (d.url ?? null) : (d.thumbnail_url ?? null);

    const payload: Payload = {
      title: String(d.title ?? "Astronomy Picture of the Day"),
      date: String(d.date ?? ""),
      explanation: String(d.explanation ?? ""),
      copyright: d.copyright ? String(d.copyright).replace(/\s+/g, " ").trim() : undefined,
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
