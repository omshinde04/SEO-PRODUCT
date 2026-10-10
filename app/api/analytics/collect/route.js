import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import AnalyticsEvent from "@/models/AnalyticsEvent";
import { getClientIp, hashRateLimitKey } from "@/lib/auth/rate-limit-utils";
import RateLimitEntry from "@/models/RateLimitEntry";
import {
    sanitizePagePath,
    inferPageType,
    sanitizeReferrer,
    isInternalOrAdminRoute,
} from "@/lib/analytics/sanitize";
import { parseUserAgent } from "@/lib/analytics/user-agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const eventSchema = z.object({
    eventType: z.enum([
        "page_view",
        "session_start",
        "business_view",
        "category_view",
        "location_view",
        "guide_view",
        "place_view",
        "event_view",
        "search",
        "phone_click",
        "whatsapp_click",
        "website_click",
        "directions_click",
        "cta_click",
    ]),
    pagePath: z.string().min(1).max(2048),
    pageTitle: z.string().max(250).optional().default(""),
    sessionId: z.string().min(8).max(64),
    durationSeconds: z.number().min(0).max(86400).optional().default(0),
    referrer: z.string().max(2048).optional().default(""),
    entitySlug: z.string().max(250).optional().default(""),
    entityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().default({}),
});

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_EVENTS_PER_MINUTE = 60; // Up to 60 events/min per IP

async function checkCollectionRateLimit(ip) {
    if (!ip) return false;
    const now = new Date();
    const cutoff = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
    const expiresAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
    const key = hashRateLimitKey("analytics-collect-ip", ip);

    const updatePipeline = [
        {
            $set: {
                count: {
                    $cond: [
                        { $gt: [{ $ifNull: ["$windowStartedAt", new Date(0)] }, cutoff] },
                        { $add: [{ $ifNull: ["$count", 0] }, 1] },
                        1,
                    ],
                },
                windowStartedAt: {
                    $cond: [
                        { $gt: [{ $ifNull: ["$windowStartedAt", new Date(0)] }, cutoff] },
                        "$windowStartedAt",
                        now,
                    ],
                },
                expiresAt,
            },
        },
    ];

    try {
        const record = await RateLimitEntry.findOneAndUpdate(
            { key },
            updatePipeline,
            { upsert: true, new: true, updatePipeline: true }
        ).lean().exec();

        return record.count > MAX_EVENTS_PER_MINUTE;
    } catch (err) {
        if (err?.code === 11000) {
            const record = await RateLimitEntry.findOneAndUpdate(
                { key },
                updatePipeline,
                { upsert: false, new: true, updatePipeline: true }
            ).lean().exec();
            return record ? record.count > MAX_EVENTS_PER_MINUTE : false;
        }
        return false;
    }
}

export async function POST(request) {
    try {
        let rawBody;
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json") || contentType.includes("text/plain")) {
            const text = await request.text();
            if (!text) {
                return NextResponse.json({ error: "Empty payload" }, { status: 400 });
            }
            try {
                rawBody = JSON.parse(text);
            } catch {
                return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
        }

        const parseResult = eventSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parseResult.error.flatten() },
                { status: 400 }
            );
        }

        const data = parseResult.data;

        // Strictly reject any attempts to track admin or internal routes
        if (isInternalOrAdminRoute(data.pagePath)) {
            return NextResponse.json({ ignored: true, reason: "internal_route" }, { status: 200 });
        }

        const clientIp = getClientIp(request) || "127.0.0.1";
        const userAgent = request.headers.get("user-agent") || "";

        // Rate limiting check
        const isRateLimited = await checkCollectionRateLimit(clientIp);
        if (isRateLimited) {
            return NextResponse.json(
                { error: "Too many requests. Please slow down." },
                { status: 429, headers: { "Retry-After": "60" } }
            );
        }

        // Privacy-first visitor pseudonym: HMAC SHA-256 hash of IP + UserAgent. Raw IP is never stored.
        const visitorHash = hashRateLimitKey("analytics-visitor", `${clientIp}|${userAgent.slice(0, 100)}`);

        // Sanitize path (strip sensitive query tokens)
        const sanitizedPath = sanitizePagePath(data.pagePath);
        const pageType = inferPageType(sanitizedPath);

        // Sanitize referrer
        const { hostname: referrerHostname, source: referrerSource } = sanitizeReferrer(
            data.referrer,
            request.headers.get("host") || "gaavconnect.in"
        );

        // Classify device, browser, OS
        const { deviceType, browserFamily, osFamily } = parseUserAgent(userAgent);

        // Coarse cloud geolocation headers (if deployed on Vercel or Cloudflare; no GPS/precise coords)
        const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").slice(0, 10);
        const region = (request.headers.get("x-vercel-ip-country-region") || "").slice(0, 100);

        // Metadata sanitation (prevent large or malicious payloads)
        const safeMetadata = {};
        if (data.metadata && typeof data.metadata === "object") {
            if (typeof data.metadata.searchQuery === "string") {
                // Low-case, trim, cap to 60 characters
                safeMetadata.searchQuery = data.metadata.searchQuery.trim().toLowerCase().slice(0, 60);
            }
            if (typeof data.metadata.resultsCount === "number") {
                safeMetadata.resultsCount = Math.max(0, Math.min(10000, data.metadata.resultsCount));
            }
            if (typeof data.metadata.actionLabel === "string") {
                safeMetadata.actionLabel = data.metadata.actionLabel.trim().slice(0, 100);
            }
            if (typeof data.metadata.targetUrl === "string") {
                safeMetadata.targetUrl = sanitizePagePath(data.metadata.targetUrl);
            }
        }

        await connectDB();

        // Check if visitor is new or returning
        const existingVisitor = await AnalyticsEvent.findOne({ visitorHash })
            .select("_id")
            .lean()
            .exec();
        const isNewVisitor = !existingVisitor;

        await AnalyticsEvent.create({
            eventType: data.eventType,
            timestamp: new Date(),
            pagePath: sanitizedPath,
            pageTitle: (data.pageTitle || "").trim().slice(0, 250),
            pageType,
            visitorHash,
            sessionId: data.sessionId,
            isNewVisitor,
            durationSeconds: data.durationSeconds || 0,
            referrerHostname,
            referrerSource,
            deviceType,
            browserFamily,
            osFamily,
            country,
            region,
            entitySlug: (data.entitySlug || "").trim().slice(0, 250),
            entityId: data.entityId || null,
            metadata: safeMetadata,
        });

        return new NextResponse(null, {
            status: 204,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });
    } catch (error) {
        console.error("[ANALYTICS] Event collection error:", error.message);
        return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
    }
}
