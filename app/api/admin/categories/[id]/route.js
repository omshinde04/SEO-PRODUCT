
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Business from "@/models/Business";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

const patchCategorySchema = z
    .object({
        name: z.string().trim().min(2).max(100),
        slug: z
            .string()
            .trim()
            .toLowerCase()
            .min(1)
            .max(120)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        description: z.string().trim().max(1000),
        parent: z.string().nullable(),
        icon: z.string().trim().max(80),
        status: z.enum(["active", "inactive"]),
        sortOrder: z.number().int().min(0).max(100000),
        seo: z
            .object({
                title: z.string().trim().max(70),
                description: z.string().trim().max(170),
                noIndex: z.boolean(),
            })
            .strict(),
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

async function validateParent(parentId, categoryId) {
    if (parentId === null) return null;

    if (!mongoose.isValidObjectId(parentId)) {
        return apiError("Parent category ID is invalid.", 400);
    }

    if (parentId === categoryId) {
        return apiError("A category cannot be its own parent.", 400);
    }

    const parent = await Category.findById(parentId)
        .select("_id status parent")
        .lean()
        .exec();

    if (!parent) {
        return apiError("Parent category was not found.", 404);
    }

    if (parent.status !== "active") {
        return apiError("Parent category must be active.", 409);
    }

    // Walk ancestors to prevent a hierarchy cycle.
    const visited = new Set([categoryId]);
    let current = parent;

    while (current) {
        const currentId = String(current._id);

        if (visited.has(currentId)) {
            return apiError("This parent would create a category hierarchy cycle.", 400);
        }

        visited.add(currentId);

        if (!current.parent) break;

        current = await Category.findById(current.parent)
            .select("_id parent")
            .lean()
            .exec();

        if (!current) {
            return apiError("The parent category hierarchy is invalid.", 409);
        }
    }

    return null;
}

// GET /api/admin/categories/:id
export async function GET(_request, { params }) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid category ID.", 400);
        }

        await connectDB();

        const category = await Category.findById(id)
            .select("-__v")
            .lean()
            .exec();

        if (!category) {
            return apiError("Category not found.", 404);
        }

        return apiSuccess({ item: category });
    } catch (error) {
        console.error("[CATEGORIES] Get by ID failed:", error.message);
        return apiError("Unable to retrieve category.", 500);
    }
}

// PATCH /api/admin/categories/:id
export async function PATCH(request, { params }) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid category ID.", 400);
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

        const validation = patchCategorySchema.safeParse(body);

        if (!validation.success) {
            return apiError(
                "Category update data is invalid.",
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

        const category = await Category.findById(id).exec();

        if (!category) {
            return apiError("Category not found.", 404);
        }

        // PATCH can deactivate a category too, so enforce the same data
        // integrity rules as DELETE before changing active -> inactive.
        if (updates.status === "inactive" && category.status === "active") {
            const activeChildren = await Category.exists({
                parent: category._id,
                status: "active",
            });

            if (activeChildren) {
                return apiError(
                    "Deactivate or reassign active child categories first.",
                    409
                );
            }

            const linkedBusiness = await Business.exists({
                category: category._id,
            });

            if (linkedBusiness) {
                return apiError(
                    "This category is referenced by businesses. Reassign those businesses before deactivating it.",
                    409
                );
            }
        }

        if (updates.parent !== undefined) {
            const parentError = await validateParent(updates.parent, id);
            if (parentError) return parentError;
        }

        // Prevent duplicate names under the same parent.
        if (updates.name !== undefined || updates.parent !== undefined) {
            const nextName = updates.name ?? category.name;
            const nextParent =
                updates.parent !== undefined ? updates.parent : category.parent;

            const duplicateName = await Category.findOne({
                _id: { $ne: category._id },
                name: nextName,
                parent: nextParent ?? null,
            })
                .select("_id")
                .lean()
                .exec();

            if (duplicateName) {
                return apiError(
                    "A category with this name already exists under this parent.",
                    409
                );
            }
        }

        // Never allow clients to set audit fields or arbitrary MongoDB fields.
        for (const [key, value] of Object.entries(updates)) {
            category.set(key, value);
        }

        category.updatedBy = auth.user.id;

        await category.save();

        return apiSuccess({
            message: "Category updated successfully.",
            item: category.toObject(),
        });
    } catch (error) {
        if (isDuplicateKey(error)) {
            return apiError("A category with this slug or name already exists.", 409);
        }

        if (isDatabaseValidationError(error)) {
            return apiError("Category data failed database validation.", 400);
        }

        console.error("[CATEGORIES] Update failed:", error.message);
        return apiError("Unable to update category.", 500);
    }
}

// DELETE /api/admin/categories/:id
// Soft delete: mark inactive rather than permanently removing the record.
export async function DELETE(_request, { params }) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const { id } = await params;

        if (!objectIdSchema.safeParse(id).success) {
            return apiError("Invalid category ID.", 400);
        }

        await connectDB();

        const category = await Category.findById(id).exec();

        if (!category) {
            return apiError("Category not found.", 404);
        }

        const activeChildren = await Category.exists({
            parent: category._id,
            status: "active",
        });

        if (activeChildren) {
            return apiError(
                "Deactivate or reassign active child categories first.",
                409
            );
        }

        if (category.status === "inactive") {
            return apiSuccess({
                message: "Category is already inactive.",
                item: category.toObject(),
            });
        }

        // Do not deactivate a category while any business still references it.
        // The public API only exposes businesses with active categories, so
        // allowing this would make existing business pages disappear.
        const linkedBusiness = await Business.exists({ category: category._id });

        if (linkedBusiness) {
            return apiError(
                "This category is referenced by businesses. Reassign those businesses before deactivating it.",
                409
            );
        }

        category.status = "inactive";
        category.updatedBy = auth.user.id;

        await category.save();

        return apiSuccess({
            message: "Category deactivated successfully.",
            item: category.toObject(),
        });
    } catch (error) {
        console.error("[CATEGORIES] Deactivation failed:", error.message);
        return apiError("Unable to deactivate category.", 500);
    }
}
