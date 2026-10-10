import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import StructuredData from "@/components/structured-data";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";
import LocationsDirectoryClient from "@/components/locations-directory-client";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const title = "Explore Towns, Villages & Cities in Nashik District (Ghoti, Igatpuri) | GaavConnect";
  const description =
    "Discover verified businesses, highway dhabas, farmstays, clinics, and services across Ghoti, Igatpuri, Trimbakeshwar, Sinnar, and Nashik City on GaavConnect.";
  const canonical = `${siteUrl}/locations`;
  const logoUrl = `${siteUrl}/gaavconnect-logo.svg`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      "locations in Nashik",
      "Igatpuri directory",
      "Ghoti local area",
      "Trimbakeshwar shops",
      "Sinnar businesses",
      "Nashik district towns",
      "GaavConnect locations",
    ],
    alternates: { canonical },
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
      siteName: "GaavConnect",
      url: canonical,
      locale: "en_IN",
      images: [{ url: logoUrl, alt: "GaavConnect Locations Directory" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@gaavconnect.in",
      creator: "@gaavconnect.in",
      images: [logoUrl],
    },
  };
}

export default async function LocationsPage() {
  let locations = [];
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";

  try {
    await connectDB();
    const rawLocations = await Location.find({ status: "active", "seo.noIndex": { $ne: true } })
      .select("name slug description type coverImage sortOrder address seo coordinates")
      .sort({ sortOrder: 1, name: 1 })
      .limit(100)
      .lean()
      .exec();

    locations = JSON.parse(JSON.stringify(rawLocations));
  } catch (error) {
    console.error("[LOCATION DIRECTORY]", error.message);
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/locations#page`,
        name: "Towns, Villages & Cities in Nashik District",
        description: "Explore all towns and locations across Nashik, Ghoti, and Igatpuri.",
        url: `${siteUrl}/locations`,
        isPartOf: { "@type": "WebSite", name: "GaavConnect", url: siteUrl },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: locations.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: `${siteUrl}/locations/${item.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Locations", item: `${siteUrl}/locations` },
        ],
      },
    ],
  };

  return (
    <main className="locations-page-wrapper">
      <StructuredData data={structuredData} />
      <PublicNavbar activePath="/locations" />
      <LocationsDirectoryClient initialLocations={locations} />
      <PublicFooter />
    </main>
  );
}
