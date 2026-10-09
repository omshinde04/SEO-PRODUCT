
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createCategorySchema = z
    .object({
        name: z.string().trim().min(2).max(100),
        slug: z
            .string()
            .trim()
            .toLowerCase()
            .min(1)
            .max(120)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        description: z.string().trim().max(1000).optional().default(""),
        parent: z.string().nullable().optional().default(null),
        icon: z.string().trim().max(80).optional().default(""),
        status: z.enum(["active", "inactive"]).optional().default("active"),
        sortOrder: z.number().int().min(0).max(100000).optional().default(0),
        seo: z
            .object({
                title: z.string().trim().max(70).optional().default(""),
                description: z.string().trim().max(170).optional().default(""),
                noIndex: z.boolean().optional().default(false),
            })
            .strict()
            .optional()
            .default({}),
    })
    .strict();

function isDuplicateKey(error) {
    return error?.code === 11000;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 20);
        const status = searchParams.get("status");
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

        if (status && !["active", "inactive"].includes(status)) {
            return apiError("Invalid category status filter.", 400);
        }

        if (search.length > 100) {
            return apiError("Search query is too long.", 400);
        }

        const filter = {};

        if (status) filter.status = status;

        if (search) {
            const safeSearch = new RegExp(escapeRegex(search), "i");
            filter.$or = [{ name: safeSearch }, { slug: safeSearch }];
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Category.find(filter)
                .select("-__v")
                .sort({ sortOrder: 1, name: 1, _id: 1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Category.countDocuments(filter),
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
        console.error("[CATEGORIES] List failed:", error.message);
        return apiError("Unable to retrieve categories.", 500);
    }
}

export async function POST(request) {
    const auth = await requireAdmin();

    if (auth.response) return auth.response;

    try {
        const contentType = request.headers.get("content-type") || "";

        if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
            return apiError("Content-Type must be application/json.", 415);
        }

        let body;

        try {
            body = await request.json();
        } catch {
            return apiError("Invalid JSON request body.", 400);
        }

        const validation = createCategorySchema.safeParse(body);

        if (!validation.success) {
            return apiError("Category data is invalid.", 400, validation.error.issues.map(
                (issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })
            ));
        }

        const data = validation.data;

        // Connect before any category lookup; Mongoose queries must not run
        // before the database connection is established.
        await connectDB();

        if (data.parent !== null) {
            if (!mongoose.isValidObjectId(data.parent)) {
                return apiError("Parent category ID is invalid.", 400);
            }

            const parent = await Category.findById(data.parent)
                .select("_id status")
                .lean()
                .exec();

            if (!parent) {
                return apiError("Parent category was not found.", 404);
            }

            if (parent.status !== "active") {
                return apiError("Parent category must be active.", 409);
            }
        }

        // Check top-level names because the schema's partial unique index
        // only enforces name uniqueness for child categories.
        const nameFilter = {
            name: data.name,
            parent: data.parent,
        };

        const existingName = await Category.findOne(nameFilter)
            .select("_id")
            .lean()
            .exec();

        if (existingName) {
            return apiError("A category with this name already exists under this parent.", 409);
        }

        const category = await Category.create({
            ...data,
            createdBy: auth.user.id,
            updatedBy: auth.user.id,
        });

        return apiSuccess(
            {
                message: "Category created successfully.",
                item: category.toObject(),
            },
            201
        );
    } catch (error) {
        if (isDuplicateKey(error)) {
            return apiError("A category with this slug or name already exists.", 409);
        }

        if (error?.name === "ValidationError" || error?.name === "StrictModeError") {
            return apiError("Category data failed database validation.", 400);
        }

        console.error("[CATEGORIES] Create failed:", error.message);
        return apiError("Unable to create category.", 500);
    }
}
