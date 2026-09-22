"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { CartLine } from "@/lib/pricing";

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const MAX_QTY = 20;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines, ready] = useLocalStorage<CartLine[]>("cart-v1", []);

  const add = useCallback(
    (id: string, qty = 1) =>
      setLines((prev) => {
        const existing = prev.find((l) => l.id === id);
        if (!existing) return [...prev, { id, qty }];
        return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      }),
    [setLines],
  );

  const setQty = useCallback(
    (id: string, qty: number) =>
      setLines((prev) =>
        qty < 1
          ? prev.filter((l) => l.id !== id)
          : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
      ),
    [setLines],
  );

  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), [setLines]);
  const clear = useCallback(() => setLines([]), [setLines]);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);

  const value = useMemo(
    () => ({ lines, ready, count, add, setQty, remove, clear }),
    [lines, ready, count, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
