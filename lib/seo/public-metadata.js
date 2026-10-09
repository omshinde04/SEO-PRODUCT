import "server-only";

import { connectDB } from "@/lib/db";
import { SEOSettings, SEOTemplate } from "@/models/SEOConfig";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import ContentItem from "@/models/ContentItem";

const DEFAULT_SITE_URL = "https://gaavconnect.in";
const DEFAULT_DESCRIPTION = "Discover local businesses, shops, restaurants, services, stays and places across Ghoti, Igatpuri and Nashik, Maharashtra with GaavConnect.";

function clean(value, max = 300) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}
function applyTemplate(template, value, entity, base) {
    const source = clean(template);
    if (!source) return clean(value);
    return source
        .replace(/%s/g, clean(value))
        .replace(/\{name\}/g, clean(entity?.name || entity?.title))
        .replace(/\{slug\}/g, clean(entity?.slug))
        .replace(/\{siteName\}/g, clean(base.siteName))
        .replace(/\{url\}/g, entity?.slug ? `${base.siteUrl}/${entity.path || ""}/${entity.slug}`.replace(/([^:]\/)\/+/g, "$1") : base.siteUrl)
        .trim();
}
function safeSiteUrl(value) {
    try {
        const url = new URL(value);
        return ["https:", "http:"].includes(url.protocol) ? url.origin : DEFAULT_SITE_URL;
    } catch {
        return DEFAULT_SITE_URL;
    }
}

export async function getGlobalSeoSettings() {
    const fallback = {
        siteName: "GaavConnect",
        siteUrl: safeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),
        defaultTitle: "Discover Local Businesses in Nashik District",
        titleTemplate: "%s | GaavConnect",
        defaultDescription: DEFAULT_DESCRIPTION,
        defaultImage: "",
        robotsIndex: true,
        sitemapEnabled: true,
        organizationName: "GaavConnect",
        organizationLogo: "",
    };
    try {
        await connectDB();
        const settings = await SEOSettings.findOne({ key: "global" }).lean().exec();
        if (!settings) return fallback;
        return {
            ...fallback,
            ...settings,
            siteName: clean(settings.siteName, 120) || fallback.siteName,
            siteUrl: safeSiteUrl(settings.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),
            defaultTitle: clean(settings.defaultTitle, 70) || fallback.defaultTitle,
            titleTemplate: clean(settings.titleTemplate, 120) || fallback.titleTemplate,
            defaultDescription: clean(settings.defaultDescription, 170) || fallback.defaultDescription,
            organizationName: clean(settings.organizationName, 120) || clean(settings.siteName, 120) || fallback.organizationName,
        };
    } catch (error) {
        console.error("[PUBLIC SEO] Global settings unavailable:", error.message);
        return fallback;
    }
}

export async function buildEntityMetadata({ type, slug, path }) {
    const settings = await getGlobalSeoSettings();
    let item = null;
    let template = null;
    try {
        await connectDB();
        const [seoTemplate] = await Promise.all([
            SEOTemplate.findOne({ entityType: type }).lean().exec(),
        ]);
        template = seoTemplate;
        if (type === "business") {
            item = await Business.findOne({ slug, status: "published" })
                .select("name slug tagline description coverImage logo seo category location address")
                .populate({ path: "category", select: "name slug", match: { status: "active" } })
                .populate({ path: "location", select: "name slug", match: { status: "active" } })
                .lean().exec();
            if (!item?.category || !item?.location) item = null;
        } else if (type === "category") {
            item = await Category.findOne({ slug, status: "active" }).select("name slug description icon seo").lean().exec();
        } else if (type === "location") {
            const matches = await Location.find({ slug, status: "active" }).select("name slug description seo").limit(2).lean().exec();
            if (matches.length === 1) item = matches[0];
        } else if (["place", "guide", "event"].includes(type)) {
            item = await ContentItem.findOne({ slug, kind: type, status: "published" }).select("title slug summary body coverImage seo kind").lean().exec();
            if (item) item.name = item.title;
        }
    } catch (error) {
        console.error("[PUBLIC SEO] Entity metadata unavailable:", error.message);
    }

    if (!item) {
        return {
            title: { absolute: `${clean(slug.replace(/-/g, " "), 150)} | ${settings.siteName}` },
            description: settings.defaultDescription,
            robots: { index: false, follow: true },
        };
    }

    const entitySeo = item.seo || {};
    const entityName = clean(item.name || item.title, 180);
    const rawDescription = clean(entitySeo.description || item.description || item.summary || item.tagline || settings.defaultDescription, 300);
    const description = rawDescription.slice(0, 170);
    const configuredTitleTemplate = template?.titleTemplate || settings.titleTemplate;
    const title = clean(entitySeo.title, 160) || applyTemplate(configuredTitleTemplate, entityName, { ...item, path }, settings);
    const descriptionTemplate = template?.descriptionTemplate;
    const finalDescription = entitySeo.description ? description : descriptionTemplate ? applyTemplate(descriptionTemplate, description, { ...item, path }, settings).slice(0, 170) : description;
    const canonical = safeCanonical(entitySeo.canonicalUrl || (template?.canonicalTemplate ? applyTemplate(template.canonicalTemplate, entityName, { ...item, path }, settings) : `${settings.siteUrl}/${path}/${slug}`), settings.siteUrl);
    const image = item.coverImage?.url || item.logo?.url || item.icon?.url || settings.defaultImage || undefined;
    const shouldIndex = settings.robotsIndex !== false && entitySeo.noIndex !== true && template?.noIndexByDefault !== true;
    const keywords = [
        entityName,
        item.category?.name,
        item.location?.name,
        "local businesses",
        "Nashik",
        "Igatpuri",
        "Ghoti",
        "Maharashtra",
        "GaavConnect",
    ].filter(Boolean);

    return {
        title: { absolute: title },
        description: finalDescription,
        keywords,
        alternates: { canonical },
        robots: { index: shouldIndex, follow: true, googleBot: { index: shouldIndex, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
        openGraph: {
            type: "website",
            siteName: settings.siteName,
            title,
            description: finalDescription,
            url: canonical,
            locale: "en_IN",
            ...(image ? { images: [{ url: image, alt: entityName }] } : {}),
        },
        twitter: {
            card: image ? "summary_large_image" : "summary",
            title,
            description: finalDescription,
            ...(image ? { images: [image] } : {}),
        },
    };
}

function safeCanonical(value, base) {
    try {
        const url = new URL(value, base);
        if (!["https:", "http:"].includes(url.protocol)) return base;
        return url.href;
    } catch {
        return base;
    }
}
