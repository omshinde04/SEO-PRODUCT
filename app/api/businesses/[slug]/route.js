import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugSchema = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * GET /api/businesses/:slug
 *
 * Returns a published business by its public URL slug.
 * Internal notes and audit user IDs are never exposed.
 */
export async function GET(_request, { params }) {
    try {
        const { slug } = await params;

        if (
            typeof slug !== "string" ||
            slug.length > 180 ||
            !slugSchema.test(slug)
        ) {
            return apiError("Invalid business slug.", 400);
        }

        await connectDB();

        const item = await Business.findOne({
            slug,
            status: "published",
        })
            .select("-internalNotes -createdBy -updatedBy")
            .populate({
                path: "category",
                select: "name slug description icon seo",
                match: { status: "active" },
            })
            .populate({
                path: "location",
                select: "name slug type address coordinates description coverImage seo",
                match: { status: "active" },
            })
            .lean()
            .exec();

        if (!item || !item.category || !item.location) {
            return apiError("Business not found.", 404);
        }

        return apiSuccess({ item, business: item });
    } catch (error) {
        console.error("[PUBLIC BUSINESS] Detail failed for slug:", slug, error);
        return apiError("Unable to retrieve business.", 500);
    }
}
