import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const EMAIL = "omshinde0412@gmail.com";
const PASSWORD = "Yogita@#1234";

let cookieHeader = "";
const results = [];

function record(suite, testName, passed, details = "") {
  results.push({ suite, testName, passed, details });
  const icon = passed ? "✓" : "✗";
  console.log(`  ${icon} [${suite}] ${testName} ${details ? `(${details})` : ""}`);
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    Accept: "application/json",
    Origin: BASE_URL,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(options.headers || {}),
  };

  try {
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

    let json = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        json = await res.json();
      } catch {
        json = null;
      }
    } else {
      const text = await res.text();
      json = { _rawText: text };
    }

    return { status: res.status, ok: res.ok, data: json, headers: res.headers };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function runQaSuite() {
  console.log("=================================================");
  console.log("   GAAVCONNECT FULL PRODUCT QA & API TEST SUITE   ");
  console.log("   Target: " + BASE_URL);
  console.log("=================================================\n");

  // --- SUITE 1: AUTHENTICATION ---
  console.log("--- 1. AUTHENTICATION TESTS ---");
  const badLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: "WrongPassword!999" },
  });
  record("Auth", "Rejects bad password with 401", badLogin.status === 401, `status: ${badLogin.status}`);

  const goodLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  record("Auth", "Logs in with correct admin credentials", goodLogin.ok && !!cookieHeader, `status: ${goodLogin.status}`);

  // --- SUITE 2: PUBLIC APIS ---
  console.log("\n--- 2. PUBLIC API TESTS ---");
  const pubBiz = await request("/api/businesses");
  record("Public", "GET /api/businesses returns 200", pubBiz.ok, `items: ${pubBiz.data?.items?.length || 0}`);

  const pubBizSearch = await request("/api/businesses?q=Kalinga");
  const foundKalinga = pubBizSearch.data?.items?.some((b) => b.name?.includes("Kalinga"));
  record("Public", "GET /api/businesses?q=Kalinga finds matching businesses", pubBizSearch.ok && foundKalinga);

  const pubBizFilter = await request("/api/businesses?location=ghoti");
  record("Public", "GET /api/businesses?location=ghoti filters by location", pubBizFilter.ok && pubBizFilter.data?.items?.length > 0);

  const pubBizDetail = await request("/api/businesses/hotel-kalinga-family-dhaba");
  record("Public", "GET /api/businesses/:slug returns single business details", pubBizDetail.ok && (pubBizDetail.data?.item?.slug === "hotel-kalinga-family-dhaba" || pubBizDetail.data?.business?.slug === "hotel-kalinga-family-dhaba"));

  const pubCats = await request("/api/categories");
  record("Public", "GET /api/categories returns category tree", pubCats.ok && Array.isArray(pubCats.data?.categories || pubCats.data?.items || pubCats.data));

  const pubCatDetail = await request("/api/categories/family-dhabas");
  record("Public", "GET /api/categories/:slug returns single category", pubCatDetail.ok);

  const pubLocs = await request("/api/locations");
  record("Public", "GET /api/locations returns locations list", pubLocs.ok);

  const pubLocDetail = await request("/api/locations/ghoti");
  record("Public", "GET /api/locations/:slug returns location details with Marathi name", pubLocDetail.ok && (!!pubLocDetail.data?.item?.marathiName || !!pubLocDetail.data?.location?.marathiName));

  // Submit new business
  const testSub = await request("/api/business-submissions", {
    method: "POST",
    body: {
      businessName: "Ghoti Express Motorcycle Works QA",
      contactName: "QA Engineer Om",
      email: "qa.engineer@gaavconnect.in",
      phone: "+919876543210",
      whatsapp: "9876543210",
      businessType: "service",
      address: { line1: "NH-160 Bypass", city: "Ghoti", postalCode: "422402" },
      description: "Automated QA verification submission testing public listing form."
    }
  });
  record("Public", "POST /api/business-submissions creates submission", testSub.status === 201 || testSub.status === 200, `status: ${testSub.status}`);

  // Collect analytics event
  const testEvent = await request("/api/analytics/collect", {
    method: "POST",
    body: {
      eventType: "page_view",
      pagePath: "/businesses",
      sessionId: "sess_qa_verification_123",
      referrer: "direct"
    }
  });
  record("Public", "POST /api/analytics/collect records event", testEvent.status === 204 || testEvent.status === 200, `status: ${testEvent.status}`);

  // Sitemap & Robots
  const sitemapRes = await request("/sitemap.xml");
  record("Public", "GET /sitemap.xml returns valid XML sitemap", sitemapRes.ok && sitemapRes.data?._rawText?.includes("<urlset"));

  const robotsRes = await request("/robots.txt");
  record("Public", "GET /robots.txt returns valid robots instructions", robotsRes.ok && robotsRes.data?._rawText?.includes("Sitemap:"));

  // --- SUITE 3: ADMIN APIS ---
  console.log("\n--- 3. ADMIN PANEL API TESTS ---");
  const adminBiz = await request("/api/admin/businesses?limit=50");
  record("Admin", "GET /api/admin/businesses returns admin list", adminBiz.ok && adminBiz.data?.items?.length > 0, `total: ${adminBiz.data?.pagination?.total}`);

  // Test Admin Business update
  let targetBiz = adminBiz.data?.items?.[0];
  if (targetBiz) {
    const patchBiz = await request(`/api/admin/businesses/${targetBiz._id}`, {
      method: "PATCH",
      body: { tagline: targetBiz.tagline || "Updated via QA test" }
    });
    record("Admin", "PATCH /api/admin/businesses/:id updates business", patchBiz.ok, `status: ${patchBiz.status}`);
  }

  // Admin Submissions
  const adminSubs = await request("/api/admin/submissions");
  record("Admin", "GET /api/admin/submissions returns submissions list", adminSubs.ok && adminSubs.data?.items?.length > 0, `count: ${adminSubs.data?.items?.length}`);

  // Admin Locations
  const adminLocs = await request("/api/admin/locations?limit=50");
  const ghotiLoc = adminLocs.data?.items?.find((l) => l.slug === "ghoti");
  record("Admin", "GET /api/admin/locations returns locations with Marathi & taglines", adminLocs.ok && !!ghotiLoc?.marathiName && !!ghotiLoc?.tagline);

  // Admin Categories
  const adminCats = await request("/api/admin/categories?limit=50");
  record("Admin", "GET /api/admin/categories returns category tree", adminCats.ok && adminCats.data?.items?.length > 0);

  // Admin Content
  const adminGuides = await request("/api/admin/content/guides");
  record("Admin", "GET /api/admin/content/guides returns published guides", adminGuides.ok);

  const adminPlaces = await request("/api/admin/content/places");
  record("Admin", "GET /api/admin/content/places returns places", adminPlaces.ok);

  const adminEvents = await request("/api/admin/content/events");
  record("Admin", "GET /api/admin/content/events returns events", adminEvents.ok);

  // Admin Promotions
  const adminPromos = await request("/api/admin/promotions");
  record("Admin", "GET /api/admin/promotions returns promotion requests", adminPromos.ok);

  // Admin Analytics Dashboards
  const anaOverview = await request("/api/admin/analytics/overview?days=14");
  record("Admin", "GET /api/admin/analytics/overview returns metrics", anaOverview.ok && (typeof anaOverview.data?.metrics?.current?.totalViews === "number" || typeof anaOverview.data?.overview?.totalPageViews === "number"));

  const anaTrends = await request("/api/admin/analytics/trends?days=14");
  record("Admin", "GET /api/admin/analytics/trends returns daily trends", anaTrends.ok && Array.isArray(anaTrends.data?.trends));

  const anaPages = await request("/api/admin/analytics/top-pages?days=14");
  record("Admin", "GET /api/admin/analytics/top-pages returns top pages breakdown", anaPages.ok && Array.isArray(anaPages.data?.pages || anaPages.data?.topPages));

  const anaSources = await request("/api/admin/analytics/sources?days=14");
  record("Admin", "GET /api/admin/analytics/sources returns referrers & device breakdown", anaSources.ok && Array.isArray(anaSources.data?.sources));

  // --- SUITE 4: PUBLIC PAGES HTTP STATUS CHECKS ---
  console.log("\n--- 4. PUBLIC & ADMIN PAGES RENDERING CHECKS ---");
  const pagesToTest = [
    { path: "/", name: "Home Page" },
    { path: "/businesses", name: "Businesses Directory" },
    { path: "/businesses/hotel-kalinga-family-dhaba", name: "Business Detail Page" },
    { path: "/locations", name: "Locations Directory" },
    { path: "/locations/ghoti", name: "Single Location Page" },
    { path: "/categories", name: "Categories Directory" },
    { path: "/categories/restaurants", name: "Single Category Page" },
    { path: "/about", name: "About Page" },
    { path: "/add-business", name: "List Your Business Page" },
    { path: "/promote", name: "Promote Page" },
    { path: "/guides", name: "Guides Listing" },
    { path: "/places", name: "Places Listing" },
    { path: "/events", name: "Events Listing" },
    { path: "/contact", name: "Contact Page" },
    { path: "/how-it-works", name: "How It Works" },
    { path: "/for-businesses", name: "For Businesses" },
    { path: "/help", name: "Help FAQ" },
    { path: "/safety", name: "Safety Guidelines" },
    { path: "/privacy", name: "Privacy Policy" },
    { path: "/cookies", name: "Cookie Policy" },
    { path: "/admin", name: "Admin Dashboard Route" },
    { path: "/admin/businesses", name: "Admin Businesses Route" },
    { path: "/admin/submissions", name: "Admin Submissions Route" },
    { path: "/admin/locations", name: "Admin Locations Route" },
    { path: "/admin/categories", name: "Admin Categories Route" },
    { path: "/admin/analytics", name: "Admin Analytics Route" },
    { path: "/admin/promotions", name: "Admin Promotions Route" },
    { path: "/admin/content", name: "Admin Content CMS Route" },
  ];

  for (const p of pagesToTest) {
    const pageRes = await request(p.path);
    record("Page", `${p.name} (${p.path}) renders successfully`, pageRes.ok, `status: ${pageRes.status}`);
  }

  // --- SUMMARY ---
  console.log("\n=================================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================");

  if (failed > 0) {
    console.error(`\nFAILED TESTS (${failed}):`);
    for (const f of results.filter((r) => !r.passed)) {
      console.error(`- [${f.suite}] ${f.testName} (${f.details})`);
    }
    process.exit(1);
  } else {
    console.log("\nALL SYSTEMS PASS 100% PRODUCTION-QUALITY CHECKS!");
    process.exit(0);
  }
}

runQaSuite().catch((err) => {
  console.error("QA Suite Fatal Error:", err);
  process.exit(1);
});
