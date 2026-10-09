import { z } from "zod";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createSignedImageUpload, getCloudinaryConfig, UPLOAD_PURPOSES } from "@/lib/cloudinary/upload-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ purpose: z.enum(Object.keys(UPLOAD_PURPOSES)) }).strict();

function hasSameOrigin(request) {
    const origin = request.headers.get("origin");
    if (!origin) return false;
    try { return new URL(origin).origin === new URL(request.url).origin; }
    catch { return false; }
}

/** Signs one server-selected upload folder and server-generated public ID. */
export async function POST(request) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    if (!hasSameOrigin(request)) return apiError("Request origin is not allowed.", 403);

    const contentType = request.headers.get("content-type") || "";
    if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
        return apiError("Content-Type must be application/json.", 415);
    }

    let body;
    try { body = await request.json(); }
    catch { return apiError("Invalid JSON request body.", 400); }

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
        return apiError("Upload request is invalid.", 400, validation.error.issues.map((issue) => ({
            field: issue.path.join("."), message: issue.message,
        })));
    }

    try {
        const upload = createSignedImageUpload({
            purpose: validation.data.purpose,
            config: getCloudinaryConfig(),
        });
        return apiSuccess({ upload }, 200);
    } catch (error) {
        console.error("[UPLOADS] Signature generation failed:", error.message);
        return apiError("Image uploads are not configured correctly.", 503);
    }
}