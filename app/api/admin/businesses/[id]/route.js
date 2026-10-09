
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
    validateWeeklyHours,
} from "@/lib/business/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

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

const optionalText = (max) =>
    z.string().trim().max(max);

const imageSchema = z.object({
    url: requiredUrlSchema,
    publicId: z.string().trim().min(1).max(300),
    alt: z.string().trim().max(200).optional(),
}).strict();

const businessPatchSchema = z.object({
    name: z.string().trim().min(2).max(160),

    slug: z.string()
        .trim()
        .toLowerCase()
        .min(1)
        .max(180)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

    tagline: z.string().trim().max(200),
    description: z.string().trim().max(10000),

    businessType: z.enum(businessTypes),

    establishedYear: z.number()
        .int()
        .min(1800)
        .max(new Date().getFullYear())
        .nullable(),

    category: objectIdSchema,
    location: objectIdSchema,

    contact: z.object({
        phone: optionalText(30),
        alternatePhone: optionalText(30),
        whatsapp: optionalText(30),
        email: z.string()
            .trim()
            .max(254)
            .refine(
                (value) =>
                    !value ||
                    z.string().email().safeParse(value).success,
                "Enter a valid email address."
            ),
        website: optionalUrlSchema,
        preferredMethod: z.enum(preferredMethods),
    }).partial().strict(),

    socialLinks: z.object({
        instagram: optionalUrlSchema,
        facebook: optionalUrlSchema,
        youtube: optionalUrlSchema,
        linkedin: optionalUrlSchema,
        x: optionalUrlSchema,
        tiktok: optionalUrlSchema,

        other: z.array(
            z.object({
                platform: z.string().trim().min(1).max(50),
                url: requiredUrlSchema,
            }).strict()
        ).max(20),
    }).partial().strict(),

    address: z.object({
        line1: optionalText(200),
        line2: optionalText(200),
        area: optionalText(120),
        city: optionalText(120),
        district: optionalText(120),
        state: optionalText(120),
        country: optionalText(80),
        postalCode: optionalText(12),
        formatted: optionalText(500),
    }).partial().strict(),

    coordinates: z.object({
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
    }).partial().strict(),

    serviceAreas: z.array(
        z.string().trim().min(1).max(120)
    ).max(50),

    openingHours: z.object({
        timezone: z.string().trim().min(1).max(100),
        notes: z.string().trim().max(500),
        weekly: weeklyHoursSchema,
    }).partial().strict(),

    services: z.array(
        z.string().trim().min(1).max(120)
    ).max(100),

    amenities: z.array(
        z.string().trim().min(1).max(80)
    ).max(100),

    paymentMethods: z.array(
        z.string().trim().min(1).max(50)
    ).max(30),

    languages: z.array(
        z.string().trim().min(1).max(50)
    ).max(30),

    priceRange: z.enum(priceRanges),

    logo: imageSchema.nullable(),
    coverImage: imageSchema.nullable(),
    images: z.array(imageSchema).max(20),

    seo: z.object({
        title: z.string().trim().max(70),
        description: z.string().trim().max(170),
        canonicalUrl: optionalUrlSchema,
        noIndex: z.boolean(),
    }).partial().strict(),

    status: z.enum(businessStatuses),
    verificationStatus: z.enum(verificationStatuses),
}).partial().strict();

function isDuplicateKey(error) {
    return error?.code === 11000;
}

function isDatabaseValidationError(error) {
    return [
        "ValidationError",
        "StrictModeError",
        "CastError",
    ].includes(error?.name);
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
        return apiError("Category must be active.", 409);
    }

    if (!location) {
        return apiError("Location not found.", 404);
    }

    if (location.status !== "active") {
        return apiError("Location must be active.", 409);
    }

    return null;
}

function serializeBusinessQuery(query) {
    return query
        .select("-internalNotes")
        .populate("category", "name slug")
        .populate("location", "name slug type")
        .lean()
        .exec();
}

/**
 * GET /api/admin/businesses/:id
 */
export async function GET(_request, { params }) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid business ID.", 400);
        }

        await connectDB();

        const item = await serializeBusinessQuery(
            Business.findById(id)
        );

        if (!item) {
            return apiError("Business not found.", 404);
        }

        return apiSuccess({ item });
    } catch (error) {
        console.error("[BUSINESSES] Get by ID failed:", error.message);
        return apiError("Unable to retrieve business.", 500);
    }
}

/**
 * PATCH /api/admin/businesses/:id
 */
export async function PATCH(request, { params }) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid business ID.", 400);
        }

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

        const validation = businessPatchSchema.safeParse(body);

        if (!validation.success) {
            return apiError(
                "Business update data is invalid.",
                400,
                validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );
        }

        const updates = validation.data;

        if (Object.keys(updates).length === 0) {
            return apiError("Provide at least one field to update.", 400);
        }

        await connectDB();

        const business = await Business.findById(id).exec();

        if (!business) {
            return apiError("Business not found.", 404);
        }

        const nextCategory =
            updates.category ?? String(business.category);

        const nextLocation =
            updates.location ?? String(business.location);

        const nextStatus = updates.status ?? business.status;

        // Publishing requires both references to be active. For ordinary
        // edits, validate only references that actually changed so an existing
        // draft with an inactive category/location can still be edited.
        if (nextStatus === "published") {
            const referenceError = await validateReferences(
                nextCategory,
                nextLocation
            );

            if (referenceError) return referenceError;
        } else {
            if (
                updates.category !== undefined &&
                updates.category !== String(business.category)
            ) {
                const category = await Category.findById(updates.category)
                    .select("_id status")
                    .lean()
                    .exec();

                if (!category) return apiError("Category not found.", 404);
                if (category.status !== "active") {
                    return apiError("Select an active category.", 409);
                }
            }

            if (
                updates.location !== undefined &&
                updates.location !== String(business.location)
            ) {
                const location = await Location.findById(updates.location)
                    .select("_id status")
                    .lean()
                    .exec();

                if (!location) return apiError("Location not found.", 404);
                if (location.status !== "active") {
                    return apiError("Select an active location.", 409);
                }
            }
        }

        // Validate coordinates after merging the partial update.
        if (updates.coordinates) {
            const currentCoordinates =
                business.coordinates?.toObject
                    ? business.coordinates.toObject()
                    : business.coordinates ?? {};

            const coordinateError = validateCoordinatePair(
                currentCoordinates,
                updates.coordinates
            );

            if (coordinateError) {
                return apiError(coordinateError, 400);
            }
        }

        // Validate the complete weekly schedule, not only the patch.
        if (updates.openingHours?.weekly) {
            const currentWeekly =
                business.openingHours?.weekly?.toObject
                    ? business.openingHours.weekly.toObject()
                    : business.openingHours?.weekly ?? {};

            const nextWeekly = { ...currentWeekly };

            for (const [day, periods] of Object.entries(
                updates.openingHours.weekly
            )) {
                nextWeekly[day] = periods;
            }

            const hoursErrors = validateWeeklyHours(nextWeekly);

            if (hoursErrors) {
                return apiError(
                    "Opening hours are invalid.",
                    400,
                    hoursErrors
                );
            }
        }

        const nextName = updates.name ?? business.name;
        const nextDescription =
            updates.description ?? business.description;

        const publicationError = validatePublishedBusiness({
            ...business.toObject(),
            name: nextName,
            description: nextDescription,
            category: nextCategory,
            location: nextLocation,
            status: nextStatus,
        });

        if (publicationError) {
            return apiError(publicationError, 400);
        }

        if (
            updates.slug !== undefined &&
            updates.slug !== business.slug
        ) {
            const duplicate = await Business.findOne({
                _id: { $ne: business._id },
                slug: updates.slug,
            })
                .select("_id")
                .lean()
                .exec();

            if (duplicate) {
                return apiError(
                    "A business with this slug already exists.",
                    409
                );
            }
        }

        const wasPublished = business.status === "published";

        // Merge nested objects one field at a time to preserve omitted values.
        const nestedFields = [
            "contact",
            "socialLinks",
            "address",
            "coordinates",
            "openingHours",
            "seo",
        ];

        for (const [key, value] of Object.entries(updates)) {
            if (nestedFields.includes(key)) {
                for (const [nestedKey, nestedValue] of Object.entries(value)) {
                    if (key === "openingHours" && nestedKey === "weekly") {
                        for (const [day, periods] of Object.entries(nestedValue)) {
                            business.set(
                                `openingHours.weekly.${day}`,
                                periods
                            );
                        }
                    } else {
                        business.set(`${key}.${nestedKey}`, nestedValue);
                    }
                }
            } else {
                business.set(key, value);
            }
        }

        if (nextStatus === "published" && !wasPublished) {
            business.publishedAt = new Date();
        } else if (nextStatus === "draft") {
            business.publishedAt = null;
        }

        business.updatedBy = auth.user.id;

        await business.save();

        const item = await serializeBusinessQuery(
            Business.findById(business._id)
        );

        return apiSuccess({
            message: "Business updated successfully.",
            item,
        });
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

        console.error("[BUSINESSES] Update failed:", error.message);
        return apiError("Unable to update business.", 500);
    }
}

/**
 * DELETE /api/admin/businesses/:id
 * Soft delete by archiving; the record is retained.
 */
export async function DELETE(_request, { params }) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid business ID.", 400);
        }

        await connectDB();

        const business = await Business.findById(id).exec();

        if (!business) {
            return apiError("Business not found.", 404);
        }

        if (business.status === "archived") {
            const item = await serializeBusinessQuery(
                Business.findById(business._id)
            );

            return apiSuccess({
                message: "Business is already archived.",
                item,
            });
        }

        business.status = "archived";
        business.updatedBy = auth.user.id;

        await business.save();

        const item = await serializeBusinessQuery(
            Business.findById(business._id)
        );

        return apiSuccess({
            message: "Business archived successfully.",
            item,
        });
    } catch (error) {
        if (isDatabaseValidationError(error)) {
            return apiError(
                "Business data failed database validation.",
                400
            );
        }

        console.error("[BUSINESSES] Archive failed:", error.message);
        return apiError("Unable to archive business.", 500);
    }
}
