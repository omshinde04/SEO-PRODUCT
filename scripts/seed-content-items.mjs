import mongoose from "mongoose";
import ContentItem from "../models/ContentItem.js";
import Location from "../models/Location.js";
import User from "../models/User.js";

await mongoose.connect(process.env.MONGODB_URI);

const adminUser = await User.findOne({ role: "admin" });
if (!adminUser) {
  console.error("Admin user not found!");
  process.exit(1);
}

const igatpuri = await Location.findOne({ slug: "igatpuri" });
const ghoti = await Location.findOne({ slug: "ghoti" });
const nashik = await Location.findOne({ slug: "nashik-city" });
const trimbak = await Location.findOne({ slug: "trimbakeshwar" });

console.log("Found locations:", {
  igatpuri: igatpuri?._id,
  ghoti: ghoti?._id,
  nashik: nashik?._id,
  trimbak: trimbak?._id,
});

// 1. Clean up duplicate test guides
await ContentItem.deleteMany({
  kind: "guide",
  slug: { $regex: /^guide-nashik-food-trail-/ },
});
console.log("Cleaned up old test guide duplicates.");

// 2. Seed authentic curated guides
const guidesToSeed = [
  {
    kind: "guide",
    title: "The Ultimate Highway Food Trail from Ghoti to Igatpuri",
    slug: "highway-food-trail-ghoti-igatpuri",
    summary:
      "A culinary road trip along NH160 featuring highway dhabas, roadside chai stalls, authentic spicy misal, and rustic Maharashtrian bhakri meals.",
    body: `## The Mumbai-Nashik Highway Culinary Belt
Stretching across the foot of the Western Ghats, the highway stretch between Kasara Ghat, Igatpuri, and Ghoti is celebrated across Maharashtra for authentic roadside eateries and 24-hour food stops.

## Breakfast Pitstops & Highway Misal
Start your morning around Ghoti toll plaza with piping hot spicy Misal Pav served with crunchy farsan, rassa tarri, fresh chopped onions, and lemon. Famous local stalls prepare their gravy using locally pounded goda masala.

## Traditional Dhabas for Lunch & Dinner
For hearty afternoon and evening meals, family dhabas like Hotel Kalinga and roadside Punjabi & Maharashtrian dhabas serve tandoori rotis, bajra bhakri with thecha, paneer handi, and slow-cooked mutton handi prepared on wood-fire stoves.

## Tips for Highway Travelers
Always check parking availability before stopping during peak monsoon weekends. Most highway establishments accept UPI payment, and vegetarian family sections are widely available.`,
    status: "published",
    location: igatpuri?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
  {
    kind: "guide",
    title: "Weekend Itinerary in Igatpuri: Waterfalls, Fog & Nature Trails",
    slug: "weekend-itinerary-igatpuri-waterfalls",
    summary:
      "How to plan the perfect 2-day monsoon and winter getaway in Igatpuri. Highlights include Bhavali Dam, Camel Valley, peaceful agro-stays, and local markets.",
    body: `## Day 1: Mountain Passes & Lakeside Serenity
Arrive in Igatpuri by morning. Drive through the mist towards Bhavali Dam, where lush green hills and freshwater streams create one of the most tranquil picnic settings in the region.

## Afternoon: Historic Forts & Heritage
Head toward Tringalwadi Fort for a gentle 1.5-hour hike overlooking the lake basin. Visit the rock-cut Buddhist and Jain cave shrines carved into the cliff base.

## Day 2: Viewpoints, Temples & Local Produce
Catch sunrise at Ghatandevi viewpoint. Before heading home, stop by Ghoti bazaar to pick up organic Indrayani rice, country eggs, and seasonal forest honey directly from local farmers.`,
    status: "published",
    location: igatpuri?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
  {
    kind: "guide",
    title: "The Local's Guide to Ghoti Weekly Sunday Bazaar & Village Market",
    slug: "locals-guide-ghoti-sunday-bazaar",
    summary:
      "A complete guide to experiencing the bustling Sunday market in Ghoti: fresh agricultural harvest, spices, cookware, and rural trade traditions.",
    body: `## A Living Rural Tradition
Every Sunday morning, farmers and village artisans from across dozens of surrounding tribal padas and countryside settlements converge on Ghoti town center for the weekly haat (bazaar).

## What to Buy
1. Fresh produce harvested that morning: leafy greens, country tomatoes, and organic chillies.
2. Hand-pounded spices, turmeric, and local Indrayani and Kolam rice varieties.
3. Handcrafted bamboo baskets, clay cookware, and farming essentials.

## Market Etiquette & Practical Tips
Arrive early between 8:00 AM and 11:00 AM to get the best selection and avoid vehicle congestion near the station road. Cash is preferred by smaller village sellers, although UPI is increasingly accepted.`,
    status: "published",
    location: ghoti?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
];

for (const g of guidesToSeed) {
  await ContentItem.findOneAndUpdate(
    { kind: "guide", slug: g.slug },
    { $set: g },
    { upsert: true, new: true }
  );
}
console.log("Seeded authentic published guides.");

// 3. Seed authentic places & attractions
const placesToSeed = [
  {
    kind: "place",
    title: "Bhavali Dam & Waterfall Belt",
    slug: "bhavali-dam-waterfalls",
    summary:
      "A pristine earthen dam on the Bham river offering tranquil waters, lush green backdrop, and spectacular roadside cascades during the monsoon months.",
    body: `## Overview
Located approximately 10 km from Igatpuri town, Bhavali Dam is a peaceful reservoir surrounded by the Sahyadri mountains. The reservoir serves as the primary freshwater source for surrounding villages and offers stunning scenic vistas away from commercial crowds.

## Key Highlights
- **Scenic Cascade Points**: During July to September, overflow streams create sparkling roadside waterfalls that are safe and accessible for families.
- **Birdwatching & Photography**: Early mornings offer clear water reflections, migratory waterbirds, and tranquil fog over the reservoir.

## Visitor Guidelines
- Keep the reservoir pristine by avoiding plastic litter.
- There are no commercial stalls right at the water's edge, so carry drinking water and refreshments from Igatpuri town.`,
    status: "published",
    location: igatpuri?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
  {
    kind: "place",
    title: "Tringalwadi Fort & Rock-Cut Cave",
    slug: "tringalwadi-fort-and-cave",
    summary:
      "A 10th-century hill fortress situated at 3,238 feet, featuring ancient carved caves, Jain and Buddhist stone carvings, and panoramic views of Tringalwadi lake.",
    body: `## Historical Significance
Tringalwadi Fort stands guarding the ancient trade route connecting Konkan with Khandesh. At the base of the fort lies a magnificent carved cave featuring a seated deity and carved pillared verandahs dating back to the 10th century.

## Trek Details
- **Difficulty**: Easy to Moderate.
- **Duration**: Approximately 1.5 to 2 hours from Tringalwadi village.
- **Best Season**: June to February when the lake is full and surrounding grasslands are vibrant green.`,
    status: "published",
    location: igatpuri?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
  {
    kind: "place",
    title: "Ghatandevi Temple & Camel Valley Lookouts",
    slug: "ghatandevi-temple-camel-valley",
    summary:
      "Dedicated to Ghatandevi (Protector of the Ghats), this shrine overlooks the dramatic gorges of Kasara Ghat and Camel Valley.",
    body: `## The Shrine of the Ghats
Local truck drivers, travelers, and pilgrims have paid homage at Ghatandevi Mandir for generations before embarking on the descent through Thal Ghat.

## Camel Valley
Directly behind the temple compound lies Camel Valley, a dramatic cleft dropping thousands of feet toward the Konkan plains where sudden monsoon clouds and waterfalls form.`,
    status: "published",
    location: igatpuri?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
];

for (const p of placesToSeed) {
  await ContentItem.findOneAndUpdate(
    { kind: "place", slug: p.slug },
    { $set: p },
    { upsert: true, new: true }
  );
}
console.log("Seeded authentic published places.");

// 4. Seed authentic events
const eventsToSeed = [
  {
    kind: "event",
    title: "Ghoti Weekly Sunday Farmer Bazaar & Rural Trade Fair",
    slug: "ghoti-weekly-farmer-bazaar",
    summary:
      "A weekly Sunday morning market gathering thousands of rural growers, artisans, and livestock traders across the Ghoti-Igatpuri tehsil.",
    body: `## About the Market
Held every Sunday morning in the open market grounds of Ghoti, this gathering is the primary commercial pulse of the taluka. Experience authentic village commerce, seasonal farm produce, regional spices, and local sweets.

## Timing & Venue
- **When**: Every Sunday, 8:00 AM – 3:00 PM
- **Venue**: Ghoti Bazaar Grounds, Near Railway Station, Ghoti, Maharashtra 422402
- **Entry**: Free and open to the general public`,
    event: {
      startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
      venue: "Ghoti Bazaar Grounds, Station Road, Ghoti",
      registrationUrl: "",
    },
    status: "published",
    location: ghoti?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
  {
    kind: "event",
    title: "Igatpuri Monsoon Camping & Cloud Watching Fest",
    slug: "igatpuri-monsoon-camping-fest",
    summary:
      "An immersive outdoor weekend camp featuring tent stays, starry mountain skies, live acoustic folk music, and guided treks to nearby streams.",
    body: `## Experience the Western Ghats
Escape the urban noise and spend a weekend immersed in the mist. Organized at lakeside agro-farms near Igatpuri, this family-friendly camp features:
- Barbecue dinners with authentic rural Maharashtrian dishes.
- Guided sunrise walk to Bhavali streams.
- Bonfire acoustic sessions and stargazing.`,
    event: {
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // in 7 days
      endsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      venue: "Lakeside Agro Grounds, Bhavali Dam Road, Igatpuri",
      registrationUrl: "https://gaavconnect.in/events/igatpuri-monsoon-camping-fest",
    },
    status: "published",
    location: igatpuri?._id || null,
    publishedAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  },
];

for (const e of eventsToSeed) {
  await ContentItem.findOneAndUpdate(
    { kind: "event", slug: e.slug },
    { $set: e },
    { upsert: true, new: true }
  );
}
console.log("Seeded authentic published events.");

await mongoose.disconnect();
console.log("Seeding completed successfully!");
