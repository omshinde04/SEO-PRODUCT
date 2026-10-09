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
    const [settings, businesses, categories, locations, content, noIndexTemplates] = await Promise.all([
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
    for (const item of content) {
      if (noIndexTypes.has(item.kind)) continue;
      const segment = item.kind === "place" ? "places" : item.kind === "guide" ? "guides" : "events";
      entries.push({ url: `${base}/${segment}/${item.slug}`, lastModified: item.updatedAt || now });
    }

    return entries;
  } catch (error) {
    console.error("[SITEMAP]", error.message);
    return [];
  }
}
