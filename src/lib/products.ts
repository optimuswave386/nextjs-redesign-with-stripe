import seed from "../../data/products.json";

// Prices are in cents.
export type Product = {
  id: string;
  name: string;
  blurb: string;
  price: number;
  kind: "print" | "digital" | "goods";
  imgUrl: string;
};

export const PRODUCT_KINDS: Product["kind"][] = ["print", "digital", "goods"];

// Used when MONGODB_URI isn't set, and as the source for `npm run seed`.
export const fallbackProducts = seed as Product[];

export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
