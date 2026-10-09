import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = (process.env.ADMIN_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const email = process.env.CI_ADMIN_EMAIL;
const password = process.env.CI_ADMIN_PASSWORD;
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const clientIp = "198.51.100.42";

if (process.env.CI !== "true") {
    throw new Error("Admin API smoke tests may only run in CI.");
}
if (!email || !password || !baseUrl.startsWith("http://127.0.0.1:")) {
    throw new Error("CI API smoke-test configuration is invalid.");
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForServer() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            const response = await fetch(baseUrl + "/api/health/db", {
                headers: { "x-real-ip": clientIp },
                cache: "no-store",
            });
            if (response.ok) return;
        } catch {
            // The server is still starting.
        }
        await wait(1000);
    }
    throw new Error("Next.js server did not become healthy within 60 seconds.");
}

async function request(path, options = {}) {
    const headers = {
        Accept: "application/json",
        "x-real-ip": clientIp,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.cookie ? { Cookie: options.cookie } : {}),
        ...(options.headers || {}),
    };
    const response = await fetch(new URL(path, baseUrl), {
        method: options.method || "GET",
        headers,
        cache: "no-store",
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
}

function expectStatus(result, expected, label) {
    assert.equal(
        result.response.status,
        expected,
        `${label}: expected HTTP ${expected}, received ${result.response.status} (${result.data.message || "no error message"})`
    );
}

function categoryPayload(name, slug, parent = null) {
    return {
        name,
        slug,
        description: "Created by the automated admin API smoke test.",
        parent,
        icon: "",
        status: "active",
        sortOrder: 0,
        seo: { title: "", description: "", noIndex: false },
    };
}

function locationPayload(name, slug, type, parent = null) {
    return {
        name,
        slug,
        type,
        parent,
        address: {
            district: "CI District",
            state: "CI State",
            country: "India",
            postalCodes: [],
        },
        coordinates: { latitude: null, longitude: null },
        description: "Created by the automated admin API smoke test.",
        coverImage: { url: "", publicId: "", alt: "" },
        seo: { title: "", description: "", noIndex: false },
        status: "active",
        sortOrder: 0,
    };
}

await waitForServer();

// The admin APIs must reject unauthenticated requests.
expectStatus(await request("/api/admin/categories?limit=1"), 401, "Unauthenticated category request");

const login = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
});
expectStatus(login, 200, "Admin login");

const setCookie = login.response.headers.get("set-cookie") || "";
assert.match(setCookie, /admin_session=/, "Login must set the admin session cookie");
const cookie = setCookie.split(";")[0];

const session = await request("/api/auth/me", { cookie });
expectStatus(session, 200, "Authenticated session check");
assert.equal(session.data.user?.role, "admin");


for (const [pagePath, heading] of [
    ["/admin/businesses", "Businesses"],
    ["/admin/categories", "Categories"],
    ["/admin/locations", "Locations"],
    ["/admin/seo", "Global SEO settings"],
]) {
    const pageResponse = await fetch(new URL(pagePath, baseUrl), {
        headers: { Cookie: cookie },
        cache: "no-store",
    });
    assert.equal(pageResponse.status, 200, `${pagePath} should render for an authenticated admin`);
    const html = await pageResponse.text();
    assert.ok(html.includes(heading), `${pagePath} should include the ${heading} heading`);
}

const categoryParentSlug = `ci-category-${suffix}`;
const categoryChildSlug = `ci-subcategory-${suffix}`;

const categoryParent = await request("/api/admin/categories", {
    method: "POST",
    cookie,
    body: categoryPayload(`CI Category ${suffix}`, categoryParentSlug),
});
expectStatus(categoryParent, 201, "Create parent category");
const categoryParentId = categoryParent.data.item?._id;
assert.ok(categoryParentId, "Parent category should have an ID");

const categoryChild = await request("/api/admin/categories", {
    method: "POST",
    cookie,
    body: categoryPayload(`CI Subcategory ${suffix}`, categoryChildSlug, categoryParentId),
});
expectStatus(categoryChild, 201, "Create child category");
const categoryChildId = categoryChild.data.item?._id;
assert.ok(categoryChildId, "Child category should have an ID");

const categorySearch = await request(
    "/api/admin/categories?" + new URLSearchParams({ q: categoryChildSlug, page: "1", limit: "20" }),
    { cookie }
);
expectStatus(categorySearch, 200, "Search categories");
assert.ok(categorySearch.data.items?.some((item) => item._id === categoryChildId));

expectStatus(await request("/api/admin/categories/" + categoryChildId, {
    method: "PATCH",
    cookie,
    body: { status: "inactive" },
}), 200, "Deactivate child category");

expectStatus(await request("/api/admin/categories/" + categoryParentId, {
    method: "DELETE",
    cookie,
}), 200, "Deactivate parent after child is inactive");

expectStatus(await request("/api/admin/categories/" + categoryChildId, {
    method: "PATCH",
    cookie,
    body: { status: "active" },
}), 409, "Prevent activation under inactive category parent");

expectStatus(await request("/api/admin/categories/" + categoryParentId, {
    method: "PATCH",
    cookie,
    body: { status: "active" },
}), 200, "Reactivate parent category");

expectStatus(await request("/api/admin/categories/" + categoryChildId, {
    method: "PATCH",
    cookie,
    body: { status: "active" },
}), 200, "Reactivate child category");

const countrySlug = `ci-country-${suffix}`;
const stateSlug = `ci-state-${suffix}`;

const country = await request("/api/admin/locations", {
    method: "POST",
    cookie,
    body: locationPayload(`CI Country ${suffix}`, countrySlug, "country"),
});
expectStatus(country, 201, "Create country location");
const countryId = country.data.item?._id;
assert.ok(countryId, "Country location should have an ID");

const state = await request("/api/admin/locations", {
    method: "POST",
    cookie,
    body: locationPayload(`CI State ${suffix}`, stateSlug, "state", countryId),
});
expectStatus(state, 201, "Create child state location");
const stateId = state.data.item?._id;
assert.ok(stateId, "State location should have an ID");

expectStatus(await request("/api/admin/locations/" + countryId, {
    method: "DELETE",
    cookie,
}), 409, "Prevent deactivation of parent with active child");

expectStatus(await request("/api/admin/locations/" + stateId, {
    method: "DELETE",
    cookie,
}), 200, "Deactivate child location");

expectStatus(await request("/api/admin/locations/" + countryId, {
    method: "DELETE",
    cookie,
}), 200, "Deactivate parent location");

expectStatus(await request("/api/admin/locations/" + stateId, {
    method: "PATCH",
    cookie,
    body: { status: "active" },
}), 409, "Prevent activation under inactive location parent");

expectStatus(await request("/api/admin/locations/" + countryId, {
    method: "PATCH",
    cookie,
    body: { status: "active" },
}), 200, "Reactivate country location");

expectStatus(await request("/api/admin/locations/" + stateId, {
    method: "PATCH",
    cookie,
    body: { status: "active" },
}), 200, "Reactivate state location");

const businessSlug = `ci-business-${suffix}`;
const business = await request("/api/admin/businesses", {
    method: "POST",
    cookie,
    body: {
        name: `CI Business ${suffix}`,
        slug: businessSlug,
        description: "A valid business description for the admin smoke test.",
        category: categoryParentId,
        location: countryId,
        status: "draft",
    },
});
expectStatus(business, 201, "Create draft business");
const businessId = business.data.item?._id;
assert.ok(businessId, "Business should have an ID");

const businessSearch = await request(
    "/api/admin/businesses?" + new URLSearchParams({ q: businessSlug, page: "1", limit: "20" }),
    { cookie }
);
expectStatus(businessSearch, 200, "Search businesses");
assert.ok(businessSearch.data.items?.some((item) => item._id === businessId));

expectStatus(await request("/api/admin/businesses/" + businessId, {
    method: "PATCH",
    cookie,
    body: { status: "published" },
}), 200, "Publish business");

expectStatus(await request("/api/admin/businesses/" + businessId, {
    method: "DELETE",
    cookie,
}), 200, "Archive business");

const archivedBusiness = await request(
    "/api/admin/businesses?" + new URLSearchParams({ q: businessSlug, status: "archived", page: "1", limit: "20" }),
    { cookie }
);
expectStatus(archivedBusiness, 200, "Read archived business");
assert.ok(archivedBusiness.data.items?.some((item) => item._id === businessId));

const placeSlug = `ci-place-${suffix}`;
const place = await request("/api/admin/content/places", {
    method: "POST",
    cookie,
    body: {
        title: `CI Place ${suffix}`,
        slug: placeSlug,
        summary: "A short summary for the CI content workflow.",
        body: "This record is created only in the isolated CI database.",
        status: "draft",
        location: countryId,
        coverImage: { url: "", publicId: "", alt: "" },
        seo: { title: "", description: "", canonicalUrl: "", noIndex: false },
    },
});
expectStatus(place, 201, "Create draft place");
const placeId = place.data.item?._id;
assert.ok(placeId, "Place should have an ID");

const placeSearch = await request(
    "/api/admin/content/places?" + new URLSearchParams({ q: placeSlug, page: "1", limit: "10" }),
    { cookie }
);
expectStatus(placeSearch, 200, "Search content");
assert.ok(placeSearch.data.items?.some((item) => item._id === placeId));

const publishedPlace = await request("/api/admin/content/places", {
    method: "PATCH",
    cookie,
    body: { id: placeId, data: { status: "published" } },
});
expectStatus(publishedPlace, 200, "Publish place");
assert.equal(publishedPlace.data.item?.summary, "A short summary for the CI content workflow.");
assert.equal(publishedPlace.data.item?.body, "This record is created only in the isolated CI database.");

const draftPlace = await request("/api/admin/content/places", {
    method: "PATCH",
    cookie,
    body: { id: placeId, data: { status: "draft" } },
});
expectStatus(draftPlace, 200, "Return place to draft");
assert.equal(draftPlace.data.item?.summary, "A short summary for the CI content workflow.");

const invalidEvent = await request("/api/admin/content/events", {
    method: "POST",
    cookie,
    body: {
        title: `CI Invalid Event ${suffix}`,
        slug: `ci-invalid-event-${suffix}`,
        summary: "Invalid event dates should be rejected.",
        body: "Automated validation check.",
        status: "draft",
        location: countryId,
        coverImage: { url: "", publicId: "", alt: "" },
        seo: { title: "", description: "", canonicalUrl: "", noIndex: false },
        event: {
            startsAt: "2026-10-10T12:00:00.000Z",
            endsAt: "2026-10-10T11:00:00.000Z",
            venue: "CI Venue",
            registrationUrl: "",
        },
    },
});
expectStatus(invalidEvent, 400, "Reject invalid event date range");

const eventStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const eventEnd = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
const event = await request("/api/admin/content/events", {
    method: "POST",
    cookie,
    body: {
        title: `CI Event ${suffix}`,
        slug: `ci-event-${suffix}`,
        summary: "A valid event summary.",
        body: "A valid event body for the smoke test.",
        status: "draft",
        location: countryId,
        coverImage: { url: "", publicId: "", alt: "" },
        seo: { title: "", description: "", canonicalUrl: "", noIndex: false },
        event: {
            startsAt: eventStart,
            endsAt: eventEnd,
            venue: "CI Venue",
            registrationUrl: "https://example.com/register",
        },
    },
});
expectStatus(event, 201, "Create valid event draft");
const eventId = event.data.item?._id;
assert.ok(eventId, "Event should have an ID");

const publishedEvent = await request("/api/admin/content/events", {
    method: "PATCH",
    cookie,
    body: { id: eventId, data: { status: "published" } },
});
expectStatus(publishedEvent, 200, "Publish event with saved date and venue");
assert.equal(publishedEvent.data.item?.status, "published");

const seoSettings = {
    siteName: "SEO-PRODUCT CI",
    siteUrl: baseUrl,
    defaultTitle: "CI default title",
    titleTemplate: "%s | SEO-PRODUCT CI",
    defaultDescription: "SEO settings integration smoke test.",
    defaultImage: "",
    robotsIndex: true,
    sitemapEnabled: true,
    organizationName: "SEO-PRODUCT CI",
    organizationLogo: "",
};
expectStatus(await request("/api/admin/content/seo", {
    method: "PATCH",
    cookie,
    body: { data: seoSettings },
}), 200, "Save global SEO settings");

const savedSeo = await request("/api/admin/content/seo", { cookie });
expectStatus(savedSeo, 200, "Read global SEO settings");
assert.equal(savedSeo.data.items?.[0]?.siteName, seoSettings.siteName);

const submissionBody = {
    businessName: `CI Business ${suffix}`,
    contactName: "CI Contact",
    email: `ci-submission-${suffix}@example.test`,
    phone: "+1 202-555-0147",
    locationName: "CI Location",
    categoryName: "CI Category",
    website: "https://example.com",
    message: "Automated submission review workflow.",
};

expectStatus(await request("/api/business-submissions", {
    method: "POST",
    body: submissionBody,
}), 403, "Reject public submission without Origin");

expectStatus(await request("/api/business-submissions", {
    method: "POST",
    body: submissionBody,
    headers: { Origin: "https://untrusted.example" },
}), 403, "Reject cross-origin public submission");

const submission = await request("/api/business-submissions", {
    method: "POST",
    body: submissionBody,
    headers: { Origin: baseUrl, "x-real-ip": "198.51.100.43" },
});
expectStatus(submission, 201, "Accept same-origin business submission");
const submissionId = submission.data.id;
assert.ok(submissionId, "Submission should have an ID");

const submissionList = await request(
    "/api/admin/content/submissions?" + new URLSearchParams({ q: submissionBody.email, page: "1", limit: "20" }),
    { cookie }
);
expectStatus(submissionList, 200, "Search business submissions");
assert.ok(submissionList.data.items?.some((item) => item._id === submissionId));

expectStatus(await request("/api/admin/content/submissions", {
    method: "PATCH",
    cookie,
    body: { id: submissionId, data: { status: "reviewing", adminNotes: "Reviewed by CI smoke test." } },
}), 200, "Review business submission");

expectStatus(await request("/api/admin/content/events?id=" + encodeURIComponent(eventId), {
    method: "DELETE",
    cookie,
}), 200, "Delete smoke-test event");

expectStatus(await request("/api/admin/content/places?id=" + encodeURIComponent(placeId), {
    method: "DELETE",
    cookie,
}), 200, "Delete smoke-test place");

const logout = await request("/api/auth/logout", {
    method: "POST",
    cookie,
});
expectStatus(logout, 200, "Admin logout");
assert.match(logout.response.headers.get("set-cookie") || "", /max-age=0/i, "Logout must expire the session cookie");

expectStatus(await request("/api/auth/me"), 401, "Session should be absent after logout");

process.stdout.write("Admin API smoke test passed: admin pages, authentication, business CRUD, categories, locations, content publishing, SEO, submissions, and logout.\n");
