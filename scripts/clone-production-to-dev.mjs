import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PROD_URI = "mongodb+srv://SEO-OM-PRODUCT:admin1234@ecommerce-cluster.ddi9clk.mongodb.net/SEO-Om?appName=ecommerce-cluster";
const DEV_URI = "mongodb+srv://SEO-OM-PRODUCT:admin1234@ecommerce-cluster.ddi9clk.mongodb.net/SEO-Om-dev?appName=ecommerce-cluster";

async function cloneBaselineToDev() {
  console.log("=== CLONING BASELINE PRODUCTION DATA TO DEV DATABASE ===");

  // 1. Connect to PROD to read baseline data
  console.log("Connecting to PRODUCTION database (SEO-Om)...");
  const prodConn = await mongoose.createConnection(PROD_URI).asPromise();
  const prodDb = prodConn.db;

  const users = await prodDb.collection("Users").find({}).toArray();
  const categories = await prodDb.collection("categories").find({}).toArray();
  const locations = await prodDb.collection("locations").find({}).toArray();
  const contentitems = await prodDb.collection("contentitems").find({}).toArray();
  const seosettings = await prodDb.collection("seosettings").find({}).toArray();
  const seo_settings = await prodDb.collection("seo_settings").find({}).toArray();
  const seo_templates = await prodDb.collection("seo_templates").find({}).toArray();
  const mediaassets = await prodDb.collection("mediaassets").find({}).toArray();

  console.log(`Fetched from PROD:
- Users: ${users.length}
- Categories: ${categories.length}
- Locations: ${locations.length}
- ContentItems: ${contentitems.length}
- SeoSettings: ${seosettings.length + seo_settings.length}
- SeoTemplates: ${seo_templates.length}
- MediaAssets: ${mediaassets.length}
  `);

  await prodConn.close();

  // 2. Connect to DEV to set up sandbox
  console.log("Connecting to DEVELOPMENT database (SEO-Om-dev)...");
  const devConn = await mongoose.createConnection(DEV_URI).asPromise();
  const devDb = devConn.db;

  // Clear existing collections in dev
  const collections = ["Users", "categories", "locations", "contentitems", "seosettings", "seo_settings", "seo_templates", "mediaassets", "businesses", "businesssubmissions", "promotion_requests", "analytics_events", "rate_limit_entries"];
  for (const name of collections) {
    try {
      await devDb.collection(name).deleteMany({});
    } catch {
      // Collection might not exist yet
    }
  }

  // Insert baseline data
  if (users.length > 0) await devDb.collection("Users").insertMany(users);
  if (categories.length > 0) await devDb.collection("categories").insertMany(categories);
  if (locations.length > 0) await devDb.collection("locations").insertMany(locations);
  if (contentitems.length > 0) await devDb.collection("contentitems").insertMany(contentitems);
  if (seosettings.length > 0) await devDb.collection("seosettings").insertMany(seosettings);
  if (seo_settings.length > 0) await devDb.collection("seo_settings").insertMany(seo_settings);
  if (seo_templates.length > 0) await devDb.collection("seo_templates").insertMany(seo_templates);
  if (mediaassets.length > 0) await devDb.collection("mediaassets").insertMany(mediaassets);

  console.log("Successfully seeded baseline data into SEO-Om-dev!");

  const devCounts = {};
  for (const name of collections) {
    devCounts[name] = await devDb.collection(name).countDocuments();
  }
  console.log("DEV Database Summary:\n", JSON.stringify(devCounts, null, 2));

  await devConn.close();
  console.log("\nSetup complete! SEO-Om-dev is completely isolated from production SEO-Om.");
}

cloneBaselineToDev().catch((err) => {
  console.error("Cloning error:", err);
  process.exit(1);
});
