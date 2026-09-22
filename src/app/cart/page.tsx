"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { ProductArt } from "@/components/ProductArt";
import { formatPrice } from "@/lib/products";
import { useCatalog } from "@/lib/useCatalog";
import { FREE_SHIPPING_OVER, priceCart } from "@/lib/pricing";

export default function CartPage() {
  const { lines, ready, setQty, remove } = useCart();
  const { products, error } = useCatalog();
  const [removed, setRemoved] = useState(0);
  const priced = useMemo(() => priceCart(lines, products ?? []), [lines, products]);

  // Drop anything that's no longer sold, and say so.
  useEffect(() => {
    if (!products || !ready) return;
    const known = new Set(products.map((p) => p.id));
    const gone = lines.filter((l) => !known.has(l.id));
    if (gone.length) {
      gone.forEach((l) => remove(l.id));
      setRemoved((n) => n + gone.length);
    }
  }, [products, ready, lines, remove]);

  return (
    <div className="container">
      <header className="page-head">
        <h1>Your cart</h1>
      </header>

      {removed > 0 && (
        <p className="muted" role="status">
          {removed === 1 ? "An item that's no longer for sale was" : "Some items that are no longer for sale were"}{" "}
          removed from your cart.
        </p>
      )}

      {error ? (
        <div className="empty">
          <p>We couldn&rsquo;t load your cart details. Check your connection and reload the page.</p>
        </div>
      ) : !ready || !products ? null : priced.lines.length === 0 ? (
        <div className="empty">
          <p>Your cart is empty.</p>
          <Link href="/products" className="btn">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="commerce">
          <ul>
            {priced.lines.map(({ product, qty, total }) => (
              <li key={product.id} className="cart-line">
                <ProductArt index={products.findIndex((p) => p.id === product.id)} kind={product.kind} imgUrl={product.imgUrl} />
                <div>
                  <h3>{product.name}</h3>
                  <p className="muted small" style={{ margin: 0 }}>
                    {formatPrice(product.price)} each
                  </p>
                  <div className="cart-actions">
                    <div className="stepper">
                      <button type="button" aria-label={`Decrease quantity of ${product.name}`} onClick={() => setQty(product.id, qty - 1)}>
                        &minus;
                      </button>
                      <output aria-live="polite">{qty}</output>
                      <button type="button" aria-label={`Increase quantity of ${product.name}`} onClick={() => setQty(product.id, qty + 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="text-btn" onClick={() => remove(product.id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <span className="price">{formatPrice(total)}</span>
              </li>
            ))}
          </ul>

          <aside className="summary" aria-label="Order summary">
            <h2>Summary</h2>
            <dl>
              <div className="row">
                <dt>Subtotal</dt>
                <dd>{formatPrice(priced.subtotal)}</dd>
              </div>
              <div className="row">
                <dt>Shipping</dt>
                <dd>{priced.needsShipping ? (priced.shipping ? formatPrice(priced.shipping) : "Free") : "Not needed"}</dd>
              </div>
              <div className="row total">
                <dt>Total</dt>
                <dd>{formatPrice(priced.total)}</dd>
              </div>
            </dl>
            {priced.needsShipping && priced.shipping > 0 && (
              <p className="muted small">
                Add {formatPrice(FREE_SHIPPING_OVER - priced.subtotal)} more for free shipping.
              </p>
            )}
            <Link href="/checkout" className="btn">
              Go to checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
