import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// The success page calls this with the session_id Stripe put in the redirect URL.
// We ask Stripe directly for the session (never trust anything the browser could
// have edited) and turn it into the Order shape the UI already knows how to render.

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id");
  if (!id || !id.startsWith("cs_")) {
    return NextResponse.json({ error: "Missing or invalid session." }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error("[checkout/session]", err);
    return NextResponse.json({ error: "Payments aren't configured on this server yet." }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id, { expand: ["line_items"] });
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "This order hasn't been paid yet." }, { status: 402 });
    }

    const items = (session.line_items?.data ?? []).map((li) => ({
      name: li.description ?? "Item",
      qty: li.quantity ?? 1,
      total: li.amount_total ?? 0,
    }));
    const shipping = session.shipping_cost?.amount_total ?? 0;

    const order = {
      id: session.id.replace(/^cs_(test_)?/, "ORD-").slice(0, 24).toUpperCase(),
      createdAt: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
      email: session.customer_details?.email ?? session.customer_email ?? "",
      items,
      subtotal: session.amount_subtotal ?? 0,
      shipping,
      total: session.amount_total ?? 0,
    };
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[checkout/session] stripe error", err);
    return NextResponse.json({ error: "Could not find that order." }, { status: 404 });
  }
}
