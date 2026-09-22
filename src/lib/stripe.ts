import "server-only";
import Stripe from "stripe";

let client: Stripe | null | undefined;

// Lazily built so the app can still boot (and the demo catalogue/pages still work)
// without a Stripe key set; only the checkout route needs it.
export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Get a test key from https://dashboard.stripe.com/test/apikeys and add it to .env.local.",
    );
  }
  client = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  return client;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
