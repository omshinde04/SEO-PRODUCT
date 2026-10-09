
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LOCATION_TYPES = [
    "country",
    "state",
    "district",
    "city",
    "town",
    "village",
    "locality",
    "region",
];

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
                error: apiError("Invalid parent location ID.", 400),
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
                error: apiError("Invalid parent location.", 400),
            };
        }

        // Location slugs are unique within a parent, not globally.
        // Therefore, a slug can be ambiguous across different branches.
        const matches = await Location.find({
            slug: value,
            status: "active",
        })
            .select("_id")
            .limit(2)
            .lean()
            .exec();

        if (matches.length === 0) {
            return {
                filter: undefined,
                error: apiError("Active parent location not found.", 404),
            };
        }

        if (matches.length > 1) {
            return {
                filter: undefined,
                error: apiError(
                    "Parent slug is ambiguous. Use the parent location ID.",
                    400
                ),
            };
        }

        return {
            filter: matches[0]._id,
            error: null,
        };
    }

    const parent = await Location.findOne(query)
        .select("_id")
        .lean()
        .exec();

    if (!parent) {
        return {
            filter: undefined,
            error: apiError("Active parent location not found.", 404),
        };
    }

    return {
        filter: parent._id,
        error: null,
    };
}

/**
 * GET /api/locations
 *
 * Public API for browsing active locations.
 *
 * Query parameters:
 * - page: positive integer, defaults to 1
 * - limit: positive integer, defaults to 50, maximum 100
 * - q: search by location name or slug
 * - type: filter by location type
 * - parent: parent location ID or slug
 * - parent=root: return top-level locations
 *
 * Only active locations are returned.
 * seo.noIndex does not hide a location from public browsing.
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
            return apiError(
                "Page must be a positive integer.",
                400
            );
        }

        if (limit === null) {
            return apiError(
                `Limit must be between 1 and ${MAX_LIMIT}.`,
                400
            );
        }

        const search = (searchParams.get("q") || "").trim();
        const type = searchParams.get("type");
        const rawParent = searchParams.get("parent");

        const parentValue =
            rawParent === null ? null : rawParent.trim();

        if (search.length > MAX_SEARCH_LENGTH) {
            return apiError(
                `Search query must be ${MAX_SEARCH_LENGTH} characters or fewer.`,
                400
            );
        }

        if (type !== null && !LOCATION_TYPES.includes(type)) {
            return apiError("Invalid location type.", 400);
        }

        if (parentValue === "") {
            return apiError(
                "Parent location cannot be empty.",
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

        if (type !== null) {
            filter.type = type;
        }

        if (parentValue !== null) {
            filter.parent = parentResult.filter;
        }

        if (search) {
            const expression = new RegExp(
                escapeRegex(search),
                "i"
            );

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
            Location.find(filter)
                .select(
                    "name slug type parent address coordinates description coverImage seo.title seo.description seo.noIndex sortOrder"
                )
                .sort({
                    sortOrder: 1,
                    name: 1,
                    _id: 1,
                })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),

            Location.countDocuments(filter),
        ]);

        return apiSuccess({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(
            "[PUBLIC LOCATIONS] List failed:",
            error.message
        );

        return apiError(
            "Unable to retrieve locations.",
            500
        );
    }
}