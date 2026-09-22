import type { Product } from "./products";

export type CartLine = { id: string; qty: number };
export type PricedLine = { product: Product; qty: number; total: number };

export const FREE_SHIPPING_OVER = 7500; // cents
export const FLAT_SHIPPING = 500; // cents

// Shared by the browser (to show totals) and the server (to decide what to charge).
// Always pass the catalogue that came from the database: unknown ids are dropped.
export function priceCart(lines: CartLine[], catalogue: Product[]) {
  const byId = new Map(catalogue.map((p) => [p.id, p]));
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const product = byId.get(line.id);
    if (!product || !Number.isInteger(line.qty) || line.qty < 1) continue;
    priced.push({ product, qty: line.qty, total: product.price * line.qty });
  }
  const subtotal = priced.reduce((sum, l) => sum + l.total, 0);
  const needsShipping = priced.some((l) => l.product.kind !== "digital");
  const shipping = !needsShipping || subtotal >= FREE_SHIPPING_OVER ? 0 : FLAT_SHIPPING;
  return { lines: priced, subtotal, shipping, total: subtotal + shipping, needsShipping };
}
