import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Business from "@/models/Business";
import StructuredData from "@/components/structured-data";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";
import CategoryBrowser from "@/components/category-browser";

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
  const countMap = {};
  const settings = await getGlobalSeoSettings();

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
    <>
      <StructuredData data={structuredData} />
      <CategoryBrowser categories={categories} countMap={countMap} />
    </>
  );
}

