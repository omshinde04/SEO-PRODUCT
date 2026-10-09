import { z } from "zod";

import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import BusinessSubmission from "@/models/BusinessSubmission";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = ["pending", "reviewing", "approved", "rejected"];
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
        if (status && !statuses.includes(status)) return apiError("Invalid submission status filter.", 400);
        if (q.length > 100) return apiError("Search query is too long.", 400);

        await connectDB();
        const filter = {};
        if (status) filter.status = status;
        if (q) {
            const safe = new RegExp(escapeRegex(q), "i");
            filter.$or = [
                { businessName: safe },
                { contactName: safe },
                { email: safe },
                { phone: safe },
                { locationName: safe },
                { categoryName: safe },
            ];
        }

        const skip = (page - 1) * limit;
        const [items, total, counts] = await Promise.all([
            BusinessSubmission.find(filter)
                .select("-__v")
                .populate("business", "name slug status")
                .populate("category", "name slug")
                .populate("location", "name slug type")
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            BusinessSubmission.countDocuments(filter),
            BusinessSubmission.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
        ]);

        const summary = { pending: 0, reviewing: 0, approved: 0, rejected: 0, total: 0 };
        for (const row of counts) {
            if (Object.hasOwn(summary, row._id)) summary[row._id] = row.count;
            summary.total += row.count;
        }

        // Auto-detect matching businesses if not explicitly linked
        for (const item of items) {
            if (!item.business && item.businessName) {
                const matched = await Business.findOne({
                    $or: [
                        { name: new RegExp(`^${escapeRegex(item.businessName)}$`, "i") },
                        ...(item.phone ? [{ "contact.phone": item.phone }] : []),
                        ...(item.email ? [{ "contact.email": item.email }] : []),
                    ],
                })
                    .select("name slug status")
                    .lean();

                if (matched) {
                    item.business = matched;
                    BusinessSubmission.updateOne({ _id: item._id }, { $set: { business: matched._id } })
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
        console.error("[ADMIN SUBMISSIONS] List failed:", error.message);
        return apiError("Unable to retrieve business submissions.", 500);
    }
}
