import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import BusinessSubmission from "@/models/BusinessSubmission";
import { apiError, apiSuccess } from "@/lib/api/response";
import { enforceSubmissionRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isHttpUrl(value) {
    if (!value) return true;
    try {
        const parsed = new URL(value);
        return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname);
    } catch {
        return false;
    }
}

const hexId = z.string().regex(/^[a-f\d]{24}$/i);

const schema = z.object({
    businessName: z.string().trim().min(2).max(160),
    contactName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().min(7).max(30).regex(/^[+()\d .-]+$/),
    whatsapp: z.string().trim().max(30).optional().default(""),
    businessType: z.enum([
        "business", "restaurant", "hotel", "professional_service",
        "healthcare", "retail", "tourism", "attraction", "guide",
        "event_venue", "other"
    ]).optional().default("business"),
    tagline: z.string().trim().max(200).optional().default(""),
    category: hexId.nullable().optional().default(null),
    categoryName: z.string().trim().max(120).optional().default(""),
    location: hexId.nullable().optional().default(null),
    locationName: z.string().trim().max(120).optional().default(""),
    address: z.object({
        line1: z.string().trim().max(200).optional().default(""),
        area: z.string().trim().max(120).optional().default(""),
        city: z.string().trim().max(120).optional().default(""),
        postalCode: z.string().trim().max(12).optional().default(""),
        formatted: z.string().trim().max(500).optional().default(""),
    }).strict().optional().default({}),
    services: z.array(z.string().trim().max(120)).max(50).optional().default([]),
    website: z.string().trim().max(2048).optional().default("")
        .refine(isHttpUrl, "Website must be a valid HTTP or HTTPS URL."),
    message: z.string().trim().max(5000).optional().default(""),
}).strict();

export async function POST(request) {
    const origin = request.headers.get("origin");

    // This endpoint is intended for the first-party public submission form.
    // Reject missing origins as well as cross-origin browser submissions.
    if (!origin) {
        return apiError("Request origin is required.", 403);
    }

    try {
        const allowedOrigins = new Set([new URL(request.url).origin]);
        for (const configuredOrigin of [
            process.env.NEXT_PUBLIC_SITE_URL,
            process.env.SITE_URL,
        ]) {
            if (!configuredOrigin) continue;
            try {
                const parsed = new URL(configuredOrigin);
                if (["http:", "https:"].includes(parsed.protocol)) {
                    allowedOrigins.add(parsed.origin);
                }
            } catch {
                // Ignore malformed optional origin configuration; the request
                // origin still has to match the application origin.
            }
        }

        if (!allowedOrigins.has(new URL(origin).origin)) {
            return apiError("Request origin is not allowed.", 403);
        }
    } catch {
        return apiError("Invalid request origin.", 403);
    }

    const contentType = (request.headers.get("content-type") || "")
        .split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
        return apiError("Content-Type must be application/json.", 415);
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return apiError("Submission details are invalid.", 400, parsed.error.issues);
    }

    try {
        await connectDB();

        const rateLimit = await enforceSubmissionRateLimit(request, parsed.data.email);
        if (rateLimit.limited) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Too many submissions. Please try again later.",
                },
                {
                    status: 429,
                    headers: {
                        "Cache-Control": "no-store",
                        "Retry-After": String(rateLimit.retryAfterSeconds),
                    },
                }
            );
        }

        const item = await BusinessSubmission.create(parsed.data);
        return apiSuccess({ received: true, id: item._id }, 201);
    } catch (error) {
        console.error("[SUBMISSION]", error.message);
        return apiError("Unable to submit your business right now.", 500);
    }
}
