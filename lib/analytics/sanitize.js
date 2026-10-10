const SENSITIVE_QUERY_PARAMS = new Set([
    "token",
    "access_token",
    "refresh_token",
    "auth",
    "key",
    "api_key",
    "apikey",
    "secret",
    "password",
    "pwd",
    "code",
    "state",
    "session",
    "session_id",
    "email",
    "phone",
    "user",
    "username",
]);

const SEARCH_ENGINE_HOSTS = [
    "google.",
    "bing.com",
    "yahoo.",
    "duckduckgo.com",
    "ecosia.org",
    "baidu.com",
    "yandex.",
];

const SOCIAL_HOSTS = [
    "instagram.com",
    "facebook.com",
    "fb.com",
    "t.co",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "lnkd.in",
    "whatsapp.com",
    "wa.me",
    "youtube.com",
    "youtu.be",
    "pinterest.com",
    "reddit.com",
];

/**
 * Strips sensitive query parameters from a URL or relative path while preserving benign search params like `q` or `category`.
 */
export function sanitizePagePath(rawPath) {
    if (!rawPath || typeof rawPath !== "string") return "/";

    try {
        const dummyUrl = new URL(rawPath, "https://gaavconnect.in");
        const pathname = dummyUrl.pathname.replace(/\/+/g, "/") || "/";

        const sanitizedParams = new URLSearchParams();
        for (const [key, value] of dummyUrl.searchParams.entries()) {
            const lowerKey = key.toLowerCase();
            if (!SENSITIVE_QUERY_PARAMS.has(lowerKey)) {
                // Limit query parameter length to avoid abuse
                sanitizedParams.append(key, value.slice(0, 100));
            }
        }

        const query = sanitizedParams.toString();
        return query ? `${pathname}?${query}` : pathname;
    } catch {
        return "/";
    }
}

/**
 * Classifies a pathname into a recognized GaavConnect page type.
 */
export function inferPageType(pathname) {
    if (!pathname || typeof pathname !== "string") return "other";

    const path = pathname.split("?")[0].replace(/\/+/g, "/");

    if (path === "/" || path === "") return "home";
    if (path.startsWith("/businesses/") && path !== "/businesses") return "business";
    if (path === "/businesses") return "business";
    if (path.startsWith("/categories/") || path === "/categories") return "category";
    if (path.startsWith("/locations/") || path === "/locations") return "location";
    if (path.startsWith("/places/") || path === "/places") return "place";
    if (path.startsWith("/guides/") || path === "/guides") return "guide";
    if (path.startsWith("/events/") || path === "/events") return "event";
    if (
        path === "/about" ||
        path === "/contact" ||
        path === "/help" ||
        path === "/privacy" ||
        path === "/terms" ||
        path === "/cookies"
    ) {
        return "info";
    }

    return "other";
}

/**
 * Extracts and sanitizes referrer hostname, stripping query strings and credentials.
 */
export function sanitizeReferrer(rawReferrer, currentHost = "gaavconnect.in") {
    if (!rawReferrer || typeof rawReferrer !== "string") {
        return { hostname: "direct", source: "direct" };
    }

    try {
        const url = new URL(rawReferrer);
        const host = url.hostname.toLowerCase();

        if (
            host === currentHost.toLowerCase() ||
            host === "localhost" ||
            host === "127.0.0.1" ||
            host.endsWith(".gaavconnect.in")
        ) {
            return { hostname: host, source: "internal" };
        }

        // Check search engines
        for (const se of SEARCH_ENGINE_HOSTS) {
            if (host.includes(se)) {
                return { hostname: host, source: "search" };
            }
        }

        // Check social networks
        for (const social of SOCIAL_HOSTS) {
            if (host === social || host.endsWith("." + social)) {
                return { hostname: host, source: "social" };
            }
        }

        return { hostname: host, source: "referral" };
    } catch {
        return { hostname: "unknown", source: "unknown" };
    }
}

/**
 * Returns true if the path is an administrative or internal route that must not be tracked.
 */
export function isInternalOrAdminRoute(path) {
    if (!path || typeof path !== "string") return true;
    const clean = path.trim().toLowerCase();
    return (
        clean.startsWith("/admin") ||
        clean.startsWith("/api/admin") ||
        clean.startsWith("/api/auth") ||
        clean.startsWith("/_next")
    );
}
