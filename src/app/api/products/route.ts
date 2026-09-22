import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (err) {
    console.error("[api/products]", err);
    return NextResponse.json({ error: "The shop is unavailable right now." }, { status: 503 });
  }
}
