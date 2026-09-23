import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Edge-safe: built from auth.config.ts only, so no Node-only modules
// (mongoose, bcryptjs, mongodb) get pulled into the middleware bundle.
// This was the cause of the build/runtime errors — the old middleware.ts
// imported the full `auth` from auth.ts, which drags in the Credentials
// provider and its Node dependencies into the Edge runtime.
export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: ["/profile/:path*", "/orders/:path*", "/account/:path*"],
};
