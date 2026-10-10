import "server-only";

import { connectDB } from "@/lib/db";
import { SEOSettings, SEOTemplate } from "@/models/SEOConfig";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import ContentItem from "@/models/ContentItem";

export const DEFAULT_SITE_URL = "https://gaavconnect.in";
export const DEFAULT_FOUNDER_NAME = "Om Vilas Shinde";
export const DEFAULT_PHONE = "+919373545169";
export const DEFAULT_WHATSAPP = "9373545169";
export const DEFAULT_INSTAGRAM = "https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3";
export const DEFAULT_INSTAGRAM_HANDLE = "@gaavconnect.in";
export const DEFAULT_DESCRIPTION = "Discover local businesses, highway dhabas, farmstays, trusted services, shops, and attractions across Ghoti, Igatpuri, Nashik City and NH-160 highway with GaavConnect.";

function clean(value, max = 300) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function applyTemplate(template, value, entity, base) {
    const source = clean(template);
    if (!source) return clean(value);
    const locName = clean(entity?.location?.name || entity?.locationName || (typeof entity?.location === "string" ? entity.location : "Nashik District"));
    const catName = clean(entity?.category?.name || entity?.categoryName || (typeof entity?.category === "string" ? entity.category : "Local Services"));
    return source
        .replace(/%s/g, clean(value))
        .replace(/\{name\}/g, clean(entity?.name || entity?.title))
        .replace(/\{location\}/g, locName)
        .replace(/\{category\}/g, catName)
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

function safeCanonical(value, base) {
    try {
        const url = new URL(value, base);
        if (!["https:", "http:"].includes(url.protocol)) return base;
        return url.href;
    } catch {
        return base;
    }
}

export async function getGlobalSeoSettings() {
    const fallback = {
        siteName: "GaavConnect",
        siteUrl: safeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),
        defaultTitle: "GaavConnect — Local Businesses & Places in Nashik District (Ghoti, Igatpuri)",
        titleTemplate: "%s | GaavConnect",
        defaultDescription: DEFAULT_DESCRIPTION,
        defaultImage: `${DEFAULT_SITE_URL}/gaavconnect-logo.svg`,
        robotsIndex: true,
        sitemapEnabled: true,
        organizationName: "GaavConnect",
        organizationLogo: `${DEFAULT_SITE_URL}/gaavconnect-logo.svg`,
        founderName: DEFAULT_FOUNDER_NAME,
        phone: DEFAULT_PHONE,
        whatsapp: DEFAULT_WHATSAPP,
        instagramUrl: DEFAULT_INSTAGRAM,
        instagramHandle: DEFAULT_INSTAGRAM_HANDLE,
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
            defaultTitle: !clean(settings.defaultTitle, 100) || /seo-product|nearfolk|discover local businesses\s*&\s*places/i.test(clean(settings.defaultTitle, 100)) ? fallback.defaultTitle : clean(settings.defaultTitle, 100),
            titleTemplate: !clean(settings.titleTemplate, 120) || /seo-product|nearfolk/i.test(clean(settings.titleTemplate, 120)) ? fallback.titleTemplate : clean(settings.titleTemplate, 120),
            defaultDescription: !clean(settings.defaultDescription, 200) || /seo-product|nearfolk/i.test(clean(settings.defaultDescription, 200)) ? fallback.defaultDescription : clean(settings.defaultDescription, 200),
            organizationName: ["seo-product", "nearfolk"].includes(clean(settings.organizationName, 120).toLowerCase()) ? fallback.organizationName : (clean(settings.organizationName, 120) || clean(settings.siteName, 120) || fallback.organizationName),
            organizationLogo: settings.organizationLogo || fallback.organizationLogo,
            founderName: DEFAULT_FOUNDER_NAME,
            phone: DEFAULT_PHONE,
            whatsapp: DEFAULT_WHATSAPP,
            instagramUrl: DEFAULT_INSTAGRAM,
            instagramHandle: DEFAULT_INSTAGRAM_HANDLE,
        };
    } catch (error) {
        console.error("[PUBLIC SEO] Global settings unavailable:", error.message);
        return fallback;
    }
}

export async function getOrganizationStructuredData() {
    const settings = await getGlobalSeoSettings();
    const siteUrl = settings.siteUrl || DEFAULT_SITE_URL;

    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: settings.siteName || "GaavConnect",
        alternateName: "GaavConnect Nashik",
        url: siteUrl,
        logo: settings.organizationLogo || `${siteUrl}/gaavconnect-logo.svg`,
        description: settings.defaultDescription,
        founder: {
            "@type": "Person",
            name: DEFAULT_FOUNDER_NAME,
            jobTitle: "Founder & CEO",
            url: `${siteUrl}/about`,
        },
        sameAs: [
            DEFAULT_INSTAGRAM,
            "https://www.instagram.com/gaavconnect.in/",
        ],
        contactPoint: [
            {
                "@type": "ContactPoint",
                telephone: DEFAULT_PHONE,
                contactType: "customer service",
                areaServed: "IN",
                availableLanguage: ["en", "mr", "hi"],
            },
        ],
        address: {
            "@type": "PostalAddress",
            addressLocality: "Igatpuri",
            addressRegion: "Maharashtra",
            addressCountry: "IN",
            postalCode: "422403",
        },
        areaServed: [
            { "@type": "AdministrativeArea", name: "Nashik District" },
            { "@type": "City", name: "Igatpuri" },
            { "@type": "City", name: "Ghoti" },
            { "@type": "City", name: "Nashik City" },
            { "@type": "City", name: "Trimbakeshwar" },
            { "@type": "City", name: "Sinnar" },
            { "@type": "City", name: "Bhagur" },
            { "@type": "City", name: "Kavathe" },
            { "@type": "City", name: "Pimpalgaon Baswant" },
        ],
    };
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
                .select("name slug tagline description coverImage logo seo category location address contact")
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

    const locationName = item.location?.name || (type === "location" ? entityName : "Nashik District");
    const categoryName = item.category?.name || (type === "category" ? entityName : "Local Directory");

    const keywords = [
        entityName,
        categoryName,
        locationName,
        "local businesses in Nashik",
        "Ghoti",
        "Igatpuri",
        "Nashik district directory",
        "highway dhabas NH-160",
        "Maharashtra",
        "GaavConnect",
        "verified local services",
    ].filter(Boolean);

    return {
        title: { absolute: title },
        description: finalDescription,
        keywords,
        alternates: { canonical },
        robots: {
            index: shouldIndex,
            follow: true,
            googleBot: {
                index: shouldIndex,
                follow: true,
                "max-image-preview": "large",
                "max-snippet": -1,
                "max-video-preview": -1,
            },
        },
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
            site: "@gaavconnect.in",
            creator: "@gaavconnect.in",
            ...(image ? { images: [image] } : {}),
        },
    };
}

export async function getEntityStructuredData({ type, slug }) {
    const settings = await getGlobalSeoSettings();
    const siteUrl = settings.siteUrl || DEFAULT_SITE_URL;

    try {
        await connectDB();
        if (type === "business") {
            const item = await Business.findOne({ slug, status: "published", "seo.noIndex": { $ne: true } })
                .select("name slug tagline description contact address coordinates coverImage logo openingHours businessType priceRange")
                .populate({ path: "category", select: "name slug", match: { status: "active" } })
                .populate({ path: "location", select: "name slug address", match: { status: "active" } })
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
            const businessUrl = `${siteUrl}/businesses/${item.slug}`;

            const localBusiness = {
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
                areaServed: [
                    { "@type": "Place", name: item.location.name },
                    { "@type": "Place", name: "Nashik District" },
                ],
                ...(item.coordinates?.latitude != null && item.coordinates?.longitude != null ? {
                    geo: {
                        "@type": "GeoCoordinates",
                        latitude: item.coordinates.latitude,
                        longitude: item.coordinates.longitude,
                    },
                } : {}),
                sameAs: [
                    item.contact?.whatsapp ? `https://wa.me/${item.contact.whatsapp.replace(/[^0-9]/g, "")}` : null,
                ].filter(Boolean),
            };

            const breadcrumbs = {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                    { "@type": "ListItem", position: 2, name: "Businesses", item: `${siteUrl}/businesses` },
                    { "@type": "ListItem", position: 3, name: item.location.name, item: `${siteUrl}/locations/${item.location.slug}` },
                    { "@type": "ListItem", position: 4, name: item.name, item: businessUrl },
                ],
            };

            return {
                "@context": "https://schema.org",
                "@graph": [localBusiness, breadcrumbs],
            };
        }

        if (type === "category") {
            const item = await Category.findOne({ slug, status: "active", "seo.noIndex": { $ne: true } }).select("name slug description").lean().exec();
            if (!item) return null;
            const categoryUrl = `${siteUrl}/categories/${item.slug}`;

            return {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "CollectionPage",
                        "@id": `${categoryUrl}#page`,
                        name: `${item.name} in Nashik District`,
                        description: clean(item.description || `Explore ${item.name} and verified local services across Nashik district, Ghoti, and Igatpuri on GaavConnect.`, 300),
                        url: categoryUrl,
                        isPartOf: { "@type": "WebSite", name: settings.siteName, url: siteUrl },
                    },
                    {
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                            { "@type": "ListItem", position: 2, name: "Categories", item: `${siteUrl}/categories` },
                            { "@type": "ListItem", position: 3, name: item.name, item: categoryUrl },
                        ],
                    },
                ],
            };
        }

        if (type === "location") {
            const matches = await Location.find({ slug, status: "active", "seo.noIndex": { $ne: true } }).select("name slug description type").limit(2).lean().exec();
            if (matches.length !== 1) return null;
            const item = matches[0];
            const locationUrl = `${siteUrl}/locations/${item.slug}`;

            return {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "CollectionPage",
                        "@id": `${locationUrl}#page`,
                        name: `Businesses & Places in ${item.name}, Nashik District`,
                        description: clean(item.description || `Discover local businesses, dhabas, farmstays, and services in ${item.name}, Nashik district, Maharashtra on GaavConnect.`, 300),
                        url: locationUrl,
                        about: { "@type": "Place", name: item.name },
                        isPartOf: { "@type": "WebSite", name: settings.siteName, url: siteUrl },
                    },
                    {
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                            { "@type": "ListItem", position: 2, name: "Locations", item: `${siteUrl}/locations` },
                            { "@type": "ListItem", position: 3, name: item.name, item: locationUrl },
                        ],
                    },
                ],
            };
        }

        if (type === "place") {
            const item = await ContentItem.findOne({ slug, kind: "place", status: "published", "seo.noIndex": { $ne: true } })
                .select("title slug summary body coverImage location seo")
                .populate({ path: "location", select: "name slug" })
                .lean().exec();
            if (!item) return null;
            const placeUrl = `${siteUrl}/places/${item.slug}`;
            const locName = item.location?.name || "Nashik District";

            return {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "TouristAttraction",
                        "@id": `${placeUrl}#attraction`,
                        name: item.title,
                        description: clean(item.summary || item.body || `Explore ${item.title} in ${locName}, Nashik district.`, 400),
                        url: placeUrl,
                        ...(item.coverImage?.url ? { image: item.coverImage.url } : {}),
                        location: {
                            "@type": "Place",
                            name: locName,
                            address: {
                                "@type": "PostalAddress",
                                addressLocality: locName,
                                addressRegion: "Maharashtra",
                                addressCountry: "IN",
                            },
                        },
                        isPartOf: { "@type": "WebSite", name: settings.siteName, url: siteUrl },
                    },
                    {
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                            { "@type": "ListItem", position: 2, name: "Places", item: `${siteUrl}/places` },
                            { "@type": "ListItem", position: 3, name: item.title, item: placeUrl },
                        ],
                    },
                ],
            };
        }

        if (type === "guide") {
            const item = await ContentItem.findOne({ slug, kind: "guide", status: "published", "seo.noIndex": { $ne: true } })
                .select("title slug summary body coverImage location seo publishedAt createdAt updatedAt")
                .populate({ path: "location", select: "name slug" })
                .lean().exec();
            if (!item) return null;
            const guideUrl = `${siteUrl}/guides/${item.slug}`;

            return {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "Article",
                        "@id": `${guideUrl}#article`,
                        headline: item.title,
                        description: clean(item.summary || item.body || `Guide: ${item.title} in Nashik district.`, 400),
                        url: guideUrl,
                        ...(item.coverImage?.url ? { image: item.coverImage.url } : {}),
                        inLanguage: "en-IN",
                        author: {
                            "@type": "Person",
                            name: DEFAULT_FOUNDER_NAME,
                            url: `${siteUrl}/about`,
                        },
                        publisher: {
                            "@id": `${siteUrl}/#organization`,
                        },
                        datePublished: item.publishedAt || item.createdAt,
                        dateModified: item.updatedAt || item.publishedAt || item.createdAt,
                        mainEntityOfPage: guideUrl,
                    },
                    {
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                            { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/guides` },
                            { "@type": "ListItem", position: 3, name: item.title, item: guideUrl },
                        ],
                    },
                ],
            };
        }

        if (type === "event") {
            const item = await ContentItem.findOne({ slug, kind: "event", status: "published", "seo.noIndex": { $ne: true } })
                .select("title slug summary body coverImage location event seo")
                .populate({ path: "location", select: "name slug" })
                .lean().exec();
            if (!item) return null;
            const eventUrl = `${siteUrl}/events/${item.slug}`;
            const locName = item.location?.name || "Nashik District";

            return {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "Event",
                        "@id": `${eventUrl}#event`,
                        name: item.title,
                        description: clean(item.summary || item.body || `Event: ${item.title} in ${locName}.`, 400),
                        url: eventUrl,
                        ...(item.coverImage?.url ? { image: item.coverImage.url } : {}),
                        ...(item.event?.startsAt ? { startDate: item.event.startsAt } : {}),
                        ...(item.event?.endsAt ? { endDate: item.event.endsAt } : {}),
                        location: {
                            "@type": "Place",
                            name: item.event?.venue || locName,
                            address: {
                                "@type": "PostalAddress",
                                addressLocality: locName,
                                addressRegion: "Maharashtra",
                                addressCountry: "IN",
                            },
                        },
                        organizer: {
                            "@id": `${siteUrl}/#organization`,
                        },
                    },
                    {
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                            { "@type": "ListItem", position: 2, name: "Events", item: `${siteUrl}/events` },
                            { "@type": "ListItem", position: 3, name: item.title, item: eventUrl },
                        ],
                    },
                ],
            };
        }
    } catch (error) {
        console.error("[PUBLIC SEO] Structured data unavailable:", error.message);
    }
    return null;
}
