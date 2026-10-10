
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import Business from "@/models/Business";
import Category from "@/models/Category";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEFAULT_BUSINESS_LIMIT = 12;
const MAX_BUSINESS_LIMIT = 50;

const DEFAULT_CHILD_LIMIT = 50;
const MAX_CHILD_LIMIT = 100;

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

/**
 * GET /api/locations/:slug
 *
 * Returns:
 * - Active location details and SEO metadata
 * - Active parent location, if present
 * - Paginated active child locations
 * - Paginated published businesses assigned to this location
 *
 * Query parameters:
 * - page: business page, defaults to 1
 * - limit: businesses per page, defaults to 12, maximum 50
 * - childrenPage: child-location page, defaults to 1
 * - childrenLimit: children per page, defaults to 50, maximum 100
 */
export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        if (
            typeof slug !== "string" ||
            slug.length > 140 ||
            !SLUG_REGEX.test(slug)
        ) {
            return apiError("Invalid location slug.", 400);
        }

        const { searchParams } = new URL(request.url);

        const page = parsePositiveInteger(
            searchParams.get("page"),
            1,
            Number.MAX_SAFE_INTEGER
        );

        const limit = parsePositiveInteger(
            searchParams.get("limit"),
            DEFAULT_BUSINESS_LIMIT,
            MAX_BUSINESS_LIMIT
        );

        const childrenPage = parsePositiveInteger(
            searchParams.get("childrenPage"),
            1,
            Number.MAX_SAFE_INTEGER
        );

        const childrenLimit = parsePositiveInteger(
            searchParams.get("childrenLimit"),
            DEFAULT_CHILD_LIMIT,
            MAX_CHILD_LIMIT
        );

        if (page === null || childrenPage === null) {
            return apiError(
                "Page values must be positive integers.",
                400
            );
        }

        if (limit === null) {
            return apiError(
                `Business limit must be between 1 and ${MAX_BUSINESS_LIMIT}.`,
                400
            );
        }

        if (childrenLimit === null) {
            return apiError(
                `Children limit must be between 1 and ${MAX_CHILD_LIMIT}.`,
                400
            );
        }

        const businessSkip = (page - 1) * limit;
        const childrenSkip = (childrenPage - 1) * childrenLimit;

        if (
            !Number.isSafeInteger(businessSkip) ||
            !Number.isSafeInteger(childrenSkip)
        ) {
            return apiError("Page is too large.", 400);
        }

        await connectDB();

        // Slugs are unique within a parent, not globally.
        // Never choose an arbitrary location when a slug is ambiguous.
        const matches = await Location.find({
            slug,
            status: "active",
        })
            .select("_id")
            .limit(2)
            .lean()
            .exec();

        if (matches.length === 0) {
            return apiError("Location not found.", 404);
        }

        if (matches.length > 1) {
            return apiError(
                "This location slug is ambiguous. Use a unique slug or a hierarchical location URL.",
                409
            );
        }

        const locationId = matches[0]._id;

        const location = await Location.findOne({
            _id: locationId,
            status: "active",
        })
            .select(
                "name slug type parent address coordinates description coverImage seo sortOrder createdAt updatedAt"
            )
            .lean()
            .exec();

        if (!location) {
            return apiError("Location not found.", 404);
        }

        // Resolve the parent separately so a missing or inactive parent
        // cannot accidentally be presented as a root location.
        let parent = null;

        if (location.parent) {
            parent = await Location.findOne({
                _id: location.parent,
                status: "active",
            })
                .select(
                    "name slug type parent address description coverImage seo"
                )
                .lean()
                .exec();

            if (!parent) {
                return apiError("Location not found.", 404);
            }
        }

        const childFilter = {
            parent: location._id,
            status: "active",
        };

        // Match the public business-list rules:
        // published businesses, indexable business pages, active categories.
        const activeCategoryIds = await Category.find({
            status: "active",
        }).distinct("_id").exec();

        const businessFilter = {
            location: location._id,
            status: "published",
            "seo.noIndex": { $ne: true },
            category: { $in: activeCategoryIds },
        };

        const [
            children,
            totalChildren,
            businesses,
            totalBusinesses,
        ] = await Promise.all([
            Location.find(childFilter)
                .select(
                    "name slug type parent address description coverImage seo sortOrder"
                )
                .sort({
                    sortOrder: 1,
                    name: 1,
                    _id: 1,
                })
                .skip(childrenSkip)
                .limit(childrenLimit)
                .lean()
                .exec(),

            Location.countDocuments(childFilter),

            Business.find(businessFilter)
                .select("-internalNotes -createdBy -updatedBy")
                .populate({
                    path: "category",
                    select: "name slug description icon",
                    match: { status: "active" },
                })
                .populate({
                    path: "location",
                    select: "name slug type address coverImage",
                    match: { status: "active" },
                })
                .sort({
                    isSponsored: -1,
                    sponsoredPriority: -1,
                    isFeatured: -1,
                    publishedAt: -1,
                    name: 1,
                    _id: 1,
                })
                .skip(businessSkip)
                .limit(limit)
                .lean()
                .exec(),

            Business.countDocuments(businessFilter),
        ]);

        // Exclude any records whose references became invalid or inactive.
        const now = new Date();
        const visibleBusinesses = businesses
            .filter((business) => business.category && business.location)
            .map((b) => {
                if (b.isSponsored && b.sponsoredUntil && new Date(b.sponsoredUntil) < now) {
                    return { ...b, isSponsored: false };
                }
                return b;
            });

        return apiSuccess({
            item: location,
            parent,
            children,
            childrenPagination: {
                page: childrenPage,
                limit: childrenLimit,
                total: totalChildren,
                totalPages: Math.ceil(totalChildren / childrenLimit),
            },
            businesses: visibleBusinesses,
            businessPagination: {
                page,
                limit,
                total: totalBusinesses,
                totalPages: Math.ceil(totalBusinesses / limit),
            },
        });
    } catch (error) {
        console.error(
            "[PUBLIC LOCATION DETAIL] Request failed:",
            error.message
        );

        return apiError(
            "Unable to retrieve location details.",
            500
        );
    }
}
