import mongoose from "mongoose";
import { SignJWT } from "jose";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const user = await db.collection("Users").findOne({ role: "admin", isActive: true });

const secret = new TextEncoder().encode(JWT_SECRET);
const token = await new SignJWT({ role: user.role, tokenVersion: user.tokenVersion })
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(user._id.toString())
  .setIssuer("local-discovery-platform")
  .setAudience("local-discovery-admin")
  .setIssuedAt()
  .setExpirationTime("3600s")
  .sign(secret);

const cookie = `admin_session=${token}`;

async function adminFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function publicFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

const testResults = [];
function report(section, name, passed, details = "") {
  testResults.push({ section, name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`[${icon}] ${section} > ${name}${details ? ` (${details})` : ""}`);
}

console.log("==========================================================");
console.log("   WORLD-CLASS QA & EDGE-CASE AUTOMATED TEST SUITE        ");
console.log("==========================================================");

// --- TEST SUITE 1: SUBMISSIONS LIFECYCLE & EDGE CASES ---
console.log("\n--- SUITE 1: Submissions Lifecycle & Edge Cases ---");

// Test 1.1: Public submission with minimal required fields only
const minSub = {
  businessName: `Minimal Shop ${Date.now().toString().slice(-4)}`,
  contactName: "Minimal Owner",
  email: `min.${Date.now()}@example.com`,
  phone: "+919800011111",
};
const subRes1 = await fetch(`${BASE_URL}/api/business-submissions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
  body: JSON.stringify(minSub),
});
const subData1 = await subRes1.json();
report("Submissions", "Create with minimal required fields", subRes1.status === 201, `ID: ${subData1.id}`);

// Test 1.2: Public submission with invalid email (should reject 400)
const badSub = { ...minSub, email: "invalid-email-format" };
const subResBad = await fetch(`${BASE_URL}/api/business-submissions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
  body: JSON.stringify(badSub),
});
report("Submissions", "Reject invalid email with HTTP 400", subResBad.status === 400);

// Test 1.3: Verify submission appears in Admin List
const listSubs = await adminFetch("/api/admin/submissions?limit=10");
const foundMin = listSubs.data.items?.find(s => s._id === subData1.id);
report("Submissions", "New submission visible in admin list", Boolean(foundMin));

// Test 1.4: Update submission internal notes
const noteRes = await adminFetch(`/api/admin/submissions/${subData1.id}`, {
  method: "PATCH",
  body: { adminNotes: "Called owner, confirmed shop hours." },
});
report("Submissions", "Save internal admin notes", noteRes.ok);

// Test 1.5: Convert minimal submission to Draft business listing
const cats = await db.collection("categories").find({ status: "active" }).toArray();
const locs = await db.collection("locations").find({ status: "active" }).toArray();

const convertRes = await adminFetch(`/api/admin/submissions/${subData1.id}`, {
  method: "POST",
  body: {
    category: cats[0]._id.toString(),
    location: locs[0]._id.toString(),
    businessType: "retail",
    description: "Sample description for minimal business.",
    publish: false, // DRAFT!
  },
});
report("Submissions", "Convert submission to Draft business", convertRes.ok && convertRes.data.business?.status === "draft");

// Test 1.6: Verify duplicate conversion is prevented (HTTP 409)
const dupConvertRes = await adminFetch(`/api/admin/submissions/${subData1.id}`, {
  method: "POST",
  body: {
    category: cats[0]._id.toString(),
    location: locs[0]._id.toString(),
    businessType: "retail",
    description: "Another conversion attempt.",
    publish: true,
  },
});
report("Submissions", "Prevent duplicate conversion (HTTP 409)", dupConvertRes.status === 409);

// Test 1.7: Verify submission document now has business ID and status approved
const verifySubDoc = await db.collection("businesssubmissions").findOne({ _id: new mongoose.Types.ObjectId(subData1.id) });
report("Submissions", "Submission document holds linked business ID", Boolean(verifySubDoc.business) && verifySubDoc.status === "approved");

// Cleanup test draft business & submission
if (convertRes.data.business?._id) {
  await db.collection("businesses").deleteOne({ _id: new mongoose.Types.ObjectId(convertRes.data.business._id) });
}
await db.collection("businesssubmissions").deleteOne({ _id: new mongoose.Types.ObjectId(subData1.id) });

// --- TEST SUITE 2: BUSINESS MANAGEMENT & STATUS REFLECTION ---
console.log("\n--- SUITE 2: Business Management & Status Reflection ---");

// Test 2.1: Create draft business
const testBizSlug = `qa-test-biz-${Date.now()}`;
const createBiz = await adminFetch("/api/admin/businesses", {
  method: "POST",
  body: {
    name: "QA Test Business For Verification",
    slug: testBizSlug,
    businessType: "restaurant",
    category: cats[0]._id.toString(),
    location: locs[0]._id.toString(),
    description: "Testing draft vs published visibility.",
    status: "draft",
  },
});
report("Businesses", "Create draft business in admin", createBiz.ok);
const createdBizId = createBiz.data.item?._id;

// Test 2.2: Ensure draft business is NOT visible on public API
const publicCheck1 = await publicFetch(`/api/businesses?limit=50`);
const isDraftInPublic = publicCheck1.data.items?.some(b => b.slug === testBizSlug);
report("Businesses", "Draft business is HIDDEN from public API", !isDraftInPublic);

// Test 2.3: Publish the business via PATCH
const publishBiz = await adminFetch(`/api/admin/businesses/${createdBizId}`, {
  method: "PATCH",
  body: { status: "published", publishedAt: new Date() },
});
report("Businesses", "Publish business via admin PATCH", publishBiz.ok && publishBiz.data.item?.status === "published");

// Test 2.4: Ensure published business IS visible on public API
const publicCheck2 = await publicFetch(`/api/businesses?limit=50`);
const isPublishedInPublic = publicCheck2.data.items?.some(b => b.slug === testBizSlug);
report("Businesses", "Published business is VISIBLE on public API", isPublishedInPublic);

// Test 2.5: Feature toggle on published business
const featureBiz = await adminFetch(`/api/admin/businesses/${createdBizId}`, {
  method: "PATCH",
  body: { isFeatured: true },
});
report("Businesses", "Toggle featured status to true", featureBiz.ok && featureBiz.data.item?.isFeatured === true);

// Test 2.6: Archive the business
const archiveBiz = await adminFetch(`/api/admin/businesses/${createdBizId}`, {
  method: "PATCH",
  body: { status: "archived" },
});
report("Businesses", "Archive business via admin PATCH", archiveBiz.ok && archiveBiz.data.item?.status === "archived");

// Test 2.7: Ensure archived business is HIDDEN from public API
const publicCheck3 = await publicFetch(`/api/businesses?limit=50`);
const isArchivedInPublic = publicCheck3.data.items?.some(b => b.slug === testBizSlug);
report("Businesses", "Archived business is HIDDEN from public API", !isArchivedInPublic);

// Test 2.8: Delete business
const deleteBiz = await adminFetch(`/api/admin/businesses/${createdBizId}`, { method: "DELETE" });
report("Businesses", "Delete business permanently", deleteBiz.ok);

// --- TEST SUITE 3: CATEGORIES & LOCATIONS VALIDATION ---
console.log("\n--- SUITE 3: Categories & Locations Validation ---");

// Test 3.1: Reject category with duplicate slug
const dupCatRes = await adminFetch("/api/admin/categories", {
  method: "POST",
  body: {
    name: "Duplicate Restaurants",
    slug: "restaurants", // already exists!
    status: "active",
  },
});
report("Categories", "Reject duplicate category slug with HTTP 409", dupCatRes.status === 409);

// Test 3.2: Reject town location without parent
const noParentTown = await adminFetch("/api/admin/locations", {
  method: "POST",
  body: {
    name: "Invalid Orphan Town",
    slug: `orphan-town-${Date.now()}`,
    type: "town",
    parent: null,
    status: "active",
  },
});
report("Locations", "Reject orphan town without parent (HTTP 400)", noParentTown.status === 400);

// Test 3.3: Accept region location without parent
const validRegion = await adminFetch("/api/admin/locations", {
  method: "POST",
  body: {
    name: `Valid Regional Belt ${Date.now()}`,
    slug: `valid-region-${Date.now()}`,
    type: "region",
    status: "active",
  },
});
report("Locations", "Accept top-level region without parent (HTTP 201)", validRegion.ok);
if (validRegion.data.item?._id) {
  await adminFetch(`/api/admin/locations/${validRegion.data.item._id}`, { method: "DELETE" });
}

// --- TEST SUITE 4: PUBLIC DETAIL PAGES HEALTH ---
console.log("\n--- SUITE 4: Public Detail Pages Health ---");

// Test 4.1: Public Business Detail
const bizSlug = "hotel-kalinga-family-dhaba";
const bizPageRes = await fetch(`${BASE_URL}/businesses/${bizSlug}`, { cache: "no-store" });
report("Public Pages", `/businesses/${bizSlug} renders HTTP 200`, bizPageRes.status === 200);

// Test 4.2: Public Category Detail
const catSlug = "family-dhabas";
const catPageRes = await fetch(`${BASE_URL}/categories/${catSlug}`, { cache: "no-store" });
report("Public Pages", `/categories/${catSlug} renders HTTP 200`, catPageRes.status === 200);

// Test 4.3: Public Location Detail
const locSlug = "ghoti";
const locPageRes = await fetch(`${BASE_URL}/locations/${locSlug}`, { cache: "no-store" });
report("Public Pages", `/locations/${locSlug} renders HTTP 200`, locPageRes.status === 200);

// Test 4.4: Public Guides List & Detail
const guideSlug = "highway-food-trail-ghoti-igatpuri";
const guidePageRes = await fetch(`${BASE_URL}/guides/${guideSlug}`, { cache: "no-store" });
report("Public Pages", `/guides/${guideSlug} renders HTTP 200`, guidePageRes.status === 200);

// Test 4.5: Public Places List & Detail
const placeRes = await fetch(`${BASE_URL}/places/bhavali-dam-waterfalls`, { cache: "no-store" });
report("Public Pages", "/places/bhavali-dam-waterfalls renders HTTP 200", placeRes.status === 200);

// Test 4.6: Public Events List & Detail
const eventRes = await fetch(`${BASE_URL}/events/ghoti-weekly-farmer-bazaar`, { cache: "no-store" });
report("Public Pages", "/events/ghoti-weekly-farmer-bazaar renders HTTP 200", eventRes.status === 200);

// Test 4.7: Public Add Business Form
const addBizRes = await fetch(`${BASE_URL}/add-business`, { cache: "no-store" });
report("Public Pages", `/add-business renders HTTP 200`, addBizRes.status === 200);

// Summary
const totalTests = testResults.length;
const passedTests = testResults.filter(t => t.passed).length;
const failedTests = testResults.filter(t => !t.passed);

console.log("\n==========================================================");
console.log(`TEST EXECUTION SUMMARY: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
if (failedTests.length > 0) {
  console.log("Failed tests:");
  failedTests.forEach(f => console.log(`- [${f.section}] ${f.name}: ${f.details}`));
} else {
  console.log("ALL TESTS COMPLETED WITH ZERO DEFECTS!");
}
console.log("==========================================================");

process.exit(failedTests.length > 0 ? 1 : 0);
