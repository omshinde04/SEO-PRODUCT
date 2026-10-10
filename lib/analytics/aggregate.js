import { connectDB } from "../db.js";
import AnalyticsEvent from "../../models/AnalyticsEvent.js";
import Business from "../../models/Business.js";
import Category from "../../models/Category.js";
import Location from "../../models/Location.js";

const TIMEZONE = "Asia/Kolkata";

/**
 * Calculates start, end, and prior comparison dates based on preset or custom range.
 */
export function resolveDateRange(range = "7d", customStart, customEnd) {
    const now = new Date();

    let startDate;
    let endDate = new Date(now);

    if (range === "today") {
        // Start of today in local date
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    } else if (range === "yesterday") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
    } else if (range === "30d") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "90d") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === "custom" && customStart && customEnd) {
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = new Date(now);
        }
    } else {
        // Default: 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime());
    const prevStartDate = new Date(startDate.getTime() - durationMs);

    return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        range,
        timezone: TIMEZONE,
    };
}

function calculatePercentChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * Overview KPIs: Total views, unique visitors, total sessions, new/returning, bounce rate, avg duration.
 */
export async function getOverviewMetrics({ startDate, endDate, prevStartDate, prevEndDate }) {
    await connectDB();

    async function queryPeriod(start, end) {
        const match = {
            timestamp: { $gte: start, $lte: end },
            eventType: "page_view",
        };

        const result = await AnalyticsEvent.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: 1 },
                    uniqueVisitors: { $addToSet: "$visitorHash" },
                    sessions: { $addToSet: "$sessionId" },
                    totalDuration: { $sum: "$durationSeconds" },
                    durationEventsCount: {
                        $sum: { $cond: [{ $gt: ["$durationSeconds", 0] }, 1, 0] },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalViews: 1,
                    uniqueVisitorsCount: { $size: "$uniqueVisitors" },
                    totalSessionsCount: { $size: "$sessions" },
                    avgDuration: {
                        $cond: [
                            { $gt: ["$durationEventsCount", 0] },
                            { $divide: ["$totalDuration", "$durationEventsCount"] },
                            0,
                        ],
                    },
                },
            },
        ]).exec();

        const base = result[0] || {
            totalViews: 0,
            uniqueVisitorsCount: 0,
            totalSessionsCount: 0,
            avgDuration: 0,
        };

        // Calculate bounce rate: sessions that have exactly 1 page view
        const bounceResult = await AnalyticsEvent.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$sessionId",
                    viewsInSession: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    bouncedSessions: {
                        $sum: { $cond: [{ $eq: ["$viewsInSession", 1] }, 1, 0] },
                    },
                },
            },
        ]).exec();

        const bounceData = bounceResult[0] || { totalSessions: 0, bouncedSessions: 0 };
        const bounceRate =
            bounceData.totalSessions > 0
                ? Math.round((bounceData.bouncedSessions / bounceData.totalSessions) * 100 * 10) / 10
                : 0;

        // New vs returning visitors
        const newVisitorsCount = await AnalyticsEvent.distinct("visitorHash", {
            ...match,
            isNewVisitor: true,
        }).then((res) => res.length);

        const returningVisitorsCount = Math.max(0, base.uniqueVisitorsCount - newVisitorsCount);
        const avgPagesPerSession =
            base.totalSessionsCount > 0
                ? Math.round((base.totalViews / base.totalSessionsCount) * 100) / 100
                : 0;

        return {
            totalViews: base.totalViews,
            uniqueVisitors: base.uniqueVisitorsCount,
            totalSessions: base.totalSessionsCount,
            newVisitors: newVisitorsCount,
            returningVisitors: returningVisitorsCount,
            avgPagesPerSession,
            avgSessionDuration: Math.round(base.avgDuration),
            bounceRate,
        };
    }

    const current = await queryPeriod(startDate, endDate);
    const previous = await queryPeriod(prevStartDate, prevEndDate);

    return {
        current,
        previous,
        change: {
            views: calculatePercentChange(current.totalViews, previous.totalViews),
            visitors: calculatePercentChange(current.uniqueVisitors, previous.uniqueVisitors),
            sessions: calculatePercentChange(current.totalSessions, previous.totalSessions),
            bounceRate: calculatePercentChange(current.bounceRate, previous.bounceRate),
            avgDuration: calculatePercentChange(
                current.avgSessionDuration,
                previous.avgSessionDuration
            ),
        },
    };
}

/**
 * Traffic Trends: Hourly buckets for short ranges, daily buckets for multi-day ranges.
 */
export async function getTrafficTrends({ startDate, endDate, range }) {
    await connectDB();

    const isHourly = range === "today" || range === "yesterday";
    const dateFormat = isHourly ? "%Y-%m-%d %H:00" : "%Y-%m-%d";

    const trends = await AnalyticsEvent.aggregate([
        {
            $match: {
                timestamp: { $gte: startDate, $lte: endDate },
                eventType: "page_view",
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: dateFormat,
                        date: "$timestamp",
                        timezone: TIMEZONE,
                    },
                },
                views: { $sum: 1 },
                visitors: { $addToSet: "$visitorHash" },
                sessions: { $addToSet: "$sessionId" },
            },
        },
        {
            $project: {
                _id: 0,
                bucket: "$_id",
                views: 1,
                visitors: { $size: "$visitors" },
                sessions: { $size: "$sessions" },
            },
        },
        { $sort: { bucket: 1 } },
    ]).exec();

    return {
        isHourly,
        trends,
    };
}

/**
 * Real-time Active Visitors: Last 5 minutes deduplicated visitor hashes, active sessions, and recent events.
 */
export async function getRealtimeStats() {
    await connectDB();

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Active visitors in last 5 minutes
    const activeVisitors = await AnalyticsEvent.distinct("visitorHash", {
        timestamp: { $gte: fiveMinutesAgo },
    }).then((hashes) => hashes.length);

    // Active sessions in last 5 minutes
    const activeSessions = await AnalyticsEvent.distinct("sessionId", {
        timestamp: { $gte: fiveMinutesAgo },
    }).then((sids) => sids.length);

    // Recent 10 events
    const recentActivity = await AnalyticsEvent.find({
        timestamp: { $gte: fifteenMinutesAgo },
    })
        .sort({ timestamp: -1 })
        .limit(10)
        .select("eventType pagePath pageTitle entitySlug timestamp")
        .lean()
        .exec();

    // Trending pages in last 15 minutes
    const trendingPages = await AnalyticsEvent.aggregate([
        {
            $match: {
                timestamp: { $gte: fifteenMinutesAgo },
                eventType: "page_view",
            },
        },
        {
            $group: {
                _id: "$pagePath",
                views: { $sum: 1 },
                title: { $last: "$pageTitle" },
            },
        },
        { $sort: { views: -1 } },
        { $limit: 5 },
        {
            $project: {
                _id: 0,
                path: "$_id",
                title: { $ifNull: ["$title", "$_id"] },
                views: 1,
            },
        },
    ]).exec();

    return {
        activeVisitors,
        activeSessions,
        recentActivity,
        trendingPages,
        lastUpdated: now.toISOString(),
        windowMinutes: 5,
    };
}

/**
 * Top Performing Pages with pageType filtering and growth comparison.
 */
export async function getTopPages({ startDate, endDate, prevStartDate, prevEndDate, pageType, limit = 20 }) {
    await connectDB();

    const match = {
        timestamp: { $gte: startDate, $lte: endDate },
        eventType: "page_view",
    };

    if (pageType && pageType !== "all") {
        match.pageType = pageType;
    }

    const totalViewsCount = await AnalyticsEvent.countDocuments(match);

    const pages = await AnalyticsEvent.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$pagePath",
                pageTitle: { $last: "$pageTitle" },
                pageType: { $last: "$pageType" },
                views: { $sum: 1 },
                visitors: { $addToSet: "$visitorHash" },
            },
        },
        {
            $project: {
                _id: 0,
                pagePath: "$_id",
                pageTitle: 1,
                pageType: 1,
                views: 1,
                uniqueVisitors: { $size: "$visitors" },
            },
        },
        { $sort: { views: -1 } },
        { $limit: limit },
    ]).exec();

    // Fetch previous period view counts for top pages
    const pagePaths = pages.map((p) => p.pagePath);
    const prevViewsMap = new Map();

    if (pagePaths.length > 0) {
        const prevPages = await AnalyticsEvent.aggregate([
            {
                $match: {
                    timestamp: { $gte: prevStartDate, $lte: prevEndDate },
                    eventType: "page_view",
                    pagePath: { $in: pagePaths },
                },
            },
            {
                $group: {
                    _id: "$pagePath",
                    views: { $sum: 1 },
                },
            },
        ]).exec();

        for (const item of prevPages) {
            prevViewsMap.set(item._id, item.views);
        }
    }

    const items = pages.map((item) => {
        const prevViews = prevViewsMap.get(item.pagePath) || 0;
        return {
            ...item,
            percentOfTotal:
                totalViewsCount > 0
                    ? Math.round((item.views / totalViewsCount) * 100 * 10) / 10
                    : 0,
            change: calculatePercentChange(item.views, prevViews),
        };
    });

    return {
        totalViews: totalViewsCount,
        pages: items,
    };
}

/**
 * Traffic Sources, Device, and Technology Insights.
 */
export async function getSourcesAndTech({ startDate, endDate }) {
    await connectDB();

    const match = {
        timestamp: { $gte: startDate, $lte: endDate },
        eventType: "page_view",
    };

    // Sources breakdown
    const sources = await AnalyticsEvent.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$referrerSource",
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, source: "$_id", count: 1 } },
        { $sort: { count: -1 } },
    ]).exec();

    // Top referring hostnames
    const topReferrers = await AnalyticsEvent.aggregate([
        {
            $match: {
                ...match,
                referrerHostname: { $nin: ["direct", "unknown", "internal", "localhost"] },
            },
        },
        {
            $group: {
                _id: "$referrerHostname",
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, hostname: "$_id", count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]).exec();

    // Devices
    const devices = await AnalyticsEvent.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$deviceType",
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, device: "$_id", count: 1 } },
        { $sort: { count: -1 } },
    ]).exec();

    // Browsers
    const browsers = await AnalyticsEvent.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$browserFamily",
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, browser: "$_id", count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 6 },
    ]).exec();

    // Operating Systems
    const os = await AnalyticsEvent.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$osFamily",
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, os: "$_id", count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 6 },
    ]).exec();

    // Geographic Insights (Coarse country and region, if available)
    const regions = await AnalyticsEvent.aggregate([
        {
            $match: {
                ...match,
                region: { $ne: "" },
            },
        },
        {
            $group: {
                _id: { region: "$region", country: "$country" },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                region: "$_id.region",
                country: "$_id.country",
                count: 1,
            },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]).exec();

    return {
        sources,
        topReferrers,
        devices,
        browsers,
        os,
        regions,
    };
}

/**
 * GaavConnect Local Business Discovery Insights:
 * Business views, CTAs (call, whatsapp, directions, website), Category/Location views, Search analytics.
 */
export async function getBusinessDiscoveryInsights({ startDate, endDate }) {
    await connectDB();

    const timeMatch = { timestamp: { $gte: startDate, $lte: endDate } };

    // 1. Most viewed business profiles
    const topBusinesses = await AnalyticsEvent.aggregate([
        {
            $match: {
                ...timeMatch,
                eventType: "business_view",
                entitySlug: { $ne: "" },
            },
        },
        {
            $group: {
                _id: "$entitySlug",
                views: { $sum: 1 },
                visitors: { $addToSet: "$visitorHash" },
            },
        },
        {
            $project: {
                _id: 0,
                slug: "$_id",
                views: 1,
                uniqueVisitors: { $size: "$visitors" },
            },
        },
        { $sort: { views: -1 } },
        { $limit: 15 },
    ]).exec();

    // Fetch actual Business names and status from database for enriched reporting
    const slugs = topBusinesses.map((b) => b.slug);
    const bizRecords = await Business.find({ slug: { $in: slugs } })
        .select("name slug status category location")
        .populate("category", "name")
        .populate("location", "name")
        .lean()
        .exec();

    const bizMap = new Map();
    for (const b of bizRecords) {
        bizMap.set(b.slug, b);
    }

    const enrichedBusinesses = topBusinesses.map((item) => {
        const found = bizMap.get(item.slug);
        return {
            ...item,
            name: found?.name || item.slug,
            categoryName: found?.category?.name || "General",
            locationName: found?.location?.name || "Nashik District",
            status: found?.status || "unknown",
            businessId: found?._id ? found._id.toString() : null,
        };
    });

    // 2. High-Intent Direct Action CTAs
    const ctaAgg = await AnalyticsEvent.aggregate([
        {
            $match: {
                ...timeMatch,
                eventType: {
                    $in: ["phone_click", "whatsapp_click", "directions_click", "website_click"],
                },
            },
        },
        {
            $group: {
                _id: "$eventType",
                count: { $sum: 1 },
            },
        },
    ]).exec();

    const ctaCounts = {
        phoneClicks: 0,
        whatsappClicks: 0,
        directionsClicks: 0,
        websiteClicks: 0,
    };

    for (const cta of ctaAgg) {
        if (cta._id === "phone_click") ctaCounts.phoneClicks = cta.count;
        if (cta._id === "whatsapp_click") ctaCounts.whatsappClicks = cta.count;
        if (cta._id === "directions_click") ctaCounts.directionsClicks = cta.count;
        if (cta._id === "website_click") ctaCounts.websiteClicks = cta.count;
    }

    // 3. Category & Location page view performance
    const categoryViews = await AnalyticsEvent.aggregate([
        {
            $match: {
                ...timeMatch,
                eventType: "category_view",
                entitySlug: { $ne: "" },
            },
        },
        {
            $group: {
                _id: "$entitySlug",
                views: { $sum: 1 },
            },
        },
        { $sort: { views: -1 } },
        { $limit: 10 },
    ]).exec();

    const locationViews = await AnalyticsEvent.aggregate([
        {
            $match: {
                ...timeMatch,
                eventType: "location_view",
                entitySlug: { $ne: "" },
            },
        },
        {
            $group: {
                _id: "$entitySlug",
                views: { $sum: 1 },
            },
        },
        { $sort: { views: -1 } },
        { $limit: 10 },
    ]).exec();

    // 4. Search Usage & Zero-Result Searches
    const searches = await AnalyticsEvent.aggregate([
        {
            $match: {
                ...timeMatch,
                eventType: "search",
                "metadata.searchQuery": { $exists: true, $ne: "" },
            },
        },
        {
            $group: {
                _id: "$metadata.searchQuery",
                count: { $sum: 1 },
                zeroResultsCount: {
                    $sum: { $cond: [{ $eq: ["$metadata.resultsCount", 0] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                _id: 0,
                query: "$_id",
                count: 1,
                zeroResultsCount: 1,
            },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
    ]).exec();

    const totalBusinessProfileViews = await AnalyticsEvent.countDocuments({
        ...timeMatch,
        eventType: "business_view",
    });

    return {
        totalBusinessViews: totalBusinessProfileViews,
        topBusinesses: enrichedBusinesses,
        ctaCounts,
        categoryViews: categoryViews.map((c) => ({ slug: c._id, views: c.views })),
        locationViews: locationViews.map((l) => ({ slug: l._id, views: l.views })),
        searches,
    };
}

/**
 * Generate CSV export data for tables.
 */
export function generateCsv(headers, rows) {
    const escape = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const headerLine = headers.map(escape).join(",");
    const rowLines = rows.map((row) => row.map(escape).join(","));

    return [headerLine, ...rowLines].join("\r\n");
}
