export type Order = {
  id: string;
  createdAt: string;
  items: { name: string; qty: number; total: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  email: string;
  // Present for orders paid through Stripe; used to avoid re-confirming the same
  // session twice (e.g. on a page refresh of the success page).
  stripeSessionId?: string;
};

const KEY = "orders-v1";

export function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  try {
    const rest = readOrders().filter((o) => o.id !== order.id);
    localStorage.setItem(KEY, JSON.stringify([order, ...rest].slice(0, 50)));
  } catch {
    /* storage unavailable: the order page still works from the URL */
  }
}
