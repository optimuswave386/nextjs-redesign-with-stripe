"use client";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";

export function AddToCart({ id, name }: { id: string; name: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <>
      <button
        type="button"
        className="btn btn-sm"
        aria-label={`Add ${name} to cart`}
        onClick={() => {
          add(id);
          setAdded(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 1800);
        }}
      >
        {added ? "Added" : "Add to cart"}
      </button>
      <span className="sr-only" role="status">
        {added ? `${name} added to your cart` : ""}
      </span>
    </>
  );
}
