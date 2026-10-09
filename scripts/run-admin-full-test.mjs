import mongoose from "mongoose";
import { SignJWT } from "jose";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || !JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET");
  process.exit(1);
}

// Connect to DB directly to fetch admin user, categories, locations
await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

const usersColl = db.collection("Users");
const categoriesColl = db.collection("categories");
const locationsColl = db.collection("locations");
const businessesColl = db.collection("businesses");
const submissionsColl = db.collection("businesssubmissions");

const adminUser = await usersColl.findOne({ role: "admin", isActive: true });
if (!adminUser) {
  console.error("Admin user not found!");
  process.exit(1);
}

// Generate valid admin JWT token
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
  console.warn(`[GAP FOUND] ${feature}: ${issue}`);
}

console.log("=== STARTING ADMIN FEATURE TESTS & ADDING 15 BUSINESSES ===");

// 1. Test Dashboard Stats
console.log("\n1. Testing Dashboard Stats API...");
const statsRes = await api("/api/admin/dashboard/stats");
if (!statsRes.ok) {
  recordGap("Dashboard Stats", `HTTP ${statsRes.status}: ${JSON.stringify(statsRes.data)}`);
} else {
  console.log("Dashboard Stats:", statsRes.data.data?.counts || statsRes.data);
}

// Fetch categories & locations for creating 15 businesses
const allCategories = await categoriesColl.find({ status: "active" }).toArray();
const allLocations = await locationsColl.find({ status: "active" }).toArray();

const catMap = Object.fromEntries(allCategories.map(c => [c.slug, c._id.toString()]));
const locMap = Object.fromEntries(allLocations.map(l => [l.slug, l._id.toString()]));

// 15 realistic Maharashtra businesses
const fifteenAdminBusinesses = [
  {
    name: "Shree Ganesh Agro Fertilizers",
    slug: "shree-ganesh-agro-fertilizers",
    tagline: "Quality Pesticides, Sprayers & Bio Inputs",
    description: "Serving Sinnar farming community with soil conditioners, drip equipment, and genuine seeds with agronomist guidance.",
    businessType: "retail",
    category: catMap["krushi-seva-kendra"] || allCategories[0]._id.toString(),
    location: locMap["sinnar"] || allLocations[0]._id.toString(),
    establishedYear: 2013,
    contact: { phone: "+919833011111", email: "ganeshagro@gmail.com", preferredMethod: "phone" },
    address: { line1: "Station Road, Near APMC Market", city: "Sinnar", district: "Nashik", state: "Maharashtra", postalCode: "422103", formatted: "Sinnar, Nashik 422103" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: true,
  },
  {
    name: "Hotel Sahyadri Highway Kitchen",
    slug: "hotel-sahyadri-highway-kitchen",
    tagline: "Authentic Khandeshi Shev Bhaji & Mutton Thali",
    description: "Famous highway stopover on Mumbai-Agra Highway known for spicy black masala preparations, hot jowar bhakris, and clean family seating.",
    businessType: "restaurant",
    category: catMap["family-dhabas"] || allCategories[0]._id.toString(),
    location: locMap["ghoti"] || allLocations[0]._id.toString(),
    establishedYear: 2015,
    contact: { phone: "+919833022222", whatsapp: "9833022222", preferredMethod: "phone" },
    address: { line1: "Samruddhi Mahamarg Interchange, Ghoti", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Samruddhi Interchange, Ghoti 422402" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: true,
  },
  {
    name: "Bhavali Misty Lake Camping & Resort",
    slug: "bhavali-misty-lake-camping",
    tagline: "Waterfront Tents, Trekking & Star Gazing",
    description: "Serene lakeside glamping retreat close to Bhavali Dam Igatpuri with campfire, nature walks, homecooked Maharashtrian meals, and kayaking.",
    businessType: "hotel",
    category: catMap["agro-resorts"] || allCategories[0]._id.toString(),
    location: locMap["igatpuri"] || allLocations[0]._id.toString(),
    establishedYear: 2020,
    contact: { phone: "+919833033333", whatsapp: "9833033333", email: "stay@bhavalilake.in", preferredMethod: "whatsapp" },
    address: { line1: "Bhavali Dam Backwaters, Igatpuri", city: "Igatpuri", district: "Nashik", state: "Maharashtra", postalCode: "422403", formatted: "Bhavali Dam, Igatpuri 422403" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "premium",
    isFeatured: true,
  },
  {
    name: "Godavari Ayur Clinic & Panchakarma",
    slug: "godavari-ayur-clinic-panchakarma",
    tagline: "Traditional Ayurvedic Healing & Wellness Therapy",
    description: "Led by Dr. Sunita Kulkarni (MD Ayurveda), providing classical panchakarma therapies, spine and joint care, and herbal wellness remedies.",
    businessType: "healthcare",
    category: catMap["clinics"] || allCategories[0]._id.toString(),
    location: locMap["trimbakeshwar"] || allLocations[0]._id.toString(),
    establishedYear: 2011,
    contact: { phone: "+919833044444", email: "godavariayur@gmail.com", preferredMethod: "phone" },
    address: { line1: "Near Kushavarta Kund, Temple Road", city: "Trimbakeshwar", district: "Nashik", state: "Maharashtra", postalCode: "422212", formatted: "Kushavarta Road, Trimbakeshwar 422212" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "moderate",
    isFeatured: false,
  },
  {
    name: "Pawar Kirana & Spices Mart",
    slug: "pawar-kirana-spices-mart",
    tagline: "Pure Ground Spices, Grains & Daily Household Goods",
    description: "Oldest trustworthy grocery in Ghoti bazaar stocking Kolam rice, homemade goda masala, dried fruits, pulses, and household cleaning products.",
    businessType: "retail",
    category: catMap["kirana-stores"] || allCategories[0]._id.toString(),
    location: locMap["ghoti"] || allLocations[0]._id.toString(),
    establishedYear: 1998,
    contact: { phone: "+919833055555", preferredMethod: "phone" },
    address: { line1: "Mahatma Gandhi Road, Main Bazaar", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "MG Road, Ghoti 422402" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: false,
  },
  {
    name: "Trimbak Pilgrim Bhavan & Guest House",
    slug: "trimbak-pilgrim-bhavan",
    tagline: "Affordable Family Rooms for Pilgrims",
    description: "Spacious AC and non-AC rooms just 200m from Jyotirlinga Temple, offering elevator, pure vegetarian kitchen, and 24-hour hot water.",
    businessType: "hotel",
    category: catMap["budget-lodges"] || allCategories[0]._id.toString(),
    location: locMap["trimbakeshwar"] || allLocations[0]._id.toString(),
    establishedYear: 2009,
    contact: { phone: "+919833066666", email: "trimbakbhavan@gmail.com", preferredMethod: "phone" },
    address: { line1: "Main Temple Path, Trimbakeshwar", city: "Trimbakeshwar", district: "Nashik", state: "Maharashtra", postalCode: "422212", formatted: "Trimbakeshwar 422212" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: false,
  },
  {
    name: "Sai Auto Electricals & Battery Care",
    slug: "sai-auto-electricals-battery",
    tagline: "Car Batteries, Inverters & Highway Dynamo Repairs",
    description: "Exide and Amaron battery dealership, alternator rewinding, computerized electrical diagnostics for heavy trucks and personal cars.",
    businessType: "professional_service",
    category: catMap["mechanics-puncture"] || allCategories[0]._id.toString(),
    location: locMap["ghoti"] || allLocations[0]._id.toString(),
    establishedYear: 2014,
    contact: { phone: "+919833077777", whatsapp: "9833077777", preferredMethod: "phone" },
    address: { line1: "Highway Naka, Near Bus Stand", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Ghoti Highway 422402" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: false,
  },
  {
    name: "Kavathe Milk & Agro Dairy Collection",
    slug: "kavathe-milk-agro-dairy",
    tagline: "Pure Cow & Buffalo Milk, Fresh Paneer & Ghee",
    description: "Cooperative dairy chilling center providing pure cow milk, buffalo curd, handmade desi ghee, and cattle feeds for village farmers.",
    businessType: "retail",
    category: catMap["kirana-stores"] || allCategories[0]._id.toString(),
    location: locMap["kavathe"] || allLocations[0]._id.toString(),
    establishedYear: 2017,
    contact: { phone: "+919833088888", preferredMethod: "phone" },
    address: { line1: "Grampanchayat Road, Kavathe Village", city: "Kavathe", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Kavathe Village 422402" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: false,
  },
  {
    name: "Anand Medical & General Store",
    slug: "anand-medical-general-store",
    tagline: "Prescription Drugs, Baby Nutrition & Medical First Aid",
    description: "Well-stocked neighborhood pharmacy in Bhagur offering genuine pharmaceutical medicines, blood pressure monitors, and daily sanitization items.",
    businessType: "healthcare",
    category: catMap["pharmacies"] || allCategories[0]._id.toString(),
    location: locMap["bhagur"] || allLocations[0]._id.toString(),
    establishedYear: 2006,
    contact: { phone: "+919833099999", preferredMethod: "phone" },
    address: { line1: "Veer Savarkar Chowk, Bhagur", city: "Bhagur", district: "Nashik", state: "Maharashtra", postalCode: "422502", formatted: "Bhagur Chowk 422502" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: false,
  },
  {
    name: "Pimpalgaon Onion & Grape Agro Clinic",
    slug: "pimpalgaon-grape-agro-clinic",
    tagline: "Soil Nutrient Testing, Export Fungicides & Drip Care",
    description: "Agricultural advisory helping grape and onion growers with weather-adjusted spray schedules, drip automation, and pest management.",
    businessType: "professional_service",
    category: catMap["krushi-seva-kendra"] || allCategories[0]._id.toString(),
    location: locMap["pimpalgaon"] || allLocations[0]._id.toString(),
    establishedYear: 2018,
    contact: { phone: "+919833100000", email: "agroclinic.pimpalgaon@gmail.com", preferredMethod: "phone" },
    address: { line1: "Opposite Market Committee, Lasalgaon Road", city: "Pimpalgaon", district: "Nashik", state: "Maharashtra", postalCode: "422209", formatted: "Lasalgaon Road, Pimpalgaon 422209" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "moderate",
    isFeatured: true,
  },
  {
    name: "Ghoti Express Motorcycle Spares & Works",
    slug: "ghoti-express-motorcycle-spares",
    tagline: "Hero, Bajaj, Honda Genuine Parts & Quick Servicing",
    description: "Reliable two-wheeler garage and spare parts hub with trained mechanics for routine tune-ups, clutch overhauls, and tube vulcanizing.",
    businessType: "professional_service",
    category: catMap["mechanics-puncture"] || allCategories[0]._id.toString(),
    location: locMap["ghoti"] || allLocations[0]._id.toString(),
    establishedYear: 2016,
    contact: { phone: "+919833111111", preferredMethod: "phone" },
    address: { line1: "Kasara Ghat Road, Near Old Octroi", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Ghoti 422402" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: false,
  },
  {
    name: "Sinnar Handloom & Paithani Weavers",
    slug: "sinnar-handloom-paithani-weavers",
    tagline: "Direct-from-Loom Silk Paithanis & Traditional Sarees",
    description: "Authentic handloom artisan showroom featuring zari border Paithani sarees, Peshwai dhotis, and festive silk garments directly from weavers.",
    businessType: "retail",
    category: catMap["clothing-textiles"] || allCategories[0]._id.toString(),
    location: locMap["sinnar"] || allLocations[0]._id.toString(),
    establishedYear: 2001,
    contact: { phone: "+919833122222", whatsapp: "9833122222", preferredMethod: "whatsapp" },
    address: { line1: "Weavers Colony, Shirdi Highway", city: "Sinnar", district: "Nashik", state: "Maharashtra", postalCode: "422103", formatted: "Sinnar 422103" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "premium",
    isFeatured: true,
  },
  {
    name: "Durg Bhandar Misal & Highway Snacks",
    slug: "durg-bhandar-misal-snacks",
    tagline: "Firewood Cooked Kat & Crispy Farsan Misal",
    description: "Crowd favorite morning misal joint near Kalsubai trek base route. Known for fiery red gravy, freshly chopped onions, and lemon wedges.",
    businessType: "restaurant",
    category: catMap["breakfast-misal"] || allCategories[0]._id.toString(),
    location: locMap["igatpuri"] || allLocations[0]._id.toString(),
    establishedYear: 2019,
    contact: { phone: "+919833133333", preferredMethod: "phone" },
    address: { line1: "Bari-Igatpuri Road, Near Trek Junction", city: "Igatpuri", district: "Nashik", state: "Maharashtra", postalCode: "422403", formatted: "Igatpuri 422403" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: true,
  },
  {
    name: "Nashik Valley Organic Table & Cafe",
    slug: "nashik-valley-organic-cafe",
    tagline: "Fresh Vineyard Salads, Artisan Breads & Local Coffee",
    description: "Chic farm cafe nestled on Gangapur Dam road offering farm-to-table cuisine, cold brew coffee, wood-fired pizzas, and scenic vineyard views.",
    businessType: "restaurant",
    category: catMap["restaurants"] || allCategories[0]._id.toString(),
    location: locMap["nashik-city"] || allLocations[0]._id.toString(),
    establishedYear: 2021,
    contact: { phone: "+919833144444", website: "https://nashikvalleycafe.in", preferredMethod: "phone" },
    address: { line1: "Gangapur Dam Backwaters Road", city: "Nashik City", district: "Nashik", state: "Maharashtra", postalCode: "422002", formatted: "Gangapur Dam Road, Nashik 422002" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "moderate",
    isFeatured: true,
  },
  {
    name: "Trimbak Ayurvedic Herbals & Guggul Depo",
    slug: "trimbak-herbals-guggul-depo",
    tagline: "Wild Brahmagiri Forest Herbs, Shilajit & Pure Honey",
    description: "Reputed tribal and wild herb collector supplying pure forest honey, Triphala churnas, Ashwagandha roots, and authenticated medicinal resins.",
    businessType: "retail",
    category: catMap["shopping-retail"] || allCategories[0]._id.toString(),
    location: locMap["trimbakeshwar"] || allLocations[0]._id.toString(),
    establishedYear: 1995,
    contact: { phone: "+919833155555", preferredMethod: "phone" },
    address: { line1: "Kushavarta Road, Near Main Gate", city: "Trimbakeshwar", district: "Nashik", state: "Maharashtra", postalCode: "422212", formatted: "Trimbakeshwar 422212" },
    status: "published",
    verificationStatus: "verified",
    priceRange: "budget",
    isFeatured: false,
  },
];

console.log("\n2. Creating 15 Businesses via Admin API (POST /api/admin/businesses)...");
let createdCount = 0;
const createdBusinessIds = [];

for (const b of fifteenAdminBusinesses) {
  const res = await api("/api/admin/businesses", {
    method: "POST",
    body: b,
  });
  if (res.ok) {
    createdCount++;
    const id = res.data.data?._id || res.data._id;
    createdBusinessIds.push(id);
    console.log(`[OK] Created "${b.name}" (${b.slug}) -> ID: ${id}`);
  } else {
    recordGap("Create Business", `Failed to create ${b.name}: HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }
}
console.log(`Successfully added ${createdCount}/15 businesses from admin API.`);

// 3. Test Admin Business Listing & Filters
console.log("\n3. Testing Admin Business Listing & Querying...");
const listRes = await api("/api/admin/businesses?limit=50");
if (!listRes.ok) {
  recordGap("Admin Business List", `HTTP ${listRes.status}`);
} else {
  const total = listRes.data.data?.businesses?.length || listRes.data.businesses?.length || 0;
  console.log(`Admin business listing retrieved: ${total} businesses.`);
}

// 4. Test Updating/Modifying Business via Admin (PATCH /api/admin/businesses/[id])
if (createdBusinessIds.length > 0) {
  console.log("\n4. Testing Business Update/Toggle (PATCH /api/admin/businesses/[id])...");
  const testId = createdBusinessIds[0];
  const updateRes = await api(`/api/admin/businesses/${testId}`, {
    method: "PATCH",
    body: {
      isFeatured: false,
      tagline: "Updated Tagline via Admin Panel Test",
    },
  });
  if (updateRes.ok) {
    console.log(`[OK] Successfully updated business ${testId}`);
  } else {
    recordGap("Update Business", `HTTP ${updateRes.status} ${JSON.stringify(updateRes.data)}`);
  }
}

// 5. Test Category Management Feature (POST /api/admin/categories & PATCH)
console.log("\n5. Testing Admin Category Feature (Create & Update)...");
const testCatSlug = `test-service-${Date.now().toString().slice(-4)}`;
const newCatRes = await api("/api/admin/categories", {
  method: "POST",
  body: {
    name: "Temporary Test Category",
    slug: testCatSlug,
    description: "Temporary category for admin test suite",
    icon: "briefcase",
    status: "active",
    sortOrder: 99,
  },
});
if (!newCatRes.ok) {
  recordGap("Admin Category Create", `HTTP ${newCatRes.status} ${JSON.stringify(newCatRes.data)}`);
} else {
  const catId = newCatRes.data.data?._id || newCatRes.data._id;
  console.log(`[OK] Created test category ID: ${catId}`);
  // Test update
  const editCatRes = await api(`/api/admin/categories/${catId}`, {
    method: "PATCH",
    body: { description: "Updated description via admin suite" },
  });
  if (editCatRes.ok) {
    console.log(`[OK] Updated test category ID: ${catId}`);
  } else {
    recordGap("Admin Category Update", `HTTP ${editCatRes.status}`);
  }
}

// 6. Test Location Management Feature (POST /api/admin/locations & PATCH)
console.log("\n6. Testing Admin Location Feature (Create & Update)...");
const testLocSlug = `test-loc-${Date.now().toString().slice(-4)}`;
const newLocRes = await api("/api/admin/locations", {
  method: "POST",
  body: {
    name: "Deolali Camp",
    slug: testLocSlug,
    type: "town",
    address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422401"] },
    coordinates: { latitude: 19.932, longitude: 73.834 },
    status: "active",
  },
});
if (!newLocRes.ok) {
  recordGap("Admin Location Create", `HTTP ${newLocRes.status} ${JSON.stringify(newLocRes.data)}`);
} else {
  const locId = newLocRes.data.data?._id || newLocRes.data._id;
  console.log(`[OK] Created test location ID: ${locId}`);
  // Test update
  const editLocRes = await api(`/api/admin/locations/${locId}`, {
    method: "PATCH",
    body: { description: "Historic military cantonment town near Nashik" },
  });
  if (editLocRes.ok) {
    console.log(`[OK] Updated test location ID: ${locId}`);
  } else {
    recordGap("Admin Location Update", `HTTP ${editLocRes.status}`);
  }
}

// 7. Test Submissions Management Feature (GET /api/admin/submissions & PATCH /api/admin/submissions/[id])
console.log("\n7. Testing Admin Submissions Management...");
const subListRes = await api("/api/admin/submissions");
if (!subListRes.ok) {
  recordGap("Admin Submissions List", `HTTP ${subListRes.status}`);
} else {
  const submissions = subListRes.data.data?.submissions || subListRes.data.submissions || [];
  console.log(`Found ${submissions.length} submissions.`);
  if (submissions.length > 0) {
    const subToTest = submissions[0];
    const updateSubRes = await api(`/api/admin/submissions/${subToTest._id}`, {
      method: "PATCH",
      body: {
        status: "reviewing",
        adminNotes: "Under review by Om Shinde admin.",
      },
    });
    if (updateSubRes.ok) {
      console.log(`[OK] Updated submission ${subToTest._id} status to 'reviewing'`);
    } else {
      recordGap("Admin Submission Status Update", `HTTP ${updateSubRes.status} ${JSON.stringify(updateSubRes.data)}`);
    }
  }
}

// 8. Test Public Front-end Endpoints to verify reflections
console.log("\n8. Testing Public Directory & Category Reflections...");
const publicBizRes = await fetch(`${BASE_URL}/api/businesses?limit=50`).then(r => r.json()).catch(() => ({}));
const publicCount = publicBizRes.data?.businesses?.length || publicBizRes.businesses?.length || 0;
console.log(`Public businesses available: ${publicCount} (Expected: >= 25)`);

const publicCatsRes = await fetch(`${BASE_URL}/api/categories`).then(r => r.json()).catch(() => ({}));
const publicCatCount = publicCatsRes.data?.length || publicCatsRes.categories?.length || (Array.isArray(publicCatsRes) ? publicCatsRes.length : 0);
console.log(`Public categories available: ${publicCatCount}`);

// Summary
console.log("\n=== TEST EXECUTION SUMMARY ===");
console.log(`Total Initial Businesses: 10`);
console.log(`Total Added via Admin Panel: ${createdCount}`);
console.log(`Total Total in Database: ${10 + createdCount}`);
console.log(`Identified Gaps/Errors: ${gaps.length}`);
if (gaps.length > 0) {
  console.log("\nList of identified gaps:");
  gaps.forEach((g, i) => console.log(`${i + 1}. [${g.feature}] ${g.issue}`));
} else {
  console.log("All tested features passed with zero failures!");
}

process.exit(0);
