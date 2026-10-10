import { requireAdmin } from "@/lib/api/require-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { resolveDateRange, getOverviewMetrics } from "@/lib/analytics/aggregate";

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

        const dateRange = resolveDateRange(range, customStart, customEnd);
        const metrics = await getOverviewMetrics(dateRange);

        return apiSuccess({
            range: dateRange.range,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
            timezone: dateRange.timezone,
            metrics,
        });
    } catch (error) {
        console.error("[ANALYTICS] Overview fetch failed:", error.message);
        return apiError("Failed to fetch analytics overview.", 500);
    }
}
