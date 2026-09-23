import "server-only";
import { connectMongoose } from "@/lib/mongoose";
import OrderModel from "@/models/order";
import { auth } from "@/auth";

export type Order = {
  id: string;
  createdAt: string;
  items: { name: string; qty: number; total: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  email: string;
  userId?: string;
  // Present for orders paid through Stripe; used to avoid re-confirming the same
  // session twice (e.g. on a page refresh of the success page).
  stripeSessionId?: string;
};

export async function readOrders(): Promise<Order[]> {
  const session = await auth();
  if (!session?.user) return [];

  await connectMongoose();
  const docs = await OrderModel.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return docs.map(({ _id, __v, ...rest }) => rest) as unknown as Order[];
}

export async function findOrderBySession(stripeSessionId: string): Promise<Order | null> {
  const session = await auth();
  if (!session?.user) return null;

  await connectMongoose();
  const doc = await OrderModel.findOne({
    userId: session.user.id,
    stripeSessionId,
  }).lean();
  if (!doc) return null;

  const { _id, __v, ...rest } = doc as any;
  return rest as Order;
}

export async function saveOrder(order: Order): Promise<Order> {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await connectMongoose();

  // Dedup: avoid re-saving the same Stripe session twice on refresh.
  if (order.stripeSessionId) {
    const existing = await OrderModel.findOne({
      userId: session.user.id,
      stripeSessionId: order.stripeSessionId,
    }).lean();
    if (existing) {
      const { _id, __v, ...rest } = existing as any;
      return rest as Order;
    }
  }

  const saved = await OrderModel.findOneAndUpdate(
    { id: order.id, userId: session.user.id },
    { ...order, userId: session.user.id },
    { upsert: true, new: true }
  ).lean();

  const { _id, __v, ...rest } = saved as any;
  return rest as Order;
}
