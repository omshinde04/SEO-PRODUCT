import { z } from "zod";
import { connectDB } from "@/lib/db";
import PromotionRequest from "@/models/PromotionRequest";
import Business from "@/models/Business";
import { syncPromotionToBusiness } from "@/lib/promotions/sync";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hexId = z.string().regex(/^[a-f\d]{24}$/i);

const updateSchema = z.object({
    status: z.enum(["pending", "reviewing", "active", "rejected", "paused", "completed"]).optional(),
    businessId: hexId.nullable().optional(),
    promotionalHeadline: z.string().trim().max(200).optional(),
    sponsoredTagline: z.string().trim().max(200).optional(),
    sponsoredBadge: z.string().trim().max(50).optional(),
    priority: z.number().int().min(0).max(100).optional(),
    durationDays: z.number().int().min(1).max(365).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    adminNotes: z.string().trim().max(3000).optional(),
}).strict();

export async function PATCH(request, context) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const { id } = await context.params;
    if (!hexId.safeParse(id).success) {
        return apiError("Invalid promotion request ID.", 400);
    }

    const contentType = (request.headers.get("content-type") || "")
        .split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
        return apiError("Content-Type must be application/json.", 415);
    }

    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return apiError("Invalid update payload.", 400, parsed.error.issues);
    }

    try {
        await connectDB();
        const promo = await PromotionRequest.findById(id);
        if (!promo) {
            return apiError("Promotion request not found.", 404);
        }

        const data = parsed.data;
        const previousBusinessId = promo.business ? String(promo.business) : null;

        if (data.status) promo.status = data.status;
        if (data.businessId !== undefined) promo.business = data.businessId || null;
        const headline = data.sponsoredTagline !== undefined ? data.sponsoredTagline : data.promotionalHeadline;
        if (headline !== undefined) promo.promotionalHeadline = headline;
        if (data.sponsoredBadge !== undefined) promo.sponsoredBadge = data.sponsoredBadge;
        if (data.priority !== undefined) promo.priority = data.priority;
        if (data.adminNotes !== undefined) promo.adminNotes = data.adminNotes;

        const now = new Date();
        promo.reviewedBy = auth.user._id;
        promo.reviewedAt = now;

        const effectiveStatus = data.status || promo.status;

        // If activating or updating an active promotion:
        if (effectiveStatus === "active") {
            const start = data.startDate ? new Date(data.startDate) : (promo.startDate || now);
            let end = data.endDate ? new Date(data.endDate) : promo.endDate;

            if (!end || end <= start) {
                const days = data.durationDays || (
                    promo.plan === "starter_7" ? 7 :
                    promo.plan === "growth_14" ? 14 :
                    promo.plan === "spotlight_30" ? 30 : 14
                );
                end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
            }

            promo.startDate = start;
            promo.endDate = end;
        }

        // Synchronize with Business collection (auto-creates if needed, updates sponsorship & cleans up stale links)
        await syncPromotionToBusiness(promo, { previousBusinessId });

        await promo.save();

        const updated = await PromotionRequest.findById(id)
            .populate("business", "name slug status isSponsored coverImage tagline")
            .populate("targetCategory", "name slug")
            .populate("targetLocation", "name slug type")
            .populate("reviewedBy", "name email")
            .lean();

        return apiSuccess({
            item: updated,
            message: `Promotion request ${promo.status === "active" ? "approved & activated" : "updated"} successfully.`,
        });
    } catch (error) {
        console.error("[ADMIN PROMOTIONS] Patch error:", error.message);
        return apiError("Failed to update promotion request.", 500);
    }
}

export async function DELETE(request, context) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const { id } = await context.params;
    if (!hexId.safeParse(id).success) {
        return apiError("Invalid promotion request ID.", 400);
    }

    try {
        await connectDB();
        const promo = await PromotionRequest.findById(id);
        if (!promo) {
            return apiError("Promotion request not found.", 404);
        }

        if (promo.business && promo.status === "active") {
            await Business.findByIdAndUpdate(promo.business, {
                $set: {
                    isSponsored: false,
                    sponsoredUntil: null,
                },
            });
        }

        await PromotionRequest.findByIdAndDelete(id);

        return apiSuccess({ message: "Promotion request deleted." });
    } catch (error) {
        console.error("[ADMIN PROMOTIONS] Delete error:", error.message);
        return apiError("Failed to delete promotion request.", 500);
    }
}
