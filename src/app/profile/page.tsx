"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { readOrders, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Profile = {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  postal?: string;
  country?: string;
};

const FIELDS: { name: keyof Profile; label: string; type?: string; autoComplete: string }[] = [
  { name: "name", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "address", label: "Street address", autoComplete: "street-address" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "postal", label: "Postal code", autoComplete: "postal-code" },
  { name: "country", label: "Country", autoComplete: "country-name" },
];

export default function ProfilePage() {
  const [profile, setProfile, ready] = useLocalStorage<Profile>("profile-v1", {});
  const [orders, setOrders] = useState<Order[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => setOrders(readOrders()), []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setProfile(Object.fromEntries(FIELDS.map((f) => [f.name, String(fd.get(f.name) ?? "").trim()])));
    setSaved(true);
  }

  const initials =
    (profile.name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="container">
      <header className="page-head profile-head">
        <div className="avatar" aria-hidden="true">
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize: "clamp(2rem, 1rem + 4vw, 3.5rem)" }}>{profile.name || "Your profile"}</h1>
        </div>
      </header>

      <div className="two-col">
        <section aria-labelledby="details-title">
          <h2 id="details-title">Your details</h2>
          {ready && (
            <form onSubmit={onSubmit} onChange={() => setSaved(false)}>
              {FIELDS.map((f) => (
                <div className="field" key={f.name}>
                  <label htmlFor={`p-${f.name}`}>{f.label}</label>
                  <input
                    id={`p-${f.name}`}
                    name={f.name}
                    type={f.type ?? "text"}
                    autoComplete={f.autoComplete}
                    defaultValue={profile[f.name] ?? ""}
                  />
                </div>
              ))}
              <button type="submit" className="btn">
                Save details
              </button>
              <p className="form-status" role="status">
                {saved ? "Saved. Checkout and the help form will use these details." : ""}
              </p>
            </form>
          )}
          <p className="muted small" style={{ marginTop: 24 }}>
            Details and orders are stored in this browser only.
          </p>
        </section>

        <section aria-labelledby="orders-title">
          <h2 id="orders-title">Orders</h2>
          {orders.length === 0 ? (
            <>
              <p className="muted">No orders yet. When you buy something, it shows up here.</p>
              <Link href="/products" className="btn btn-ghost">
                Browse the shop
              </Link>
            </>
          ) : (
            <ul>
              {orders.map((o) => (
                <li key={o.id} className="order">
                  <div className="order-head">
                    <strong>{o.id}</strong>
                    <span>{formatPrice(o.total)}</span>
                  </div>
                  <p className="muted small" style={{ margin: "0 0 8px" }}>
                    {new Date(o.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </p>
                  <ul>
                    {o.items.map((i) => (
                      <li key={i.name}>
                        {i.name} &times; {i.qty}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
