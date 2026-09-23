import "server-only";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

declare global {
  // Reused across hot reloads and serverless invocations so we don't open a new
  // connection per request/authorize() call.
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectMongoose(): Promise<typeof mongoose> {
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (!globalThis._mongooseConn) {
    globalThis._mongooseConn = mongoose
      .connect(uri, { dbName: process.env.MONGODB_DB || "site" })
      .catch((err) => {
        // Don't cache a failed connection forever.
        globalThis._mongooseConn = undefined;
        throw err;
      });
  }

  return globalThis._mongooseConn;
}
