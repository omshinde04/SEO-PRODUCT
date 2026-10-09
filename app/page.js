import PublicHome from "@/components/public-home";
import StructuredData from "@/components/structured-data";
import { connectDB } from "@/lib/db";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getGlobalSeoSettings();
  const title = settings.defaultTitle || "GaavConnect — Discover Local Businesses in Nashik District";
  const description = settings.defaultDescription || "Discover local shops, restaurants, trusted services, stays and places across Ghoti, Igatpuri and Nashik, Maharashtra with GaavConnect.";
  const image = settings.defaultImage || undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: settings.siteName || "GaavConnect",
      locale: "en_IN",
      url: settings.siteUrl,
      ...(image ? { images: [{ url: image, alt: settings.siteName || "GaavConnect" }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

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
    const visibleBusinesses = businesses.filter((item) => item.category && item.location);
    initialData = {
      businesses: visibleBusinesses,
      categories,
      locations,
      pagination: { page: 1, limit: 8, total: visibleBusinesses.length, totalPages: visibleBusinesses.length ? 1 : 0 },
    };
    initialData = JSON.parse(JSON.stringify(initialData));
  } catch (error) {
    console.error("[PUBLIC HOME] Initial listings unavailable:", error.message);
  }

  const settings = await getGlobalSeoSettings();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: settings.defaultTitle,
    description: settings.defaultDescription,
    url: `${settings.siteUrl}/`,
    about: { "@type": "Place", name: "Nashik district, Maharashtra, India" },
    isPartOf: { "@type": "WebSite", name: settings.siteName, url: settings.siteUrl },
  };

  return <><StructuredData data={structuredData} /><PublicHome initialData={initialData} /></>;
}
