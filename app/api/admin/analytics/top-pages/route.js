import { requireAdmin } from "@/lib/api/require-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { resolveDateRange, getTopPages } from "@/lib/analytics/aggregate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
    const { user, response } = await requireAdmin();
    if (response) return response;

    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "7d";
        const customStart = searchParams.get("startDate");
        const customEnd = searchParams.get("endDate");
        const pageType = searchParams.get("pageType") || "all";
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

        const dateRange = resolveDateRange(range, customStart, customEnd);
        const data = await getTopPages({ ...dateRange, pageType, limit });

        return apiSuccess({
            range: dateRange.range,
            pageType,
            ...data,
        });
    } catch (error) {
        console.error("[ANALYTICS] Top pages fetch failed:", error.message);
        return apiError("Failed to fetch top pages.", 500);
    }
}
