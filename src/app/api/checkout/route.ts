import { NextResponse } from "next/server";
import { priceCart, type CartLine } from "@/lib/pricing";
import { getProducts } from "@/lib/data";
import type { Product } from "@/lib/products";
import { getStripe, siteUrl } from "@/lib/stripe";

// Validates the cart and re-prices it from the database (never trusting prices the
// browser sends), then creates a Stripe Checkout Session for the priced total and
// returns its hosted URL. The browser redirects there to pay; Stripe redirects back
// to /checkout/success?session_id=... (or /checkout?canceled=1 if the visitor backs out).

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { items, customer } = (body ?? {}) as {
    items?: unknown;
    customer?: Record<string, unknown>;
  };

  const lines: CartLine[] = Array.isArray(items)
    ? items
        .map((i: { id?: unknown; qty?: unknown }) => ({ id: String(i?.id ?? ""), qty: Number(i?.qty) }))
        .filter((i) => Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= 20)
    : [];
  let catalogue: Product[];
  try {
    catalogue = await getProducts();
  } catch (err) {
    console.error("[checkout] could not load products", err);
    return NextResponse.json({ error: "The shop is unavailable right now. Try again in a moment." }, { status: 503 });
  }
  const priced = priceCart(lines, catalogue);
  if (priced.lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const c = {
    name: str(customer?.name, 120),
    email: str(customer?.email, 200),
    address: str(customer?.address, 200),
    city: str(customer?.city, 100),
    postal: str(customer?.postal, 20),
    country: str(customer?.country, 100),
  };
  const errors: Record<string, string> = {};
  if (!c.name) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors.email = "Enter a valid email address.";
  if (priced.needsShipping) {
    if (!c.address) errors.address = "Enter a street address.";
    if (!c.city) errors.city = "Enter a city.";
    if (!c.postal) errors.postal = "Enter a postal code.";
    if (!c.country) errors.country = "Enter a country.";
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Check the highlighted fields.", errors }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Payments aren't configured on this server yet." }, { status: 503 });
  }

  const base = siteUrl();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: c.email,
      client_reference_id: lines.map((l) => `${l.id}:${l.qty}`).join(","),
      line_items: priced.lines.map(({ product, qty }) => ({
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.blurb || undefined,
            metadata: { productId: product.id },
          },
        },
      })),
      ...(priced.needsShipping
        ? {
            shipping_options:
              priced.shipping > 0
                ? [
                    {
                      shipping_rate_data: {
                        type: "fixed_amount" as const,
                        fixed_amount: { amount: priced.shipping, currency: "usd" },
                        display_name: "Standard shipping",
                      },
                    },
                  ]
                : [
                    {
                      shipping_rate_data: {
                        type: "fixed_amount" as const,
                        fixed_amount: { amount: 0, currency: "usd" },
                        display_name: "Free shipping",
                      },
                    },
                  ],
          }
        : {}),
      metadata: {
        customerName: c.name,
        address: priced.needsShipping ? `${c.address}, ${c.city} ${c.postal}, ${c.country}` : "",
        cart: JSON.stringify(lines).slice(0, 480),
      },
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] stripe error", err);
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 502 });
  }
}
