import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/response";
import {
    resolveDateRange,
    getTopPages,
    getTrafficTrends,
    getBusinessDiscoveryInsights,
    generateCsv,
} from "@/lib/analytics/aggregate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
    const { user, response } = await requireAdmin();
    if (response) return response;

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "pages";
        const range = searchParams.get("range") || "7d";
        const customStart = searchParams.get("startDate");
        const customEnd = searchParams.get("endDate");

        const dateRange = resolveDateRange(range, customStart, customEnd);
        let csvContent = "";
        let filename = `gaavconnect-analytics-${type}-${range}.csv`;

        if (type === "pages") {
            const result = await getTopPages({ ...dateRange, limit: 100 });
            const headers = [
                "Page Title",
                "Page Path",
                "Page Type",
                "Views",
                "Unique Visitors",
                "% of Total",
                "Growth %",
            ];
            const rows = result.pages.map((p) => [
                p.pageTitle || "Untitled",
                p.pagePath,
                p.pageType,
                p.views,
                p.uniqueVisitors,
                `${p.percentOfTotal}%`,
                `${p.change}%`,
            ]);
            csvContent = generateCsv(headers, rows);
        } else if (type === "businesses") {
            const result = await getBusinessDiscoveryInsights(dateRange);
            const headers = [
                "Business Name",
                "Slug",
                "Category",
                "Location",
                "Status",
                "Views",
                "Unique Visitors",
            ];
            const rows = result.topBusinesses.map((b) => [
                b.name,
                b.slug,
                b.categoryName,
                b.locationName,
                b.status,
                b.views,
                b.uniqueVisitors,
            ]);
            csvContent = generateCsv(headers, rows);
        } else if (type === "trends") {
            const result = await getTrafficTrends(dateRange);
            const headers = ["Time Period", "Page Views", "Unique Visitors", "Sessions"];
            const rows = result.trends.map((t) => [t.bucket, t.views, t.visitors, t.sessions]);
            csvContent = generateCsv(headers, rows);
        } else if (type === "searches") {
            const result = await getBusinessDiscoveryInsights(dateRange);
            const headers = ["Search Query", "Search Count", "Zero Result Count"];
            const rows = result.searches.map((s) => [s.query, s.count, s.zeroResultsCount]);
            csvContent = generateCsv(headers, rows);
        } else {
            return apiError("Invalid export type.", 400);
        }

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("[ANALYTICS] CSV Export failed:", error.message);
        return apiError("Failed to export analytics data.", 500);
    }
}
