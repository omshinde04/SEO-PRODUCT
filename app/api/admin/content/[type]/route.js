import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { ADMIN_RESOURCES } from "@/lib/content/admin-config";
import Location from "@/models/Location";
import Business from "@/models/Business";
import ContentItem from "@/models/ContentItem";
import { SEOSettings } from "@/models/SEOConfig";
import {
    deleteCloudinaryImage,
    getCloudinaryConfig,
} from "@/lib/cloudinary/upload-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isHttpUrl(value) {
    if (!value) return true;
    try {
        const parsed = new URL(value);
        return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname);
    } catch {
        return false;
    }
}

const httpUrl = (maxLength = 2048) =>
    z.string().trim().max(maxLength).refine(
        isHttpUrl,
        "URL must be a valid HTTP or HTTPS URL."
    );

const eventSchema = z
    .object({
        startsAt: z.string().datetime().nullable().optional(),
        endsAt: z.string().datetime().nullable().optional(),
        venue: z.string().trim().max(240).optional(),
        registrationUrl: httpUrl().optional(),
    })
    .strict()
    .superRefine((event, context) => {
        if (event.startsAt && event.endsAt &&
            new Date(event.endsAt).getTime() < new Date(event.startsAt).getTime()) {
            context.addIssue({
                code: "custom",
                path: ["endsAt"],
                message: "Event end time must be after its start time.",
            });
        }
    });

const contentSchema = z
    .object({
        title: z.string().trim().min(2).max(180),
        slug: z.string().trim().toLowerCase().min(1).max(200)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        summary: z.string().trim().max(500).optional(),
        body: z.string().trim().max(50000).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        location: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
        coverImage: z.object({
            url: httpUrl().optional(),
            publicId: z.string().trim().max(300).optional(),
            alt: z.string().trim().max(200).optional(),
        }).strict().optional(),
        event: eventSchema.optional(),
        seo: z.object({
            title: z.string().trim().max(70).optional(),
            description: z.string().trim().max(170).optional(),
            noIndex: z.boolean().optional(),
            canonicalUrl: httpUrl().optional(),
        }).strict().optional(),
    })
    .strict();

const submissionSchema = z.object({
    status: z.enum(["pending", "reviewing", "approved", "rejected"]),
    adminNotes: z.string().trim().max(3000).optional().default(""),
}).strict();

const assignTargetSchema = z.object({
    entityType: z.enum(["location", "event", "place", "guide", "business"]),
    entityId: z.string().regex(/^[a-f\d]{24}$/i),
}).strict();

const mediaSchema = z.object({
    url: z.string().url().max(2048).refine((value) => /^https?:\/\//i.test(value)),
    publicId: z.string().trim().min(1).max(300),
    folder: z.string().trim().min(1).max(200),
    alt: z.string().trim().max(200).optional().default(""),
    caption: z.string().trim().max(500).optional().default(""),
    mimeType: z.string().trim().max(100).optional().default("image"),
    bytes: z.number().int().min(0).max(5242880).optional().default(0),
    width: z.number().int().min(0).nullable().optional(),
    height: z.number().int().min(0).nullable().optional(),
    assignTo: assignTargetSchema.optional(),
}).strict();

const mediaUpdateSchema = z.object({
    alt: z.string().trim().max(200).optional(),
    caption: z.string().trim().max(500).optional(),
    assignTo: assignTargetSchema.optional(),
    unassignFrom: assignTargetSchema.optional(),
}).strict();

async function applyMediaAssignment(media, assignTo, userId) {
    if (!assignTo) return null;
    const { entityType, entityId } = assignTo;
    const coverImagePayload = {
        url: media.url,
        publicId: media.publicId,
        alt: media.alt || "",
    };

    if (entityType === "location") {
        return await Location.findByIdAndUpdate(
            entityId,
            { $set: { coverImage: coverImagePayload, updatedBy: userId } },
            { new: true }
        );
    }
    if (["event", "place", "guide"].includes(entityType)) {
        return await ContentItem.findByIdAndUpdate(
            entityId,
            { $set: { coverImage: coverImagePayload, updatedBy: userId } },
            { new: true }
        );
    }
    if (entityType === "business") {
        return await Business.findByIdAndUpdate(
            entityId,
            { $set: { coverImage: coverImagePayload } },
            { new: true }
        );
    }
    return null;
}

async function removeMediaAssignment(media, unassignFrom, userId) {
    if (!unassignFrom) return null;
    const { entityType, entityId } = unassignFrom;
    const blankCover = { url: "", publicId: "", alt: "" };

    if (entityType === "location") {
        return await Location.findByIdAndUpdate(
            entityId,
            { $set: { coverImage: blankCover, updatedBy: userId } },
            { new: true }
        );
    }
    if (["event", "place", "guide"].includes(entityType)) {
        return await ContentItem.findByIdAndUpdate(
            entityId,
            { $set: { coverImage: blankCover, updatedBy: userId } },
            { new: true }
        );
    }
    if (entityType === "business") {
        return await Business.findByIdAndUpdate(
            entityId,
            { $set: { coverImage: blankCover } },
            { new: true }
        );
    }
    return null;
}

const settingsSchema = z.object({
    siteName: z.string().trim().min(1).max(120),
    siteUrl: httpUrl(),
    defaultTitle: z.string().trim().max(70),
    titleTemplate: z.string().trim().max(120),
    defaultDescription: z.string().trim().max(170),
    defaultImage: httpUrl(),
    robotsIndex: z.boolean(),
    sitemapEnabled: z.boolean(),
    organizationName: z.string().trim().max(120),
    organizationLogo: httpUrl(),
}).strict();

const templateSchema = z.object({
    entityType: z.enum(["business", "category", "location", "place", "guide", "event"]),
    titleTemplate: z.string().trim().max(160),
    descriptionTemplate: z.string().trim().max(300),
    canonicalTemplate: z.string().trim().max(300),
    noIndexByDefault: z.boolean(),
}).strict();

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getType(context) {
    return (await context.params).type;
}

async function authorize() {
    const auth = await requireAdmin();
    return auth.response ? { response: auth.response } : { user: auth.user };
}

function fail(error) {
    if (error?.code === 11000) {
        return apiError("A record with this slug or identifier already exists.", 409);
    }
    if (["ValidationError", "CastError", "StrictModeError"].includes(error?.name)) {
        return apiError("The submitted data is invalid.", 400);
    }
    console.error("[ADMIN CONTENT]", error?.message || error);
    return apiError("Unable to process this request.", 500);
}

async function parseBody(request) {
    const contentType = (request.headers.get("content-type") || "")
        .split(";")[0].trim().toLowerCase();

    if (contentType !== "application/json") {
        return { error: apiError("Content-Type must be application/json.", 415) };
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: apiError("Invalid JSON body.", 400) };
    }
    return { body };
}

function validatePublishedContent(kind, data) {
    if (!data.summary?.trim() || !data.body?.trim()) {
        return apiError("Published content requires a summary and body.", 400);
    }
    if (kind === "event") {
        if (!data.event?.startsAt || !data.event?.venue?.trim()) {
            return apiError("Published events require a start date and venue.", 400);
        }
        if (data.event.endsAt && new Date(data.event.endsAt).getTime() < new Date(data.event.startsAt).getTime()) {
            return apiError("Event end time must be after its start time.", 400);
        }
    }
    return null;
}

function getSearchFilter(type, resource, search) {
    if (!search || type === "seo") return {};
    const expression = new RegExp(escapeRegex(search), "i");

    if (resource.kind) {
        return { $or: [{ title: expression }, { slug: expression }, { summary: expression }] };
    }
    if (type === "submissions") {
        return { $or: [{ businessName: expression }, { contactName: expression }, { email: expression }, { phone: expression }] };
    }
    if (type === "media") {
        return { $or: [{ publicId: expression }, { alt: expression }, { caption: expression }, { url: expression }] };
    }
    if (type === "seo-templates") {
        return { $or: [{ entityType: expression }, { titleTemplate: expression }] };
    }
    return {};
}

export async function GET(request, context) {
    const auth = await authorize();
    if (auth.response) return auth.response;

    const type = await getType(context);
    const resource = ADMIN_RESOURCES[type];
    if (!resource) return apiError("Unknown resource.", 404);

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 50);
    const status = url.searchParams.get("status");
    const search = (url.searchParams.get("q") || "").trim();

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return apiError("Invalid pagination parameters.", 400);
    }
    if (search.length > 100) return apiError("Search query is too long.", 400);

    if (type === "submissions" && status && !["pending", "reviewing", "approved", "rejected"].includes(status)) {
        return apiError("Invalid submission status filter.", 400);
    }
    if (resource.kind && status && !["draft", "published", "archived"].includes(status)) {
        return apiError("Invalid content status filter.", 400);
    }

    try {
        await connectDB();

        if (type === "seo") {
            const item = await resource.model.findOne({ key: "global" }).lean().exec();
            if (item) {
                if (!item.siteName || ["seo-product", "nearfolk"].includes(String(item.siteName).toLowerCase())) item.siteName = "GaavConnect";
                if (!item.siteUrl) item.siteUrl = "https://gaavconnect.in";
                if (!item.titleTemplate || /seo-product|nearfolk/i.test(item.titleTemplate)) item.titleTemplate = "%s | GaavConnect";
                if (!item.defaultTitle || /seo-product|nearfolk|discover local businesses\s*&\s*places/i.test(item.defaultTitle)) item.defaultTitle = "GaavConnect — Discover Local Businesses in Nashik District";
                if (!item.defaultDescription || /seo-product|nearfolk/i.test(item.defaultDescription)) item.defaultDescription = "Discover local businesses, shops, restaurants and services across Ghoti, Igatpuri and Nashik, Maharashtra.";
                if (!item.organizationName || ["seo-product", "nearfolk"].includes(String(item.organizationName).toLowerCase())) item.organizationName = "GaavConnect";
            }
            return apiSuccess({
                items: item ? [item] : [],
                total: item ? 1 : 0,
                page,
                limit,
                totalPages: item ? 1 : 0,
            });
        }

        const filter = resource.kind ? { kind: resource.kind } : {};
        if (status && (resource.kind || type === "submissions")) filter.status = status;
        Object.assign(filter, getSearchFilter(type, resource, search));

        const [items, total] = await Promise.all([
            resource.model.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec(),
            resource.model.countDocuments(filter),
        ]);

        let enrichedItems = items;
        if (type === "media" && items.length > 0) {
            const publicIds = items.map((m) => m.publicId).filter(Boolean);
            const urls = items.map((m) => m.url).filter(Boolean);

            const [locations, contentItems, businesses] = await Promise.all([
                Location.find({
                    $or: [
                        { "coverImage.publicId": { $in: publicIds } },
                        { "coverImage.url": { $in: urls } },
                    ],
                }).select("name slug type coverImage").lean().exec(),
                ContentItem.find({
                    $or: [
                        { "coverImage.publicId": { $in: publicIds } },
                        { "coverImage.url": { $in: urls } },
                    ],
                }).select("title slug kind coverImage").lean().exec(),
                Business.find({
                    $or: [
                        { "coverImage.publicId": { $in: publicIds } },
                        { "coverImage.url": { $in: urls } },
                        { "logo.publicId": { $in: publicIds } },
                        { "logo.url": { $in: urls } },
                    ],
                }).select("name slug coverImage logo").lean().exec(),
            ]);

            enrichedItems = items.map((item) => {
                const usages = [];
                for (const loc of locations) {
                    if (loc.coverImage?.publicId === item.publicId || (item.url && loc.coverImage?.url === item.url)) {
                        usages.push({
                            entityType: "location",
                            name: loc.name,
                            slug: loc.slug,
                            id: loc._id.toString(),
                            publicUrl: `/locations/${loc.slug}`,
                        });
                    }
                }
                for (const ci of contentItems) {
                    if (ci.coverImage?.publicId === item.publicId || (item.url && ci.coverImage?.url === item.url)) {
                        usages.push({
                            entityType: ci.kind,
                            name: ci.title,
                            slug: ci.slug,
                            id: ci._id.toString(),
                            publicUrl: `/${ci.kind === "place" ? "places" : ci.kind === "guide" ? "guides" : "events"}/${ci.slug}`,
                        });
                    }
                }
                for (const biz of businesses) {
                    if (biz.coverImage?.publicId === item.publicId || (item.url && biz.coverImage?.url === item.url) ||
                        biz.logo?.publicId === item.publicId || (item.url && biz.logo?.url === item.url)) {
                        usages.push({
                            entityType: "business",
                            name: biz.name,
                            slug: biz.slug,
                            id: biz._id.toString(),
                            publicUrl: `/businesses/${biz.slug}`,
                        });
                    }
                }
                return { ...item, usages };
            });
        }

        return apiSuccess({
            items: enrichedItems,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        return fail(error);
    }
}

export async function POST(request, context) {
    const auth = await authorize();
    if (auth.response) return auth.response;

    const type = await getType(context);
    const resource = ADMIN_RESOURCES[type];
    if (!resource) return apiError("Unknown resource.", 404);
    if (type === "submissions") return apiError("Submissions are created through the public endpoint.", 405);

    const parsedBody = await parseBody(request);
    if (parsedBody.error) return parsedBody.error;

    try {
        await connectDB();
        let data;

        if (resource.kind) {
            const parsed = contentSchema.safeParse(parsedBody.body);
            if (!parsed.success) return apiError("Content data is invalid.", 400, parsed.error.issues);
            data = {
                ...parsed.data,
                status: parsed.data.status ?? "draft",
                location: parsed.data.location ?? null,
            };

            if (data.status === "published") {
                const validationError = validatePublishedContent(resource.kind, data);
                if (validationError) return validationError;
            }
            if (data.location && !await Location.exists({ _id: data.location, status: "active" })) {
                return apiError("Select an active location.", 400);
            }

            Object.assign(data, {
                kind: resource.kind,
                createdBy: auth.user.id,
                updatedBy: auth.user.id,
                publishedAt: data.status === "published" ? new Date() : null,
            });
        } else if (type === "media") {
            const parsed = mediaSchema.safeParse(parsedBody.body);
            if (!parsed.success) return apiError("Media data is invalid.", 400, parsed.error.issues);
            const { assignTo, ...mediaFields } = parsed.data;
            data = { ...mediaFields, uploadedBy: auth.user.id };
            const item = await resource.model.create(data);
            if (assignTo) {
                await applyMediaAssignment(item, assignTo, auth.user.id);
            }
            return apiSuccess({ item }, 201);
        } else if (type === "seo") {
            const parsed = settingsSchema.safeParse(parsedBody.body);
            if (!parsed.success) return apiError("SEO settings are invalid.", 400, parsed.error.issues);
            const item = await resource.model.findOneAndUpdate(
                { key: "global" },
                { $set: { ...parsed.data, key: "global", updatedBy: auth.user.id } },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            ).lean().exec();
            return apiSuccess({ item });
        } else if (type === "seo-templates") {
            const parsed = templateSchema.safeParse(parsedBody.body);
            if (!parsed.success) return apiError("SEO template is invalid.", 400, parsed.error.issues);
            data = { ...parsed.data, updatedBy: auth.user.id };
        } else {
            return apiError("Creation is not supported for this resource.", 405);
        }

        const item = await resource.model.create(data);
        return apiSuccess({ item }, 201);
    } catch (error) {
        return fail(error);
    }
}

export async function PATCH(request, context) {
    const auth = await authorize();
    if (auth.response) return auth.response;

    const type = await getType(context);
    const resource = ADMIN_RESOURCES[type];
    if (!resource) return apiError("Unknown resource.", 404);

    const parsedBody = await parseBody(request);
    if (parsedBody.error) return parsedBody.error;
    const { body } = parsedBody;

    try {
        await connectDB();

        if (type === "seo") {
            const parsed = settingsSchema.partial().strict().safeParse(body.data || {});
            if (!parsed.success) return apiError("SEO settings are invalid.", 400, parsed.error.issues);
            const item = await resource.model.findOneAndUpdate(
                { key: "global" },
                { $set: { ...parsed.data, key: "global", updatedBy: auth.user.id } },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            ).lean().exec();
            return apiSuccess({ item });
        }

        if (!body.id || !mongoose.isValidObjectId(body.id)) {
            return apiError("A valid record ID is required.", 400);
        }

        let updates;

        if (resource.kind) {
            const parsed = contentSchema.partial().strict().safeParse(body.data);
            if (!parsed.success) return apiError("Content data is invalid.", 400, parsed.error.issues);
            updates = { ...parsed.data, updatedBy: auth.user.id };

            const filter = { _id: body.id, kind: resource.kind };
            if (updates.location && !await Location.exists({ _id: updates.location, status: "active" })) {
                return apiError("Select an active location.", 400);
            }

            if (updates.status === "published") {
                const current = await resource.model.findOne(filter).lean().exec();
                if (!current) return apiError("Record not found.", 404);
                const candidate = {
                    summary: updates.summary ?? current.summary,
                    body: updates.body ?? current.body,
                    event: updates.event
                        ? { ...(current.event || {}), ...updates.event }
                        : current.event,
                };
                const validationError = validatePublishedContent(resource.kind, candidate);
                if (validationError) return validationError;
                updates.publishedAt = current.publishedAt || new Date();
            } else if (updates.status) {
                updates.publishedAt = null;
            }
        } else if (type === "submissions") {
            const parsed = submissionSchema.safeParse(body.data);
            if (!parsed.success) return apiError("Submission update is invalid.", 400, parsed.error.issues);
            updates = { ...parsed.data, reviewedBy: auth.user.id, reviewedAt: new Date() };
        } else if (type === "media") {
            const parsed = mediaUpdateSchema.safeParse(body.data);
            if (!parsed.success) return apiError("Media update is invalid.", 400, parsed.error.issues);
            if (Object.keys(parsed.data).length === 0) {
                return apiError("Provide alt text, caption, or an assignment change to update.", 400);
            }
            const { assignTo, unassignFrom, ...mediaFields } = parsed.data;
            updates = mediaFields;

            const existingMedia = await resource.model.findById(body.id).lean().exec();
            if (!existingMedia) return apiError("Media record not found.", 404);

            if (assignTo) {
                await applyMediaAssignment(existingMedia, assignTo, auth.user.id);
            }
            if (unassignFrom) {
                await removeMediaAssignment(existingMedia, unassignFrom, auth.user.id);
            }
        } else if (type === "seo-templates") {
            const parsed = templateSchema.partial().strict().safeParse(body.data);
            if (!parsed.success) return apiError("SEO template is invalid.", 400, parsed.error.issues);
            updates = { ...parsed.data, updatedBy: auth.user.id };
        } else {
            return apiError("This resource cannot be updated.", 405);
        }

        const filter = resource.kind ? { _id: body.id, kind: resource.kind } : { _id: body.id };
        const setUpdates = { ...updates };

        // PATCH nested objects by dotted path so omitted fields are preserved.
        for (const key of ["coverImage", "event", "seo"]) {
            if (!setUpdates[key] || typeof setUpdates[key] !== "object") continue;
            const nested = setUpdates[key];
            delete setUpdates[key];
            for (const [nestedKey, nestedValue] of Object.entries(nested)) {
                setUpdates[`${key}.${nestedKey}`] = nestedValue;
            }
        }

        const item = await resource.model.findOneAndUpdate(
            filter,
            { $set: setUpdates },
            { new: true, runValidators: true }
        ).lean().exec();

        if (!item) return apiError("Record not found.", 404);
        return apiSuccess({ item });
    } catch (error) {
        return fail(error);
    }
}

export async function DELETE(request, context) {
    const auth = await authorize();
    if (auth.response) return auth.response;

    const type = await getType(context);
    const resource = ADMIN_RESOURCES[type];
    if (!resource) return apiError("Unknown resource.", 404);
    if (!["media", "places", "guides", "events", "seo-templates"].includes(type)) {
        return apiError("Deletion is not allowed for this resource.", 405);
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id || !mongoose.isValidObjectId(id)) {
        return apiError("A valid record ID is required.", 400);
    }

    try {
        await connectDB();

        if (type === "media") {
            const media = await resource.model.findById(id).lean().exec();
            if (!media) return apiError("Media record not found.", 404);

            const [businessReference, locationReference, contentReference, seoReference] = await Promise.all([
                Business.exists({
                    $or: [
                        { "logo.publicId": media.publicId },
                        { "logo.url": media.url },
                        { "coverImage.publicId": media.publicId },
                        { "coverImage.url": media.url },
                        { "images.publicId": media.publicId },
                        { "images.url": media.url },
                    ],
                }),
                Location.exists({
                    $or: [
                        { "coverImage.publicId": media.publicId },
                        { "coverImage.url": media.url },
                    ],
                }),
                ContentItem.exists({
                    $or: [
                        { "coverImage.publicId": media.publicId },
                        { "coverImage.url": media.url },
                    ],
                }),
                SEOSettings.exists({
                    $or: [
                        { defaultImage: media.url },
                        { organizationLogo: media.url },
                    ],
                }),
            ]);

            if (businessReference || locationReference || contentReference || seoReference) {
                return apiError(
                    "This image is assigned to content. Remove its references before deleting it.",
                    409
                );
            }

            try {
                await deleteCloudinaryImage({
                    publicId: media.publicId,
                    config: getCloudinaryConfig(),
                });
            } catch (error) {
                console.error("[MEDIA] Cloudinary deletion failed:", error.message);
                return apiError(
                    "Cloudinary could not confirm asset deletion. The media record was kept.",
                    502
                );
            }

            const result = await resource.model.deleteOne({
                _id: id,
                publicId: media.publicId,
            }).exec();

            if (!result.deletedCount) {
                return apiError(
                    "The Cloudinary asset was deleted, but the media record changed. Refresh the library and retry.",
                    409
                );
            }

            return apiSuccess({ deleted: true, assetDeleted: true });
        }

        const filter = resource.kind ? { _id: id, kind: resource.kind } : { _id: id };
        const result = await resource.model.deleteOne(filter).exec();
        if (!result.deletedCount) return apiError("Record not found.", 404);

        return apiSuccess({ deleted: true });
    } catch (error) {
        return fail(error);
    }
}
