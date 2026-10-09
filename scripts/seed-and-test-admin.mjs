import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Import models
  const { default: User } = await import("../models/User.js");
  const { default: Category } = await import("../models/Category.js");
  const { default: Location } = await import("../models/Location.js");
  const { default: Business } = await import("../models/Business.js");
  const { default: BusinessSubmission } = await import("../models/BusinessSubmission.js");
  const { default: ContentItem } = await import("../models/ContentItem.js");
  const { default: MediaAsset } = await import("../models/MediaAsset.js");

  // Step 1: Clean existing data (preserve admin User)
  console.log("\n--- STEP 1: RESETTING DATABASE RECORDS (PRESERVING USERS) ---");
  const delBusinesses = await Business.deleteMany({});
  const delCategories = await Category.deleteMany({});
  const delLocations = await Location.deleteMany({});
  const delSubmissions = await BusinessSubmission.deleteMany({});
  const delContent = await ContentItem.deleteMany({});
  const delMedia = await MediaAsset.deleteMany({});
  console.log(`Deleted: ${delBusinesses.deletedCount} businesses, ${delCategories.deletedCount} categories, ${delLocations.deletedCount} locations, ${delSubmissions.deletedCount} submissions.`);

  // Verify Admin User
  const adminUser = await User.findOne({ role: "admin" }).lean();
  if (!adminUser) {
    console.error("No admin user found! Please run scripts/create-admin.mjs first.");
    process.exit(1);
  }
  console.log(`Verified Admin User: ${adminUser.name} (${adminUser.email})`);

  // Step 2: Seed Categories
  console.log("\n--- STEP 2: SEEDING CATEGORIES & HIERARCHY ---");
  const parentCategoriesData = [
    {
      name: "Restaurants & Dining",
      slug: "restaurants",
      description: "Authentic highway dhabas, family restaurants, pure veg thali, and traditional breakfast spots across Nashik district.",
      icon: "utensils",
      sortOrder: 1,
      status: "active",
      seo: { title: "Restaurants & Dhabas in Nashik", description: "Discover the best dhabas and eateries in Nashik, Ghoti, and Igatpuri.", noIndex: false },
    },
    {
      name: "Hotels & Stays",
      slug: "hotels-stays",
      description: "Scenic hill resorts, budget lodges, agro farmstays, and mountain view villas in Igatpuri and Nashik.",
      icon: "bed",
      sortOrder: 2,
      status: "active",
      seo: { title: "Hotels & Stays in Nashik & Igatpuri", description: "Find cozy resorts, lodges, and agro farm stays.", noIndex: false },
    },
    {
      name: "Healthcare & Medical",
      slug: "healthcare",
      description: "24/7 pharmacies, medical stores, general practitioners, and emergency clinics in rural and town areas.",
      icon: "activity",
      sortOrder: 3,
      status: "active",
      seo: { title: "Pharmacies & Doctors in Nashik District", description: "Find medical stores and clinics near you.", noIndex: false },
    },
    {
      name: "Shopping & Retail",
      slug: "shopping-retail",
      description: "Local kirana stores, daily provisions, traditional clothing, and village markets.",
      icon: "bag",
      sortOrder: 4,
      status: "active",
      seo: { title: "Local Shops & Kirana Stores", description: "Explore retail stores and provisions.", noIndex: false },
    },
    {
      name: "Auto & Repairs",
      slug: "auto-repairs",
      description: "Two and four-wheeler garages, tyre puncture works, and highway breakdown assistance.",
      icon: "wrench",
      sortOrder: 5,
      status: "active",
      seo: { title: "Garages & Mechanics in Nashik", description: "Local vehicle repair and puncture services.", noIndex: false },
    },
    {
      name: "Agriculture & Krushi",
      slug: "agriculture",
      description: "Krushi Seva Kendras, organic fertilizers, seeds, irrigation, and farm equipment.",
      icon: "store",
      sortOrder: 6,
      status: "active",
      seo: { title: "Krushi Seva Kendras & Agriculture Stores", description: "Fertilizers and farm supplies.", noIndex: false },
    },
    {
      name: "Local Services",
      slug: "local-services",
      description: "Electricians, plumbers, carpentry, hardware, and essential town services.",
      icon: "briefcase",
      sortOrder: 7,
      status: "active",
      seo: { title: "Local Services & Hardware", description: "Trusted local service professionals.", noIndex: false },
    },
  ];

  const parentCats = {};
  for (const c of parentCategoriesData) {
    const doc = await Category.create({ ...c, createdBy: adminUser._id, updatedBy: adminUser._id });
    parentCats[c.slug] = doc;
  }
  console.log(`Created ${Object.keys(parentCats).length} parent categories.`);

  // Child Categories
  const childCategoriesData = [
    {
      name: "Highway Family Dhabas",
      slug: "family-dhabas",
      description: "Famous Mumbai-Nashik highway family dhabas serving authentic Maharashtrian & North Indian food.",
      icon: "utensils",
      parent: parentCats["restaurants"]._id,
      sortOrder: 1,
      status: "active",
    },
    {
      name: "Breakfast & Misal Pav",
      slug: "breakfast-misal",
      description: "Spicy Nashik misal, poha, vadapav, and morning tea stalls.",
      icon: "utensils",
      parent: parentCats["restaurants"]._id,
      sortOrder: 2,
      status: "active",
    },
    {
      name: "Agro Resorts & Farmstays",
      slug: "agro-resorts",
      description: "Experience rural village life, organic farming, and peaceful nature stays.",
      icon: "bed",
      parent: parentCats["hotels-stays"]._id,
      sortOrder: 1,
      status: "active",
    },
    {
      name: "Budget Lodges & Rooms",
      slug: "budget-lodges",
      description: "Clean, affordable overnight rooms for highway travelers and pilgrims.",
      icon: "bed",
      parent: parentCats["hotels-stays"]._id,
      sortOrder: 2,
      status: "active",
    },
    {
      name: "Pharmacies & Medicals",
      slug: "pharmacies",
      description: "Licensed chemist stores offering prescription drugs and emergency medicines.",
      icon: "activity",
      parent: parentCats["healthcare"]._id,
      sortOrder: 1,
      status: "active",
    },
    {
      name: "General Clinics & Doctors",
      slug: "clinics",
      description: "Experienced MBBS & BAMS general physicians and family health clinics.",
      icon: "activity",
      parent: parentCats["healthcare"]._id,
      sortOrder: 2,
      status: "active",
    },
    {
      name: "Kirana & Provision Stores",
      slug: "kirana-stores",
      description: "Daily household goods, spices, grains, and village provision shops.",
      icon: "bag",
      parent: parentCats["shopping-retail"]._id,
      sortOrder: 1,
      status: "active",
    },
    {
      name: "Clothing & Traditional Wear",
      slug: "clothing-textiles",
      description: "Traditional Paithani sarees, festive clothing, and ready-made garments.",
      icon: "bag",
      parent: parentCats["shopping-retail"]._id,
      sortOrder: 2,
      status: "active",
    },
    {
      name: "Two & Four Wheeler Garages",
      slug: "mechanics-puncture",
      description: "Vehicle servicing, oil change, tyre puncture, and breakdown rescue.",
      icon: "wrench",
      parent: parentCats["auto-repairs"]._id,
      sortOrder: 1,
      status: "active",
    },
    {
      name: "Krushi Seva Kendra & Seeds",
      slug: "krushi-seva-kendra",
      description: "Certified seeds, crop fertilizers, pesticides, and modern farming tools.",
      icon: "store",
      parent: parentCats["agriculture"]._id,
      sortOrder: 1,
      status: "active",
    },
  ];

  const allCats = { ...parentCats };
  for (const c of childCategoriesData) {
    const doc = await Category.create({ ...c, createdBy: adminUser._id, updatedBy: adminUser._id });
    allCats[c.slug] = doc;
  }
  console.log(`Created ${childCategoriesData.length} subcategories. Total categories: ${Object.keys(allCats).length}`);

  // Step 3: Seed Locations
  console.log("\n--- STEP 3: SEEDING LOCATIONS ---");
  const locationsData = [
    {
      name: "Ghoti",
      slug: "ghoti",
      type: "town",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422402"] },
      coordinates: { latitude: 19.7214, longitude: 73.6841 },
      status: "active",
      seo: { title: "Local Businesses in Ghoti, Nashik", description: "Discover shops and services in Ghoti.", noIndex: false },
    },
    {
      name: "Igatpuri",
      slug: "igatpuri",
      type: "city",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422403"] },
      coordinates: { latitude: 19.6967, longitude: 73.5621 },
      status: "active",
      seo: { title: "Local Businesses in Igatpuri Hill Station", description: "Resorts, hotels, and places in Igatpuri.", noIndex: false },
    },
    {
      name: "Nashik City",
      slug: "nashik-city",
      type: "city",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422001", "422002"] },
      coordinates: { latitude: 19.9975, longitude: 73.7898 },
      status: "active",
      seo: { title: "Local Businesses in Nashik City", description: "Explore restaurants, medical, and shopping in Nashik.", noIndex: false },
    },
    {
      name: "Trimbakeshwar",
      slug: "trimbakeshwar",
      type: "town",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422212"] },
      coordinates: { latitude: 19.9317, longitude: 73.5308 },
      status: "active",
      seo: { title: "Places & Stays in Trimbakeshwar", description: "Pilgrimage stays, food, and shops.", noIndex: false },
    },
    {
      name: "Sinnar",
      slug: "sinnar",
      type: "town",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422103"] },
      coordinates: { latitude: 19.8458, longitude: 74.0016 },
      status: "active",
      seo: { title: "Local Businesses in Sinnar", description: "Shops, clinics, and services in Sinnar.", noIndex: false },
    },
    {
      name: "Kavathe",
      slug: "kavathe",
      type: "village",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422402"] },
      coordinates: { latitude: 19.7450, longitude: 73.7120 },
      status: "active",
      seo: { title: "Local Businesses in Kavathe Village", description: "Village provisions and services in Kavathe.", noIndex: false },
    },
    {
      name: "Bhagur",
      slug: "bhagur",
      type: "town",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422502"] },
      coordinates: { latitude: 19.9056, longitude: 73.8184 },
      status: "active",
      seo: { title: "Local Businesses in Bhagur", description: "Explore places in historic Bhagur.", noIndex: false },
    },
    {
      name: "Pimpalgaon",
      slug: "pimpalgaon",
      type: "town",
      address: { district: "Nashik", state: "Maharashtra", country: "India", postalCodes: ["422209"] },
      coordinates: { latitude: 20.1706, longitude: 73.9856 },
      status: "active",
      seo: { title: "Krushi & Businesses in Pimpalgaon Baswant", description: "Agricultural hub and market listings.", noIndex: false },
    },
  ];

  const allLocs = {};
  for (const l of locationsData) {
    const doc = await Location.create({ ...l, createdBy: adminUser._id, updatedBy: adminUser._id });
    allLocs[l.slug] = doc;
  }
  console.log(`Created ${Object.keys(allLocs).length} locations.`);

  // Step 4: Seed 10 Initial Businesses
  console.log("\n--- STEP 4: SEEDING 10 INITIAL HIGH-QUALITY BUSINESSES ---");
  const initialBusinessesData = [
    {
      name: "Hotel Kalinga Family Dhaba",
      slug: "hotel-kalinga-family-dhaba",
      tagline: "Authentic Chulivarch Jevan & Highway Dhaba",
      description: "Renowned family dhaba located on NH-160 Ghoti bypass. Famous for authentic country chicken, bhakri, sev bhaji, and quick highway service with spacious family seating.",
      businessType: "restaurant",
      category: allCats["family-dhabas"]._id,
      location: allLocs["ghoti"]._id,
      establishedYear: 2011,
      contact: { phone: "+919822012345", whatsapp: "9822012345", email: "kalingadhaba@gmail.com", preferredMethod: "phone" },
      address: { line1: "NH-160 Ghoti Bypass Road", area: "Ghoti Tollway", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Ghoti Bypass, Nashik 422402" },
      coordinates: { latitude: 19.722, longitude: 73.685 },
      services: [{ name: "Family Dining" }, { name: "Outdoor Seating" }, { name: "Highway Parking" }],
      priceRange: "budget",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Sai Misal House & Snacks",
      slug: "sai-misal-house-snacks",
      tagline: "Traditional Spicy Nashik Tarri Misal",
      description: "Serving piping-hot rassa misal with freshly baked pav, curd, and papad. A must-stop morning destination for travelers passing through Igatpuri hill station.",
      businessType: "restaurant",
      category: allCats["breakfast-misal"]._id,
      location: allLocs["igatpuri"]._id,
      establishedYear: 2016,
      contact: { phone: "+919822023456", whatsapp: "9822023456", email: "", preferredMethod: "any" },
      address: { line1: "Old Agra Road, Near Railway Station", area: "Station Road", city: "Igatpuri", district: "Nashik", state: "Maharashtra", postalCode: "422403", formatted: "Station Road, Igatpuri 422403" },
      coordinates: { latitude: 19.698, longitude: 73.564 },
      services: [{ name: "Breakfast" }, { name: "Takeaway" }],
      priceRange: "budget",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Vaitarna Agro Farmstay & Resort",
      slug: "vaitarna-agro-farmstay-resort",
      tagline: "Lakeside Eco Farmstay & Organic Living",
      description: "Scenic 8-acre agro farmstay overlooking Upper Vaitarna backwaters. Features rustic cottages, organic farm-to-table dining, boating, and tractor rides for families.",
      businessType: "hotel",
      category: allCats["agro-resorts"]._id,
      location: allLocs["ghoti"]._id,
      establishedYear: 2019,
      contact: { phone: "+919822034567", whatsapp: "9822034567", email: "stay@vaitarnaagro.com", website: "https://vaitarnaagro.com", preferredMethod: "whatsapp" },
      address: { line1: "Vaitarna Dam Backwaters Road", area: "Zarwad Khurd", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Zarwad Khurd, Ghoti 422402" },
      coordinates: { latitude: 19.780, longitude: 73.610 },
      services: [{ name: "Cottages" }, { name: "Organic Meals" }, { name: "Campfire" }],
      priceRange: "premium",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Igatpuri Hilltop Residency",
      slug: "igatpuri-hilltop-residency",
      tagline: "Comfortable Mountain Retreat & Banquet",
      description: "Modern hill hotel situated amidst misty peaks of the Western Ghats. Offers AC deluxe rooms, pure veg restaurant, swimming pool, and mountain view balconies.",
      businessType: "hotel",
      category: allCats["hotels-stays"]._id,
      location: allLocs["igatpuri"]._id,
      establishedYear: 2014,
      contact: { phone: "+919822045678", email: "info@hilltopresidency.com", preferredMethod: "phone" },
      address: { line1: "Mumbai-Nashik Highway, Near Toll Plaza", area: "Hill Top", city: "Igatpuri", district: "Nashik", state: "Maharashtra", postalCode: "422403", formatted: "Hill Top, Igatpuri 422403" },
      coordinates: { latitude: 19.702, longitude: 73.558 },
      services: [{ name: "Room Service" }, { name: "Pool" }, { name: "Wi-Fi" }],
      priceRange: "moderate",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Maharashtra 24x7 Medical Store",
      slug: "maharashtra-24x7-medical-store",
      tagline: "Trusted Emergency Medicines & Health Supplies",
      description: "Always open pharmacy providing genuine medicines, baby care products, emergency first-aid supplies, and surgical equipment in the heart of Ghoti market.",
      businessType: "healthcare",
      category: allCats["pharmacies"]._id,
      location: allLocs["ghoti"]._id,
      establishedYear: 2008,
      contact: { phone: "+919822056789", whatsapp: "9822056789", email: "", preferredMethod: "phone" },
      address: { line1: "Shop No. 4, Market Yard Road", area: "Main Bazaar", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Main Bazaar, Ghoti 422402" },
      coordinates: { latitude: 19.720, longitude: 73.682 },
      services: [{ name: "24/7 Service" }, { name: "Home Delivery" }],
      priceRange: "budget",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Shree Ram Family Clinic & Wellness",
      slug: "shree-ram-family-clinic-wellness",
      tagline: "Dedicated General Physician & Child Care",
      description: "Dr. R. K. Patil (BAMS) offering clinical consultation, seasonal fever treatment, pediatric healthcare, and preventive medicine counseling for local families.",
      businessType: "healthcare",
      category: allCats["clinics"]._id,
      location: allLocs["sinnar"]._id,
      establishedYear: 2012,
      contact: { phone: "+919822067890", email: "patilclinic@gmail.com", preferredMethod: "phone" },
      address: { line1: "Opposite Shivaji Statue, Shirdi Road", area: "Shivaji Chowk", city: "Sinnar", district: "Nashik", state: "Maharashtra", postalCode: "422103", formatted: "Shivaji Chowk, Sinnar 422103" },
      coordinates: { latitude: 19.847, longitude: 74.003 },
      services: [{ name: "Outpatient Clinic" }, { name: "Blood Pressure Checks" }],
      priceRange: "budget",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Om Kirana & General Provision",
      slug: "om-kirana-general-provision",
      tagline: "Quality Grains, Spices & Village Essentials",
      description: "Daily village provision store providing fresh cooking oils, pulses, packaged groceries, toiletries, and cold beverages at fair local prices.",
      businessType: "retail",
      category: allCats["kirana-stores"]._id,
      location: allLocs["kavathe"]._id,
      establishedYear: 2015,
      contact: { phone: "+919822078901", email: "", preferredMethod: "phone" },
      address: { line1: "Main Temple Road, Gram Panchayat Chowk", area: "Village Center", city: "Kavathe", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Kavathe, Nashik 422402" },
      coordinates: { latitude: 19.746, longitude: 73.713 },
      services: [{ name: "Daily Essentials" }, { name: "Wholesale Supplies" }],
      priceRange: "budget",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Mahalaxmi Paithani & Saree Center",
      slug: "mahalaxmi-paithani-saree-center",
      tagline: "Handwoven Paithani & Bridal Silk Sarees",
      description: "Traditional silk emporium featuring authentic Yeola Paithani sarees, bridal silks, Nauvari sarees, and traditional Maharashtrian attire.",
      businessType: "retail",
      category: allCats["clothing-textiles"]._id,
      location: allLocs["nashik-city"]._id,
      establishedYear: 2004,
      contact: { phone: "+919822089012", whatsapp: "9822089012", website: "https://mahalaxmisarees.com", preferredMethod: "whatsapp" },
      address: { line1: "MG Road, Raviwar Karanja", area: "Old City", city: "Nashik City", district: "Nashik", state: "Maharashtra", postalCode: "422001", formatted: "MG Road, Nashik 422001" },
      coordinates: { latitude: 19.999, longitude: 73.791 },
      services: [{ name: "Handloom Sarees" }, { name: "Custom Draping" }],
      priceRange: "moderate",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Balaji 24/7 Automobile Garage",
      slug: "balaji-247-automobile-garage",
      tagline: "Highway Breakdown Rescue & Computerized Alignment",
      description: "Full-service multi-brand motor garage specializing in emergency engine repairs, computerized wheel balancing, AC recharge, and highway towing.",
      businessType: "professional_service",
      category: allCats["mechanics-puncture"]._id,
      location: allLocs["ghoti"]._id,
      establishedYear: 2017,
      contact: { phone: "+919822090123", whatsapp: "9822090123", preferredMethod: "phone" },
      address: { line1: "Opposite IOCL Petrol Pump, Highway Cross", area: "Ghoti Bypass", city: "Ghoti", district: "Nashik", state: "Maharashtra", postalCode: "422402", formatted: "Ghoti Highway Cross 422402" },
      coordinates: { latitude: 19.724, longitude: 73.687 },
      services: [{ name: "Towing" }, { name: "Engine Repairs" }, { name: "Tyre Works" }],
      priceRange: "moderate",
      status: "published",
      isFeatured: false,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
    {
      name: "Kisan Krushi Seva Kendra & Seeds",
      slug: "kisan-krushi-seva-kendra-seeds",
      tagline: "Certified Seeds, Organic Pesticides & Drip Systems",
      description: "Authorized agricultural input center serving grape and onion farmers of Pimpalgaon and Nashik. Stocking government-approved hybrid seeds, bio-fertilizers, and drip accessories.",
      businessType: "retail",
      category: allCats["krushi-seva-kendra"]._id,
      location: allLocs["pimpalgaon"]._id,
      establishedYear: 2010,
      contact: { phone: "+919822101234", email: "kisankrushi@gmail.com", preferredMethod: "phone" },
      address: { line1: "Near APMC Fruit Market, Lasalgaon Road", area: "APMC Yard", city: "Pimpalgaon", district: "Nashik", state: "Maharashtra", postalCode: "422209", formatted: "APMC Yard, Pimpalgaon 422209" },
      coordinates: { latitude: 20.172, longitude: 73.987 },
      services: [{ name: "Soil Testing Advice" }, { name: "Drip Irrigation Parts" }],
      priceRange: "budget",
      status: "published",
      isFeatured: true,
      verificationStatus: "verified",
      publishedAt: new Date(),
    },
  ];

  for (const b of initialBusinessesData) {
    await Business.create({
      ...b,
      services: b.services.map((s) => (typeof s === "string" ? s : s.name)),
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });
  }
  console.log(`Created ${initialBusinessesData.length} initial published businesses.`);

  // Step 5: Seed Sample Business Submissions
  console.log("\n--- STEP 5: SEEDING SAMPLE SUBMISSIONS FOR ADMIN REVIEW ---");
  const sampleSubmissions = [
    {
      businessName: "Gauri Agro Tourism & Tents",
      contactName: "Gaurav Shinde",
      email: "gaurav.shinde@gmail.com",
      phone: "+919855512345",
      locationName: "Igatpuri",
      categoryName: "Hotels & Stays",
      website: "https://gauriagro.in",
      message: "We have an agro camp with 10 Swiss tents near Bhavali dam. Would like to get listed on GaavConnect.",
      status: "pending",
    },
    {
      businessName: "Mauli Electrical Works",
      contactName: "Mahesh Jadhav",
      email: "mahesh.jadhav@gmail.com",
      phone: "+919855523456",
      locationName: "Ghoti",
      categoryName: "Local Services",
      website: "",
      message: "Domestic wiring, motor rewindings and electrical repair shop in Ghoti bazaar.",
      status: "pending",
    },
  ];
  for (const s of sampleSubmissions) {
    await BusinessSubmission.create(s);
  }
  console.log(`Created ${sampleSubmissions.length} pending submissions.`);

  console.log("\nSEEDING COMPLETED SUCCESSFULLY!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
