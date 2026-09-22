import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { sendOrderReceiptEmail } from "@/lib/mailer";

// Point a Stripe webhook (dashboard or `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
// at this route for the `checkout.session.completed` event. It verifies the signature against
// STRIPE_WEBHOOK_SECRET, then emails the customer a receipt via nodemailer.
//
// This is the reliable place to react to a completed payment: it fires even if the
// customer's browser never makes it back to /checkout/success (closed tab, flaky network).

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const payload = await req.text(); // raw body — required for signature verification
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    console.error("[webhooks/stripe] bad signature", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const full = await getStripe().checkout.sessions.retrieve(session.id, { expand: ["line_items"] });
      const email = full.customer_details?.email ?? full.customer_email;
      if (email && full.payment_status === "paid") {
        await sendOrderReceiptEmail({
          id: full.id.replace(/^cs_(test_)?/, "ORD-").slice(0, 24).toUpperCase(),
          email,
          items: (full.line_items?.data ?? []).map((li) => ({
            name: li.description ?? "Item",
            qty: li.quantity ?? 1,
            total: li.amount_total ?? 0,
          })),
          subtotal: full.amount_subtotal ?? 0,
          shipping: full.shipping_cost?.amount_total ?? 0,
          total: full.amount_total ?? 0,
        });
      }
    } catch (err) {
      // Don't fail the webhook over an email hiccup — Stripe will retry on non-2xx,
      // which would just resend the same event without fixing an email-provider issue.
      console.error("[webhooks/stripe] receipt email failed", err);
    }
  }

  return NextResponse.json({ received: true });
}
