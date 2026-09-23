import Link from "next/link";
import { auth } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import User from "@/models/user";
import { readOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null; // middleware redirects before this renders

  await connectMongoose();
  const user = await User.findById(session.user.id, "-passwordHash").lean();
  const orders = await readOrders();

  const initials =
    (user?.name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="container">
      <header className="page-head profile-head">
        <div className="avatar" aria-hidden="true">
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize: "clamp(2rem, 1rem + 4vw, 3.5rem)" }}>{user?.name || "Your profile"}</h1>
        </div>
      </header>

      <div className="two-col">
        <section aria-labelledby="details-title">
          <h2 id="details-title">Your details</h2>
          <ProfileForm
            initial={{
              name: user?.name ?? "",
              email: user?.email ?? "",
              address: user?.address ?? "",
              city: user?.city ?? "",
              zipcode: user?.zipcode ?? "",
              phone: user?.phone ?? "",
            }}
          />
          <p className="muted small" style={{ marginTop: 24 }}>
            Your details and orders are saved to your account.
          </p>
        </section>

        <section aria-labelledby="orders-title">
          <h2 id="orders-title">Orders</h2>
          {orders.length === 0 ? (
            <>
              <p className="muted">No orders yet. When you buy something, it shows up here.</p>
              <Link href="/products" className="btn btn-ghost">
                Browse the shop
              </Link>
            </>
          ) : (
            <ul>
              {orders.map((o) => (
                <li key={o.id} className="order">
                  <div className="order-head">
                    <strong>{o.id}</strong>
                    <span>{formatPrice(o.total)}</span>
                  </div>
                  <p className="muted small" style={{ margin: "0 0 8px" }}>
                    {new Date(o.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </p>
                  <ul>
                    {o.items.map((i) => (
                      <li key={i.name}>
                        {i.name} &times; {i.qty}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
