import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import ContentItem from "@/models/ContentItem";
import { SEOSettings, SEOTemplate } from "@/models/SEOConfig";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  try {
    await connectDB();
    const [settings, businesses, categories, locations, contentItems, noIndexTemplates] = await Promise.all([
      SEOSettings.findOne({ key: "global" }).select("siteUrl sitemapEnabled robotsIndex").lean().exec(),
      Business.find({ status: "published", "seo.noIndex": { $ne: true } }).select("slug updatedAt").lean().exec(),
      Category.find({ status: "active", "seo.noIndex": { $ne: true } }).select("slug updatedAt").lean().exec(),
      Location.find({ status: "active", "seo.noIndex": { $ne: true } }).select("slug updatedAt").lean().exec(),
      ContentItem.find({ status: "published", "seo.noIndex": { $ne: true } }).select("kind slug updatedAt").lean().exec(),
      SEOTemplate.find({ noIndexByDefault: true }).select("entityType").lean().exec(),
    ]);

    if (settings?.sitemapEnabled === false || settings?.robotsIndex === false) return [];

    const base = (settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://gaavconnect.in").replace(/\/$/, "");
    if (!/^https?:\/\//i.test(base)) return [];

    const noIndexTypes = new Set(noIndexTemplates.map((item) => item.entityType));
    const now = new Date();
    const entries = [
      { url: base, lastModified: now },
      { url: `${base}/businesses`, lastModified: now },
      { url: `${base}/categories`, lastModified: now },
      { url: `${base}/locations`, lastModified: now },
      { url: `${base}/places`, lastModified: now },
      { url: `${base}/guides`, lastModified: now },
      { url: `${base}/events`, lastModified: now },
      { url: `${base}/about`, lastModified: now },
      { url: `${base}/how-it-works`, lastModified: now },
      { url: `${base}/for-businesses`, lastModified: now },
      { url: `${base}/contact`, lastModified: now },
      { url: `${base}/help`, lastModified: now },
      { url: `${base}/safety`, lastModified: now },
      { url: `${base}/privacy`, lastModified: now },
      { url: `${base}/cookies`, lastModified: now },
      { url: `${base}/accessibility`, lastModified: now },
      { url: `${base}/guides/choosing-a-local-service`, lastModified: now },
      { url: `${base}/guides/useful-business-listing`, lastModified: now },
      { url: `${base}/guides/before-you-visit`, lastModified: now },
      { url: `${base}/guides/business-discovery-basics`, lastModified: now },
    ];

    if (!noIndexTypes.has("category")) {
      for (const item of categories) entries.push({ url: `${base}/categories/${item.slug}`, lastModified: item.updatedAt || now });
    }
    if (!noIndexTypes.has("location")) {
      for (const item of locations) entries.push({ url: `${base}/locations/${item.slug}`, lastModified: item.updatedAt || now });
    }
    if (!noIndexTypes.has("business")) {
      for (const item of businesses) entries.push({ url: `${base}/businesses/${item.slug}`, lastModified: item.updatedAt || now });
    }
    for (const item of contentItems) {
      const segment = item.kind === "guide" ? "guides" : item.kind === "place" ? "places" : "events";
      entries.push({ url: `${base}/${segment}/${item.slug}`, lastModified: item.updatedAt || now });
    }
    return entries;
  } catch (error) {
    console.error("[SITEMAP]", error.message);
    return [];
  }
}
