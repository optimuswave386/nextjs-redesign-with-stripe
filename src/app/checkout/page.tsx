"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/products";
import { priceCart } from "@/lib/pricing";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useCatalog } from "@/lib/useCatalog";

type Profile = {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  postal?: string;
  country?: string;
};

function Field({
  name,
  label,
  defaultValue,
  error,
  type = "text",
  autoComplete,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={`c-${name}`}>{label}</label>
      <input
        id={`c-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `c-${name}-err` : undefined}
      />
      {error && (
        <span id={`c-${name}-err`} className="error">
          {error}
        </span>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutForm />
    </Suspense>
  );
}

function CheckoutForm() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";
  const { lines, ready } = useCart();
  const [profile, , profileReady] = useLocalStorage<Profile>("profile-v1", {});
  const { products, error: catalogError } = useCatalog();
  const priced = useMemo(() => priceCart(lines, products ?? []), [lines, products]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(canceled ? "Checkout was canceled — your cart is still here." : "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const customer = Object.fromEntries(
      ["name", "email", "address", "city", "postal", "country"].map((k) => [k, String(fd.get(k) ?? "")]),
    );
    setBusy(true);
    setErrors({});
    setMessage("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines, customer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setMessage(data.error ?? "We couldn't place your order. Try again.");
        setBusy(false);
        return;
      }
      // The cart is only cleared once payment actually succeeds (see checkout/success),
      // so a canceled Stripe checkout leaves it intact.
      window.location.href = data.url as string;
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (catalogError) {
    return (
      <div className="container">
        <header className="page-head">
          <h1>Checkout</h1>
        </header>
        <div className="empty">
          <p>We couldn&rsquo;t load the shop. Check your connection and reload the page.</p>
        </div>
      </div>
    );
  }

  if (!ready || !profileReady || !products) {
    return (
      <div className="container">
        <header className="page-head">
          <h1>Checkout</h1>
        </header>
      </div>
    );
  }

  if (priced.lines.length === 0) {
    return (
      <div className="container">
        <header className="page-head">
          <h1>Checkout</h1>
        </header>
        <div className="empty">
          <p>There&rsquo;s nothing in your cart to check out.</p>
          <Link href="/products" className="btn">
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-head">
        <h1>Checkout</h1>
        <p>You&rsquo;ll pay on Stripe&rsquo;s secure checkout page, then come right back.</p>
      </header>
      <div className="commerce">
        <form onSubmit={onSubmit} noValidate id="checkout-form">
          <h2 style={{ fontSize: "1.6rem", marginBottom: 20 }}>Contact</h2>
          <div className="field-row">
            <Field name="name" label="Full name" defaultValue={profile.name} error={errors.name} autoComplete="name" />
            <Field name="email" label="Email" type="email" defaultValue={profile.email} error={errors.email} autoComplete="email" />
          </div>

          {priced.needsShipping ? (
            <>
              <h2 style={{ fontSize: "1.6rem", margin: "20px 0" }}>Shipping address</h2>
              <Field name="address" label="Street address" defaultValue={profile.address} error={errors.address} autoComplete="street-address" />
              <div className="field-row">
                <Field name="city" label="City" defaultValue={profile.city} error={errors.city} autoComplete="address-level2" />
                <Field name="postal" label="Postal code" defaultValue={profile.postal} error={errors.postal} autoComplete="postal-code" />
              </div>
              <Field name="country" label="Country" defaultValue={profile.country} error={errors.country} autoComplete="country-name" />
            </>
          ) : (
            <p className="muted">Everything in your cart is digital, so there&rsquo;s no shipping address to fill in.</p>
          )}
          <p className="form-status" role="alert">
            {message}
          </p>
        </form>

        <aside className="summary" aria-label="Order summary">
          <h2>Your order</h2>
          <ul style={{ marginBottom: 16 }}>
            {priced.lines.map(({ product, qty, total }) => (
              <li key={product.id} className="row">
                <span>
                  {product.name} <span className="muted">&times; {qty}</span>
                </span>
                <span>{formatPrice(total)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div className="row">
              <dt>Shipping</dt>
              <dd>{priced.needsShipping ? (priced.shipping ? formatPrice(priced.shipping) : "Free") : "Not needed"}</dd>
            </div>
            <div className="row total">
              <dt>Total</dt>
              <dd>{formatPrice(priced.total)}</dd>
            </div>
          </dl>
          <button type="submit" form="checkout-form" className="btn" disabled={busy}>
            {busy ? "Redirecting to payment…" : "Continue to payment"}
          </button>
          <p style={{ margin: "14px 0 0" }}>
            <Link href="/cart" className="muted small">
              Back to cart
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
