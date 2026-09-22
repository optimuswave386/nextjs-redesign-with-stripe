"use client";
import { useEffect, useState } from "react";
import type { Product } from "./products";

let cached: Promise<Product[]> | null = null;

function load() {
  cached ??= fetch("/api/products")
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<{ products: Product[] }>;
    })
    .then((d) => d.products)
    .catch((e) => {
      cached = null; // let the next visit try again
      throw e;
    });
  return cached;
}

// The product list for the cart and checkout pages, fetched once per visit.
export function useCatalog() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    load()
      .then((p) => live && setProducts(p))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);
  return { products, error };
}
