"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readOrders, saveOrder, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { useCart } from "@/components/CartProvider";

type Status = "loading" | "ok" | "error";

export function OrderSummary({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const { clear } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("We couldn't find that order.");
      return;
    }
    // Already confirmed this session in this browser (e.g. a page refresh) — just read it back.
    const existing = readOrders().find((o) => o.stripeSessionId === sessionId);
    if (existing) {
      setOrder(existing);
      setStatus("ok");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not confirm the order.");
        const confirmed: Order = { ...data.order, stripeSessionId: sessionId };
        if (cancelled) return;
        saveOrder(confirmed);
        if (!cleared.current) {
          cleared.current = true;
          clear();
        }
        setOrder(confirmed);
        setStatus("ok");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not confirm the order.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="empty">
        <p>Confirming your payment&hellip;</p>
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className="empty">
        <p>{error || "We couldn't find that order."}</p>
        <Link href="/products" className="btn">
          Back to the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="empty">
      <p>
        Order <strong>{order.id}</strong> is confirmed. A receipt is on its way to {order.email}.
      </p>
      <ul style={{ margin: "0 0 24px", maxWidth: 480 }}>
        {order.items.map((i) => (
          <li key={i.name} className="order-head" style={{ marginBottom: 4 }}>
            <span>
              {i.name} <span className="muted">&times; {i.qty}</span>
            </span>
            <span>{formatPrice(i.total)}</span>
          </li>
        ))}
        <li className="order-head" style={{ marginTop: 12, fontWeight: 700 }}>
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </li>
      </ul>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/profile" className="btn">
          View your orders
        </Link>
        <Link href="/products" className="btn btn-ghost">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
