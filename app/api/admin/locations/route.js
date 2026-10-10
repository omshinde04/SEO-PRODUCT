
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import { optionalUrlSchema } from "@/lib/business/validation";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const locationInputSchema = z
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
        parent: z.string().nullable().optional().default(null),

        address: z
            .object({
                district: z.string().trim().max(120).optional().default(""),
                state: z.string().trim().max(120).optional().default(""),
                country: z.string().trim().max(80).optional().default("India"),
                postalCodes: z
                    .array(
                        z.string().trim().min(3).max(12).regex(/^[0-9A-Za-z -]+$/)
                    )
                    .max(100)
                    .optional()
                    .default([]),
            })
            .strict()
            .optional()
            .default({}),

        coordinates: z
            .object({
                latitude: z.number().min(-90).max(90).nullable().optional(),
                longitude: z.number().min(-180).max(180).nullable().optional(),
            })
            .strict()
            .optional()
            .default({}),

        description: z.string().trim().max(3000).optional().default(""),
        marathiName: z.string().trim().max(120).optional().default(""),
        tagline: z.string().trim().max(160).optional().default(""),
        featuredOnAbout: z.boolean().optional().default(false),

        coverImage: z
            .object({
                url: optionalUrlSchema.optional().default(""),
                publicId: z.string().trim().max(300).optional().default(""),
                alt: z.string().trim().max(200).optional().default(""),
            })
            .strict()
            .optional()
            .default({}),

        seo: z
            .object({
                title: z.string().trim().max(70).optional().default(""),
                description: z.string().trim().max(170).optional().default(""),
                noIndex: z.boolean().optional().default(false),
            })
            .strict()
            .optional()
            .default({}),

        status: z.enum(["active", "inactive"]).optional().default("active"),
        sortOrder: z.number().int().min(0).max(100000).optional().default(0),
    })
    .strict();

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

function validateCoordinates(coordinates = {}) {
    const { latitude, longitude } = coordinates;

    const hasLatitude = latitude !== undefined && latitude !== null;
    const hasLongitude = longitude !== undefined && longitude !== null;

    if (hasLatitude !== hasLongitude) {
        return apiError(
            "Provide both latitude and longitude, or leave both empty.",
            400
        );
    }

    return null;
}

async function validateParent(parentId, childType) {
    if (!parentId) {
        return null;
    }

    if (!mongoose.isValidObjectId(parentId)) {
        return apiError("Parent location ID is invalid.", 400);
    }

    let parent = await Location.findById(parentId)
        .select("_id type status parent")
        .lean()
        .exec();

    if (!parent) {
        return apiError("Parent location was not found.", 404);
    }

    if (parent.status !== "active") {
        return apiError("Parent location must be active.", 409);
    }

    const allowed = allowedParentTypes[childType];

    if (!allowed.includes(parent.type)) {
        return apiError(
            `${parent.type} cannot be the parent of a ${childType} location.`,
            400
        );
    }

    const visited = new Set();
    let current = parent;
    while (current) {
        const currentId = String(current._id);
        if (visited.has(currentId)) {
            return apiError("The existing location hierarchy contains a cycle.", 409);
        }
        visited.add(currentId);

        if (current.status !== "active") {
            return apiError("All parent locations must be active.", 409);
        }
        if (!current.parent) break;

        const ancestor = await Location.findById(current.parent)
            .select("_id type status parent")
            .lean()
            .exec();
        if (!ancestor) {
            return apiError("The parent location hierarchy is invalid.", 409);
        }
        if (!allowedParentTypes[current.type]?.includes(ancestor.type)) {
            return apiError("The existing location hierarchy has an invalid parent type.", 409);
        }
        current = ancestor;
    }

    return null;
}

// GET /api/admin/locations?page=1&limit=20&type=town&status=active&q=ghoti
export async function GET(request) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 20);
        const type = searchParams.get("type");
        const status = searchParams.get("status");
        const parent = searchParams.get("parent");
        const search = (searchParams.get("q") || "").trim();

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return apiError("Invalid pagination parameters.", 400);
        }

        if (type && !locationTypes.includes(type)) {
            return apiError("Invalid location type filter.", 400);
        }

        if (status && !["active", "inactive"].includes(status)) {
            return apiError("Invalid location status filter.", 400);
        }

        if (parent && parent !== "root" && !mongoose.isValidObjectId(parent)) {
            return apiError("Invalid parent location ID.", 400);
        }

        if (search.length > 100) {
            return apiError("Search query is too long.", 400);
        }

        const filter = {};

        if (type) filter.type = type;
        if (status) filter.status = status;

        if (parent === "root") {
            filter.parent = null;
        } else if (parent) {
            filter.parent = new mongoose.Types.ObjectId(parent);
        }

        if (search) {
            const safeSearch = new RegExp(escapeRegex(search), "i");
            filter.$or = [{ name: safeSearch }, { slug: safeSearch }];
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Location.find(filter)
                .sort({ sortOrder: 1, name: 1, _id: 1 })
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
        console.error("[LOCATIONS] List failed:", error.message);
        return apiError("Unable to retrieve locations.", 500);
    }
}

// POST /api/admin/locations
export async function POST(request) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const contentType = request.headers.get("content-type") || "";

        if (
            contentType.split(";")[0].trim().toLowerCase() !== "application/json"
        ) {
            return apiError("Content-Type must be application/json.", 415);
        }

        let body;

        try {
            body = await request.json();
        } catch {
            return apiError("Invalid JSON request body.", 400);
        }

        const validation = locationInputSchema.safeParse(body);

        if (!validation.success) {
            return apiError(
                "Location data is invalid.",
                400,
                validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }))
            );
        }

        const data = validation.data;

        const coordinateError = validateCoordinates(data.coordinates);
        if (coordinateError) return coordinateError;

        const postalCodes = data.address?.postalCodes || [];
        if (new Set(postalCodes).size !== postalCodes.length) {
            return apiError("Postal codes must not contain duplicates.", 400);
        }

        await connectDB();

        const parentError = await validateParent(data.parent, data.type);
        if (parentError) return parentError;

        const duplicateName = await Location.findOne({
            name: data.name,
            parent: data.parent,
        })
            .select("_id")
            .lean()
            .exec();

        if (duplicateName) {
            return apiError(
                "A location with this name already exists under this parent.",
                409
            );
        }

        const location = await Location.create({
            ...data,
            createdBy: auth.user.id,
            updatedBy: auth.user.id,
        });

        return apiSuccess(
            {
                message: "Location created successfully.",
                item: location.toObject(),
            },
            201
        );
    } catch (error) {
        if (isDuplicateKey(error)) {
            return apiError(
                "A location with this slug already exists at this hierarchy level.",
                409
            );
        }

        if (isDatabaseValidationError(error)) {
            return apiError("Location data failed database validation.", 400);
        }

        console.error("[LOCATIONS] Create failed:", error.message);
        return apiError("Unable to create location.", 500);
    }
}
