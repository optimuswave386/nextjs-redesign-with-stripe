import seed from "../../data/products.json";

// Prices are in cents.
export type Product = {
  id: string;
  name: string;
  blurb: string;
  price: number;
  kind: "print" | "digital" | "goods";
  imgUrl: string;
  tax_code: "txcd_99999999" | "txcd_10000000" | "txcd_10103000";
};

// Needed for stripe managed payments for tax purposes
// txcd_99999999 — General - Tangible Goods, 
// txcd_10000000 — General - Services, 
// txcd_10103000 — Digital goods
export const TAX_CODES: Product["tax_code"][] = ["txcd_99999999", "txcd_10000000", "txcd_10103000"];

export const PRODUCT_KINDS: Product["kind"][] = ["print", "digital", "goods"];

// Used when MONGODB_URI isn't set, and as the source for `npm run seed`.
export const fallbackProducts = seed as Product[];

export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
