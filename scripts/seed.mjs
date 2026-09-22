// Loads the sample projects and products from /data into MongoDB.
// Safe to re-run: documents that already exist are left untouched.
//   npm run seed
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Add it to .env.local first.");
  process.exit(1);
}

const read = (file) => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8"));
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "site");

  for (const [collection, file, key] of [
    ["projects", "projects.json", "slug"],
    ["products", "products.json", "id"],
  ]) {
    const docs = read(file);
    const result = await db.collection(collection).bulkWrite(
      docs.map((doc, order) => ({
        updateOne: {
          filter: { [key]: doc[key] },
          update: { $setOnInsert: { ...doc, order } },
          upsert: true,
        },
      })),
    );
    console.log(`${collection}: ${result.upsertedCount} added, ${docs.length - result.upsertedCount} already there`);
  }
} finally {
  await client.close();
}
