import { requireAdmin } from "@/lib/api/require-admin";
import { apiSuccess } from "@/lib/api/response";
import { getSearchConsoleStatus } from "@/lib/analytics/search-console";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const status = getSearchConsoleStatus();
    return apiSuccess(status);
}
