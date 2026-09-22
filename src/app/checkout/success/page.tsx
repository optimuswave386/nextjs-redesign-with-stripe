import type { Metadata } from "next";
import { OrderSummary } from "./OrderSummary";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <div className="container">
      <header className="page-head">
        <h1>Thank you</h1>
      </header>
      <OrderSummary sessionId={session_id ?? ""} />
    </div>
  );
}
