import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const EMAIL = "omshinde0412@gmail.com";
const PASSWORD = "Yogita@#1234";

let cookieHeader = "";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    Accept: "application/json",
    Origin: BASE_URL,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/admin_session=[^;]+/);
    if (match) {
      cookieHeader = match[0];
    }
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

const results = [];
function record(moduleName, testName, passed, details = "") {
  results.push({ moduleName, testName, passed, details });
  const icon = passed ? "PASS" : "FAIL";
  console.log(`[${icon}] ${moduleName} - ${testName} ${details ? `(${details})` : ""}`);
}

async function runSuite() {
  console.log("=== STARTING GAAVCONNECT ADMIN PANEL TEST SUITE ===");
  console.log(`Target: ${BASE_URL}`);

  // 1. AUTHENTICATION MODULE
  console.log("\n--- 1. Testing Authentication Module ---");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  record("Auth", "POST /api/auth/login", loginRes.ok && !!cookieHeader, `status: ${loginRes.status}`);

  const meRes = await request("/api/auth/me");
  record("Auth", "GET /api/auth/me", meRes.ok && meRes.data?.user?.email === EMAIL, `user: ${meRes.data?.user?.email}`);

  // 2. DASHBOARD STATS
  console.log("\n--- 2. Testing Dashboard Module ---");
  const statsRes = await request("/api/admin/dashboard/stats");
  const hasStats = statsRes.ok && typeof statsRes.data?.stats?.businesses?.total === "number";
  record("Dashboard", "GET /api/admin/dashboard/stats", hasStats, `businesses: ${statsRes.data?.stats?.businesses?.total}`);

  // 3. LOCATIONS MODULE (Including User's Exact Mumbai Case)
  console.log("\n--- 3. Testing Locations Module ---");
  const listLocRes = await request("/api/admin/locations?limit=10");
  record("Locations", "GET /api/admin/locations", listLocRes.ok && Array.isArray(listLocRes.data?.items), `count: ${listLocRes.data?.items?.length}`);

  // Exact Mumbai Payload from Screenshot
  const createLocRes = await request("/api/admin/locations", {
    method: "POST",
    body: {
      name: "Mumbai Suburban Test",
      slug: "mumbai-suburban-test",
      type: "city",
      parent: null,
      address: {
        district: "Mumbai",
        state: "Maharashtra",
        country: "India",
        postalCodes: ["400001", "400050"],
      },
      coordinates: { latitude: 19.076, longitude: 72.8777 },
      description: "Financial hub of Maharashtra testing directory inclusion.",
      coverImage: {
        url: "https://res.cloudinary.com/dummy/image/upload/sample.jpg",
        publicId: "sample",
        alt: "Mumbai Skyline",
      },
      seo: {
        title: "Businesses in Mumbai",
        description: "Explore top places in Mumbai.",
        noIndex: false,
      },
      status: "active",
      sortOrder: 0,
    },
  });
  const createdLocId = createLocRes.data?.item?._id;
  record("Locations", "POST /api/admin/locations (Create top-level city)", createLocRes.status === 201, `id: ${createdLocId || createLocRes.data?.message}`);

  if (createdLocId) {
    const editLocRes = await request(`/api/admin/locations/${createdLocId}`, {
      method: "PATCH",
      body: {
        description: "Updated Mumbai description by admin.",
      },
    });
    record("Locations", "PATCH /api/admin/locations/:id (Edit location)", editLocRes.ok, editLocRes.data?.message);

    const deactLocRes = await request(`/api/admin/locations/${createdLocId}`, {
      method: "DELETE",
    });
    record("Locations", "DELETE /api/admin/locations/:id (Deactivate)", deactLocRes.ok, deactLocRes.data?.message);

    const reactLocRes = await request(`/api/admin/locations/${createdLocId}`, {
      method: "PATCH",
      body: { status: "active" },
    });
    record("Locations", "PATCH /api/admin/locations/:id (Reactivate)", reactLocRes.ok, reactLocRes.data?.message);
  }

  // 4. CATEGORIES MODULE
  console.log("\n--- 4. Testing Categories Module ---");
  const listCatRes = await request("/api/admin/categories?limit=10");
  record("Categories", "GET /api/admin/categories", listCatRes.ok, `count: ${listCatRes.data?.items?.length}`);

  const createCatRes = await request("/api/admin/categories", {
    method: "POST",
    body: {
      name: "Agro Tech & Machinery Test",
      slug: "agro-tech-machinery-test",
      description: "Tractor repairs, drip irrigation and precision agro tools.",
      icon: "store",
      parent: null,
      status: "active",
      sortOrder: 10,
    },
  });
  const createdCatId = createCatRes.data?.item?._id;
  record("Categories", "POST /api/admin/categories (Create category)", createCatRes.status === 201, `id: ${createdCatId || createCatRes.data?.message}`);

  if (createdCatId) {
    const editCatRes = await request(`/api/admin/categories/${createdCatId}`, {
      method: "PATCH",
      body: { description: "Updated agro description." },
    });
    record("Categories", "PATCH /api/admin/categories/:id (Edit category)", editCatRes.ok, editCatRes.data?.message);

    const deactCatRes = await request(`/api/admin/categories/${createdCatId}`, {
      method: "DELETE",
    });
    record("Categories", "DELETE /api/admin/categories/:id (Deactivate)", deactCatRes.ok, deactCatRes.data?.message);

    const reactCatRes = await request(`/api/admin/categories/${createdCatId}`, {
      method: "PATCH",
      body: { status: "active" },
    });
    record("Categories", "PATCH /api/admin/categories/:id (Reactivate)", reactCatRes.ok, reactCatRes.data?.message);
  }

  // 5. BUSINESSES MODULE
  console.log("\n--- 5. Testing Businesses Module ---");
  const listBizRes = await request("/api/admin/businesses?limit=10");
  record("Businesses", "GET /api/admin/businesses", listBizRes.ok, `count: ${listBizRes.data?.items?.length}`);

  let existingLocId = createdLocId || listLocRes.data?.items?.[0]?._id;
  let existingCatId = createdCatId || listCatRes.data?.items?.[0]?._id;

  const createBizRes = await request("/api/admin/businesses", {
    method: "POST",
    body: {
      name: "Sahyadri Agro Solutions Test",
      slug: "sahyadri-agro-solutions-test",
      tagline: "Quality seeds and fertilizer supplies in Nashik",
      description: "Authorized agricultural input center serving local farmers.",
      businessType: "retail",
      category: existingCatId,
      location: existingLocId,
      address: {
        line1: "Station Road",
        city: "Igatpuri",
        district: "Nashik",
        state: "Maharashtra",
        postalCode: "422403",
        formatted: "Station Road, Igatpuri 422403",
      },
      coordinates: { latitude: 19.695, longitude: 73.562 },
      contact: { phone: "+919876543210", email: "sahyadri.agro@gmail.com", preferredMethod: "phone" },
      status: "published",
      verificationStatus: "verified",
      seo: { title: "Sahyadri Agro Solutions", description: "Buy seeds and fertilizers in Igatpuri.", noIndex: false },
    },
  });
  const createdBizId = createBizRes.data?.item?._id;
  record("Businesses", "POST /api/admin/businesses (Create business)", createBizRes.status === 201, `id: ${createdBizId || createBizRes.data?.message}`);

  if (createdBizId) {
    const editBizRes = await request(`/api/admin/businesses/${createdBizId}`, {
      method: "PATCH",
      body: {
        tagline: "Updated Sahyadri tagline by admin",
      },
    });
    record("Businesses", "PATCH /api/admin/businesses/:id (Edit business)", editBizRes.ok, editBizRes.data?.message);
  }

  // 6. PROMOTIONS MODULE
  console.log("\n--- 6. Testing Promotions & Ads Module ---");
  const listPromoRes = await request("/api/admin/promotions");
  record("Promotions", "GET /api/admin/promotions", listPromoRes.ok, `count: ${listPromoRes.data?.items?.length}`);

  // 7. SUBMISSIONS MODULE
  console.log("\n--- 7. Testing Submissions Module ---");
  const listSubRes = await request("/api/admin/submissions");
  record("Submissions", "GET /api/admin/submissions", listSubRes.ok, `count: ${listSubRes.data?.items?.length}`);

  // 8. EDITORIAL CONTENT (Places, Guides, Events)
  console.log("\n--- 8. Testing Editorial Content Modules ---");
  for (const contentType of ["places", "guides", "events"]) {
    const listContentRes = await request(`/api/admin/content/${contentType}`);
    record("Content", `GET /api/admin/content/${contentType}`, listContentRes.ok, `count: ${listContentRes.data?.items?.length}`);

    const createContentRes = await request(`/api/admin/content/${contentType}`, {
      method: "POST",
      body: {
        title: `Test ${contentType.slice(0, -1)} Entry`,
        slug: `test-${contentType.slice(0, -1)}-${Date.now()}`,
        summary: `A summary for testing ${contentType} administration.`,
        body: `Full body content describing the local ${contentType} experience.`,
        status: "draft",
        ...(contentType === "events" ? {
          event: {
            startsAt: new Date(Date.now() + 86400000).toISOString(),
            venue: "Ghoti Market Ground",
          }
        } : {})
      },
    });
    const cId = createContentRes.data?.item?._id;
    record("Content", `POST /api/admin/content/${contentType}`, createContentRes.status === 201, `id: ${cId || createContentRes.data?.message}`);

    if (cId) {
      const delContentRes = await request(`/api/admin/content/${contentType}?id=${cId}`, {
        method: "DELETE",
      });
      record("Content", `DELETE /api/admin/content/${contentType}`, delContentRes.ok, delContentRes.data?.message);
    }
  }

  // 9. MEDIA LIBRARY MODULE
  console.log("\n--- 9. Testing Media Library Module ---");
  const listMediaRes = await request("/api/admin/content/media");
  record("Media", "GET /api/admin/content/media", listMediaRes.ok, `count: ${listMediaRes.data?.items?.length}`);

  const uploadSigRes = await request("/api/admin/uploads/signature", {
    method: "POST",
    body: { purpose: "location-cover" },
  });
  record("Media", "POST /api/admin/uploads/signature", uploadSigRes.ok && !!uploadSigRes.data?.upload?.signature, `folder: ${uploadSigRes.data?.upload?.folder}`);

  // 10. SEO MANAGEMENT & SEO TEMPLATES
  console.log("\n--- 10. Testing SEO Management Module ---");
  const getSeoRes = await request("/api/admin/content/seo");
  record("SEO", "GET /api/admin/content/seo", getSeoRes.ok, `siteName: ${getSeoRes.data?.items?.[0]?.siteName}`);

  const currentSeo = getSeoRes.data?.items?.[0] || {};
  const saveSeoRes = await request("/api/admin/content/seo", {
    method: "PATCH",
    body: {
      data: {
        siteName: currentSeo.siteName || "GaavConnect",
        siteUrl: currentSeo.siteUrl || "https://gaavconnect.in",
        defaultTitle: "GaavConnect — Rural Local Discovery & SEO Platform",
        titleTemplate: "%s | GaavConnect",
        defaultDescription: "Discover verified highway dhabas, agricultural clinics, shops and services in Nashik district.",
        defaultImage: currentSeo.defaultImage || "",
        robotsIndex: true,
        sitemapEnabled: true,
        organizationName: "GaavConnect India",
        organizationLogo: currentSeo.organizationLogo || "",
      },
    },
  });
  record("SEO", "PATCH /api/admin/content/seo (Save global settings)", saveSeoRes.ok, saveSeoRes.data?.message);

  // Test SEO Templates
  const getTemplatesRes = await request("/api/admin/content/seo-templates");
  record("SEO", "GET /api/admin/content/seo-templates", getTemplatesRes.ok, `count: ${getTemplatesRes.data?.items?.length}`);

  // Clean up test business and category & location
  console.log("\n--- Cleanup Test Records ---");
  const mongoose = (await import("mongoose")).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (createdBizId) await db.collection("businesses").deleteOne({ _id: new mongoose.Types.ObjectId(createdBizId) });
  if (createdCatId) await db.collection("categories").deleteOne({ _id: new mongoose.Types.ObjectId(createdCatId) });
  if (createdLocId) await db.collection("locations").deleteOne({ _id: new mongoose.Types.ObjectId(createdLocId) });
  console.log("Cleaned up test entries from database.");

  // SUMMARY
  console.log("\n=== TEST SUITE SUMMARY ===");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error("FAILURES DETECTED:");
    results.filter((r) => !r.passed).forEach((r) => console.error(`- ${r.moduleName} : ${r.testName} (${r.details})`));
    process.exit(1);
  } else {
    console.log("ALL ADMIN MODULES PASSED VERIFICATION!");
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
