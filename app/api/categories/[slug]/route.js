
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Business from "@/models/Business";
import Location from "@/models/Location";
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

export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        if (
            typeof slug !== "string" ||
            slug.length > 120 ||
            !SLUG_REGEX.test(slug)
        ) {
            return apiError("Invalid category slug.", 400);
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

        const item = await Category.findOne({
            slug,
            status: "active",
        })
            .select(
                "name slug description icon parent sortOrder seo createdAt updatedAt"
            )
            .lean()
            .exec();

        if (!item) {
            return apiError("Category not found.", 404);
        }

        let parent = null;

        if (item.parent) {
            parent = await Category.findOne({
                _id: item.parent,
                status: "active",
            })
                .select("name slug description icon parent seo")
                .lean()
                .exec();

            if (!parent) {
                return apiError("Category not found.", 404);
            }
        }

        const childFilter = {
            parent: item._id,
            status: "active",
        };

        const businessFilter = {
            category: item._id,
            status: "published",
            "seo.noIndex": { $ne: true },
        };

        const [
            activeLocationIds,
            children,
            totalChildren,
        ] = await Promise.all([
            Location.find({ status: "active" })
                .distinct("_id")
                .exec(),

            Category.find(childFilter)
                .select(
                    "name slug description icon parent sortOrder seo.title seo.description seo.noIndex"
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

            Category.countDocuments(childFilter),
        ]);

        businessFilter.location = {
            $in: activeLocationIds,
        };

        const [businesses, totalBusinesses] = await Promise.all([
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

        const visibleBusinesses = businesses.filter(
            (business) => business.category && business.location
        );

        return apiSuccess({
            item,
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
            "[PUBLIC CATEGORY DETAIL] Request failed:",
            error.message
        );

        return apiError(
            "Unable to retrieve category details.",
            500
        );
    }
}
