import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoose } from "@/lib/mongoose";
import User from "@/models/user";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  await connectMongoose();

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: String(email).toLowerCase(), passwordHash, name });

  return NextResponse.json({ id: user._id.toString(), email: user.email });
}
