"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PageHeader from "../components/page-header";

function formatNumber(num) {
    if (num === null || num === undefined) return "0";
    return new Intl.NumberFormat("en-IN").format(num);
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
}

function formatDateTime(isoString) {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    }).format(d);
}

function GrowthBadge({ value }) {
    if (value === null || value === undefined || value === 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                0%
            </span>
        );
    }
    const isPositive = value > 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isPositive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60"
            }`}
        >
            {isPositive ? "↑ +" : "↓ "}
            {value}%
        </span>
    );
}

function TrendChart({ trends, isHourly }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    if (!trends || trends.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <svg
                    className="h-10 w-10 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3v18h18M9 17V9m4 8V5m4 12v-6"
                    />
                </svg>
                <p className="mt-2 text-sm font-semibold text-slate-700">No traffic trends recorded</p>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                    When visitors view pages on GaavConnect, time-series charts will appear here.
                </p>
            </div>
        );
    }

    const maxViews = Math.max(1, ...trends.map((t) => t.views));
    const width = 800;
    const height = 240;
    const paddingX = 40;
    const paddingY = 30;
    const graphWidth = width - paddingX * 2;
    const graphHeight = height - paddingY * 2;

    const points = trends.map((t, idx) => {
        const x =
            paddingX +
            (trends.length > 1
                ? (idx / (trends.length - 1)) * graphWidth
                : graphWidth / 2);
        const yViews = height - paddingY - (t.views / maxViews) * graphHeight;
        const yVisitors = height - paddingY - ((t.visitors || 0) / maxViews) * graphHeight;
        return { ...t, x, yViews, yVisitors };
    });

    const viewsPath = points.reduce(
        (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.yViews}`,
        ""
    );
    const visitorsPath = points.reduce(
        (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.yVisitors}`,
        ""
    );
    const areaPath = `${viewsPath} L ${points[points.length - 1].x} ${
        height - paddingY
    } L ${points[0].x} ${height - paddingY} Z`;

    return (
        <div className="relative">
            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-64 w-full min-w-[600px] select-none"
                >
                    <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                        const y = height - paddingY - pct * graphHeight;
                        const labelVal = Math.round(pct * maxViews);
                        return (
                            <g key={pct}>
                                <line
                                    x1={paddingX}
                                    y1={y}
                                    x2={width - paddingX}
                                    y2={y}
                                    stroke="#e2e8f0"
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                />
                                <text
                                    x={paddingX - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#94a3b8"
                                >
                                    {labelVal}
                                </text>
                            </g>
                        );
                    })}

                    {/* Views Area Fill & Line */}
                    <path d={areaPath} fill="url(#viewsGrad)" />
                    <path
                        d={viewsPath}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Visitors Line */}
                    <path
                        d={visitorsPath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        strokeLinecap="round"
                    />

                    {/* Points & Hover targets */}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p.x}
                                cy={p.yViews}
                                r={hoveredPoint?.bucket === p.bucket ? 5 : 3}
                                fill="#2563eb"
                                stroke="#ffffff"
                                strokeWidth="2"
                            />
                            {/* Transparent wider hover target */}
                            <rect
                                x={p.x - 15}
                                y={paddingY}
                                width={30}
                                height={graphHeight}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPoint(p)}
                            />
                        </g>
                    ))}

                    {/* X axis labels */}
                    {points
                        .filter(
                            (_, idx) =>
                                idx === 0 ||
                                idx === points.length - 1 ||
                                idx % Math.max(1, Math.floor(points.length / 5)) === 0
                        )
                        .map((p) => {
                            const label = isHourly
                                ? p.bucket.split(" ")[1] || p.bucket
                                : p.bucket.slice(5);
                            return (
                                <text
                                    key={p.bucket}
                                    x={p.x}
                                    y={height - 8}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#64748b"
                                >
                                    {label}
                                </text>
                            );
                        })}
                </svg>
            </div>

            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div
                    className="pointer-events-none absolute -top-2 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur-sm"
                    style={{
                        left: `clamp(10px, ${hoveredPoint.x}px, calc(100% - 160px))`,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <p className="font-bold text-slate-800">{hoveredPoint.bucket}</p>
                    <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                                <span className="h-2 w-2 rounded-full bg-blue-600" />
                                Page Views:
                            </span>
                            <span className="font-bold text-slate-900">{hoveredPoint.views}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Visitors:
                            </span>
                            <span className="font-bold text-slate-900">{hoveredPoint.visitors}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                Sessions:
                            </span>
                            <span className="font-bold text-slate-900">{hoveredPoint.sessions}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-600" />
                    <span>Page Views</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>Unique Visitors</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-slate-400" />
                    <span>Sessions</span>
                </div>
            </div>
        </div>
    );
}

export default function AnalyticsClient({ user }) {
    const [range, setRange] = useState("7d");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [activeTab, setActiveTab] = useState("traffic"); // 'traffic' | 'business' | 'tech' | 'gsc'
    const [pageTypeFilter, setPageTypeFilter] = useState("all");

    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState([]);
    const [isHourly, setIsHourly] = useState(false);
    const [topPages, setTopPages] = useState([]);
    const [realtime, setRealtime] = useState(null);
    const [businessInsights, setBusinessInsights] = useState(null);
    const [techInsights, setTechInsights] = useState(null);
    const [gscStatus, setGscStatus] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastRefreshed, setLastRefreshed] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            let queryParams = `range=${range}`;
            if (range === "custom" && startDate && endDate) {
                queryParams += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(
                    endDate
                )}`;
            }

            const [ovRes, trRes, tpRes, rtRes, biRes, srcRes, gscRes] = await Promise.all([
                fetch(`/api/admin/analytics/overview?${queryParams}`),
                fetch(`/api/admin/analytics/trends?${queryParams}`),
                fetch(`/api/admin/analytics/top-pages?${queryParams}&pageType=${pageTypeFilter}`),
                fetch(`/api/admin/analytics/realtime`),
                fetch(`/api/admin/analytics/business-discovery?${queryParams}`),
                fetch(`/api/admin/analytics/sources?${queryParams}`),
                fetch(`/api/admin/analytics/search-console`),
            ]);

            const [ovData, trData, tpData, rtData, biData, srcData, gscData] = await Promise.all([
                ovRes.json(),
                trRes.json(),
                tpRes.json(),
                rtRes.json(),
                biRes.json(),
                srcRes.json(),
                gscRes.json(),
            ]);

            if (!ovRes.ok) throw new Error(ovData.message || "Failed to load overview");

            setOverview(ovData.metrics);
            setTrends(trData.trends || []);
            setIsHourly(Boolean(trData.isHourly));
            setTopPages(tpData.pages || []);
            setRealtime(rtData);
            setBusinessInsights(biData);
            setTechInsights(srcData);
            setGscStatus(gscData);
            setLastRefreshed(new Date().toISOString());
        } catch (err) {
            setError(err.message || "Could not retrieve analytics data.");
        } finally {
            setLoading(false);
        }
    }, [range, startDate, endDate, pageTypeFilter]);

    // Initial load and on filter changes
    useEffect(() => {
        let cancelled = false;

        queueMicrotask(() => {
            if (!cancelled) {
                fetchData();
            }
        });

        return () => {
            cancelled = true;
        };
    }, [fetchData]);

    // Live real-time polling every 25 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch("/api/admin/analytics/realtime");
                if (res.ok) {
                    const data = await res.json();
                    setRealtime(data);
                }
            } catch {}
        }, 25000);

        return () => clearInterval(interval);
    }, []);

    const metrics = overview?.current || {
        totalViews: 0,
        uniqueVisitors: 0,
        totalSessions: 0,
        newVisitors: 0,
        returningVisitors: 0,
        avgPagesPerSession: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
    };

    const changes = overview?.change || {};

    return (
        <main className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            <PageHeader
                eyebrow="ANALYTICS & DISCOVERY INTELLIGENCE"
                title="Website Analytics"
                description="Comprehensive real-time traffic, local business discovery metrics, and visitor engagement for GaavConnect."
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={fetchData}
                            disabled={loading}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <svg
                                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Refresh
                        </button>
                        <a
                            href={`/api/admin/analytics/export?type=${
                                activeTab === "business" ? "businesses" : "pages"
                            }&range=${range}`}
                            download
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Export CSV
                        </a>
                    </div>
                }
            />

            {/* Real-time Status Pulse Banner */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                    <div>
                        <span className="text-sm font-bold text-slate-900">
                            {formatNumber(realtime?.activeVisitors || 0)} Active Visitors Right Now
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                            ({formatNumber(realtime?.activeSessions || 0)} active sessions in last 5 min)
                        </span>
                    </div>
                </div>
                <div className="text-xs text-slate-500">
                    Auto-refreshes every 25s · Last synced: {formatDateTime(lastRefreshed)}
                </div>
            </div>

            {/* Date Range & Controls Filter Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        ["today", "Today"],
                        ["yesterday", "Yesterday"],
                        ["7d", "Last 7 days"],
                        ["30d", "Last 30 days"],
                        ["90d", "Last 90 days"],
                        ["custom", "Custom"],
                    ].map(([val, label]) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => setRange(val)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                range === val
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {range === "custom" && (
                    <div className="flex items-center gap-2 text-xs">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700"
                        />
                    </div>
                )}

                <div className="text-xs font-medium text-slate-400">Timezone: Asia/Kolkata (IST)</div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                    {error}
                </div>
            )}

            {/* Top KPI Summary Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Page Views
                        </span>
                        <GrowthBadge value={changes.views} />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-slate-900">
                        {formatNumber(metrics.totalViews)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Compared to previous period: {formatNumber(overview?.previous?.totalViews || 0)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Unique Visitors
                        </span>
                        <GrowthBadge value={changes.visitors} />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-slate-900">
                        {formatNumber(metrics.uniqueVisitors)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(metrics.newVisitors)} new · {formatNumber(metrics.returningVisitors)} returning
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Sessions
                        </span>
                        <GrowthBadge value={changes.sessions} />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-slate-900">
                        {formatNumber(metrics.totalSessions)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {metrics.avgPagesPerSession} pages / session avg
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Engagement / Bounce
                        </span>
                        <GrowthBadge value={changes.bounceRate} />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-slate-900">{metrics.bounceRate}%</p>
                    <p className="mt-1 text-xs text-slate-500">
                        Avg session duration: {formatDuration(metrics.avgSessionDuration)}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 flex border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setActiveTab("traffic")}
                    className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
                        activeTab === "traffic"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Traffic & Trends
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("business")}
                    className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
                        activeTab === "business"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Business Discovery Insights
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("tech")}
                    className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
                        activeTab === "tech"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Sources & Devices
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("gsc")}
                    className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
                        activeTab === "gsc"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Google Search Console
                </button>
            </div>

            {/* TAB 1: TRAFFIC & TRENDS */}
            {activeTab === "traffic" && (
                <div className="space-y-8">
                    {/* Traffic Trends Chart */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Traffic Over Time</h2>
                                <p className="text-xs text-slate-500">
                                    {isHourly ? "Hourly activity" : "Daily activity"} for the selected period
                                </p>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                                {trends.length} data points
                            </span>
                        </div>
                        <TrendChart trends={trends} isHourly={isHourly} />
                    </div>

                    {/* Top Pages Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Top Performing Pages</h2>
                                <p className="text-xs text-slate-500">
                                    Public pages with highest visits (admin/internal pages excluded)
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="page-type-filter" className="text-xs text-slate-400">
                                    Type:
                                </label>
                                <select
                                    id="page-type-filter"
                                    value={pageTypeFilter}
                                    onChange={(e) => setPageTypeFilter(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                >
                                    <option value="all">All page types</option>
                                    <option value="home">Homepage</option>
                                    <option value="business">Business profiles</option>
                                    <option value="category">Categories</option>
                                    <option value="location">Locations</option>
                                    <option value="guide">Guides</option>
                                    <option value="place">Places</option>
                                    <option value="event">Events</option>
                                </select>
                            </div>
                        </div>

                        {topPages.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                                No page view data recorded for this filter range yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="px-6 py-3">Page Title & Path</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3 text-right">Views</th>
                                            <th className="px-4 py-3 text-right">Visitors</th>
                                            <th className="px-4 py-3 text-right">% of Total</th>
                                            <th className="px-6 py-3 text-right">Change</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {topPages.map((page) => (
                                            <tr key={page.pagePath} className="hover:bg-slate-50/60">
                                                <td className="px-6 py-3.5">
                                                    <div className="font-semibold text-slate-800">
                                                        {page.pageTitle || "Untitled"}
                                                    </div>
                                                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                                                        {page.pagePath}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                                                        {page.pageType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                                                    {formatNumber(page.views)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-slate-600">
                                                    {formatNumber(page.uniqueVisitors)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-slate-500">
                                                    {page.percentOfTotal}%
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <GrowthBadge value={page.change} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: BUSINESS DISCOVERY INSIGHTS */}
            {activeTab === "business" && (
                <div className="space-y-8">
                    {/* High-Intent Customer Actions Banner */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-2">
                            <h2 className="text-sm font-bold text-slate-900">High-Intent Customer Actions</h2>
                            <p className="text-xs text-slate-500">
                                Concrete customer conversion clicks on verified local businesses
                            </p>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                    Phone Calls Initiated
                                </span>
                                <p className="mt-2 text-2xl font-extrabold text-blue-900">
                                    {formatNumber(businessInsights?.ctaCounts?.phoneClicks || 0)}
                                </p>
                                <p className="mt-1 text-[11px] text-blue-700/80">
                                    Clicks on call buttons (Intent to dial)
                                </p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                    WhatsApp Inquiries
                                </span>
                                <p className="mt-2 text-2xl font-extrabold text-emerald-900">
                                    {formatNumber(businessInsights?.ctaCounts?.whatsappClicks || 0)}
                                </p>
                                <p className="mt-1 text-[11px] text-emerald-700/80">
                                    Direct chat conversations initiated
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                                    Map Directions Clicks
                                </span>
                                <p className="mt-2 text-2xl font-extrabold text-amber-900">
                                    {formatNumber(businessInsights?.ctaCounts?.directionsClicks || 0)}
                                </p>
                                <p className="mt-1 text-[11px] text-amber-700/80">
                                    Google Maps routing to physical shops
                                </p>
                            </div>
                            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                                    Website Clicks
                                </span>
                                <p className="mt-2 text-2xl font-extrabold text-purple-900">
                                    {formatNumber(businessInsights?.ctaCounts?.websiteClicks || 0)}
                                </p>
                                <p className="mt-1 text-[11px] text-purple-700/80">
                                    Outbound visits to business domains
                                </p>
                            </div>
                        </div>
                        <p className="mt-4 text-[11px] text-slate-400">
                            *Note: A click on a phone link is intent to call; it does not confirm a completed
                            phone conversation. A profile view represents local discovery interest.
                        </p>
                    </div>

                    {/* Most Viewed Businesses Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5 sm:p-6">
                            <h2 className="text-sm font-bold text-slate-900">Most Viewed Business Profiles</h2>
                            <p className="text-xs text-slate-500">
                                Businesses receiving the highest discovery attention across GaavConnect
                            </p>
                        </div>
                        {(!businessInsights?.topBusinesses ||
                            businessInsights.topBusinesses.length === 0) ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                                No business profile views recorded in this period yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="px-6 py-3">Business</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Location</th>
                                            <th className="px-4 py-3 text-right">Views</th>
                                            <th className="px-4 py-3 text-right">Visitors</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {businessInsights.topBusinesses.map((biz) => (
                                            <tr key={biz.slug} className="hover:bg-slate-50/60">
                                                <td className="px-6 py-3.5">
                                                    <div className="font-semibold text-slate-900">{biz.name}</div>
                                                    <div className="font-mono text-[11px] text-slate-400">
                                                        /{biz.slug}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-600">{biz.categoryName}</td>
                                                <td className="px-4 py-3.5 text-slate-600">{biz.locationName}</td>
                                                <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                                                    {formatNumber(biz.views)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-slate-600">
                                                    {formatNumber(biz.uniqueVisitors)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={`/businesses/${biz.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                        >
                                                            View Public ↗
                                                        </a>
                                                        {biz.businessId && (
                                                            <Link
                                                                href={`/admin/businesses`}
                                                                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                                                            >
                                                                Manage
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Search Analytics & Zero-Results Table */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-900">Top Search Queries</h2>
                            <p className="text-xs text-slate-500">
                                What users are actively searching for in the directory
                            </p>
                            {(!businessInsights?.searches || businessInsights.searches.length === 0) ? (
                                <p className="mt-4 text-xs text-slate-400">No searches recorded yet.</p>
                            ) : (
                                <div className="mt-4 divide-y divide-slate-100">
                                    {businessInsights.searches.map((s) => (
                                        <div
                                            key={s.query}
                                            className="flex items-center justify-between py-2.5 text-xs"
                                        >
                                            <span className="font-medium text-slate-800">“{s.query}”</span>
                                            <span className="font-bold text-slate-900">
                                                {formatNumber(s.count)} searches
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-900">
                                Zero-Result Searches (Unmet Demand)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Queries that returned 0 businesses — useful for onboarding new listings!
                            </p>
                            {(!businessInsights?.searches ||
                                businessInsights.searches.filter((s) => s.zeroResultsCount > 0).length ===
                                    0) ? (
                                <p className="mt-4 text-xs text-slate-400">
                                    No zero-result searches recorded yet.
                                </p>
                            ) : (
                                <div className="mt-4 divide-y divide-slate-100">
                                    {businessInsights.searches
                                        .filter((s) => s.zeroResultsCount > 0)
                                        .map((s) => (
                                            <div
                                                key={s.query}
                                                className="flex items-center justify-between py-2.5 text-xs"
                                            >
                                                <span className="font-medium text-rose-700">“{s.query}”</span>
                                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                                    {s.zeroResultsCount} no-result hits
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: SOURCES & DEVICES */}
            {activeTab === "tech" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Acquisition Sources */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900">Traffic Sources</h2>
                        <p className="text-xs text-slate-500">How visitors arrive on GaavConnect</p>
                        <div className="mt-4 space-y-3">
                            {(techInsights?.sources || []).map((s) => (
                                <div key={s.source} className="flex items-center justify-between text-xs">
                                    <span className="font-medium capitalize text-slate-700">{s.source}</span>
                                    <span className="font-bold text-slate-900">{formatNumber(s.count)}</span>
                                </div>
                            ))}
                            {(!techInsights?.sources || techInsights.sources.length === 0) && (
                                <p className="text-xs text-slate-400">No source data recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Top Referrers */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900">Top Referring Domains</h2>
                        <p className="text-xs text-slate-500">External domains linking to GaavConnect</p>
                        <div className="mt-4 space-y-3">
                            {(techInsights?.topReferrers || []).map((r) => (
                                <div key={r.hostname} className="flex items-center justify-between text-xs">
                                    <span className="font-mono text-slate-700">{r.hostname}</span>
                                    <span className="font-bold text-slate-900">{formatNumber(r.count)}</span>
                                </div>
                            ))}
                            {(!techInsights?.topReferrers || techInsights.topReferrers.length === 0) && (
                                <p className="text-xs text-slate-400">No external referrers recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Devices */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900">Device Breakdown</h2>
                        <p className="text-xs text-slate-500">Broad device categorization</p>
                        <div className="mt-4 space-y-3">
                            {(techInsights?.devices || []).map((d) => (
                                <div key={d.device} className="flex items-center justify-between text-xs">
                                    <span className="font-medium capitalize text-slate-700">{d.device}</span>
                                    <span className="font-bold text-slate-900">{formatNumber(d.count)}</span>
                                </div>
                            ))}
                            {(!techInsights?.devices || techInsights.devices.length === 0) && (
                                <p className="text-xs text-slate-400">No device data recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Browsers */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900">Browsers</h2>
                        <p className="text-xs text-slate-500">Visitor browser families</p>
                        <div className="mt-4 space-y-3">
                            {(techInsights?.browsers || []).map((b) => (
                                <div key={b.browser} className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-700">{b.browser}</span>
                                    <span className="font-bold text-slate-900">{formatNumber(b.count)}</span>
                                </div>
                            ))}
                            {(!techInsights?.browsers || techInsights.browsers.length === 0) && (
                                <p className="text-xs text-slate-400">No browser data recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Operating Systems */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900">Operating Systems</h2>
                        <p className="text-xs text-slate-500">Client platform families</p>
                        <div className="mt-4 space-y-3">
                            {(techInsights?.os || []).map((o) => (
                                <div key={o.os} className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-700">{o.os}</span>
                                    <span className="font-bold text-slate-900">{formatNumber(o.count)}</span>
                                </div>
                            ))}
                            {(!techInsights?.os || techInsights.os.length === 0) && (
                                <p className="text-xs text-slate-400">No OS data recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Coarse Geography */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900">Regional Insights</h2>
                        <p className="text-xs text-slate-500">Coarse cloud region (no GPS stored)</p>
                        <div className="mt-4 space-y-3">
                            {(techInsights?.regions || []).map((r) => (
                                <div
                                    key={`${r.region}-${r.country}`}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="font-medium text-slate-700">
                                        {r.region || "Unknown"} ({r.country || "IN"})
                                    </span>
                                    <span className="font-bold text-slate-900">{formatNumber(r.count)}</span>
                                </div>
                            ))}
                            {(!techInsights?.regions || techInsights.regions.length === 0) && (
                                <p className="text-xs text-slate-400">
                                    Coarse geolocation headers unavailable in local environment.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: GOOGLE SEARCH CONSOLE */}
            {activeTab === "gsc" && (
                <div className="max-w-4xl space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Google Search Console Integration
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Official search performance metrics from Google Organic SERP
                                </p>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    gscStatus?.configured
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                }`}
                            >
                                {gscStatus?.configured ? "Connected" : "Pending Credentials"}
                            </span>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">
                                Critical Distinction: Google Search vs Website Analytics
                            </p>
                            <ul className="mt-2 space-y-1 text-slate-600">
                                {(gscStatus?.setupGuide?.metricsDistinction || []).map((m, idx) => (
                                    <li key={idx}>{m}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                How to configure Google Search Console
                            </h3>
                            <ol className="mt-3 space-y-2 text-xs text-slate-600">
                                {(gscStatus?.setupGuide?.steps || []).map((s, idx) => (
                                    <li key={idx} className="flex gap-2">
                                        <span className="font-bold text-blue-600">{idx + 1}.</span>
                                        <span>{s.slice(3)}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
