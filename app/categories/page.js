import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Business from "@/models/Business";
import StructuredData from "@/components/structured-data";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";
import CategoryBrowser from "@/components/category-browser";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const title = "Browse Business Categories in Nashik District (Ghoti, Igatpuri) | GaavConnect";
  const description =
    "Explore business categories across Nashik district — from highway dhabas and misal joints to agro farmstays, medical stores, mechanics, and shops on GaavConnect.";
  const canonical = `${siteUrl}/categories`;
  const logoUrl = `${siteUrl}/gaavconnect-logo.svg`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      "business categories Nashik",
      "Igatpuri restaurants and dhabas",
      "Ghoti local shops",
      "agro resorts Nashik",
      "mechanics NH-160",
      "GaavConnect directory",
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
      images: [{ url: logoUrl, alt: "GaavConnect Categories Directory" }],
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

export default async function CategoriesPage() {
  let categories = [];
  const countMap = {};
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";

  try {
    await connectDB();
    const [cats, counts] = await Promise.all([
      Category.find({ status: "active", "seo.noIndex": { $ne: true } })
        .select("name slug description icon parent sortOrder")
        .sort({ sortOrder: 1, name: 1 })
        .limit(100)
        .lean()
        .exec(),
      Business.aggregate([
        { $match: { status: "published", "seo.noIndex": { $ne: true } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    categories = JSON.parse(JSON.stringify(cats));
    counts.forEach((c) => {
      if (c._id) {
        countMap[c._id.toString()] = c.count;
      }
    });
  } catch (error) {
    console.error("[CATEGORY DIRECTORY]", error.message);
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/categories#page`,
        name: "Local Business Categories in Nashik District",
        description: "Explore all business categories across Nashik, Ghoti, and Igatpuri.",
        url: `${siteUrl}/categories`,
        isPartOf: { "@type": "WebSite", name: "GaavConnect", url: siteUrl },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: categories.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: `${siteUrl}/categories/${item.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Categories", item: `${siteUrl}/categories` },
        ],
      },
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <CategoryBrowser categories={categories} countMap={countMap} />
    </>
  );
}
