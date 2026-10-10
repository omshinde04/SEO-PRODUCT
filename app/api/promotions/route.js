import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import PromotionRequest from "@/models/PromotionRequest";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const hexId = z.string().regex(/^[a-f\d]{24}$/i);

const submissionSchema = z.object({
    businessId: hexId.nullable().optional().default(null),
    businessName: z.string().trim().min(2).max(160),
    contactName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().min(7).max(30).regex(/^[+()\d .-]+$/),
    whatsapp: z.string().trim().max(30).optional().default(""),
    plan: z.enum(["starter_7", "growth_14", "spotlight_30", "custom"]).optional().default("growth_14"),
    promotionalHeadline: z.string().trim().max(200).optional().default(""),
    targetCategory: z.string().trim().max(160).nullable().optional().default(null),
    targetCategoryName: z.string().trim().max(160).optional().default(""),
    targetLocation: z.string().trim().max(160).nullable().optional().default(null),
    targetLocationName: z.string().trim().max(160).optional().default(""),
    preferredCta: z.enum(["call", "call_now", "whatsapp", "website", "directions", "details", "visit_us", "order_online"]).optional().default("call_now"),
    budget: z.string().trim().max(80).optional().default(""),
    message: z.string().trim().max(3000).optional().default(""),
}).strict();

/**
 * GET /api/promotions
 * Public endpoint to fetch active sponsored promotions / spotlight businesses.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(Math.max(Number(searchParams.get("limit") || 4), 1), 20);
        const category = searchParams.get("category") || "";
        const location = searchParams.get("location") || "";

        await connectDB();

        // 1. Find businesses flagged as isSponsored: true
        const businessFilter = {
            status: "published",
            isSponsored: true,
            $or: [
                { sponsoredUntil: null },
                { sponsoredUntil: { $gte: new Date() } },
            ],
        };

        if (category) {
            const catDoc = await Category.findOne({
                $or: [{ _id: hexId.safeParse(category).success ? category : null }, { slug: category }],
            }).select("_id");
            if (catDoc) businessFilter.category = catDoc._id;
        }

        if (location) {
            const locDoc = await Location.findOne({
                $or: [{ _id: hexId.safeParse(location).success ? location : null }, { slug: location }],
            }).select("_id");
            if (locDoc) businessFilter.location = locDoc._id;
        }

        const sponsoredBusinesses = await Business.find(businessFilter)
            .select("-internalNotes -createdBy -updatedBy")
            .populate("category", "name slug description icon")
            .populate("location", "name slug type address coverImage")
            .sort({ sponsoredPriority: -1, updatedAt: -1 })
            .limit(limit)
            .lean()
            .exec();

        // 2. Also check active promotion requests that have approved spotlight copy
        const activeRequests = await PromotionRequest.find({
            status: "active",
            $or: [
                { endDate: null },
                { endDate: { $gte: new Date() } },
            ],
        })
            .populate({
                path: "business",
                select: "-internalNotes -createdBy -updatedBy",
                populate: [
                    { path: "category", select: "name slug description icon" },
                    { path: "location", select: "name slug type address coverImage" },
                ],
            })
            .sort({ priority: -1, createdAt: -1 })
            .limit(limit)
            .lean()
            .exec();

        return apiSuccess({
            sponsoredBusinesses,
            activeRequests,
        });
    } catch (error) {
        console.error("[PROMOTIONS] Failed to fetch active promotions:", error.message);
        return apiError("Could not retrieve active promotions.", 500);
    }
}

/**
 * POST /api/promotions
 * Public endpoint to submit a promotion / sponsored ad request.
 */
export async function POST(request) {
    const contentType = (request.headers.get("content-type") || "")
        .split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
        return apiError("Content-Type must be application/json.", 415);
    }

    const body = await request.json().catch(() => null);
    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
        return apiError("Promotion request details are invalid.", 400, parsed.error.issues);
    }

    try {
        await connectDB();
        const data = parsed.data;

        let linkedBusinessId = data.businessId;

        // Auto-match business if not explicitly provided
        if (!linkedBusinessId && data.businessName) {
            const matched = await Business.findOne({
                status: "published",
                $or: [
                    { name: new RegExp(`^${escapeRegex(data.businessName)}$`, "i") },
                    ...(data.phone ? [{ "contact.phone": data.phone }] : []),
                    ...(data.email ? [{ "contact.email": data.email }] : []),
                ],
            })
                .select("_id")
                .lean();

            if (matched) {
                linkedBusinessId = matched._id;
            }
        }

        const newRequest = await PromotionRequest.create({
            business: linkedBusinessId || null,
            businessName: data.businessName,
            contactName: data.contactName,
            email: data.email,
            phone: data.phone,
            whatsapp: data.whatsapp || data.phone,
            plan: data.plan,
            promotionalHeadline: data.promotionalHeadline,
            targetCategory: data.targetCategory,
            targetCategoryName: data.targetCategoryName,
            targetLocation: data.targetLocation,
            targetLocationName: data.targetLocationName,
            preferredCta: data.preferredCta,
            budget: data.budget,
            message: data.message,
            status: "pending",
            sponsoredBadge: "Sponsored",
            priority: 1,
        });

        return apiSuccess(
            {
                id: newRequest._id,
                businessName: newRequest.businessName,
                status: newRequest.status,
                message: "Promotion request submitted successfully. Our team will review and activate your sponsored ad.",
            },
            201
        );
    } catch (error) {
        console.error("[PROMOTIONS] Submit error:", error.message);
        return apiError("Failed to submit promotion request. Please try again.", 500);
    }
}
