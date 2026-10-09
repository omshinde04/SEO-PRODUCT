import PublicHome from "@/components/public-home";
import StructuredData from "@/components/structured-data";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "GaavConnect — Discover Local Businesses in Nashik District",
  description: "Discover local shops, restaurants, trusted services, stays and places across Ghoti, Igatpuri and Nashik, Maharashtra with GaavConnect.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "GaavConnect — Discover Local Businesses in Nashik District",
    description: "Find local businesses, useful services and places worth discovering across Nashik district.",
    type: "website",
    locale: "en_IN",
  },
};

export default async function Home() {
  let initialData = { businesses: [], categories: [], locations: [], pagination: null };
  try {
    await connectDB();
    const [businesses, categories, locations] = await Promise.all([
      Business.find({ status: "published", "seo.noIndex": { $ne: true } })
        .select("name slug tagline description businessType category location address coverImage images logo isFeatured verificationStatus")
        .populate({ path: "category", select: "name slug description icon", match: { status: "active", "seo.noIndex": { $ne: true } } })
        .populate({ path: "location", select: "name slug type address coverImage", match: { status: "active", "seo.noIndex": { $ne: true } } })
        .sort({ isFeatured: -1, publishedAt: -1, name: 1 })
        .limit(8)
        .lean()
        .exec(),
      Category.find({ status: "active", "seo.noIndex": { $ne: true } })
        .select("name slug description icon sortOrder")
        .sort({ sortOrder: 1, name: 1 })
        .limit(12)
        .lean()
        .exec(),
      Location.find({ status: "active", "seo.noIndex": { $ne: true } })
        .select("name slug description type sortOrder")
        .sort({ sortOrder: 1, name: 1 })
        .limit(30)
        .lean()
        .exec(),
    ]);
    initialData = {
      businesses: businesses.filter((item) => item.category && item.location),
      categories,
      locations,
      pagination: { page: 1, limit: 8, total: businesses.length, totalPages: businesses.length ? 1 : 0 },
    };
    initialData = JSON.parse(JSON.stringify(initialData));
  } catch (error) {
    console.error("[PUBLIC HOME] Initial listings unavailable:", error.message);
  }

  const settings = await getGlobalSeoSettings();\n  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "GaavConnect — Discover Local Businesses in Nashik District",
    description: "Discover local businesses, shops, restaurants and services across Ghoti, Igatpuri and Nashik, Maharashtra.",
    url: "https://gaavconnect.in/",
    about: { "@type": "Place", name: "Nashik district, Maharashtra, India" },
  };

  return <><StructuredData data={structuredData} /><PublicHome initialData={initialData} /></>;
}
