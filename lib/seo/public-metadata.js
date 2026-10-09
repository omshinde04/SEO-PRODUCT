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
            siteName: ["seo-product", "nearfolk"].includes(clean(settings.siteName, 120).toLowerCase()) ? fallback.siteName : (clean(settings.siteName, 120) || fallback.siteName),
            siteUrl: safeSiteUrl(settings.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),
            defaultTitle: !clean(settings.defaultTitle, 70) || /seo-product|nearfolk|discover local businesses\s*&\s*places/i.test(clean(settings.defaultTitle, 70)) ? fallback.defaultTitle : clean(settings.defaultTitle, 70),
            titleTemplate: !clean(settings.titleTemplate, 120) || /seo-product|nearfolk/i.test(clean(settings.titleTemplate, 120)) ? fallback.titleTemplate : clean(settings.titleTemplate, 120),
            defaultDescription: !clean(settings.defaultDescription, 170) || /seo-product|nearfolk/i.test(clean(settings.defaultDescription, 170)) ? fallback.defaultDescription : clean(settings.defaultDescription, 170),
            organizationName: ["seo-product", "nearfolk"].includes(clean(settings.organizationName, 120).toLowerCase()) ? fallback.organizationName : (clean(settings.organizationName, 120) || clean(settings.siteName, 120) || fallback.organizationName),
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
    const rawTemplate = template?.titleTemplate || settings.titleTemplate;
    const configuredTitleTemplate = /seo-product|nearfolk/i.test(rawTemplate) ? settings.titleTemplate : rawTemplate;
    const title = clean(entitySeo.title, 160) || applyTemplate(configuredTitleTemplate, entityName, { ...item, path }, settings);
    const descriptionTemplate = template?.descriptionTemplate;
    const finalDescription = entitySeo.description ? description : descriptionTemplate ? applyTemplate(descriptionTemplate, description, { ...item, path }, settings).slice(0, 170) : description;
    const canonical = safeCanonical(entitySeo.canonicalUrl || (template?.canonicalTemplate ? applyTemplate(template.canonicalTemplate, entityName, { ...item, path }, settings) : `${settings.siteUrl}/${path}/${slug}`), settings.siteUrl);
    const image = item.coverImage?.url || item.logo?.url || item.icon?.url || settings.defaultImage || undefined;
    const shouldIndex = settings.robotsIndex !== false && (entitySeo.noIndex !== undefined ? entitySeo.noIndex !== true : template?.noIndexByDefault !== true);
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

export async function getEntityStructuredData({ type, slug }) {
    const settings = await getGlobalSeoSettings();
    try {
        await connectDB();
        if (type === "business") {
            const item = await Business.findOne({ slug, status: "published", "seo.noIndex": { $ne: true } })
                .select("name slug tagline description contact address coordinates coverImage logo openingHours businessType priceRange")
                .populate({ path: "category", select: "name", match: { status: "active" } })
                .populate({ path: "location", select: "name address", match: { status: "active" } })
                .lean().exec();
            if (!item?.category || !item?.location) return null;
            const schemaTypes = {
                restaurant: "Restaurant",
                hotel: "Hotel",
                healthcare: "MedicalBusiness",
                retail: "Store",
                professional_service: "ProfessionalService",
            };
            const address = item.address || {};
            const businessUrl = `${settings.siteUrl}/businesses/${item.slug}`;
            const data = {
                "@context": "https://schema.org",
                "@type": schemaTypes[item.businessType] || "LocalBusiness",
                "@id": `${businessUrl}#business`,
                name: item.name,
                url: businessUrl,
                description: clean(item.description || item.tagline, 500),
                telephone: item.contact?.phone || undefined,
                email: item.contact?.email || undefined,
                image: item.coverImage?.url || item.logo?.url || undefined,
                priceRange: item.priceRange && item.priceRange !== "not_applicable" ? item.priceRange : undefined,
                address: {
                    "@type": "PostalAddress",
                    streetAddress: [address.line1, address.line2, address.area].filter(Boolean).join(", ") || undefined,
                    addressLocality: address.city || item.location.name || undefined,
                    addressRegion: address.state || "Maharashtra",
                    postalCode: address.postalCode || undefined,
                    addressCountry: address.country || "IN",
                },
                areaServed: {
                    "@type": "Place",
                    name: item.location.name,
                },
                ...(item.coordinates?.latitude != null && item.coordinates?.longitude != null ? {
                    geo: {
                        "@type": "GeoCoordinates",
                        latitude: item.coordinates.latitude,
                        longitude: item.coordinates.longitude,
                    },
                } : {}),
                sameAs: [],
            };
            return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== ""));
        }

        if (type === "category") {
            const item = await Category.findOne({ slug, status: "active", "seo.noIndex": { $ne: true } }).select("name slug description").lean().exec();
            if (!item) return null;
            return {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: item.name,
                description: clean(item.description || `Explore ${item.name} and local services across Nashik district on GaavConnect.`, 300),
                url: `${settings.siteUrl}/categories/${item.slug}`,
                isPartOf: { "@type": "WebSite", name: settings.siteName, url: settings.siteUrl },
            };
        }

        if (type === "location") {
            const matches = await Location.find({ slug, status: "active", "seo.noIndex": { $ne: true } }).select("name slug description type").limit(2).lean().exec();
            if (matches.length !== 1) return null;
            const item = matches[0];
            return {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: `Businesses in ${item.name}`,
                description: clean(item.description || `Discover local businesses and services in ${item.name}, Maharashtra on GaavConnect.`, 300),
                url: `${settings.siteUrl}/locations/${item.slug}`,
                about: { "@type": "Place", name: item.name },
                isPartOf: { "@type": "WebSite", name: settings.siteName, url: settings.siteUrl },
            };
        }
    } catch (error) {
        console.error("[PUBLIC SEO] Structured data unavailable:", error.message);
    }
    return null;
}
