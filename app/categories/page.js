import Link from "next/link";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import StructuredData from "@/components/structured-data";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Local Business Categories in Nashik",
  description: "Explore local business categories on GaavConnect, from food and shopping to healthcare, professional services, stays and tourism in Nashik district.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "Browse Local Business Categories in Nashik | GaavConnect",
    description: "Explore categories and find nearby businesses and services across Nashik district.",
    type: "website",
    locale: "en_IN",
  },
};

export default async function CategoriesPage() {
  let categories = [];
  const settings = await getGlobalSeoSettings();
  try {
    await connectDB();
    categories = await Category.find({ status: "active", "seo.noIndex": { $ne: true } })
      .select("name slug description icon sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .limit(100)
      .lean()
      .exec();
  } catch (error) {
    console.error("[CATEGORY DIRECTORY]", error.message);
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Local business categories in Nashik district",
    url: `${settings.siteUrl}/categories`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categories.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: `${settings.siteUrl}/categories/${item.slug}`,
      })),
    },
  };

  return (
    <main className="directory-page">
      <StructuredData data={structuredData} />
      <header className="directory-header"><Link href="/">← GaavConnect</Link><Link href="/businesses">Explore businesses ↗</Link></header>
      <section className="detail-state">
        <span className="eyebrow">DISCOVER BY CATEGORY</span>
        <h1>Browse local business categories</h1>
        <p>Explore shops, restaurants, healthcare, professional services, stays and experiences across Ghoti, Igatpuri, Nashik and nearby villages.</p>
      </section>
      {categories.length ? <section className="detail-listing-section"><div className="collection-grid">{categories.map((item) => <Link className="collection-card" key={item._id} href={`/categories/${item.slug}`}><span className="collection-symbol collection-symbol-2">{item.icon ? "✦" : "⌕"}</span><span className="collection-card-copy"><strong>{item.name}</strong><small>{item.description || `Explore ${item.name.toLowerCase()} in your area.`}</small></span><span className="collection-arrow">↗</span></Link>)}</div></section> : <section className="detail-state"><h2>Categories are being added</h2><p>Check back soon, or browse the current business directory.</p><Link className="detail-primary" href="/businesses">Browse businesses ↗</Link></section>}
    </main>
  );
}
