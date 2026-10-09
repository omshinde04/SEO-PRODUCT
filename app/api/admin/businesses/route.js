
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
    optionalUrlSchema,
    requiredUrlSchema,
    weeklyHoursSchema,
    validateCoordinatePair,
    validatePublishedBusiness,
} from "@/lib/business/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const businessTypes = [
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
];

const businessStatuses = ["draft", "published", "archived"];

const verificationStatuses = [
    "unverified",
    "pending",
    "verified",
    "rejected",
];

const priceRanges = [
    "budget",
    "moderate",
    "premium",
    "luxury",
    "not_applicable",
];

const preferredMethods = [
    "phone",
    "whatsapp",
    "email",
    "website",
    "any",
];

const slugSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const optionalText = (max) =>
    z.string().trim().max(max).optional();

const imageSchema = z
    .object({
        url: requiredUrlSchema,
        publicId: z.string().trim().min(1).max(300),
        alt: z.string().trim().max(200).optional().default(""),
    })
    .strict();

const businessInputSchema = z
    .object({
        name: z.string().trim().min(2).max(160),
        slug: slugSchema,
        tagline: z.string().trim().max(200).optional().default(""),
        description: z.string().trim().max(10000).optional().default(""),

        businessType: z
            .enum(businessTypes)
            .optional()
            .default("business"),

        establishedYear: z
            .number()
            .int()
            .min(1800)
            .max(new Date().getFullYear())
            .nullable()
            .optional()
            .default(null),

        category: z.string().regex(/^[a-f\d]{24}$/i),
        location: z.string().regex(/^[a-f\d]{24}$/i),

        contact: z
            .object({
                phone: optionalText(30),
                alternatePhone: optionalText(30),
                whatsapp: optionalText(30),
                email: z
                    .string()
                    .trim()
                    .email()
                    .max(254)
                    .or(z.literal(""))
                    .optional(),
                website: optionalUrlSchema.optional(),
                preferredMethod: z.enum(preferredMethods).optional(),
            })
            .strict()
            .optional()
            .default({}),

        socialLinks: z
            .object({
                instagram: optionalUrlSchema.optional(),
                facebook: optionalUrlSchema.optional(),
                youtube: optionalUrlSchema.optional(),
                linkedin: optionalUrlSchema.optional(),
                x: optionalUrlSchema.optional(),
                tiktok: optionalUrlSchema.optional(),
                other: z
                    .array(
                        z
                            .object({
                                platform: z
                                    .string()
                                    .trim()
                                    .min(1)
                                    .max(50),
                                url: requiredUrlSchema,
                            })
                            .strict()
                    )
                    .max(20)
                    .optional(),
            })
            .strict()
            .optional()
            .default({}),

        address: z
            .object({
                line1: optionalText(200),
                line2: optionalText(200),
                area: optionalText(120),
                city: optionalText(120),
                district: optionalText(120),
                state: optionalText(120),
                country: optionalText(80),
                postalCode: optionalText(12),
                formatted: optionalText(500),
            })
            .strict()
            .optional()
            .default({}),

        coordinates: z
            .object({
                latitude: z
                    .number()
                    .min(-90)
                    .max(90)
                    .nullable()
                    .optional(),
                longitude: z
                    .number()
                    .min(-180)
                    .max(180)
                    .nullable()
                    .optional(),
            })
            .strict()
            .optional(),

        serviceAreas: z
            .array(z.string().trim().min(1).max(120))
            .max(50)
            .optional(),

        openingHours: z
            .object({
                timezone: z.string().trim().min(1).max(100).optional(),
                weekly: weeklyHoursSchema.optional(),
                notes: optionalText(500),
            })
            .strict()
            .optional(),

        services: z
            .array(z.string().trim().min(1).max(120))
            .max(100)
            .optional(),

        amenities: z
            .array(z.string().trim().min(1).max(80))
            .max(100)
            .optional(),

        paymentMethods: z
            .array(z.string().trim().min(1).max(50))
            .max(30)
            .optional(),

        languages: z
            .array(z.string().trim().min(1).max(50))
            .max(30)
            .optional(),

        priceRange: z.enum(priceRanges).optional(),

        logo: imageSchema.nullable().optional(),
        coverImage: imageSchema.nullable().optional(),
        images: z.array(imageSchema).max(20).optional(),

        seo: z
            .object({
                title: optionalText(70),
                description: optionalText(170),
                canonicalUrl: optionalUrlSchema.optional(),
                noIndex: z.boolean().optional(),
            })
            .strict()
            .optional(),

        isFeatured: z.boolean().optional().default(false),

        status: z
            .enum(businessStatuses)
            .optional()
            .default("draft"),

        verificationStatus: z
            .enum(verificationStatuses)
            .optional()
            .default("unverified"),
    })
    .strict();

function isDuplicateKey(error) {
    return error?.code === 11000;
}

function isDatabaseValidationError(error) {
    return (
        error?.name === "ValidationError" ||
        error?.name === "StrictModeError" ||
        error?.name === "CastError"
    );
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function validateReferences(categoryId, locationId) {
    if (
        !mongoose.isValidObjectId(categoryId) ||
        !mongoose.isValidObjectId(locationId)
    ) {
        return apiError("Invalid category or location ID.", 400);
    }

    const [category, location] = await Promise.all([
        Category.findById(categoryId)
            .select("_id status")
            .lean()
            .exec(),

        Location.findById(locationId)
            .select("_id status")
            .lean()
            .exec(),
    ]);

    if (!category) {
        return apiError("Category not found.", 404);
    }

    if (category.status !== "active") {
        return apiError("Select an active category.", 409);
    }

    if (!location) {
        return apiError("Location not found.", 404);
    }

    if (location.status !== "active") {
        return apiError("Select an active location.", 409);
    }

    return null;
}

// GET /api/admin/businesses?page=1&limit=20&status=draft&q=hotel
export async function GET(request) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 20);
        const status = searchParams.get("status");
        const verificationStatus = searchParams.get("verificationStatus");
        const businessType = searchParams.get("businessType");
        const category = searchParams.get("category");
        const location = searchParams.get("location");
        const q = (searchParams.get("q") || "").trim();

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return apiError("Invalid pagination parameters.", 400);
        }

        if (status && !businessStatuses.includes(status)) {
            return apiError("Invalid business status filter.", 400);
        }

        if (
            verificationStatus &&
            !verificationStatuses.includes(verificationStatus)
        ) {
            return apiError("Invalid verification status filter.", 400);
        }

        if (businessType && !businessTypes.includes(businessType)) {
            return apiError("Invalid business type filter.", 400);
        }

        if (category && !mongoose.isValidObjectId(category)) {
            return apiError("Invalid category ID filter.", 400);
        }

        if (location && !mongoose.isValidObjectId(location)) {
            return apiError("Invalid location ID filter.", 400);
        }

        if (q.length > 100) {
            return apiError("Search query is too long.", 400);
        }

        const filter = {};

        if (status) filter.status = status;
        if (verificationStatus) filter.verificationStatus = verificationStatus;
        if (businessType) filter.businessType = businessType;
        if (category) filter.category = category;
        if (location) filter.location = location;

        if (q) {
            const safeSearch = new RegExp(escapeRegex(q), "i");

            filter.$or = [
                { name: safeSearch },
                { slug: safeSearch },
                { tagline: safeSearch },
                { "address.city": safeSearch },
            ];
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Business.find(filter)
                .select("-internalNotes")
                .populate("category", "name slug")
                .populate("location", "name slug type")
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),

            Business.countDocuments(filter),
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
        console.error("[BUSINESSES] List failed:", error.message);
        return apiError("Unable to retrieve businesses.", 500);
    }
}

// POST /api/admin/businesses
export async function POST(request) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const contentType = request.headers.get("content-type") || "";

        if (
            contentType.split(";")[0].trim().toLowerCase() !==
            "application/json"
        ) {
            return apiError("Content-Type must be application/json.", 415);
        }

        let body;

        try {
            body = await request.json();
        } catch {
            return apiError("Invalid JSON request body.", 400);
        }

        const validation = businessInputSchema.safeParse(body);

        if (!validation.success) {
            return apiError(
                "Business data is invalid.",
                400,
                validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );
        }

        const data = validation.data;

        if (data.coordinates) {
            const coordinateError = validateCoordinatePair(
                {},
                data.coordinates
            );

            if (coordinateError) {
                return apiError(coordinateError, 400);
            }
        }

        const publicationError = validatePublishedBusiness(data);

        if (publicationError) {
            return apiError(publicationError, 400);
        }

        await connectDB();

        const referenceError = await validateReferences(
            data.category,
            data.location
        );

        if (referenceError) return referenceError;

        const duplicate = await Business.findOne({ slug: data.slug })
            .select("_id")
            .lean()
            .exec();

        if (duplicate) {
            return apiError(
                "A business with this slug already exists.",
                409
            );
        }

        const business = await Business.create({
            ...data,
            createdBy: auth.user.id,
            updatedBy: auth.user.id,
            publishedAt:
                data.status === "published" ? new Date() : null,
        });

        const item = await Business.findById(business._id)
            .select("-internalNotes")
            .populate("category", "name slug")
            .populate("location", "name slug type")
            .lean()
            .exec();

        return apiSuccess(
            {
                message: "Business created successfully.",
                item,
            },
            201
        );
    } catch (error) {
        if (isDuplicateKey(error)) {
            return apiError(
                "A business with this slug already exists.",
                409
            );
        }

        if (isDatabaseValidationError(error)) {
            return apiError(
                "Business data failed database validation.",
                400
            );
        }

        console.error("[BUSINESSES] Create failed:", error.message);
        return apiError("Unable to create business.", 500);
    }
}
