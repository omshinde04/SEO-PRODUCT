import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import BusinessSubmission from "@/models/BusinessSubmission";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { validatePublishedBusiness } from "@/lib/business/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const updateSchema = z.object({
    status: z.enum(["pending", "reviewing", "approved", "rejected"]).optional(),
    adminNotes: z.string().trim().max(3000).optional(),
}).strict();
const createListingSchema = z.object({
    category: objectIdSchema,
    location: objectIdSchema,
    businessType: z.enum(["business", "restaurant", "hotel", "professional_service", "healthcare", "retail", "tourism", "attraction", "guide", "event_venue", "other"]),
    description: z.string().trim().max(10000),
    publish: z.boolean().default(true),
}).strict();

function slugify(value) {
    return String(value || "local-business")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 150) || "local-business";
}

async function uniqueSlug(name) {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;
    while (await Business.exists({ slug: candidate })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}

export async function PATCH(request, { params }) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const { id } = await params;
        if (!objectIdSchema.safeParse(id).success) return apiError("Invalid submission ID.", 400);
        const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
        if (contentType !== "application/json") return apiError("Content-Type must be application/json.", 415);

        const body = await request.json().catch(() => null);
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Submission update is invalid.", 400, parsed.error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message,
            })));
        }
        if (!Object.keys(parsed.data).length) return apiError("Provide a status or admin note to update.", 400);

        await connectDB();
        const item = await BusinessSubmission.findById(id).exec();
        if (!item) return apiError("Submission not found.", 404);

        if (parsed.data.status !== undefined) {
            if (item.business && parsed.data.status !== "approved") {
                return apiError("This request already has a business listing. Keep it approved and manage publication in Business Management.", 409);
            }
            item.status = parsed.data.status;
            if (["approved", "rejected"].includes(parsed.data.status)) {
                item.reviewedBy = auth.user.id;
                item.reviewedAt = new Date();
            } else {
                item.reviewedBy = null;
                item.reviewedAt = null;
            }
        }
        if (parsed.data.adminNotes !== undefined) item.adminNotes = parsed.data.adminNotes;
        await item.save();

        return apiSuccess({ message: "Submission updated successfully.", item: item.toObject() });
    } catch (error) {
        console.error("[ADMIN SUBMISSIONS] Update failed:", error.message);
        return apiError("Unable to update this submission.", 500);
    }
}

export async function POST(request, { params }) {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    try {
        const { id } = await params;
        if (!objectIdSchema.safeParse(id).success) return apiError("Invalid submission ID.", 400);
        const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
        if (contentType !== "application/json") return apiError("Content-Type must be application/json.", 415);

        const body = await request.json().catch(() => null);
        const parsed = createListingSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Listing details are invalid.", 400, parsed.error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message,
            })));
        }

        await connectDB();
        const submission = await BusinessSubmission.findById(id).exec();
        if (!submission) return apiError("Submission not found.", 404);
        if (submission.status !== "approved") return apiError("Approve this request before creating a listing.", 409);
        if (submission.business) return apiError("A business listing has already been created from this request.", 409);

        const [category, location] = await Promise.all([
            Category.findOne({ _id: parsed.data.category, status: "active" }).select("_id name").lean().exec(),
            Location.findOne({ _id: parsed.data.location, status: "active" }).select("_id name address").lean().exec(),
        ]);
        if (!category) return apiError("Choose an active category.", 400);
        if (!location) return apiError("Choose an active location.", 400);

        const publishStatus = parsed.data.publish ? "published" : "draft";
        const description = parsed.data.description || submission.message || "";
        if (publishStatus === "published" && !description.trim()) {
            return apiError("Add a business description before publishing this listing.", 400);
        }

        const businessData = {
            name: submission.businessName,
            slug: await uniqueSlug(submission.businessName),
            tagline: "",
            description: description.trim(),
            businessType: parsed.data.businessType,
            category: category._id,
            location: location._id,
            contact: {
                phone: submission.phone,
                email: submission.email,
                website: submission.website || "",
                preferredMethod: "any",
            },
            address: {
                city: submission.locationName || location.name || "",
                formatted: submission.locationName || location.name || "",
                country: "India",
            },
            services: [],
            amenities: [],
            paymentMethods: [],
            languages: [],
            priceRange: "not_applicable",
            status: publishStatus,
            publishedAt: publishStatus === "published" ? new Date() : null,
            verificationStatus: publishStatus === "published" ? "verified" : "unverified",
            isFeatured: false,
            seo: {
                title: `${submission.businessName} | nearfolk`.slice(0, 70),
                description: description.trim().slice(0, 170),
                noIndex: false,
            },
            createdBy: auth.user.id,
            updatedBy: auth.user.id,
        };

        const publicationError = validatePublishedBusiness(businessData);
        if (publicationError) return apiError(publicationError, 400);

        const business = await Business.create(businessData);
        submission.business = business._id;
        submission.convertedAt = new Date();
        submission.reviewedBy = auth.user.id;
        submission.reviewedAt = submission.reviewedAt || new Date();
        await submission.save();

        return apiSuccess({
            message: publishStatus === "published"
                ? "Business listing published. It is now eligible to appear in public discovery."
                : "Business draft created. Publish it from Business Management when ready.",
            item: submission.toObject(),
            business: { _id: business._id, name: business.name, slug: business.slug, status: business.status },
            publicUrl: publishStatus === "published" ? `/businesses/${business.slug}` : null,
        }, 201);
    } catch (error) {
        if (error?.code === 11000) return apiError("A business with this slug already exists. Try again to generate a unique URL.", 409);
        if (["ValidationError", "StrictModeError", "CastError"].includes(error?.name)) {
            return apiError("Business listing data failed validation.", 400);
        }
        console.error("[ADMIN SUBMISSIONS] Listing creation failed:", error.message);
        return apiError("Unable to create a business listing from this request.", 500);
    }
}
