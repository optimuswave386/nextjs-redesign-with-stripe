import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import User from "@/models/user";
import { auth } from "@/auth";

const EDITABLE_FIELDS = ["name", "address", "city", "zipcode", "phone"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectMongoose();
  const user = await User.findById(session.user.id, "-passwordHash").lean();
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, string> = {};
  for (const field of EDITABLE_FIELDS) {
    if (typeof body[field] === "string") updates[field] = body[field].trim();
  }

  await connectMongoose();
  const user = await User.findByIdAndUpdate(session.user.id, updates, {
    new: true,
    projection: "-passwordHash",
  }).lean();

  return NextResponse.json({ user });
}
