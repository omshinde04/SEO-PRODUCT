import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECENT_BUSINESS_LIMIT = 5;

/**
 * GET /api/admin/dashboard/stats
 *
 * Admin-only overview counts and recently created businesses.
 * Business totals include all publication states; pending verification is
 * counted independently of publication state.
 */
export async function GET() {
    try {
        const auth = await requireAdmin();

        if (auth.response) return auth.response;

        await connectDB();

        const [
            totalBusinesses,
            publishedBusinesses,
            draftBusinesses,
            archivedBusinesses,
            pendingVerificationBusinesses,
            totalCategories,
            activeCategories,
            inactiveCategories,
            totalLocations,
            activeLocations,
            inactiveLocations,
            recentBusinesses,
        ] = await Promise.all([
            Business.countDocuments({}),
            Business.countDocuments({ status: "published" }),
            Business.countDocuments({ status: "draft" }),
            Business.countDocuments({ status: "archived" }),
            Business.countDocuments({ verificationStatus: "pending" }),
            Category.countDocuments({}),
            Category.countDocuments({ status: "active" }),
            Category.countDocuments({ status: "inactive" }),
            Location.countDocuments({}),
            Location.countDocuments({ status: "active" }),
            Location.countDocuments({ status: "inactive" }),
            Business.find({})
                .select("name slug status businessType verificationStatus logo createdAt category location")
                .populate("category", "name slug")
                .populate("location", "name slug type")
                .sort({ createdAt: -1, _id: -1 })
                .limit(RECENT_BUSINESS_LIMIT)
                .lean()
                .exec(),
        ]);

        return apiSuccess({
            stats: {
                businesses: {
                    total: totalBusinesses,
                    published: publishedBusinesses,
                    drafts: draftBusinesses,
                    archived: archivedBusinesses,
                    pendingVerification: pendingVerificationBusinesses,
                },
                categories: {
                    total: totalCategories,
                    active: activeCategories,
                    inactive: inactiveCategories,
                },
                locations: {
                    total: totalLocations,
                    active: activeLocations,
                    inactive: inactiveLocations,
                },
            },
            recentBusinesses,
        });
    } catch (error) {
        console.error("[ADMIN DASHBOARD] Stats failed:", error.message);
        return apiError("Unable to retrieve dashboard statistics.", 500);
    }
}
