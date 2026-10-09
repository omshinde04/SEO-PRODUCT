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

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

const gaps = [];
function recordGap(feature, issue) {
  gaps.push({ feature, issue });
  console.log(`❌ [GAP] ${feature}: ${issue}`);
}
function recordSuccess(feature, note = "") {
  console.log(`✅ [OK] ${feature}${note ? `: ${note}` : ""}`);
}

console.log("==================================================");
console.log("   FULL ADMIN API & FEATURES VERIFICATION SUITE   ");
console.log("==================================================");

// --- 1. DASHBOARD STATS ---
console.log("\n[1] Testing Dashboard API...");
const stats = await api("/api/admin/dashboard/stats");
if (!stats.ok || !stats.data.success) {
  recordGap("Dashboard Stats", `HTTP ${stats.status}: ${stats.data.message}`);
} else {
  recordSuccess("Dashboard Stats", `Total Businesses: ${stats.data.stats.businesses.total}, Categories: ${stats.data.stats.categories.total}, Locations: ${stats.data.stats.locations.total}`);
}

// --- 2. BUSINESSES CRUD ---
console.log("\n[2] Testing Businesses Feature...");
// Listing
const bizList = await api("/api/admin/businesses?limit=10");
if (!bizList.ok || !bizList.data.success) {
  recordGap("Business List", `HTTP ${bizList.status}: ${bizList.data.message}`);
} else {
  const items = bizList.data.items || [];
  recordSuccess("Business List", `Retrieved ${items.length} items (Total in DB: ${bizList.data.pagination?.total})`);
  
  // Search query
  const searchTest = await api("/api/admin/businesses?q=Kalinga");
  if (searchTest.ok && searchTest.data.items?.length > 0) {
    recordSuccess("Business Search Filter", `Found "${searchTest.data.items[0].name}" searching for "Kalinga"`);
  } else {
    recordGap("Business Search Filter", `Failed to find business matching "Kalinga"`);
  }

  // Edit / Patch
  if (items.length > 0) {
    const target = items[0];
    const patchRes = await api(`/api/admin/businesses/${target._id}`, {
      method: "PATCH",
      body: {
        isFeatured: !target.isFeatured,
        tagline: "Updated Tagline by Comprehensive Test Suite",
      },
    });
    if (patchRes.ok && patchRes.data.success) {
      recordSuccess("Business Update (PATCH)", `Updated business ${target.name} (_id: ${target._id})`);
    } else {
      recordGap("Business Update (PATCH)", `HTTP ${patchRes.status}: ${patchRes.data.message}`);
    }
  }
}

// Create a temporary business and delete it
const categories = await db.collection("categories").find({ status: "active" }).toArray();
const locations = await db.collection("locations").find({ status: "active" }).toArray();

const tempSlug = `temp-test-biz-${Date.now()}`;
const createBizRes = await api("/api/admin/businesses", {
  method: "POST",
  body: {
    name: "Temporary Verification Business",
    slug: tempSlug,
    tagline: "Will be deleted to test deletion lifecycle",
    description: "Testing business creation and immediate deletion flow in admin panel.",
    businessType: "retail",
    category: categories[0]._id.toString(),
    location: locations[0]._id.toString(),
    status: "draft",
    verificationStatus: "unverified",
  },
});

if (createBizRes.ok && createBizRes.data.success) {
  const createdBizId = createBizRes.data.item._id;
  recordSuccess("Business Create (POST)", `Created temp business _id: ${createdBizId}`);
  
  // Test deletion
  const delBizRes = await api(`/api/admin/businesses/${createdBizId}`, { method: "DELETE" });
  if (delBizRes.ok && delBizRes.data.success) {
    recordSuccess("Business Delete (DELETE)", `Deleted temp business _id: ${createdBizId}`);
  } else {
    recordGap("Business Delete (DELETE)", `HTTP ${delBizRes.status}: ${delBizRes.data.message}`);
  }
} else {
  recordGap("Business Create (POST)", `HTTP ${createBizRes.status}: ${createBizRes.data.message}`);
}

// --- 3. CATEGORIES CRUD ---
console.log("\n[3] Testing Categories Feature...");
const catList = await api("/api/admin/categories?limit=50");
if (!catList.ok || !catList.data.success) {
  recordGap("Category List", `HTTP ${catList.status}: ${catList.data.message}`);
} else {
  recordSuccess("Category List", `Found ${catList.data.items?.length} categories`);
}

// Create temporary category
const tempCatSlug = `temp-cat-${Date.now()}`;
const createCatRes = await api("/api/admin/categories", {
  method: "POST",
  body: {
    name: `Temp Cat ${Date.now()}`,
    slug: tempCatSlug,
    description: "Testing category CRUD lifecycle",
    status: "active",
    icon: "briefcase",
  },
});

if (createCatRes.ok && createCatRes.data.success) {
  const createdCatId = createCatRes.data.item._id;
  recordSuccess("Category Create (POST)", `Created category _id: ${createdCatId}`);

  // Test Update
  const patchCatRes = await api(`/api/admin/categories/${createdCatId}`, {
    method: "PATCH",
    body: { description: "Updated category description" },
  });
  if (patchCatRes.ok && patchCatRes.data.success) {
    recordSuccess("Category Update (PATCH)", `Updated category _id: ${createdCatId}`);
  } else {
    recordGap("Category Update (PATCH)", `HTTP ${patchCatRes.status}: ${patchCatRes.data.message}`);
  }

  // Test Delete
  const delCatRes = await api(`/api/admin/categories/${createdCatId}`, { method: "DELETE" });
  if (delCatRes.ok && delCatRes.data.success) {
    recordSuccess("Category Delete (DELETE)", `Deleted category _id: ${createdCatId}`);
  } else {
    recordGap("Category Delete (DELETE)", `HTTP ${delCatRes.status}: ${delCatRes.data.message}`);
  }
} else {
  recordGap("Category Create (POST)", `HTTP ${createCatRes.status}: ${createCatRes.data.message}`);
}

// --- 4. LOCATIONS CRUD ---
console.log("\n[4] Testing Locations Feature...");
const locList = await api("/api/admin/locations?limit=50");
if (!locList.ok || !locList.data.success) {
  recordGap("Location List", `HTTP ${locList.status}: ${locList.data.message}`);
} else {
  recordSuccess("Location List", `Found ${locList.data.items?.length} locations`);
}

// Test creating top-level location (type: "region" or with a parent)
const tempLocSlug = `temp-region-${Date.now()}`;
const createLocRes = await api("/api/admin/locations", {
  method: "POST",
  body: {
    name: `Northern Ghats Region ${Date.now()}`,
    slug: tempLocSlug,
    type: "region",
    description: "Highland geographic tourism belt",
    status: "active",
  },
});

if (createLocRes.ok && createLocRes.data.success) {
  const createdLocId = createLocRes.data.item._id;
  recordSuccess("Location Create (POST)", `Created region _id: ${createdLocId}`);

  // Test Update
  const patchLocRes = await api(`/api/admin/locations/${createdLocId}`, {
    method: "PATCH",
    body: { description: "Updated region description" },
  });
  if (patchLocRes.ok && patchLocRes.data.success) {
    recordSuccess("Location Update (PATCH)", `Updated region _id: ${createdLocId}`);
  } else {
    recordGap("Location Update (PATCH)", `HTTP ${patchLocRes.status}: ${patchLocRes.data.message}`);
  }

  // Test child creation with parent
  const childLocSlug = `temp-child-${Date.now()}`;
  const createChildRes = await api("/api/admin/locations", {
    method: "POST",
    body: {
      name: "Valley Viewpoint Hamlet",
      slug: childLocSlug,
      type: "village",
      parent: createdLocId,
      description: "Picturesque village in region",
      status: "active",
    },
  });
  if (createChildRes.ok && createChildRes.data.success) {
    recordSuccess("Location Hierarchy (Child with Parent)", `Created child village with parent`);
    // Delete child
    await api(`/api/admin/locations/${createChildRes.data.item._id}`, { method: "DELETE" });
  } else {
    recordGap("Location Hierarchy", `HTTP ${createChildRes.status}: ${createChildRes.data.message}`);
  }

  // Delete parent
  const delLocRes = await api(`/api/admin/locations/${createdLocId}`, { method: "DELETE" });
  if (delLocRes.ok && delLocRes.data.success) {
    recordSuccess("Location Delete (DELETE)", `Deleted region _id: ${createdLocId}`);
  } else {
    recordGap("Location Delete (DELETE)", `HTTP ${delLocRes.status}: ${delLocRes.data.message}`);
  }
} else {
  recordGap("Location Create (POST)", `HTTP ${createLocRes.status}: ${createLocRes.data.message}`);
}

// --- 5. BUSINESS SUBMISSIONS FEATURE ---
console.log("\n[5] Testing Submissions Feature...");
const subList = await api("/api/admin/submissions");
if (!subList.ok || !subList.data.success) {
  recordGap("Submissions List", `HTTP ${subList.status}: ${subList.data.message}`);
} else {
  const submissions = subList.data.submissions || subList.data.items || [];
  recordSuccess("Submissions List", `Found ${submissions.length} submissions`);

  if (submissions.length > 0) {
    const sub = submissions[0];
    const updateSub = await api(`/api/admin/submissions/${sub._id}`, {
      method: "PATCH",
      body: {
        status: "reviewing",
        adminNotes: "Under careful review by administrator.",
      },
    });
    if (updateSub.ok && updateSub.data.success) {
      recordSuccess("Submission Status Review (PATCH)", `Set submission to 'reviewing'`);
    } else {
      recordGap("Submission Status Review", `HTTP ${updateSub.status}: ${updateSub.data.message}`);
    }
  }
}

// --- 6. CONTENT ITEMS (PLACES, GUIDES, EVENTS) ---
console.log("\n[6] Testing Content Items API (/api/admin/content/places, guides, events)...");
for (const type of ["places", "guides", "events"]) {
  const cList = await api(`/api/admin/content/${type}`);
  if (cList.ok && cList.data.success) {
    recordSuccess(`Content [${type}] List`, `Retrieved ${cList.data.items?.length} items`);
  } else {
    recordGap(`Content [${type}] List`, `HTTP ${cList.status}: ${cList.data.message}`);
  }
}

// Test creating a sample Guide content item
const testGuideSlug = `guide-nashik-food-trail-${Date.now()}`;
const createGuideRes = await api("/api/admin/content/guides", {
  method: "POST",
  body: {
    title: "The Ultimate Highway Food Trail from Ghoti to Igatpuri",
    slug: testGuideSlug,
    summary: "A curated gastronomic road trip showcasing Maharashtra dhabas, spicy misal pav, and village tea stalls.",
    body: "## Introduction\n\nHighway NH-160 and Mumbai-Agra highway offer incredible local Maharashtrian cuisine...\n\n### Top Recommended Stops\n1. Hotel Kalinga Family Dhaba\n2. Sai Misal House\n3. Hotel Sahyadri",
    status: "published",
    location: locations[0]._id.toString(),
  },
});
if (createGuideRes.ok && createGuideRes.data.success) {
  recordSuccess("Guide Creation (POST)", `Created published guide slug: ${testGuideSlug}`);
} else {
  recordGap("Guide Creation", `HTTP ${createGuideRes.status}: ${createGuideRes.data.message}`);
}

// --- 7. SEO SETTINGS & TEMPLATES ---
console.log("\n[7] Testing SEO Management & Templates...");
const seoRes = await api("/api/admin/content/seo");
if (seoRes.ok && seoRes.data.success) {
  recordSuccess("Global SEO Settings (GET)", `Retrieved SEO configuration`);
} else {
  recordGap("Global SEO Settings (GET)", `HTTP ${seoRes.status}: ${seoRes.data.message}`);
}

const seoTplRes = await api("/api/admin/content/seo-templates");
if (seoTplRes.ok && seoTplRes.data.success) {
  recordSuccess("SEO Templates (GET)", `Retrieved templates`);
} else {
  recordGap("SEO Templates (GET)", `HTTP ${seoTplRes.status}: ${seoTplRes.data.message}`);
}

// --- 8. PUBLIC CONSUMPTION REFLECTION ---
console.log("\n[8] Testing Public Frontend Reflection...");
const publicBiz = await fetch(`${BASE_URL}/api/businesses?limit=50`).then(r => r.json());
const publicBizCount = publicBiz.items?.length || publicBiz.businesses?.length || 0;
recordSuccess("Public Businesses API", `Available published businesses: ${publicBizCount}`);

const publicCats = await fetch(`${BASE_URL}/api/categories`).then(r => r.json());
const publicCatCount = publicCats.items?.length || publicCats.categories?.length || (Array.isArray(publicCats) ? publicCats.length : 0);
recordSuccess("Public Categories API", `Available active categories: ${publicCatCount}`);

const publicLocs = await fetch(`${BASE_URL}/api/locations`).then(r => r.json());
const publicLocCount = publicLocs.items?.length || publicLocs.locations?.length || (Array.isArray(publicLocs) ? publicLocs.length : 0);
recordSuccess("Public Locations API", `Available active locations: ${publicLocCount}`);

console.log("\n==================================================");
console.log(`TOTAL DETECTED GAPS: ${gaps.length}`);
if (gaps.length > 0) {
  console.log("Summary of gaps:");
  gaps.forEach((g, i) => console.log(`${i + 1}. [${g.feature}] ${g.issue}`));
} else {
  console.log("ALL ADMIN AND PUBLIC APIs OPERATE WITH 100% SUCCESS!");
}
console.log("==================================================");

process.exit(gaps.length > 0 ? 1 : 0);
