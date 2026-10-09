import { z } from "zod";

import { connectDB } from "@/lib/db";
import BusinessSubmission from "@/models/BusinessSubmission";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const updateSchema = z.object({
    status: z.enum(["pending", "reviewing", "approved", "rejected"]).optional(),
    adminNotes: z.string().trim().max(3000).optional(),
}).strict();

export async function PATCH(request, { params }) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const { id } = await params;
        if (!objectIdSchema.safeParse(id).success) return apiError("Invalid submission ID.", 400);
        const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
        if (contentType !== "application/json") return apiError("Content-Type must be application/json.", 415);

        const body = await request.json().catch(() => null);
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Submission update is invalid.", 400, parsed.error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message,
            })));
        }
        if (!Object.keys(parsed.data).length) return apiError("Provide a status or admin note to update.", 400);

        await connectDB();
        const item = await BusinessSubmission.findById(id).exec();
        if (!item) return apiError("Submission not found.", 404);

        if (parsed.data.status !== undefined) {
            item.status = parsed.data.status;
            if (["approved", "rejected"].includes(parsed.data.status)) {
                item.reviewedBy = auth.user.id;
                item.reviewedAt = new Date();
            } else if (parsed.data.status === "pending" || parsed.data.status === "reviewing") {
                item.reviewedBy = null;
                item.reviewedAt = null;
            }
        }
        if (parsed.data.adminNotes !== undefined) item.adminNotes = parsed.data.adminNotes;
        await item.save();

        return apiSuccess({
            message: "Submission updated successfully.",
            item: item.toObject(),
        });
    } catch (error) {
        console.error("[ADMIN SUBMISSIONS] Update failed:", error.message);
        return apiError("Unable to update this submission.", 500);
    }
}
