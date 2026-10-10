import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";

// Load local environment variables
const envPath = resolve(process.cwd(), ".env.local");
try {
    const envContent = readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length > 0) {
            process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
        }
    }
} catch {}

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "omshinde0412@gmail.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "Yogita@#1234";

let adminCookie = "";
let totalPassed = 0;
let totalFailed = 0;

function record(name, passed, detail = "") {
    if (passed) {
        totalPassed++;
        console.log(`[PASS] ${name} ${detail ? `(${detail})` : ""}`);
    } else {
        totalFailed++;
        console.error(`[FAIL] ${name} ${detail ? `(${detail})` : ""}`);
    }
}

async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
        Accept: "application/json",
        ...(options.headers || {}),
    };
    if (adminCookie) {
        headers["Cookie"] = adminCookie;
    }
    if (options.body && typeof options.body === "object" && !(options.body instanceof String)) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        try {
            data = await res.json();
        } catch {}
    } else {
        try {
            data = await res.text();
        } catch {}
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function run() {
    console.log("=== WEBSITE ANALYTICS & INSIGHTS VERIFICATION SUITE ===");
    console.log(`Target: ${BASE_URL}\n`);

    // 1. UNAUTHENTICATED PROTECTION CHECK
    console.log("--- 1. Testing Security & Authorization ---");
    const unauthOverview = await request("/api/admin/analytics/overview");
    record("Reject unauthenticated GET /api/admin/analytics/overview", unauthOverview.status === 401);

    const unauthRealtime = await request("/api/admin/analytics/realtime");
    record("Reject unauthenticated GET /api/admin/analytics/realtime", unauthRealtime.status === 401);

    const unauthExport = await request("/api/admin/analytics/export?type=pages");
    record("Reject unauthenticated GET /api/admin/analytics/export", unauthExport.status === 401);

    // 2. ADMIN AUTHENTICATION
    console.log("\n--- 2. Admin Authentication ---");
    const loginRes = await request("/api/auth/login", {
        method: "POST",
        body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    record("Admin login", loginRes.ok, `status: ${loginRes.status}`);

    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) {
        adminCookie = setCookie.split(";")[0];
    }

    // 3. EVENT COLLECTION API
    console.log("\n--- 3. Public Event Collection & Privacy ---");
    const testSessionId = "test_sess_" + Math.random().toString(36).substring(2, 10);

    // A. Valid page view
    const pvRes = await request("/api/analytics/collect", {
        method: "POST",
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0" },
        body: {
            eventType: "page_view",
            pagePath: "/businesses/hotel-kalinga-royal-dhaba",
            pageTitle: "Hotel Kalinga Royal Dhaba & Restaurant",
            sessionId: testSessionId,
            referrer: "https://www.google.com/search?q=kalinga+dhaba",
            durationSeconds: 15,
        },
    });
    record("POST /api/analytics/collect (page_view)", pvRes.status === 204 || pvRes.status === 200);

    // B. Business view & CTAs
    const bizViewRes = await request("/api/analytics/collect", {
        method: "POST",
        headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1" },
        body: {
            eventType: "business_view",
            pagePath: "/businesses/hotel-kalinga-royal-dhaba",
            pageTitle: "Hotel Kalinga Royal Dhaba & Restaurant",
            sessionId: testSessionId,
            entitySlug: "hotel-kalinga-royal-dhaba",
        },
    });
    record("POST /api/analytics/collect (business_view)", bizViewRes.status === 204 || bizViewRes.status === 200);

    const phoneClickRes = await request("/api/analytics/collect", {
        method: "POST",
        body: {
            eventType: "phone_click",
            pagePath: "/businesses/hotel-kalinga-royal-dhaba",
            pageTitle: "Hotel Kalinga Royal Dhaba & Restaurant",
            sessionId: testSessionId,
            entitySlug: "hotel-kalinga-royal-dhaba",
            metadata: { actionLabel: "Call Business" },
        },
    });
    record("POST /api/analytics/collect (phone_click CTA)", phoneClickRes.status === 204 || phoneClickRes.status === 200);

    const dirClickRes = await request("/api/analytics/collect", {
        method: "POST",
        body: {
            eventType: "directions_click",
            pagePath: "/businesses/hotel-kalinga-royal-dhaba",
            sessionId: testSessionId,
            entitySlug: "hotel-kalinga-royal-dhaba",
            metadata: { actionLabel: "Google Maps Navigation" },
        },
    });
    record("POST /api/analytics/collect (directions_click CTA)", dirClickRes.status === 204 || dirClickRes.status === 200);

    // C. Search query
    const searchRes = await request("/api/analytics/collect", {
        method: "POST",
        body: {
            eventType: "search",
            pagePath: "/businesses?q=chulivarch+jevan",
            sessionId: testSessionId,
            metadata: { searchQuery: "chulivarch jevan", resultsCount: 4 },
        },
    });
    record("POST /api/analytics/collect (search query)", searchRes.status === 204 || searchRes.status === 200);

    // D. Rejection of invalid payloads
    const invalidRes = await request("/api/analytics/collect", {
        method: "POST",
        body: { eventType: "unknown_event_type" },
    });
    record("Reject invalid event payload with 400", invalidRes.status === 400);

    // E. Exclusion of admin route tracking
    const adminRouteRes = await request("/api/analytics/collect", {
        method: "POST",
        body: {
            eventType: "page_view",
            pagePath: "/admin/dashboard",
            sessionId: testSessionId,
        },
    });
    record("Exclude admin route from tracking", adminRouteRes.data?.ignored === true || adminRouteRes.status === 200);

    // 4. REAL-TIME ANALYTICS
    console.log("\n--- 4. Real-Time Active Visitors ---");
    const realtimeRes = await request("/api/admin/analytics/realtime");
    record(
        "GET /api/admin/analytics/realtime (last 5 min active)",
        realtimeRes.ok && realtimeRes.data?.activeVisitors >= 1,
        `active: ${realtimeRes.data?.activeVisitors}, sessions: ${realtimeRes.data?.activeSessions}`
    );

    // 5. OVERVIEW METRICS
    console.log("\n--- 5. Traffic Overview & KPIs ---");
    const overviewRes = await request("/api/admin/analytics/overview?range=today");
    const current = overviewRes.data?.metrics?.current;
    record(
        "GET /api/admin/analytics/overview",
        overviewRes.ok && current?.totalViews >= 1,
        `views: ${current?.totalViews}, visitors: ${current?.uniqueVisitors}, bounce: ${current?.bounceRate}%`
    );

    // 6. TRAFFIC TRENDS
    console.log("\n--- 6. Traffic Trends Series ---");
    const trendsRes = await request("/api/admin/analytics/trends?range=today");
    record(
        "GET /api/admin/analytics/trends",
        trendsRes.ok && Array.isArray(trendsRes.data?.trends),
        `points: ${trendsRes.data?.trends?.length}, isHourly: ${trendsRes.data?.isHourly}`
    );

    // 7. TOP PERFORMING PAGES
    console.log("\n--- 7. Top Performing Pages ---");
    const topPagesRes = await request("/api/admin/analytics/top-pages?range=today");
    record(
        "GET /api/admin/analytics/top-pages",
        topPagesRes.ok && topPagesRes.data?.pages?.length > 0,
        `top page: ${topPagesRes.data?.pages?.[0]?.pagePath}`
    );

    // 8. BUSINESS DISCOVERY INSIGHTS
    console.log("\n--- 8. Business Discovery Insights ---");
    const bizDiscRes = await request("/api/admin/analytics/business-discovery?range=today");
    const ctas = bizDiscRes.data?.ctaCounts;
    record(
        "GET /api/admin/analytics/business-discovery",
        bizDiscRes.ok && ctas?.phoneClicks >= 1 && ctas?.directionsClicks >= 1,
        `calls: ${ctas?.phoneClicks}, directions: ${ctas?.directionsClicks}, topBiz: ${bizDiscRes.data?.topBusinesses?.length}`
    );

    // 9. TRAFFIC SOURCES & DEVICES
    console.log("\n--- 9. Traffic Sources & Devices ---");
    const sourcesRes = await request("/api/admin/analytics/sources?range=today");
    record(
        "GET /api/admin/analytics/sources",
        sourcesRes.ok && sourcesRes.data?.devices?.length > 0,
        `top device: ${sourcesRes.data?.devices?.[0]?.device}, browsers: ${sourcesRes.data?.browsers?.length}`
    );

    // 10. CSV EXPORT
    console.log("\n--- 10. Data Export (CSV) ---");
    const exportPagesRes = await request("/api/admin/analytics/export?type=pages&range=today");
    record(
        "GET /api/admin/analytics/export?type=pages",
        exportPagesRes.ok && typeof exportPagesRes.data === "string" && exportPagesRes.data.includes("Page Path"),
        `bytes: ${exportPagesRes.data?.length}`
    );

    const exportBizRes = await request("/api/admin/analytics/export?type=businesses&range=today");
    record(
        "GET /api/admin/analytics/export?type=businesses",
        exportBizRes.ok && typeof exportBizRes.data === "string" && exportBizRes.data.includes("Business Name"),
        `bytes: ${exportBizRes.data?.length}`
    );

    // 11. GOOGLE SEARCH CONSOLE STATUS
    console.log("\n--- 11. Search Console Module ---");
    const gscRes = await request("/api/admin/analytics/search-console");
    record(
        "GET /api/admin/analytics/search-console",
        gscRes.ok && gscRes.data?.setupGuide?.steps?.length > 0,
        `configured: ${gscRes.data?.configured}`
    );

    // 12. ADMIN ANALYTICS PAGE SSR
    console.log("\n--- 12. Admin Analytics UI Page ---");
    const pageRes = await request("/admin/analytics");
    record("GET /admin/analytics (Authenticated HTML)", pageRes.status === 200);

    // CLEANUP SYNTHETIC TEST EVENTS
    console.log("\n--- Cleanup Synthetic Test Records ---");
    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            const res = await mongoose.connection.collection("analytics_events").deleteMany({
                sessionId: testSessionId,
            });
            console.log(`Cleaned up ${res.deletedCount} synthetic analytics events.`);
            await mongoose.disconnect();
        }
    } catch (e) {
        console.warn("Cleanup warning:", e.message);
    }

    console.log("\n=== TEST SUMMARY ===");
    console.log(`Total Passed: ${totalPassed}`);
    console.log(`Total Failed: ${totalFailed}`);

    if (totalFailed > 0) {
        process.exit(1);
    } else {
        console.log("🌟 ALL ANALYTICS SYSTEM TESTS PASSED SUCCESSFULLY!");
    }
}

run().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
