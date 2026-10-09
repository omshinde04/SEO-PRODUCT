import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInteger(value, fallback, maximum) {
    if (value === null || value === "") return fallback;
    if (!/^\\d+$/.test(value)) return null;

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
        return null;
    }

    return parsed;
}

async function resolveActiveReference(Model, value, label) {
    if (!value) return { filter: null, error: null };

    const query = mongoose.isValidObjectId(value)
        ? { _id: value, status: "active" }
        : { slug: value.toLowerCase(), status: "active" };

    const record = await Model.findOne(query).select("_id").lean().exec();

    if (!record) {
        return {
            filter: null,
            error: apiError(`Active ${label} not found.`, 404),
        };
    }

    return { filter: record._id, error: null };
}

/**
 * GET /api/businesses
 *
 * Public discovery endpoint. Only published businesses with active
 * categories and locations are returned.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const page = parsePositiveInteger(
            searchParams.get("page"),
            1,
            Number.MAX_SAFE_INTEGER
        );
        const limit = parsePositiveInteger(
            searchParams.get("limit"),
            DEFAULT_LIMIT,
            MAX_LIMIT
        );

        if (page === null) {
            return apiError("Page must be a positive integer.", 400);
        }

        if (limit === null) {
            return apiError(`Limit must be between 1 and ${MAX_LIMIT}.`, 400);
        }

        const q = (searchParams.get("q") || "").trim();
        const businessType = (searchParams.get("businessType") || "").trim();
        const categoryValue = (searchParams.get("category") || "").trim();
        const locationValue = (searchParams.get("location") || "").trim();

        if (q.length > 100) {
            return apiError("Search query must be 100 characters or fewer.", 400);
        }

        if (businessType && ![
            "business",
            "restaurant",
            "hotel",
            "professional_service",
            "healthcare",
            "retail",
            "tourism",
            "attraction",
            "guide",
            "event_venue",
            "other",
        ].includes(businessType)) {
            return apiError("Invalid businessType filter.", 400);
        }

        await connectDB();

        const [categoryResult, locationResult] = await Promise.all([
            resolveActiveReference(Category, categoryValue, "category"),
            resolveActiveReference(Location, locationValue, "location"),
        ]);

        if (categoryResult.error) return categoryResult.error;
        if (locationResult.error) return locationResult.error;

        const filter = {
            status: "published",
            "seo.noIndex": { $ne: true },
        };

        if (categoryResult.filter) filter.category = categoryResult.filter;
        if (locationResult.filter) filter.location = locationResult.filter;
        if (businessType) filter.businessType = businessType;

        if (q) {
            const expression = new RegExp(escapeRegex(q), "i");
            filter.$or = [
                { name: expression },
                { tagline: expression },
                { description: expression },
                { "address.city": expression },
                { "address.area": expression },
                { services: expression },
            ];
        }

        const skip = (page - 1) * limit;

        if (!Number.isSafeInteger(skip)) {
            return apiError("Page is too large.", 400);
        }

        const [items, total] = await Promise.all([
            Business.find(filter)
                .select("-internalNotes -createdBy -updatedBy")
                .populate({
                    path: "category",
                    select: "name slug description icon",
                    match: { status: "active", "seo.noIndex": { $ne: true } },
                })
                .populate({
                    path: "location",
                    select: "name slug type address coverImage",
                    match: { status: "active", "seo.noIndex": { $ne: true } },
                })
                .sort({ publishedAt: -1, name: 1, _id: 1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Business.countDocuments(filter),
        ]);

        const visibleItems = items.filter((item) => item.category && item.location);

        return apiSuccess({
            items: visibleItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("[PUBLIC BUSINESSES] List failed:", error.message);
        return apiError("Unable to retrieve businesses.", 500);
    }
}
