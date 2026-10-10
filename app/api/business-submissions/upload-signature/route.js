import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createSignedImageUpload, getCloudinaryConfig } from "@/lib/cloudinary/upload-signature";
import { enforceSubmissionRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasSameOrigin(request) {
    const origin = request.headers.get("origin");
    if (!origin) return false;
    try {
        const originUrl = new URL(origin);
        const requestUrl = new URL(request.url);
        if (originUrl.origin === requestUrl.origin) return true;

        const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
        if (host && originUrl.host === host) return true;

        const isLocalOrigin = originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1";
        const isLocalReq = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
        if (isLocalOrigin && isLocalReq && originUrl.port === requestUrl.port) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export async function POST(request) {
    if (!hasSameOrigin(request)) {
        return apiError("Request origin is not allowed.", 403);
    }

    try {
        const rateLimit = await enforceSubmissionRateLimit(request, "upload-signature");
        if (rateLimit.limited) {
            return NextResponse.json(
                { success: false, message: "Too many upload attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
            );
        }

        const config = getCloudinaryConfig();
        const upload = createSignedImageUpload({
            purpose: "submission-cover",
            config,
        });

        return apiSuccess({ upload }, 200);
    } catch (error) {
        console.error("[SUBMISSION UPLOAD] Signature failed:", error.message);
        return apiError("Image upload service is currently unavailable.", 503);
    }
}
