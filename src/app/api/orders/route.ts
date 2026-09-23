import { NextResponse } from "next/server";
import { readOrders, saveOrder, findOrderBySession, type Order } from "@/lib/orders";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stripeSessionId = new URL(req.url).searchParams.get("stripeSessionId");
  if (stripeSessionId) {
    const order = await findOrderBySession(stripeSessionId);
    return NextResponse.json({ order });
  }

  const orders = await readOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const order = (await req.json()) as Order;
  const saved = await saveOrder(order);
  return NextResponse.json({ order: saved });
}
