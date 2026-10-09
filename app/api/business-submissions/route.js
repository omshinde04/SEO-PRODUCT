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

const schema = z.object({
    businessName: z.string().trim().min(2).max(160),
    contactName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().min(7).max(30).regex(/^[+()\d .-]+$/),
    locationName: z.string().trim().max(120).optional().default(""),
    categoryName: z.string().trim().max(120).optional().default(""),
    website: z.string().trim().max(2048).optional().default("")
        .refine(isHttpUrl, "Website must be a valid HTTP or HTTPS URL."),
    message: z.string().trim().max(3000).optional().default(""),
}).strict();

export async function POST(request) {
    const origin = request.headers.get("origin");

    // This endpoint is intended for the first-party public submission form.
    // Reject missing origins as well as cross-origin browser submissions.
    if (!origin) {
        return apiError("Request origin is required.", 403);
    }

    try {
        if (new URL(origin).origin !== new URL(request.url).origin) {
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
