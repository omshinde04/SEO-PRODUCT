
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parsePositiveInteger(value, fallback, maximum) {
    if (value === null || value === "") {
        return fallback;
    }

    if (!/^\d+$/.test(value)) {
        return null;
    }

    const parsed = Number(value);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed < 1 ||
        parsed > maximum
    ) {
        return null;
    }

    return parsed;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveActiveParent(value) {
    if (value === null) {
        return { filter: undefined, error: null };
    }

    if (value === "root") {
        return { filter: null, error: null };
    }

    let query;

    if (OBJECT_ID_REGEX.test(value)) {
        if (!mongoose.isValidObjectId(value)) {
            return {
                filter: undefined,
                error: apiError("Invalid parent category ID.", 400),
            };
        }

        query = {
            _id: value,
            status: "active",
        };
    } else {
        if (!SLUG_REGEX.test(value)) {
            return {
                filter: undefined,
                error: apiError("Invalid parent category.", 400),
            };
        }

        query = {
            slug: value,
            status: "active",
        };
    }

    const parent = await Category.findOne(query)
        .select("_id")
        .lean()
        .exec();

    if (!parent) {
        return {
            filter: undefined,
            error: apiError("Active parent category not found.", 404),
        };
    }

    return {
        filter: parent._id,
        error: null,
    };
}

/**
 * GET /api/categories
 *
 * Returns active categories for public browsing.
 *
 * Query parameters:
 * - page: positive integer; defaults to 1
 * - limit: positive integer; defaults to 50; maximum 100
 * - q: optional search by category name or slug
 * - parent: optional active parent category ID or slug
 * - parent=root: return top-level categories only
 *
 * seo.noIndex does not hide a category from this API.
 * It is an SEO directive, not a publication status.
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
            return apiError(
                `Limit must be between 1 and ${MAX_LIMIT}.`,
                400
            );
        }

        const search = (searchParams.get("q") || "").trim();
        const rawParent = searchParams.get("parent");
        const parentValue = rawParent === null ? null : rawParent.trim();

        if (search.length > MAX_SEARCH_LENGTH) {
            return apiError(
                `Search query must be ${MAX_SEARCH_LENGTH} characters or fewer.`,
                400
            );
        }

        if (parentValue === "") {
            return apiError(
                "Parent category cannot be empty.",
                400
            );
        }

        await connectDB();

        const parentResult = await resolveActiveParent(parentValue);

        if (parentResult.error) {
            return parentResult.error;
        }

        const filter = {
            status: "active",
        };

        // Apply a parent filter only when the parameter was supplied.
        if (parentValue !== null) {
            filter.parent = parentResult.filter;
        }

        if (search) {
            const expression = new RegExp(escapeRegex(search), "i");

            filter.$or = [
                { name: expression },
                { slug: expression },
            ];
        }

        const skip = (page - 1) * limit;

        if (!Number.isSafeInteger(skip)) {
            return apiError("Page is too large.", 400);
        }

        const [items, total] = await Promise.all([
            Category.find(filter)
                .select(
                    "name slug description icon parent sortOrder seo.title seo.description seo.noIndex"
                )
                .populate({
                    path: "parent",
                    select: "name slug",
                    match: { status: "active" },
                })
                .sort({
                    sortOrder: 1,
                    name: 1,
                    _id: 1,
                })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),

            Category.countDocuments(filter),
        ]);

        // Top-level categories have no parent. Child categories must have
        // a successfully populated active parent.
        const visibleItems = items.filter(
            (item) => item.parent === null || Boolean(item.parent)
        );

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
        console.error(
            "[PUBLIC CATEGORIES] List failed:",
            error.message
        );

        return apiError(
            "Unable to retrieve categories.",
            500
        );
    }
}