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

  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text().catch(() => "");
  }

  return { status: res.status, ok: res.ok, data };
}

const results = [];
function record(stepName, passed, details = "") {
  results.push({ stepName, passed, details });
  const tag = passed ? "PASS" : "FAIL";
  console.log(`[${tag}] ${stepName} ${details ? `(${details})` : ""}`);
}

async function run() {
  console.log("=== COMPREHENSIVE BUSINESS LIFECYCLE & PUBLIC DISPLAY TEST ===");
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Admin Login
  console.log("--- Step 1: Authentication ---");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  record("Admin Login", loginRes.ok && !!cookieHeader, `status: ${loginRes.status}`);
  if (!loginRes.ok) throw new Error("Admin login failed");

  // 2. Fetch category and location for references
  const [catRes, locRes] = await Promise.all([
    request("/api/admin/categories?limit=5&status=active"),
    request("/api/admin/locations?limit=5&status=active"),
  ]);
  const activeCat = catRes.data?.items?.[0];
  const activeLoc = locRes.data?.items?.[0];
  record("Fetch active taxonomies", !!activeCat && !!activeLoc, `cat: ${activeCat?.name}, loc: ${activeLoc?.name}`);

  // 3. Admin: Create full business with EVERY field populated
  console.log("\n--- Step 2: Admin Create Full Business ---");
  const testBusinessSlug = `test-kalinga-royal-${Date.now()}`;
  const fullBusinessPayload = {
    name: "Kalinga Royal Dhaba & Restaurant",
    slug: testBusinessSlug,
    tagline: "Authentic Highway Chulivarch Jevan & Family AC Dining",
    description: "Established in 2017 along the Mumbai-Nashik highway, Kalinga Royal Dhaba offers authentic village-style Maharashtrian specialties, Chulivarch Chicken, mutton thali, fresh bhakri, and 24x7 tea and snacks with family rooms and secure parking.",
    businessType: "restaurant",
    establishedYear: 2017,
    priceRange: "moderate",
    category: activeCat._id,
    location: activeLoc._id,
    status: "published",
    verificationStatus: "verified",
    isFeatured: true,
    contact: {
      phone: "+91 98220 11223",
      alternatePhone: "+91 98220 44556",
      whatsapp: "+91 98220 11223",
      email: "contact@kalingadhaba.com",
      website: "https://kalingadhaba.com",
      preferredMethod: "phone",
    },
    socialLinks: {
      instagram: "https://instagram.com/kalingadhaba",
      facebook: "https://facebook.com/kalingadhaba",
      youtube: "https://youtube.com/@kalingadhaba",
      linkedin: "https://linkedin.com/company/kalingadhaba",
      x: "https://x.com/kalingadhaba",
    },
    address: {
      line1: "Shop No. 1, Mumbai-Nashik Highway NH-160",
      line2: "Near Samruddhi Toll",
      area: "Ghoti Toll Naka",
      city: "Ghoti",
      district: "Nashik",
      state: "Maharashtra",
      country: "India",
      postalCode: "422402",
      formatted: "Shop No. 1, NH-160, Ghoti Toll Naka, Nashik 422402",
    },
    coordinates: {
      latitude: 19.7214,
      longitude: 73.6621,
    },
    openingHours: {
      timezone: "Asia/Kolkata",
      weekly: {
        monday: [{ open: "08:00", close: "23:30" }],
        tuesday: [{ open: "08:00", close: "23:30" }],
        wednesday: [{ open: "08:00", close: "23:30" }],
        thursday: [{ open: "08:00", close: "23:30" }],
        friday: [{ open: "08:00", close: "23:30" }],
        saturday: [{ open: "08:00", close: "23:30" }],
        sunday: [{ open: "08:00", close: "23:30" }],
      },
      notes: "Open all 7 days with 24x7 highway tea counter and late-night dine-in.",
    },
    services: [
      "Authentic Chulivarch Jevan",
      "Special Chicken Thali",
      "Family AC Dining",
      "Highway Break Stop",
    ],
    amenities: [
      "Car & Bike Parking",
      "Free Wi-Fi",
      "Air Conditioned (AC)",
      "Family Dining Seating",
      "UPI / Digital Payments",
      "Card Payment Accepted",
      "Clean Washrooms",
    ],
    paymentMethods: ["Cash", "UPI (Google Pay / PhonePe)", "Credit & Debit Cards"],
    languages: ["Marathi", "Hindi", "English"],
    serviceAreas: ["Ghoti", "Igatpuri", "Kasara", "Nashik Highway"],
    logo: {
      url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200",
      publicId: "kalinga-logo-sample",
      alt: "Kalinga Dhaba Logo",
    },
    coverImage: {
      url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      publicId: "kalinga-cover-sample",
      alt: "Kalinga Storefront View",
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
        publicId: "kalinga-img-1",
        alt: "Dining Hall",
      },
      {
        url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
        publicId: "kalinga-img-2",
        alt: "Special Thali",
      },
    ],
    seo: {
      title: "Kalinga Royal Dhaba & Restaurant | Ghoti",
      description: "Authentic highway dhaba food and family dining in Ghoti, Nashik.",
      canonicalUrl: "https://gaavconnect.in/businesses/kalinga-royal-dhaba",
      noIndex: false,
    },
  };

  const createBizRes = await request("/api/admin/businesses", {
    method: "POST",
    body: fullBusinessPayload,
  });

  const createdBiz = createBizRes.data?.item;
  record(
    "POST /api/admin/businesses (All fields)",
    createBizRes.status === 201 && !!createdBiz?._id,
    `id: ${createdBiz?._id || createBizRes.data?.message}`
  );
  if (!createdBiz?._id) {
    console.error("Create details:", JSON.stringify(createBizRes.data, null, 2));
    throw new Error("Business creation failed");
  }

  // 4. Admin: GET business by ID to verify every field stored intact
  console.log("\n--- Step 3: Admin GET & PATCH Verification ---");
  const getBizRes = await request(`/api/admin/businesses/${createdBiz._id}`);
  const item = getBizRes.data?.item;
  const hasAllFields =
    item?.name === fullBusinessPayload.name &&
    item?.establishedYear === 2017 &&
    item?.priceRange === "moderate" &&
    item?.contact?.alternatePhone === "+91 98220 44556" &&
    item?.socialLinks?.instagram === "https://instagram.com/kalingadhaba" &&
    item?.openingHours?.weekly?.monday?.length === 1 &&
    item?.amenities?.length === 7 &&
    item?.paymentMethods?.length === 3 &&
    item?.languages?.length === 3 &&
    item?.images?.length === 2 &&
    item?.logo?.url?.includes("unsplash.com") &&
    item?.coverImage?.url?.includes("unsplash.com");

  record("GET /api/admin/businesses/:id (All fields preserved in DB)", hasAllFields, `amenities: ${item?.amenities?.length}, hours: ${item?.openingHours?.weekly?.monday?.length}`);

  // Test PATCH update
  const patchBizRes = await request(`/api/admin/businesses/${createdBiz._id}`, {
    method: "PATCH",
    body: {
      tagline: "Updated Tagline for Kalinga Royal Dhaba",
      establishedYear: 2016,
    },
  });
  record("PATCH /api/admin/businesses/:id", patchBizRes.ok, patchBizRes.data?.message);

  // 5. Public API: GET /api/businesses
  console.log("\n--- Step 4: Public Directory Discovery ---");
  const publicDirRes = await request(`/api/businesses?q=Kalinga`);
  const foundInPublic = Array.isArray(publicDirRes.data?.items) &&
    publicDirRes.data.items.some((b) => b.slug === testBusinessSlug);
  record("GET /api/businesses (Public search & discovery)", foundInPublic, `total found: ${publicDirRes.data?.pagination?.total}`);

  // 6. Public Detail Page: GET /businesses/[slug]
  console.log("\n--- Step 5: Public Detail Page SSR & Field Display ---");
  const pageRes = await request(`/businesses/${testBusinessSlug}`, {
    headers: { Accept: "text/html" },
  });

  const html = typeof pageRes.data === "string" ? pageRes.data : "";
  const checks = {
    hasName: html.includes("Kalinga Royal Dhaba"),
    hasDescription: html.includes("Established in 2017 along the Mumbai-Nashik highway"),
    hasLogo: html.includes("kalinga-logo-sample") || html.includes("photo-1555396273-367ea4eb4db5"),
    hasCover: html.includes("photo-1517248135467-4c7edcad34c4"),
    hasGallery: html.includes("photo-1552566626-52f8b828add9") || html.includes("Inside"),
    hasPriceRange: html.includes("Moderate") || html.includes("₹₹"),
    hasEstYear: html.includes("2016") || html.includes("Est."),
    hasWeeklyHours: html.includes("Operating Hours") && (html.includes("08:00 - 23:30") || html.includes("Monday")),
    hasAmenities: (html.includes("Car & Bike Parking") || html.includes("Car &amp; Bike Parking")) && html.includes("Free Wi-Fi"),
    hasPayment: html.includes("Google Pay") || html.includes("Payment Modes"),
    hasLanguages: html.includes("Marathi") || html.includes("Languages Spoken"),
    hasSocial: html.includes("instagram.com/kalingadhaba") || html.includes("Instagram"),
    hasPhoneCall: html.includes("+91 98220 11223"),
    hasAltPhone: html.includes("+91 98220 44556"),
    hasWhatsApp: html.includes("9822011223"),
    hasDirections: html.includes("Get directions"),
  };

  const allPublicFieldsRendered = Object.values(checks).every(Boolean);
  record(
    "GET /businesses/[slug] (Full Public Field Rendering)",
    pageRes.status === 200 && allPublicFieldsRendered,
    `checks passed: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length}`
  );

  if (!allPublicFieldsRendered) {
    console.log("Missing public fields breakdown:", Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k));
  }

  // 7. Public Submission: Submit from "List Your Business" page with ALL fields
  console.log("\n--- Step 6: Public List Your Business Submission Form ---");
  const submissionPayload = {
    businessName: "Sai Auto Works & 24x7 Breakdown",
    tagline: "Fast highway breakdown assistance and emergency towing",
    description: "Multi-brand automotive workshop with heavy crane towing, emergency puncture repair, jumpstart, and expert engine mechanics stationed right at the Ghoti bypass.",
    businessType: "professional_service",
    category: activeCat._id,
    categoryName: activeCat.name,
    location: activeLoc._id,
    locationName: activeLoc.name,
    address: {
      line1: "Ghoti Bypass, Near Samruddhi Toll",
      area: "Ghoti Bypass",
      city: activeLoc.name,
      formatted: `Ghoti Bypass, Near Samruddhi Toll, ${activeLoc.name}`,
    },
    contactName: "Rameshwar Jadhav",
    email: `sai.auto.${Date.now()}@example.com`,
    phone: "+91 98220 99887",
    whatsapp: "+91 98220 99887",
    website: "https://saiautoworks.com",
    instagram: "@saiautoworksghoti",
    priceRange: "budget",
    openingHours: "Open 24 Hours, 7 Days a week",
    coverImageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
    services: ["24x7 Towing", "Hydraulic Crane", "Tire Breakdown", "Battery Jumpstart"],
    amenities: ["Car & Bike Parking", "UPI / Digital Payments (GPay/PhonePe)", "Clean Washrooms"],
    message: "We want to be verified and published for highway drivers on GaavConnect.",
  };

  const submitRes = await request("/api/business-submissions", {
    method: "POST",
    body: submissionPayload,
  });

  const submissionId = submitRes.data?.id;
  record(
    "POST /api/business-submissions (Submit with all new fields)",
    submitRes.status === 201 && !!submissionId,
    `id: ${submissionId || submitRes.data?.message}`
  );
  if (!submissionId) {
    console.error("Submission details:", JSON.stringify(submitRes.data, null, 2));
    throw new Error("Business submission failed");
  }

  // 8. Admin converts submission into a live Business
  console.log("\n--- Step 7: Admin Convert Submission to Business ---");
  const convertRes = await request(`/api/admin/submissions/${submissionId}`, {
    method: "POST",
    body: {
      category: activeCat._id,
      location: activeLoc._id,
      businessType: "professional_service",
      description: submissionPayload.description,
      publish: true,
    },
  });

  const convertedBiz = convertRes.data?.business;
  record(
    "POST /api/admin/submissions/:id (Convert & Publish Business)",
    convertRes.status === 201 && !!convertedBiz?._id,
    `slug: ${convertedBiz?.slug}`
  );

  if (convertedBiz?._id) {
    // Verify converted business has all submitted fields mapped
    const checkConverted = await request(`/api/admin/businesses/${convertedBiz._id}`);
    const cb = checkConverted.data?.item;
    const fieldsCarriedOver =
      cb?.tagline === submissionPayload.tagline &&
      cb?.contact?.whatsapp === submissionPayload.whatsapp &&
      cb?.socialLinks?.instagram === submissionPayload.instagram &&
      cb?.priceRange === "budget" &&
      cb?.coverImage?.url?.includes("unsplash.com") &&
      cb?.services?.length === 4 &&
      cb?.amenities?.length === 3 &&
      cb?.openingHours?.notes === submissionPayload.openingHours;

    record(
      "Submission -> Business Data Transfer (All fields preserved)",
      fieldsCarriedOver,
      `tagline: ${!!cb?.tagline}, ig: ${cb?.socialLinks?.instagram}, cover: ${!!cb?.coverImage?.url}, amenities: ${cb?.amenities?.length}`
    );

    // Verify converted business renders publicly
    const pubConvertedPage = await request(`/businesses/${convertedBiz.slug}`, {
      headers: { Accept: "text/html" },
    });
    const cHtml = typeof pubConvertedPage.data === "string" ? pubConvertedPage.data : "";
    const pubConvertedOk =
      pubConvertedPage.status === 200 &&
      cHtml.includes("Sai Auto Works") &&
      cHtml.includes("24 Hours") &&
      cHtml.includes("saiautoworksghoti");
    record("Converted Business Live Public Rendering", pubConvertedOk, `status: ${pubConvertedPage.status}`);
  }

  // 9. Cleanup
  console.log("\n--- Cleanup Test Records ---");
  if (createdBiz?._id) {
    await request(`/api/admin/businesses/${createdBiz._id}`, { method: "DELETE" });
  }
  if (convertedBiz?._id) {
    await request(`/api/admin/businesses/${convertedBiz._id}`, { method: "DELETE" });
  }
  console.log("Cleanup complete.");

  console.log("\n=== SUMMARY ===");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  console.log(`Passed: ${passed}/${total}`);
  if (passed === total) {
    console.log("🌟 ALL TESTS PASSED SUCCESSFULLY! EVERYTHING IS VERIFIED & WORKING!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
