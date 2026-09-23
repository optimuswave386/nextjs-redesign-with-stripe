import type { NextAuthConfig } from "next-auth";

// Kept separate from auth.ts on purpose: this file must stay free of anything
// Node-only (mongoose, bcryptjs, the mongodb driver) because middleware.ts runs
// this config in the Edge runtime. auth.ts imports this and adds the real
// Credentials provider on top for use in Node (API routes, server components).
const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // filled in by auth.ts
  callbacks: {
    authorized({ auth, request }) {
      const protectedRoutes = ["/profile", "/orders", "/account"];
      const isProtected = protectedRoutes.some((path) =>
        request.nextUrl.pathname.startsWith(path)
      );
      return isProtected ? Boolean(auth?.user) : true;
    },
    // Without these, session.user only ever gets {name, email, image} — the
    // `id` returned from authorize() never makes it onto the session, so every
    // DB call keyed on session.user.id (profile, orders) silently gets `undefined`.
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
