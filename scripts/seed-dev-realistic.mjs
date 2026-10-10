import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DEV_URI = process.env.MONGODB_URI;
if (!DEV_URI || !DEV_URI.includes("SEO-Om-dev")) {
  console.error("SAFETY CHECK FAILED: MONGODB_URI does not contain 'SEO-Om-dev'. Aborting!");
  process.exit(1);
}

async function seedDevRealistic() {
  console.log("=== SEEDING REALISTIC TEST DATA INTO SEO-Om-dev ===");
  await mongoose.connect(DEV_URI);
  const db = mongoose.connection.db;

  const admin = await db.collection("Users").findOne({ role: "admin" });
  if (!admin) {
    console.error("Admin user missing in SEO-Om-dev!");
    process.exit(1);
  }

  // Fetch categories and locations from dev db
  const categoriesList = await db.collection("categories").find({}).toArray();
  const catMap = {};
  for (const c of categoriesList) catMap[c.slug] = c;

  const locationsList = await db.collection("locations").find({}).toArray();
  const locMap = {};
  for (const l of locationsList) locMap[l.slug] = l;

  console.log(`Found ${categoriesList.length} categories and ${locationsList.length} locations in dev DB.`);

  // 1. Wipe existing businesses & submissions & promotions & analytics in DEV
  await db.collection("businesses").deleteMany({});
  await db.collection("businesssubmissions").deleteMany({});
  await db.collection("promotion_requests").deleteMany({});
  await db.collection("analytics_events").deleteMany({});
  console.log("Cleared existing businesses, submissions, promotions, and analytics events in dev DB.");

  const now = new Date();
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 2. High-quality realistic businesses
  const businesses = [
    {
      name: "Hotel Kalinga Family Dhaba",
      slug: "hotel-kalinga-family-dhaba",
      tagline: "Authentic Chulivarch Jevan & Highway Dhaba",
      description: "Renowned family dhaba located on NH-160 Ghoti bypass. Famous for authentic country chicken, jowar bhakri, sev bhaji, and quick highway service with spacious family seating.",
      businessType: "restaurant",
      category: catMap["family-dhabas"]?._id || catMap["restaurants"]?._id,
      location: locMap["ghoti"]?._id,
      locationSlug: "ghoti",
      categorySlug: "family-dhabas",
      establishedYear: 2011,
      contact: { phone: "+919822012345", whatsapp: "9822012345", email: "kalingadhaba@gmail.com", preferredMethod: "phone" },
      address: { line1: "NH-160 Ghoti Bypass Road", area: "Ghoti Tollway", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Ghoti Bypass, Nashik 422402" },
      coordinates: { latitude: 19.722, longitude: 73.685 },
      coverImage: {
        url: "https://res.cloudinary.com/dxqpqgu8s/image/upload/v1791577902/seo-product/places/covers/4d4ded0e-07eb-4cbd-8261-b60903ffa283.png",
        alt: "Hotel Kalinga Family Dhaba Exterior"
      },
      services: ["Family Dining", "Outdoor Seating", "Highway Parking"],
      priceRange: "budget",
      status: "published",
      isFeatured: true,
      isSponsored: true,
      sponsoredBadge: "✦ Sponsored",
      sponsoredTagline: "🔥 Top-Rated NH-160 Highway Family Dining",
      sponsoredPriority: 50,
      sponsoredUntil: futureDate,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Sai Misal House & Snacks",
      slug: "sai-misal-house-snacks",
      tagline: "Traditional Spicy Nashik Tarri Misal",
      description: "Serving piping-hot rassa misal with freshly baked pav, curd, and papad. A must-stop morning destination for travelers passing through Igatpuri hill station.",
      businessType: "restaurant",
      category: catMap["breakfast-misal"]?._id || catMap["restaurants"]?._id,
      location: locMap["igatpuri"]?._id,
      locationSlug: "igatpuri",
      categorySlug: "breakfast-misal",
      establishedYear: 2016,
      contact: { phone: "+919822023456", whatsapp: "9822023456", preferredMethod: "whatsapp" },
      address: { line1: "Old Agra Road, Near Station", area: "Station Road", city: "Igatpuri", district: "Nashik", state: "Maharashtra", postalCode: "422403", formatted: "Station Road, Igatpuri 422403" },
      coordinates: { latitude: 19.698, longitude: 73.564 },
      coverImage: {
        url: "https://res.cloudinary.com/dxqpqgu8s/image/upload/v1791577940/seo-product/guides/covers/be858f0f-3edc-437f-9f6f-12bb0a66545c.png",
        alt: "Sai Misal Fresh Plate"
      },
      services: ["Breakfast", "Fresh Tea", "Quick Snacks"],
      priceRange: "budget",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Bhavali Misty Lake Camping & Resort",
      slug: "bhavali-misty-lake-camping",
      tagline: "Lakeside Glamping & Western Ghats Nature Retreat",
      description: "Scenic 10-acre agro retreat on the banks of Bhavali Dam backwaters. Offers luxury glamping tents, barbecue nights, boating, nature trails, and authentic rural cuisine.",
      businessType: "hotel",
      category: catMap["agro-resorts"]?._id || catMap["hotels-stays"]?._id,
      location: locMap["igatpuri"]?._id,
      locationSlug: "igatpuri",
      categorySlug: "agro-resorts",
      establishedYear: 2020,
      contact: { phone: "+919822034567", whatsapp: "9822034567", email: "info@bhavalicamping.in", website: "https://bhavalicamping.in", preferredMethod: "whatsapp" },
      address: { line1: "Bhavali Dam Backwaters Road", area: "Bhavali Khurd", city: "Igatpuri", district: "Nashik", state: "Maharashtra", postalCode: "422403", formatted: "Bhavali Khurd, Igatpuri 422403" },
      coordinates: { latitude: 19.682, longitude: 73.541 },
      coverImage: {
        url: "https://res.cloudinary.com/dxqpqgu8s/image/upload/v1791577881/seo-product/places/covers/4b19b732-bba7-4433-a416-197eb9ef18a0.png",
        alt: "Bhavali Lake Camping Site"
      },
      services: ["Tent Stays", "Campfire", "Kayaking", "Rural Meals"],
      priceRange: "premium",
      status: "published",
      isFeatured: true,
      isSponsored: true,
      sponsoredBadge: "✦ Featured Stay",
      sponsoredTagline: "🌲 Best Igatpuri Monsoon Camping Destination",
      sponsoredPriority: 45,
      sponsoredUntil: futureDate,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Samruddhi Auto Care & Breakdown Rescue",
      slug: "samruddhi-auto-care-breakdown-rescue",
      tagline: "24x7 Highway Breakdown Rescue & Tyre Puncture",
      description: "Fast on-spot breakdown support on NH-160 and Samruddhi Expressway Ghoti interchange. Battery jumpstart, tubeless tyre repair, mechanical service, and towing assistance.",
      businessType: "service",
      category: catMap["mechanics-puncture"]?._id || catMap["auto-repairs"]?._id,
      location: locMap["ghoti"]?._id,
      locationSlug: "ghoti",
      categorySlug: "mechanics-puncture",
      establishedYear: 2018,
      contact: { phone: "+919822045678", whatsapp: "9822045678", preferredMethod: "phone" },
      address: { line1: "NH-160 Samruddhi Interchange Gate", area: "Ghoti Phata", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Ghoti Phata, Nashik 422402" },
      coordinates: { latitude: 19.715, longitude: 73.692 },
      coverImage: {
        url: "https://res.cloudinary.com/dxqpqgu8s/image/upload/v1791578071/seo-product/locations/covers/fc357342-b0d4-40bd-93dd-ea577778e051.png",
        alt: "Auto Garage and Rescue Van"
      },
      services: ["24x7 Breakdown", "Tyre Replacement", "Towing Assistance"],
      priceRange: "moderate",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Godavari Ayur Clinic & Panchakarma",
      slug: "godavari-ayur-clinic-panchakarma",
      tagline: "Authentic Ayurvedic Healing & Wellness",
      description: "Holistic treatments for arthritis, spine problems, and detox therapies guided by experienced BAMS practitioners. Pure herbal formulations and therapeutic massage.",
      businessType: "service",
      category: catMap["clinics"]?._id || catMap["healthcare"]?._id,
      location: locMap["nashik-city"]?._id,
      locationSlug: "nashik-city",
      categorySlug: "clinics",
      establishedYear: 2014,
      contact: { phone: "+919822056789", whatsapp: "9822056789", email: "info@godavariayur.com", preferredMethod: "phone" },
      address: { line1: "College Road, Near Krushi Nagar", area: "College Road", city: "Nashik", district: "Nashik", state: "Maharashtra", postalCode: "422005", formatted: "College Road, Nashik 422005" },
      coordinates: { latitude: 19.997, longitude: 73.765 },
      coverImage: {
        url: "https://res.cloudinary.com/dxqpqgu8s/image/upload/v1791630380/seo-product/locations/covers/bceaea2c-25a6-4717-bad9-49ea5315da6b.png",
        alt: "Ayur Clinic Consultation Room"
      },
      services: ["Panchakarma", "Pulse Diagnosis", "Herbal Remedies"],
      priceRange: "moderate",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Pawar Kirana & Spices Mart",
      slug: "pawar-kirana-spices-mart",
      tagline: "Daily Provisions & Authentic Ghati Spices",
      description: "Serving the local Ghoti community for over 25 years with premium pulses, cold-pressed oils, Nashik red chillies, and daily household groceries at fair prices.",
      businessType: "retail",
      category: catMap["kirana-stores"]?._id || catMap["shopping-retail"]?._id,
      location: locMap["ghoti"]?._id,
      locationSlug: "ghoti",
      categorySlug: "kirana-stores",
      establishedYear: 1998,
      contact: { phone: "+919822067890", whatsapp: "9822067890", preferredMethod: "any" },
      address: { line1: "Main Bazaar Road", area: "Mandi Market", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Main Bazaar, Ghoti 422402" },
      coordinates: { latitude: 19.723, longitude: 73.681 },
      services: ["Daily Groceries", "Organic Spices", "Home Delivery"],
      priceRange: "budget",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Sinnar Handloom & Paithani Weavers",
      slug: "sinnar-handloom-paithani-weavers",
      tagline: "Direct Weaver Pure Silk Paithani Sarees",
      description: "Direct-from-loom authentic silk Paithani sarees, Peshwai borders, and ceremonial bridal wear created by master weavers of Sinnar. Zero middleman margins.",
      businessType: "retail",
      category: catMap["clothing-textiles"]?._id || catMap["shopping-retail"]?._id,
      location: locMap["sinnar"]?._id,
      locationSlug: "sinnar",
      categorySlug: "clothing-textiles",
      establishedYear: 2008,
      contact: { phone: "+919822078901", whatsapp: "9822078901", preferredMethod: "whatsapp" },
      address: { line1: "Weavers Colony, Near Gondeshwar Temple", area: "Gondeshwar", city: "Sinnar", district: "Nashik", state: "Maharashtra", postalCode: "422103", formatted: "Gondeshwar Road, Sinnar 422103" },
      coordinates: { latitude: 19.849, longitude: 74.004 },
      coverImage: {
        url: "https://res.cloudinary.com/dxqpqgu8s/image/upload/v1791633177/seo-product/locations/covers/c1a6feb6-1c2a-4081-8bf8-2fb7c04a2d28.png",
        alt: "Paithani Handloom Silks"
      },
      services: ["Pure Silk Sarees", "Custom Weaving", "Bridal Collection"],
      priceRange: "premium",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Pimpalgaon Grape & Onion Agro Clinic",
      slug: "pimpalgaon-grape-agro-clinic",
      tagline: "Farmer Advisory, Seeds & Soil Health Center",
      description: "Government-certified Krushi Seva Kendra providing expert crop consultation for grape orchards, onion farming, high-yield seeds, drip irrigation, and bio-fertilizers.",
      businessType: "service",
      category: catMap["krushi-seva-kendra"]?._id || catMap["agriculture"]?._id,
      location: locMap["pimpalgaon"]?._id,
      locationSlug: "pimpalgaon",
      categorySlug: "krushi-seva-kendra",
      establishedYear: 2012,
      contact: { phone: "+919822089012", whatsapp: "9822089012", preferredMethod: "phone" },
      address: { line1: "APMC Market Gate 2", area: "APMC Mandi", city: "Pimpalgaon Baswant", district: "Nashik", state: "Maharashtra", postalCode: "422209", formatted: "APMC Mandi, Pimpalgaon 422209" },
      coordinates: { latitude: 20.171, longitude: 73.986 },
      services: ["Soil Testing", "Hybrid Seeds", "Crop Doctor Advice"],
      priceRange: "moderate",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Trimbak Pilgrim Bhavan & Guest House",
      slug: "trimbak-pilgrim-bhavan",
      tagline: "Peaceful Dharmashala & AC Rooms Near Jyotirlinga",
      description: "Clean, budget-friendly lodging situated 200 meters from the Trimbakeshwar Jyotirlinga temple. 24/7 hot water, pure veg Mahaprasad dining, and family suites.",
      businessType: "hotel",
      category: catMap["budget-lodges"]?._id || catMap["hotels-stays"]?._id,
      location: locMap["trimbakeshwar"]?._id,
      locationSlug: "trimbakeshwar",
      categorySlug: "budget-lodges",
      establishedYear: 2015,
      contact: { phone: "+919822090123", whatsapp: "9822090123", preferredMethod: "phone" },
      address: { line1: "Mandir Marg, Near Kushavarta Tirtha", area: "Kushavarta", city: "Trimbakeshwar", district: "Nashik", state: "Maharashtra", postalCode: "422212", formatted: "Mandir Marg, Trimbakeshwar 422212" },
      coordinates: { latitude: 19.932, longitude: 73.531 },
      services: ["AC Rooms", "Hot Water", "Temple Guidance"],
      priceRange: "budget",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Anand Medical & 24hr Emergency Chemist",
      slug: "anand-medical-chemist",
      tagline: "All Essential Medicines & Baby Care Products",
      description: "Trusted medical store offering genuine allopathic and ayurvedic medicines, first-aid supplies, wheelchair rentals, and 24-hour emergency medicine delivery across Ghoti.",
      businessType: "retail",
      category: catMap["pharmacies"]?._id || catMap["healthcare"]?._id,
      location: locMap["ghoti"]?._id,
      locationSlug: "ghoti",
      categorySlug: "pharmacies",
      establishedYear: 2005,
      contact: { phone: "+919822101234", whatsapp: "9822101234", preferredMethod: "any" },
      address: { line1: "Opposite Rural Hospital", area: "Station Road", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Near Rural Hospital, Ghoti 422402" },
      coordinates: { latitude: 19.721, longitude: 73.683 },
      services: ["Prescription Medicines", "24hr Emergency", "First Aid Kits"],
      priceRange: "budget",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
      createdAt: now,
      updatedAt: now,
    }
  ];

  const resBiz = await db.collection("businesses").insertMany(businesses);
  console.log(`Seeded ${resBiz.insertedCount} realistic businesses into SEO-Om-dev.`);

  // 3. Seed Realistic Business Submissions (pending, reviewing, approved, rejected)
  const submissions = [
    {
      businessName: "Bhavali Lake Kayaking & Tents",
      applicantName: "Rahul Jadhav",
      phone: "+919823456781",
      whatsapp: "9823456781",
      email: "rahul.kayak@gmail.com",
      category: catMap["agro-resorts"]?._id || catMap["hotels-stays"]?._id,
      location: locMap["igatpuri"]?._id,
      businessType: "service",
      address: { line1: "Dam Viewpoint", city: "Igatpuri", district: "Nashik", postalCode: "422403" },
      status: "pending",
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      businessName: "Sinnar MIDC Precision Toolings",
      applicantName: "Kishor Patil",
      phone: "+919823456782",
      whatsapp: "9823456782",
      email: "kishor@patiltools.com",
      category: catMap["auto-repairs"]?._id,
      location: locMap["sinnar"]?._id,
      businessType: "service",
      address: { line1: "Plot 42 MIDC Phase 2", city: "Sinnar", district: "Nashik", postalCode: "422103" },
      status: "reviewing",
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      reviewedBy: admin._id,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      businessName: "Mauli Krushi Seva Kendra",
      applicantName: "Sachin Gite",
      phone: "+919823456783",
      whatsapp: "9823456783",
      email: "maulikrushi@gmail.com",
      category: catMap["krushi-seva-kendra"]?._id || catMap["agriculture"]?._id,
      location: locMap["kavathe"]?._id,
      businessType: "retail",
      address: { line1: "Kavathe Phata", city: "Kavathe", district: "Nashik", postalCode: "422402" },
      status: "approved",
      submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      reviewedBy: admin._id,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
    {
      businessName: "International Online Jackpot Club",
      applicantName: "Anonymous Spammer",
      phone: "+919999999999",
      email: "spammer@bot.org",
      businessType: "retail",
      status: "rejected",
      rejectionReason: "Violation of terms: Non-local online gambling service.",
      submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      reviewedBy: admin._id,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    }
  ];

  await db.collection("businesssubmissions").insertMany(submissions);
  console.log(`Seeded ${submissions.length} realistic submissions (pending, reviewing, approved, rejected).`);

  // 4. Seed Promotion Requests
  const firstBiz = await db.collection("businesses").findOne({ slug: "hotel-kalinga-family-dhaba" });
  if (firstBiz) {
    const promoRequests = [
      {
        business: firstBiz._id,
        businessName: firstBiz.name,
        contactName: "Omkar Kalinga",
        email: "kalingadhaba@gmail.com",
        phone: "+919822012345",
        whatsapp: "9822012345",
        plan: "growth_14",
        promotionalHeadline: "🔥 Top-Rated NH-160 Highway Family Dining",
        targetCategory: firstBiz.category,
        targetCategoryName: "Highway Family Dhabas",
        targetLocation: firstBiz.location,
        targetLocationName: "Ghoti",
        preferredCta: "call_now",
        budget: "₹2,500",
        message: "Promote heavily on weekends for commuters traveling from Mumbai to Nashik.",
        status: "active",
        sponsoredBadge: "✦ Sponsored",
        priority: 50,
        startDate: now,
        endDate: futureDate,
        createdAt: now,
        updatedAt: now,
      }
    ];
    await db.collection("promotion_requests").insertMany(promoRequests);
    console.log(`Seeded 1 active promotion request.`);
  }

  // 5. Seed 60 Realistic Analytics Events across last 14 days
  const eventTypes = ["page_view", "business_view", "call_click", "whatsapp_click", "direction_click", "search"];
  const pages = ["/", "/businesses", "/locations", "/about", "/businesses/hotel-kalinga-family-dhaba", "/businesses/bhavali-misty-lake-camping", "/businesses/sai-misal-house-snacks"];
  const referrers = ["https://google.com", "https://instagram.com", "direct", "https://wa.me"];
  const devices = ["mobile", "desktop", "tablet"];

  const analyticsDocs = [];
  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const eventTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 86400000);
    const evType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const path = pages[Math.floor(Math.random() * pages.length)];
    const ref = referrers[Math.floor(Math.random() * referrers.length)];
    const dev = devices[Math.floor(Math.random() * devices.length)];

    analyticsDocs.push({
      eventType: evType,
      path: path,
      referrer: ref,
      device: dev,
      screenResolution: dev === "mobile" ? "390x844" : "1920x1080",
      userAgent: dev === "mobile" ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
      timestamp: eventTime,
      createdAt: eventTime,
    });
  }

  await db.collection("analytics_events").insertMany(analyticsDocs);
  console.log(`Seeded ${analyticsDocs.length} realistic analytics events spanning 14 days.`);

  await mongoose.disconnect();
  console.log("\n=== REALISTIC DEV SEED COMPLETED SUCCESSFULLY ===");
}

seedDevRealistic().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
