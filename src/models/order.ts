// models/order.ts
import mongoose, { Schema, Model } from "mongoose";
import type { Order } from "@/lib/orders";

const OrderItemSchema = new Schema(
  { name: String, qty: Number, total: Number },
  { _id: false }
);

const OrderSchema = new Schema<Order & { userId?: string }>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true }, // ties order to a logged-in user
  email: { type: String, required: true },
  items: [OrderItemSchema],
  subtotal: Number,
  shipping: Number,
  total: Number,
  stripeSessionId: { type: String, index: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export default (mongoose.models.Order as Model<any>) ||
  mongoose.model("Order", OrderSchema);