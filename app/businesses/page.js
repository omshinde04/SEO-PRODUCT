import BusinessDirectory from "@/components/business-directory";
import StructuredData from "@/components/structured-data";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const title = "Explore Verified Businesses in Nashik District (Ghoti, Igatpuri) | GaavConnect";
  const description =
    "Search verified local shops, highway dhabas, farmstays, medical stores, mechanics, and agro services across Ghoti, Igatpuri, and Nashik district on GaavConnect.";
  const canonical = `${siteUrl}/businesses`;
  const logoUrl = `${siteUrl}/gaavconnect-logo.svg`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      "businesses in Nashik",
      "Igatpuri businesses",
      "Ghoti local shops",
      "highway dhabas NH-160",
      "farmstays in Nashik",
      "local directory Nashik district",
      "GaavConnect",
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
      images: [{ url: logoUrl, alt: "GaavConnect Local Business Directory" }],
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

export default async function BusinessesPage() {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/businesses#page`,
        name: "Verified Businesses in Nashik District (Ghoti, Igatpuri)",
        description: "Browse verified local listings, food spots, stays, and services in Nashik district.",
        url: `${siteUrl}/businesses`,
        isPartOf: { "@type": "WebSite", name: "GaavConnect", url: siteUrl },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Businesses", item: `${siteUrl}/businesses` },
        ],
      },
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <BusinessDirectory />
    </>
  );
}
