import { requireAdmin } from "@/lib/api/require-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getRealtimeStats } from "@/lib/analytics/aggregate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const { user, response } = await requireAdmin();
    if (response) return response;

    try {
        const stats = await getRealtimeStats();
        return apiSuccess(stats);
    } catch (error) {
        console.error("[ANALYTICS] Realtime fetch failed:", error.message);
        return apiError("Failed to fetch real-time analytics.", 500);
    }
}
