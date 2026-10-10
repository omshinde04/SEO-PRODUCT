
"use client";

import Link from "next/link";

import { useCallback, useEffect, useState } from "react";
import StatCard from "../components/stat-card";
import StatusBadge from "../components/status-badge";
import PageHeader from "../components/page-header";
import LoadingState from "../components/loading-state";

const initialStats = {
    businesses: {
        total: 0,
        published: 0,
        drafts: 0,
        archived: 0,
        pendingVerification: 0,
    },
    categories: { total: 0, active: 0, inactive: 0 },
    locations: { total: 0, active: 0, inactive: 0 },
    places: { total: 0, published: 0 }, guides: { total: 0, published: 0 }, events: { total: 0, published: 0 }, submissions: { pending: 0 },
};

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getInitials(name) {
    return String(name || "Business")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function ErrorPanel({ message, onRetry }) {
    return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-rose-800">
                        Dashboard data could not be loaded
                    </p>
                    <p className="mt-1 text-sm leading-6 text-rose-700">
                        {message}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onRetry}
                    className="min-h-10 shrink-0 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}

function RecentBusinesses({ businesses, loading }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">
                        Recently added businesses
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        The latest business records in your database
                    </p>
                </div>
                <span className="w-fit rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    Latest 5 records
                </span>
            </div>

            {loading ? (
                <div className="space-y-4 p-6" aria-label="Loading businesses">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="flex animate-pulse items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-40 max-w-full rounded bg-slate-100" />
                                <div className="h-3 w-28 max-w-full rounded bg-slate-100" />
                            </div>
                            <div className="h-6 w-20 rounded-full bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : businesses.length === 0 ? (
                <div className="px-6 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="7" width="18" height="14" rx="2" />
                            <path d="M8 7V4h8v3M3 12h18" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-800">
                        No businesses yet
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                        When business records are added to the database, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70">
                                <th scope="col" className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Business
                                </th>
                                <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Category
                                </th>
                                <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Location
                                </th>
                                <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Added
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {businesses.map((business) => (
                                <tr key={business._id || business.slug} className="transition hover:bg-slate-50/70">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                                                {getInitials(business.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="max-w-52 truncate text-xs font-semibold text-slate-800">
                                                    {business.name || "Unnamed business"}
                                                </p>
                                                <p className="mt-1 max-w-52 truncate text-[11px] text-slate-400">
                                                    {business.slug ? `/${business.slug}` : "No slug"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-xs text-slate-600">
                                        {business.category?.name || "Uncategorized"}
                                    </td>
                                    <td className="px-4 py-4 text-xs text-slate-600">
                                        {business.location?.name || "Unknown"}
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={business.status} />
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-slate-500">
                                        {formatDate(business.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default function DashboardClient({ user }) {
    const [stats, setStats] = useState(initialStats);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/admin/dashboard/stats", {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: { Accept: "application/json" },
            });

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error("The server returned an invalid response.");
            }

            if (!response.ok || !data?.success) {
                throw new Error(
                    data?.message || "Unable to retrieve dashboard statistics."
                );
            }

            setStats({
                businesses: {
                    ...initialStats.businesses,
                    ...(data.stats?.businesses || {}),
                },
                categories: {
                    ...initialStats.categories,
                    ...(data.stats?.categories || {}),
                },
                locations: {
                    ...initialStats.locations,
                    ...(data.stats?.locations || {}),
                },
                places: { ...initialStats.places, ...(data.stats?.places || {}) },
                guides: { ...initialStats.guides, ...(data.stats?.guides || {}) },
                events: { ...initialStats.events, ...(data.stats?.events || {}) },
                submissions: { ...initialStats.submissions, ...(data.stats?.submissions || {}) },
            });

            setBusinesses(
                Array.isArray(data.recentBusinesses) ? data.recentBusinesses : []
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred."
            );
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        let cancelled = false;

        queueMicrotask(() => {
            if (!cancelled) {
                loadDashboard();
            }
        });

        return () => {
            cancelled = true;
        };
    }, [loadDashboard]);


    const statCards = [
        {
            title: "Total businesses",
            value: stats.businesses.total,
            description: `${stats.businesses.archived} archived records`,
            icon: "businesses",
            tone: "blue",
        },
        {
            title: "Published businesses",
            value: stats.businesses.published,
            description: "Currently published listings",
            icon: "published",
            tone: "green",
        },
        {
            title: "Draft businesses",
            value: stats.businesses.drafts,
            description: "Not yet published",
            icon: "drafts",
            tone: "amber",
        },
        {
            title: "Categories",
            value: stats.categories.total,
            description: `${stats.categories.active} active · ${stats.categories.inactive} inactive`,
            icon: "categories",
            tone: "violet",
        },
        {
            title: "Locations",
            value: stats.locations.total,
            description: `${stats.locations.active} active · ${stats.locations.inactive} inactive`,
            icon: "locations",
            tone: "slate",
        },
        { title: "Places", value: stats.places.total, description: stats.places.published + " published", icon: "locations", tone: "blue" },
        { title: "Guides", value: stats.guides.total, description: stats.guides.published + " published", icon: "categories", tone: "violet" },
        { title: "Events", value: stats.events.total, description: stats.events.published + " published", icon: "published", tone: "green" },
        { title: "Pending submissions", value: stats.submissions.pending, description: "Awaiting admin review", icon: "pending", tone: "amber" },
        {
            title: "Pending verification",
            value: stats.businesses.pendingVerification,
            description: "Businesses awaiting verification",
            icon: "pending",
            tone: "amber",
        },
    ];

    return (
        <main className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
                    <PageHeader
                        eyebrow="PLATFORM OVERVIEW"
                        title="Dashboard"
                        description="Monitor your listings, content structure, and verification workload from one place."
                        action={
                            <button
                                type="button"
                                onClick={loadDashboard}
                                disabled={loading}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                            >
                                <svg
                                    className={loading ? "animate-spin" : ""}
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M20 7v5h-5M4 17v-5h5" />
                                    <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
                                </svg>
                                Refresh data
                            </button>
                        }
                    />

                    {error ? (
                        <ErrorPanel message={error} onRetry={loadDashboard} />
                    ) : (
                        <>
                            <section aria-label="Platform statistics">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Platform statistics
                                    </h2>
                                    <span className="text-[11px] text-slate-400">
                                        {loading ? "Updating data…" : "Live database counts"}
                                    </span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {statCards.map((card) => (
                                        card.title === "Pending submissions" ? (
                                            <Link key={card.title} href="/admin/submissions" className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                                                <StatCard {...card} loading={loading} />
                                                <span className="sr-only">Open business submissions inbox</span>
                                            </Link>
                                        ) : (
                                            <StatCard
                                                key={card.title}
                                                {...card}
                                                loading={loading}
                                            />
                                        )
                                    ))}
                                </div>
                            </section>

                            <div className="mt-8">
                                <RecentBusinesses
                                    businesses={businesses}
                                    loading={loading}
                                />
                            </div>

                            <section className="mt-8">
                                <div className="mb-4">
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Management modules
                                    </h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        The navigation shows planned modules; unavailable modules remain disabled until implemented.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {[
                                        {
                                            title: "Business management",
                                            description: "Listings, publication status, verification, and business profiles.",
                                            number: "01",
                                        },
                                        {
                                            title: "Location & categories",
                                            description: "Organize the platform's local discovery structure.",
                                            number: "02",
                                        },
                                        {
                                            title: "Central SEO engine",
                                            description: "Global SEO settings, reusable templates, and page-level overrides.",
                                            number: "03",
                                        },
                                    ].map((item) => (
                                        <article
                                            key={item.number}
                                            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                                    {item.number}
                                                </span>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                                    Planned
                                                </span>
                                            </div>
                                            <h3 className="mt-4 text-sm font-bold text-slate-900">
                                                {item.title}
                                            </h3>
                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                {item.description}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    <section className="mt-8">
                        <h2 className="mb-3 text-sm font-bold text-slate-900">Quick actions</h2>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {[
                                ["Add business", "/admin/businesses"],
                                ["Add place", "/admin/places"],
                                ["Write guide", "/admin/guides"],
                                ["Add event", "/admin/events"],
                                ["Review submissions", "/admin/submissions"],
                            ].map(([label, href]) => (
                                <Link key={href} href={href} className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">{label} <span aria-hidden="true">→</span></Link>
                            ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                            <Link href="/admin/analytics" className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">Website Analytics</Link>
                            <Link href="/admin/media" className="rounded-lg border bg-white px-4 py-3 text-sm font-medium">Media library</Link>
                            <Link href="/admin/seo" className="rounded-lg border bg-white px-4 py-3 text-sm font-medium">SEO settings</Link>
                            <Link href="/admin/seo-templates" className="rounded-lg border bg-white px-4 py-3 text-sm font-medium">SEO templates</Link>
                        </div>
                    </section>

                    <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200/80 py-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <p>SEO-PRODUCT · Admin workspace</p>
                        <p>Signed in as {user?.email || "Administrator"}</p>
                    </footer>
        </main>
    );
}
