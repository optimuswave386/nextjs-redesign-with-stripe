import "server-only";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

export const hasDb = Boolean(uri);

declare global {
  // Reused across hot reloads and serverless invocations so we don't open a new connection per request.
  // eslint-disable-next-line no-var
  var _mongoClient: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const promise = new MongoClient(uri as string, { serverSelectionTimeoutMS: 5000 }).connect();
  // Don't cache a failed connection forever.
  promise.catch(() => {
    globalThis._mongoClient = undefined;
  });
  return promise;
}

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  globalThis._mongoClient ??= connect();
  return (await globalThis._mongoClient).db(process.env.MONGODB_DB || "site");
}
