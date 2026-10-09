import Link from "next/link";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import StructuredData from "@/components/structured-data";
import PublicNavbar from "@/components/public-navbar";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Local Areas in Nashik District",
  description: "Discover businesses and useful services around Ghoti, Igatpuri, Nashik and nearby communities in Maharashtra with GaavConnect.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "Explore Local Areas in Nashik District | GaavConnect",
    description: "Find local businesses and services across towns, villages and neighbourhoods in Nashik district.",
    type: "website",
    locale: "en_IN",
  },
};

export default async function LocationsPage() {
  let locations = [];
  const settings = await getGlobalSeoSettings();
  try {
    await connectDB();
    locations = await Location.find({ status: "active", "seo.noIndex": { $ne: true } })
      .select("name slug description type coverImage sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .limit(100)
      .lean()
      .exec();
  } catch (error) {
    console.error("[LOCATION DIRECTORY]", error.message);
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Local areas in Nashik district",
    url: `${settings.siteUrl}/locations`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: locations.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: `${settings.siteUrl}/locations/${item.slug}`,
      })),
    },
  };

  return (
    <main className="directory-page">
      <StructuredData data={structuredData} />
      <PublicNavbar activePath="/locations" />
      <section className="detail-state">
        <span className="eyebrow">DISCOVER NEAR YOU</span>
        <h1>Explore local areas and villages</h1>
        <p>Find local businesses and services across Ghoti, Igatpuri, Nashik and surrounding villages in Maharashtra.</p>
      </section>
      {locations.length ? (
        <section className="detail-listing-section">
          <div className="collection-grid">
            {locations.map((item) => (
              <Link className="collection-card" key={item._id} href={`/locations/${item.slug}`}>
                {item.coverImage?.url ? (
                  <img
                    src={item.coverImage.url}
                    alt={item.coverImage.alt || item.name}
                    className="collection-card-thumbnail"
                    style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <span className="collection-symbol collection-symbol-2">⌖</span>
                )}
                <span className="collection-card-copy">
                  <strong>{item.name}</strong>
                  <small>{item.description || `Discover local businesses in ${item.name}.`}</small>
                </span>
                <span className="collection-arrow">↗</span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="detail-state">
          <h2>Local areas are being added</h2>
          <p>Check back soon, or browse the current business directory.</p>
          <Link className="detail-primary" href="/businesses">Browse businesses ↗</Link>
        </section>
      )}
    </main>
  );
}
