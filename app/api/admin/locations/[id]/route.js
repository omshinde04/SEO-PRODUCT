
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import Business from "@/models/Business";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

const locationTypes = [
    "country",
    "state",
    "district",
    "city",
    "town",
    "village",
    "locality",
    "region",
];

const allowedParentTypes = {
    country: [],
    state: ["country"],
    district: ["state"],
    city: ["district"],
    town: ["district", "city", "region"],
    village: ["district", "town", "region"],
    locality: ["city", "town", "village", "locality", "region"],
    region: ["country", "state", "district", "city", "region"],
};

const patchLocationSchema = z
    .object({
        name: z.string().trim().min(2).max(120),

        slug: z
            .string()
            .trim()
            .toLowerCase()
            .min(1)
            .max(140)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

        type: z.enum(locationTypes),

        parent: z.string().nullable(),

        address: z
            .object({
                district: z.string().trim().max(120),
                state: z.string().trim().max(120),
                country: z.string().trim().max(80),
                postalCodes: z
                    .array(z.string().trim().min(1).max(12))
                    .max(100)
                    .refine(
                        (codes) =>
                            new Set(
                                codes.map((code) => code.toLowerCase())
                            ).size === codes.length,
                        "Postal codes must be unique."
                    ),
            })
            .partial()
            .strict(),

        coordinates: z
            .object({
                latitude: z.number().min(-90).max(90).nullable(),
                longitude: z.number().min(-180).max(180).nullable(),
            })
            .partial()
            .strict(),

        description: z.string().trim().max(3000),

        coverImage: z
            .object({
                url: z.string().trim().max(2048),
                publicId: z.string().trim().max(300),
                alt: z.string().trim().max(200),
            })
            .partial()
            .strict(),

        seo: z
            .object({
                title: z.string().trim().max(70),
                description: z.string().trim().max(170),
                noIndex: z.boolean(),
            })
            .partial()
            .strict(),

        status: z.enum(["active", "inactive"]),

        sortOrder: z.number().int().min(0).max(100000),
    })
    .partial()
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

function getParentId(parent) {
    return parent ? String(parent._id ?? parent) : null;
}

/**
 * Check coordinates after merging partial updates with stored values.
 * A location must have both coordinates or neither.
 */
function validateCoordinateMerge(current, updates) {
    const latitude =
        updates.latitude !== undefined
            ? updates.latitude
            : current.latitude;

    const longitude =
        updates.longitude !== undefined
            ? updates.longitude
            : current.longitude;

    if ((latitude === null) !== (longitude === null)) {
        return "Latitude and longitude must both be null or both be numbers.";
    }

    return null;
}

/**
 * Validate the proposed parent and prevent hierarchy cycles.
 */
async function validateParent(parentId, childType, locationId) {
    if (parentId === null) {
        if (!["country", "region"].includes(childType)) {
            return apiError(
                "Only country or region locations can be top-level locations.",
                400
            );
        }

        return null;
    }

    if (!mongoose.isValidObjectId(parentId)) {
        return apiError("Parent location ID is invalid.", 400);
    }

    if (String(parentId) === String(locationId)) {
        return apiError("A location cannot be its own parent.", 400);
    }

    const parent = await Location.findById(parentId)
        .select("_id type status parent")
        .lean()
        .exec();

    if (!parent) {
        return apiError("Parent location was not found.", 404);
    }

    if (parent.status !== "active") {
        return apiError("Parent location must be active.", 409);
    }

    if (!allowedParentTypes[childType]?.includes(parent.type)) {
        return apiError(
            `A ${childType} location cannot have a ${parent.type} parent.`,
            400
        );
    }

    const visited = new Set();
    let current = parent;

    while (current) {
        const currentId = String(current._id);

        if (currentId === String(locationId)) {
            return apiError(
                "This parent would create a location hierarchy cycle.",
                400
            );
        }

        if (visited.has(currentId)) {
            return apiError(
                "The existing location hierarchy contains a cycle.",
                409
            );
        }

        visited.add(currentId);

        if (!current.parent) {
            break;
        }

        current = await Location.findById(current.parent)
            .select("_id parent")
            .lean()
            .exec();

        if (!current) {
            return apiError(
                "The parent location hierarchy is invalid.",
                409
            );
        }
    }

    return null;
}

/**
 * GET /api/admin/locations/:id
 */
export async function GET(_request, { params }) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid location ID.", 400);
        }

        await connectDB();

        const item = await Location.findById(id)
            .lean()
            .exec();

        if (!item) {
            return apiError("Location not found.", 404);
        }

        return apiSuccess({ item });
    } catch (error) {
        console.error("[LOCATIONS] Get by ID failed:", error.message);
        return apiError("Unable to retrieve location.", 500);
    }
}

/**
 * PATCH /api/admin/locations/:id
 */
export async function PATCH(request, { params }) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid location ID.", 400);
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

        const validation = patchLocationSchema.safeParse(body);

        if (!validation.success) {
            return apiError(
                "Location update data is invalid.",
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

        const location = await Location.findById(id).exec();

        if (!location) {
            return apiError("Location not found.", 404);
        }

        const nextType = updates.type ?? location.type;

        const nextParent =
            updates.parent !== undefined
                ? updates.parent
                : getParentId(location.parent);

        /*
         * Validate the proposed parent/type relationship when either changes.
         */
        if (
            updates.parent !== undefined ||
            updates.type !== undefined
        ) {
            const parentError = await validateParent(
                nextParent,
                nextType,
                id
            );

            if (parentError) return parentError;
        }

        /*
         * Safeguard 1:
         * A type change must not invalidate existing direct children.
         */
        if (
            updates.type !== undefined &&
            updates.type !== location.type
        ) {
            const children = await Location.find({
                parent: location._id,
            })
                .select("_id name type")
                .lean()
                .exec();

            const invalidChildren = children.filter(
                (child) =>
                    !allowedParentTypes[child.type]?.includes(nextType)
            );

            if (invalidChildren.length > 0) {
                return apiError(
                    "Cannot change this location type because one or more child locations would have an invalid parent type.",
                    409,
                    invalidChildren.map((child) => ({
                        id: String(child._id),
                        name: child.name,
                        type: child.type,
                    }))
                );
            }
        }

        /*
         * Safeguard 2:
         * Do not deactivate a location while it has active children.
         */
        if (
            updates.status === "inactive" &&
            location.status === "active"
        ) {
            const activeChildren = await Location.exists({
                parent: location._id,
                status: "active",
            });

            if (activeChildren) {
                return apiError(
                    "Deactivate or reassign active child locations first.",
                    409
                );
            }
        }

        /*
         * Safeguard 3:
         * Validate the merged coordinates, not only the submitted fields.
         * This allows a valid partial update while preventing half a pair.
         */
        if (updates.coordinates) {
            const coordinateError = validateCoordinateMerge(
                location.coordinates.toObject
                    ? location.coordinates.toObject()
                    : location.coordinates,
                updates.coordinates
            );

            if (coordinateError) {
                return apiError(coordinateError, 400);
            }
        }

        /*
         * Safeguard 4:
         * Check duplicate slugs under the proposed parent.
         * MongoDB unique indexes remain the final concurrency safeguard.
         */
        if (
            updates.slug !== undefined ||
            updates.parent !== undefined
        ) {
            const nextSlug = updates.slug ?? location.slug;

            const duplicateFilter = {
                _id: { $ne: location._id },
                slug: nextSlug,
                parent: nextParent,
            };

            const duplicate = await Location.findOne(duplicateFilter)
                .select("_id")
                .lean()
                .exec();

            if (duplicate) {
                return apiError(
                    "A location with this slug already exists under this parent.",
                    409
                );
            }
        }

        /*
         * Merge nested fields individually so omitted sibling fields survive.
         * Only fields explicitly accepted by the Zod schema can be changed.
         */
        for (const [key, value] of Object.entries(updates)) {
            if (
                ["address", "coordinates", "coverImage", "seo"].includes(key)
            ) {
                for (const [nestedKey, nestedValue] of Object.entries(value)) {
                    location.set(`${key}.${nestedKey}`, nestedValue);
                }
            } else if (key === "parent") {
                location.parent = value;
            } else {
                location.set(key, value);
            }
        }

        location.updatedBy = auth.user.id;

        await location.save();

        return apiSuccess({
            message: "Location updated successfully.",
            item: location.toObject(),
        });
    } catch (error) {
        if (isDuplicateKey(error)) {
            return apiError(
                "A location with this slug already exists under this parent.",
                409
            );
        }

        if (isDatabaseValidationError(error)) {
            return apiError(
                "Location data failed database validation.",
                400
            );
        }

        console.error("[LOCATIONS] Update failed:", error.message);
        return apiError("Unable to update location.", 500);
    }
}

/**
 * DELETE /api/admin/locations/:id
 * Soft deletion only; records are retained for data integrity.
 */
export async function DELETE(_request, { params }) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid location ID.", 400);
        }

        await connectDB();

        const location = await Location.findById(id).exec();

        if (!location) {
            return apiError("Location not found.", 404);
        }

        if (location.status === "inactive") {
            return apiSuccess({
                message: "Location is already inactive.",
                item: location.toObject(),
            });
        }

        const activeChildren = await Location.exists({
            parent: location._id,
            status: "active",
        });

        if (activeChildren) {
            return apiError(
                "Deactivate or reassign active child locations first.",
                409
            );
        }

        const linkedBusiness = await Business.exists({
            location: location._id,
        });

        if (linkedBusiness) {
            return apiError(
                "This location is referenced by businesses. Reassign those businesses before deactivating it.",
                409
            );
        }

        location.status = "inactive";
        location.updatedBy = auth.user.id;

        await location.save();

        return apiSuccess({
            message: "Location deactivated successfully.",
            item: location.toObject(),
        });
    } catch (error) {
        console.error("[LOCATIONS] Deactivation failed:", error.message);
        return apiError("Unable to deactivate location.", 500);
    }
}
