import { z } from "zod";
import { connectDB } from "@/lib/db";
import PromotionRequest from "@/models/PromotionRequest";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { expireOutdatedPromotions } from "@/lib/promotions/sync";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const statuses = ["pending", "reviewing", "active", "rejected", "paused", "completed"];

export async function GET(request) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 20);
        const status = searchParams.get("status") || "";
        const q = (searchParams.get("q") || "").trim();

        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return apiError("Invalid pagination parameters.", 400);
        }
        const allowedStatuses = [...statuses, "under_review", "reviewing_or_paused"];
        if (status && !allowedStatuses.includes(status)) return apiError("Invalid promotion status filter.", 400);

        await connectDB();
        await expireOutdatedPromotions();
        const filter = {};
        if (status === "reviewing" || status === "under_review" || status === "reviewing_or_paused") {
            // When filtering by Under Review, also show paused ads as requested
            filter.status = { $in: ["reviewing", "paused"] };
        } else if (status) {
            filter.status = status;
        }
        if (q) {
            const safe = new RegExp(escapeRegex(q), "i");
            filter.$or = [
                { businessName: safe },
                { contactName: safe },
                { email: safe },
                { phone: safe },
                { promotionalHeadline: safe },
                { targetCategoryName: safe },
                { targetLocationName: safe },
            ];
        }

        const skip = (page - 1) * limit;
        const [items, total, counts] = await Promise.all([
            PromotionRequest.find(filter)
                .select("-__v")
                .populate("business", "name slug status isSponsored coverImage tagline")
                .populate("targetCategory", "name slug")
                .populate("targetLocation", "name slug type")
                .populate("reviewedBy", "name email")
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            PromotionRequest.countDocuments(filter),
            PromotionRequest.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
        ]);

        const summary = { pending: 0, reviewing: 0, active: 0, rejected: 0, paused: 0, completed: 0, underReview: 0, total: 0 };
        for (const row of counts) {
            if (Object.hasOwn(summary, row._id)) summary[row._id] = row.count;
            summary.total += row.count;
        }
        // underReview includes both reviewing and paused
        summary.underReview = (summary.reviewing || 0) + (summary.paused || 0);

        // Auto-detect matching businesses if not explicitly linked
        for (const item of items) {
            if (!item.business && item.businessName) {
                const matched = await Business.findOne({
                    status: "published",
                    $or: [
                        { name: new RegExp(`^${escapeRegex(item.businessName)}$`, "i") },
                        ...(item.phone ? [{ "contact.phone": item.phone }] : []),
                        ...(item.email ? [{ "contact.email": item.email }] : []),
                    ],
                })
                    .select("name slug status isSponsored coverImage tagline")
                    .lean();

                if (matched) {
                    item.business = matched;
                    PromotionRequest.updateOne({ _id: item._id }, { $set: { business: matched._id } })
                        .exec()
                        .catch(() => {});
                }
            }
        }

        return apiSuccess({
            items,
            summary,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("[ADMIN PROMOTIONS] List error:", error.message);
        return apiError("Unable to retrieve promotion requests.", 500);
    }
}
