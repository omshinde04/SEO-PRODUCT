"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "gaavconnect-cookie-preferences-v1";
const SESSION_STORAGE_KEY = "gaavconnect_sid_v1";
const SESSION_TIMESTAMP_KEY = "gaavconnect_sid_time";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity

function getOrCreateSessionId() {
    try {
        const now = Date.now();
        const existingId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
        const lastTime = parseInt(window.sessionStorage.getItem(SESSION_TIMESTAMP_KEY) || "0", 10);

        if (existingId && now - lastTime < SESSION_TIMEOUT_MS) {
            window.sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(now));
            return existingId;
        }

        const newId =
            (typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : "s_" + Math.random().toString(36).substring(2, 15) + "_" + now
            ).replace(/-/g, "").slice(0, 32);

        window.sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
        window.sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(now));
        return newId;
    } catch {
        return "anon_session_" + Date.now();
    }
}

function hasAnalyticsConsent() {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved) return false;
        const parsed = JSON.parse(saved);
        return Boolean(parsed?.analytics);
    } catch {
        return false;
    }
}

function sendEvent(payload) {
    if (!hasAnalyticsConsent()) return;

    try {
        const body = JSON.stringify(payload);
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
            const blob = new Blob([body], { type: "application/json" });
            const success = navigator.sendBeacon("/api/analytics/collect", blob);
            if (!success) {
                fetch("/api/analytics/collect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body,
                    keepalive: true,
                }).catch(() => {});
            }
        } else {
            fetch("/api/analytics/collect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                keepalive: true,
            }).catch(() => {});
        }
    } catch {}
}

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [consented, setConsented] = useState(false);
    const lastTrackedUrl = useRef("");
    const pageEnterTime = useRef(0);

    // Check consent state and listen for consent changes
    useEffect(() => {
        if (!pageEnterTime.current) {
            pageEnterTime.current = Date.now();
        }
        const check = () => setConsented(hasAnalyticsConsent());
        check();

        const handleStorage = (e) => {
            if (e.key === STORAGE_KEY) check();
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener("gaavconnect:consent-updated", check);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("gaavconnect:consent-updated", check);
        };
    }, []);

    // Listen to custom dispatch events from components (e.g. search queries)
    useEffect(() => {
        const handleCustomEvent = (event) => {
            if (!hasAnalyticsConsent() || !event.detail) return;
            const sessionId = getOrCreateSessionId();
            sendEvent({
                sessionId,
                pagePath: window.location.pathname + window.location.search,
                pageTitle: document.title,
                ...event.detail,
            });
        };

        window.addEventListener("gaavconnect:analytics", handleCustomEvent);
        return () => {
            window.removeEventListener("gaavconnect:analytics", handleCustomEvent);
        };
    }, []);

    // Global click delegate for high-intent business interactions
    useEffect(() => {
        const handleClick = (e) => {
            if (!hasAnalyticsConsent()) return;

            const target = e.target.closest("a, button");
            if (!target) return;

            const href = target.getAttribute("href") || "";
            const sessionId = getOrCreateSessionId();
            const currentPath = window.location.pathname;

            // Extract entity slug if on a business profile
            let entitySlug = "";
            if (currentPath.startsWith("/businesses/")) {
                entitySlug = currentPath.split("/")[2] || "";
            }

            // 1. Phone click
            if (href.startsWith("tel:")) {
                sendEvent({
                    eventType: "phone_click",
                    pagePath: currentPath,
                    pageTitle: document.title,
                    sessionId,
                    entitySlug,
                    metadata: { actionLabel: "Call Business", targetUrl: href },
                });
                return;
            }

            // 2. WhatsApp click
            if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
                sendEvent({
                    eventType: "whatsapp_click",
                    pagePath: currentPath,
                    pageTitle: document.title,
                    sessionId,
                    entitySlug,
                    metadata: { actionLabel: "WhatsApp Chat", targetUrl: href },
                });
                return;
            }

            // 3. Directions click
            if (
                href.includes("google.com/maps") ||
                href.includes("maps.apple.com") ||
                target.dataset.analyticsAction === "directions"
            ) {
                sendEvent({
                    eventType: "directions_click",
                    pagePath: currentPath,
                    pageTitle: document.title,
                    sessionId,
                    entitySlug,
                    metadata: { actionLabel: "Directions Map", targetUrl: href },
                });
                return;
            }

            // 4. External website click
            if (target.dataset.analyticsAction === "website" || (href.startsWith("http") && !href.includes(window.location.hostname))) {
                if (currentPath.startsWith("/businesses/")) {
                    sendEvent({
                        eventType: "website_click",
                        pagePath: currentPath,
                        pageTitle: document.title,
                        sessionId,
                        entitySlug,
                        metadata: { actionLabel: "Visit Business Website", targetUrl: href },
                    });
                }
            }
        };

        document.addEventListener("click", handleClick, { capture: true });
        return () => {
            document.removeEventListener("click", handleClick, { capture: true });
        };
    }, []);

    // Track page views on route changes
    useEffect(() => {
        if (!pathname || pathname.startsWith("/admin") || !consented) return;

        const queryString = searchParams ? searchParams.toString() : "";
        const fullUrl = queryString ? `${pathname}?${queryString}` : pathname;

        // Prevent double tracking same URL in quick succession (e.g. React StrictMode)
        if (lastTrackedUrl.current === fullUrl) return;

        // Record time spent on previous page
        const now = Date.now();
        const durationSeconds = Math.max(0, Math.round((now - pageEnterTime.current) / 1000));
        pageEnterTime.current = now;
        lastTrackedUrl.current = fullUrl;

        const sessionId = getOrCreateSessionId();

        // Determine specific event type for rich business tracking
        let eventType = "page_view";
        let entitySlug = "";

        if (pathname.startsWith("/businesses/") && pathname !== "/businesses") {
            eventType = "business_view";
            entitySlug = pathname.split("/")[2] || "";
        } else if (pathname.startsWith("/categories/") && pathname !== "/categories") {
            eventType = "category_view";
            entitySlug = pathname.split("/")[2] || "";
        } else if (pathname.startsWith("/locations/") && pathname !== "/locations") {
            eventType = "location_view";
            entitySlug = pathname.split("/")[2] || "";
        } else if (pathname.startsWith("/guides/") && pathname !== "/guides") {
            eventType = "guide_view";
            entitySlug = pathname.split("/")[2] || "";
        } else if (pathname.startsWith("/places/") && pathname !== "/places") {
            eventType = "place_view";
            entitySlug = pathname.split("/")[2] || "";
        } else if (pathname.startsWith("/events/") && pathname !== "/events") {
            eventType = "event_view";
            entitySlug = pathname.split("/")[2] || "";
        }

        // Slight defer so document.title is populated by Next.js
        const timer = setTimeout(() => {
            sendEvent({
                eventType,
                pagePath: fullUrl,
                pageTitle: document.title || "",
                sessionId,
                referrer: document.referrer || "",
                entitySlug,
                durationSeconds: durationSeconds > 0 && durationSeconds < 3600 ? durationSeconds : 0,
            });
        }, 150);

        return () => clearTimeout(timer);
    }, [pathname, searchParams, consented]);

    // Send final beacon on page unload
    useEffect(() => {
        const handleUnload = () => {
            if (!consented || !lastTrackedUrl.current) return;
            const duration = Math.max(0, Math.round((Date.now() - pageEnterTime.current) / 1000));
            if (duration >= 2) {
                sendEvent({
                    eventType: "page_view",
                    pagePath: lastTrackedUrl.current,
                    sessionId: getOrCreateSessionId(),
                    durationSeconds: Math.min(duration, 3600),
                });
            }
        };

        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [consented]);

    return null;
}
