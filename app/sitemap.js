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

    const staticEntries = [
      { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
      { url: `${base}/businesses`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
      { url: `${base}/locations`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/places`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
      { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
      { url: `${base}/events`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
      { url: `${base}/promote`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
      { url: `${base}/add-business`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
      { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
      { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
      { url: `${base}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/for-businesses`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/safety`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
      { url: `${base}/cookies`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
      { url: `${base}/accessibility`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
      { url: `${base}/guides/choosing-a-local-service`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/guides/useful-business-listing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/guides/before-you-visit`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/guides/business-discovery-basics`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ];

    const dynamicEntries = [];

    if (!noIndexTypes.has("location")) {
      for (const item of locations) {
        dynamicEntries.push({
          url: `${base}/locations/${item.slug}`,
          lastModified: item.updatedAt || now,
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    }

    if (!noIndexTypes.has("category")) {
      for (const item of categories) {
        dynamicEntries.push({
          url: `${base}/categories/${item.slug}`,
          lastModified: item.updatedAt || now,
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    }

    if (!noIndexTypes.has("business")) {
      for (const item of businesses) {
        dynamicEntries.push({
          url: `${base}/businesses/${item.slug}`,
          lastModified: item.updatedAt || now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    for (const item of contentItems) {
      const segment = item.kind === "guide" ? "guides" : item.kind === "place" ? "places" : "events";
      dynamicEntries.push({
        url: `${base}/${segment}/${item.slug}`,
        lastModified: item.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }

    return [...staticEntries, ...dynamicEntries];
  } catch (error) {
    console.error("[SITEMAP]", error.message);
    return [];
  }
}
