import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PROD_URI = process.env.PROD_MONGODB_URI || process.env.MONGODB_URI;

async function wipeProductionContentItems() {
  console.log("=== WIPING CONTENT ITEMS FROM PRODUCTION (SEO-Om) ===");
  const conn = await mongoose.createConnection(PROD_URI).asPromise();
  const db = conn.db;

  const countBefore = await db.collection("contentitems").countDocuments();
  console.log(`Current contentitems in production SEO-Om: ${countBefore}`);

  const res = await db.collection("contentitems").deleteMany({});
  console.log(`Deleted ${res.deletedCount} documents from production contentitems collection.`);

  const countAfter = await db.collection("contentitems").countDocuments();
  console.log(`Remaining contentitems in production SEO-Om: ${countAfter}`);

  console.log("\n--- FULL PRODUCTION DATABASE AUDIT (SEO-Om) ---");
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count} document(s)`);
  }

  await conn.close();
  console.log("\nProduction content items wiped completely clean!");
}

wipeProductionContentItems().catch((err) => {
  console.error("Error wiping production content items:", err);
  process.exit(1);
});
