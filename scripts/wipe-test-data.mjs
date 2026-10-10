import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

async function wipeTestData() {
  console.log("=== GAAVCONNECT PRODUCTION DATABASE PURGE & CLEANUP ===");
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Check Admin User
  const adminUser = await db.collection("Users").findOne({ role: "admin" });
  if (!adminUser) {
    console.error("CRITICAL: No admin user found in database! Aborting to prevent lockout.");
    process.exit(1);
  }
  console.log(`[PRESERVED] Admin user: ${adminUser.name} (${adminUser.email})`);

  // 2. Wipe fake/test businesses
  const bizCountBefore = await db.collection("businesses").countDocuments();
  const resBiz = await db.collection("businesses").deleteMany({});
  console.log(`[WIPED] Businesses collection: deleted ${resBiz.deletedCount} documents (was ${bizCountBefore}).`);

  // 3. Wipe business submissions
  const subCountBefore = await db.collection("businesssubmissions").countDocuments();
  const resSub = await db.collection("businesssubmissions").deleteMany({});
  console.log(`[WIPED] BusinessSubmissions collection: deleted ${resSub.deletedCount} documents (was ${subCountBefore}).`);

  // 4. Wipe promotion requests
  const promoCountBefore = await db.collection("promotion_requests").countDocuments();
  const resPromo = await db.collection("promotion_requests").deleteMany({});
  console.log(`[WIPED] PromotionRequests collection: deleted ${resPromo.deletedCount} documents (was ${promoCountBefore}).`);

  // 5. Wipe analytics events
  const analyticsCountBefore = await db.collection("analytics_events").countDocuments();
  const resAnalytics = await db.collection("analytics_events").deleteMany({});
  console.log(`[WIPED] AnalyticsEvents collection: deleted ${resAnalytics.deletedCount} documents (was ${analyticsCountBefore}).`);

  // 6. Wipe rate limit entries
  const rateLimitCountBefore = await db.collection("rate_limit_entries").countDocuments();
  const resRateLimit = await db.collection("rate_limit_entries").deleteMany({});
  console.log(`[WIPED] RateLimitEntries collection: deleted ${resRateLimit.deletedCount} documents (was ${rateLimitCountBefore}).`);

  // 7. Clean test locations (preserve authentic Nashik locations)
  const resLocClean = await db.collection("locations").deleteMany({
    slug: { $regex: /^(temp-|valid-region-|test-loc-)/i },
  });
  console.log(`[CLEANED] Deleted ${resLocClean.deletedCount} test locations from locations collection.`);

  // 8. Clean test categories (preserve authentic categories)
  const resCatClean = await db.collection("categories").deleteMany({
    slug: { $regex: /^(temp-cat-|test-service-)/i },
  });
  console.log(`[CLEANED] Deleted ${resCatClean.deletedCount} test categories from categories collection.`);

  // 9. Clean test content items (preserve authentic guides/places/events)
  const resContentClean = await db.collection("contentitems").deleteMany({
    slug: { $regex: /^guide-nashik-food-trail-\d+/i },
  });
  console.log(`[CLEANED] Deleted ${resContentClean.deletedCount} test content items.`);

  // 10. Summary verification
  console.log("\n--- POST-CLEANUP DATABASE AUDIT ---");
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count} document(s)`);
  }

  console.log("\n--- AUTHENTIC LOCATIONS IN DATABASE ---");
  const locs = await db.collection("locations").find({ status: "active" }).toArray();
  for (const l of locs) {
    console.log(`  • [${l.slug}] ${l.name} (${l.marathiName || "No Marathi"}): ${l.tagline || "No Tagline"} (featuredOnAbout: ${l.featuredOnAbout})`);
  }

  console.log("\n--- AUTHENTIC CATEGORIES IN DATABASE ---");
  const cats = await db.collection("categories").find({ status: "active" }).toArray();
  for (const c of cats) {
    console.log(`  • [${c.slug}] ${c.name}`);
  }

  console.log("\n--- AUTHENTIC CONTENT ITEMS IN DATABASE ---");
  const items = await db.collection("contentitems").find({ status: "published" }).toArray();
  for (const it of items) {
    console.log(`  • [${it.kind}] ${it.title} (/${it.slug})`);
  }

  console.log("\nDATABASE IS CLEAN AND READY FOR PRODUCTION DEPLOYMENT!");
  await mongoose.disconnect();
}

wipeTestData().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
