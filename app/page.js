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
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const title = settings.defaultTitle || "GaavConnect — Local Businesses & Places in Nashik District (Ghoti, Igatpuri)";
  const description = settings.defaultDescription || "Discover verified local shops, highway dhabas, farmstays, trusted services, and places across Ghoti, Igatpuri, Nashik City, and NH-160 highway on GaavConnect.";
  const image = settings.defaultImage || `${siteUrl}/gaavconnect-logo.svg`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      "local businesses in Nashik district",
      "Ghoti business directory",
      "Igatpuri shops and hotels",
      "best highway dhabas NH-160",
      "Nashik farmstays and resorts",
      "Trimbakeshwar local services",
      "Sinnar shops",
      "misal pav Igatpuri Ghoti",
      "Om Vilas Shinde",
      "GaavConnect",
    ],
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: settings.siteName || "GaavConnect",
      locale: "en_IN",
      url: siteUrl,
      images: [{ url: image, alt: "GaavConnect — Local Discovery in Nashik District" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@gaavconnect.in",
      creator: "@gaavconnect.in",
      images: [image],
    },
  };
}

export default async function Home() {
  let initialData = { businesses: [], categories: [], locations: [], pagination: null };
  try {
    await connectDB();
    const [businesses, categories, locations] = await Promise.all([
      Business.find({ status: "published", "seo.noIndex": { $ne: true } })
        .select("name slug tagline description businessType category location address coverImage images logo isFeatured isSponsored sponsoredTagline sponsoredBadge sponsoredPriority sponsoredUntil verificationStatus contact")
        .populate({ path: "category", select: "name slug description icon", match: { status: "active", "seo.noIndex": { $ne: true } } })
        .populate({ path: "location", select: "name slug type address coverImage", match: { status: "active", "seo.noIndex": { $ne: true } } })
        .sort({ isSponsored: -1, sponsoredPriority: -1, isFeatured: -1, publishedAt: -1, name: 1 })
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
    const now = new Date();
    const visibleBusinesses = businesses
      .filter((item) => item.category && item.location)
      .map((item) => {
        if (item.isSponsored && item.sponsoredUntil && new Date(item.sponsoredUntil) < now) {
          return { ...item, isSponsored: false };
        }
        return item;
      });
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
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: settings.siteName || "GaavConnect",
        url: siteUrl,
        description: settings.defaultDescription,
        inLanguage: ["en-IN", "mr-IN"],
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/businesses?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: settings.organizationName || "GaavConnect",
        url: siteUrl,
        logo: `${siteUrl}/gaavconnect-logo.svg`,
        founder: {
          "@type": "Person",
          name: "Om Vilas Shinde",
          jobTitle: "Founder & CEO",
          url: `${siteUrl}/about`,
        },
        sameAs: [
          "https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3",
          "https://www.instagram.com/gaavconnect.in/",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+919373545169",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["en", "mr", "hi"],
        },
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: settings.defaultTitle,
        description: settings.defaultDescription,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: {
          "@type": "Place",
          name: "Nashik District",
          address: {
            "@type": "PostalAddress",
            addressRegion: "Maharashtra",
            addressCountry: "IN",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 19.9975,
            longitude: 73.7898,
          },
        },
      },
    ],
  };

  return <><StructuredData data={structuredData} /><PublicHome initialData={initialData} /></>;
}
