import type { Metadata } from "next";
import { ProductTile } from "@/components/ProductTile";
import { getProducts } from "@/lib/data";
import { formatPrice, type Product } from "@/lib/products";
import { FLAT_SHIPPING, FREE_SHIPPING_OVER } from "@/lib/pricing";

export const metadata: Metadata = { title: "Shop" };
export const revalidate = 60;

export default async function ProductsPage() {
  let products: Product[] | null = null;
  try {
    products = await getProducts();
  } catch (e) {
    console.error("[products]", e);
  }

  return (
    <div className="container">
      <header className="page-head">
        <h1>Shop</h1>
        <p>
          Prints, gear and digital tools. Shipping is {formatPrice(FLAT_SHIPPING)}, and free on physical orders
          over {formatPrice(FREE_SHIPPING_OVER)}. Digital items are delivered by email.
        </p>
      </header>
      {products === null ? (
        <div className="empty">
          <p>The shop couldn&rsquo;t load just now. Reload the page in a moment.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty">
          <p>Nothing is for sale right now. Check back soon.</p>
        </div>
      ) : (
        <ul className="product-grid" style={{ paddingBottom: "clamp(56px, 8vw, 112px)" }}>
          {products.map((p, i) => (
            <ProductTile key={p.id} product={p} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
