import mongoose from "mongoose";
import { SignJWT } from "jose";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const usersColl = db.collection("Users");
const adminUser = await usersColl.findOne({ role: "admin", isActive: true });

const secret = new TextEncoder().encode(JWT_SECRET);
const adminToken = await new SignJWT({
  role: adminUser.role,
  tokenVersion: adminUser.tokenVersion,
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(adminUser._id.toString())
  .setIssuer("local-discovery-platform")
  .setAudience("local-discovery-admin")
  .setIssuedAt()
  .setExpirationTime("3600s")
  .sign(secret);

const cookieHeader = `admin_session=${adminToken}`;

async function testPage(urlPath, isAdmin = false) {
  const url = `${BASE_URL}${urlPath}`;
  try {
    const res = await fetch(url, {
      headers: isAdmin ? { Cookie: cookieHeader } : {},
      cache: "no-store",
    });
    const text = await res.text();
    const is500 = res.status >= 500;
    const hasNextError = text.includes("Application error") || text.includes("Internal Server Error") || text.includes("Unhandled Runtime Error");
    return {
      path: urlPath,
      status: res.status,
      ok: res.ok,
      hasError: is500 || hasNextError,
      snippet: hasNextError ? text.slice(0, 300) : "",
    };
  } catch (err) {
    return {
      path: urlPath,
      status: 0,
      ok: false,
      hasError: true,
      snippet: err.message,
    };
  }
}

console.log("=== COMPREHENSIVE PAGE & API AUDIT ===");

const adminPages = [
  "/admin/dashboard",
  "/admin/businesses",
  "/admin/categories",
  "/admin/locations",
  "/admin/seo",
  "/admin/places",
  "/admin/guides",
  "/admin/events",
  "/admin/media",
  "/admin/submissions",
  "/admin/seo-templates",
];

console.log("\n--- TESTING ADMIN PAGES (with auth) ---");
const pageResults = [];
for (const p of adminPages) {
  const res = await testPage(p, true);
  console.log(`[${res.status}] ${p} ${res.hasError ? "❌ ERROR" : "✅ OK"}`);
  pageResults.push(res);
}

const publicPages = [
  "/",
  "/businesses",
  "/businesses/hotel-kalinga-family-dhaba",
  "/categories",
  "/categories/restaurants",
  "/categories/family-dhabas",
  "/locations",
  "/locations/ghoti",
  "/locations/igatpuri",
  "/places",
  "/guides",
  "/events",
  "/about",
  "/submit-business",
];

console.log("\n--- TESTING PUBLIC PAGES ---");
for (const p of publicPages) {
  const res = await testPage(p, false);
  console.log(`[${res.status}] ${p} ${res.hasError ? "❌ ERROR" : "✅ OK"}`);
  pageResults.push(res);
}

const failed = pageResults.filter(r => r.hasError || !r.ok);
console.log(`\nAudit completed: ${pageResults.length} pages tested. ${failed.length} failed.`);
if (failed.length > 0) {
  console.log("\nFailed pages summary:");
  failed.forEach(f => console.log(`- ${f.path}: HTTP ${f.status} -> ${f.snippet}`));
}

process.exit(failed.length > 0 ? 1 : 0);
