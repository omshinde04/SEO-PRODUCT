"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/page-header";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
    { id: "", label: "All Requests", countKey: "total" },
    { id: "pending", label: "Pending Review", countKey: "pending" },
    { id: "active", label: "Active Ads", countKey: "active" },
    { id: "reviewing", label: "Under Review", countKey: "underReview" },
    { id: "paused", label: "Paused", countKey: "paused" },
    { id: "rejected", label: "Rejected", countKey: "rejected" },
    { id: "completed", label: "Completed", countKey: "completed" },
];

const PLAN_LABELS = {
    starter_7: { label: "7-Day Starter", days: 7, badge: "bg-blue-50 text-blue-700 border-blue-200" },
    growth_14: { label: "14-Day Growth", days: 14, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    spotlight_30: { label: "30-Day Spotlight", days: 30, badge: "bg-amber-50 text-amber-700 border-amber-200" },
    custom: { label: "Custom Plan", days: 14, badge: "bg-purple-50 text-purple-700 border-purple-200" },
};

/**
 * Safely extracts a display string from primitives, or populated objects like {_id, name, slug}
 */
function getLabel(val, fallback = "") {
    if (!val) return fallback;
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    if (typeof val === "object") {
        if (typeof val.name === "string" && val.name) return val.name;
        if (typeof val.title === "string" && val.title) return val.title;
        if (typeof val.slug === "string" && val.slug) return val.slug;
        if (val._id) return String(val._id);
    }
    return fallback;
}

function formatBudget(val) {
    if (!val) return "";
    const clean = String(val).trim();
    if (clean.startsWith("₹")) return clean;
    return `₹${clean}`;
}

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

function StatusBadge({ status }) {
    const styles = {
        pending: "bg-amber-50 text-amber-700 ring-amber-200",
        reviewing: "bg-blue-50 text-blue-700 ring-blue-200",
        active: "bg-emerald-50 text-emerald-700 ring-emerald-300 font-bold",
        paused: "bg-orange-50 text-orange-700 ring-orange-300 font-bold",
        rejected: "bg-rose-50 text-rose-700 ring-rose-200",
        completed: "bg-slate-100 text-slate-700 ring-slate-200",
    };
    const labels = {
        pending: "Pending Review",
        reviewing: "In Review",
        active: "Active Ad",
        paused: "⏸ Paused Ad",
        rejected: "Rejected",
        completed: "Completed",
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles[status] || styles.pending}`}
        >
            {status === "active" && (
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
            )}
            {labels[status] || status}
        </span>
    );
}

function StatCard({ label, value, tone = "slate", icon = "📊" }) {
    const tones = {
        amber: "bg-amber-50/80 border-amber-200 text-amber-900",
        emerald: "bg-emerald-50/80 border-emerald-200 text-emerald-900",
        blue: "bg-blue-50/80 border-blue-200 text-blue-900",
        slate: "bg-slate-50 border-slate-200 text-slate-900",
    };
    const badgeTones = {
        amber: "bg-amber-100 text-amber-800",
        emerald: "bg-emerald-100 text-emerald-800",
        blue: "bg-blue-100 text-blue-800",
        slate: "bg-slate-200 text-slate-700",
    };

    return (
        <div className={`rounded-2xl border p-4.5 shadow-sm transition hover:shadow-md ${tones[tone]}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
                <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${badgeTones[tone]}`}>
                    <span>{icon}</span>
                    <span>METRIC</span>
                </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
        </div>
    );
}

export default function PromotionsAdminClient() {
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({ pending: 0, reviewing: 0, active: 0, rejected: 0, paused: 0, completed: 0, underReview: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });

    // Modal state for Reviewing & Setting up Ads
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [businessesList, setBusinessesList] = useState([]);

    // Modal Edit Fields
    const [editStatus, setEditStatus] = useState("active");
    const [editBusinessId, setEditBusinessId] = useState("");
    const [editTagline, setEditTagline] = useState("");
    const [editBadge, setEditBadge] = useState("✦ Sponsored");
    const [editPriority, setEditPriority] = useState(10);
    const [editDays, setEditDays] = useState(7);
    const [editNotes, setEditNotes] = useState("");

    // Load available businesses for manual linking
    const loadBusinesses = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/businesses?status=published&limit=100");
            const data = await res.json();
            if (data?.items) {
                setBusinessesList(data.items);
            }
        } catch {
            // Ignore error
        }
    }, []);

    const fetchPromotions = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_SIZE),
            });
            if (statusFilter) params.set("status", statusFilter);
            if (searchTerm.trim()) params.set("q", searchTerm.trim());

            const res = await fetch(`/api/admin/promotions?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to load promotion requests");
            const data = await res.json();
            setItems(data.items || []);
            setSummary(data.summary || { pending: 0, reviewing: 0, active: 0, rejected: 0, paused: 0, completed: 0, underReview: 0, total: 0 });
            setPagination(data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
        } catch (err) {
            setError(err.message || "Failed to load promotions");
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchTerm]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchPromotions();
            void loadBusinesses();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [fetchPromotions, loadBusinesses]);

    const openReviewModal = (item) => {
        setSelectedItem(item);
        setEditStatus(item.status);
        setEditBusinessId(item.business?._id || item.business || "");
        setEditTagline(item.promotionalHeadline || item.business?.sponsoredTagline || "");
        setEditBadge(item.sponsoredBadge || "✦ Sponsored");
        setEditPriority(item.priority || 10);
        const planConfig = PLAN_LABELS[item.plan] || PLAN_LABELS.starter_7;
        setEditDays(planConfig.days || 7);
        setEditNotes(item.adminNotes || "");
    };

    const handleAction = async (actionType, customPayload = null) => {
        if (!selectedItem) return;
        setSubmitting(true);
        setError("");
        setNotice("");

        try {
            let payload = {};
            if (customPayload) {
                payload = customPayload;
            } else if (actionType === "approve_active" || actionType === "resume") {
                const start = new Date();
                const end = new Date();
                end.setDate(end.getDate() + Number(editDays || 7));
                payload = {
                    status: "active",
                    businessId: editBusinessId || undefined,
                    sponsoredTagline: editTagline.trim(),
                    sponsoredBadge: editBadge.trim(),
                    priority: Number(editPriority || 10),
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    adminNotes: editNotes.trim(),
                };
            } else if (actionType === "update_active") {
                payload = {
                    businessId: editBusinessId || undefined,
                    sponsoredTagline: editTagline.trim(),
                    sponsoredBadge: editBadge.trim(),
                    priority: Number(editPriority || 10),
                    adminNotes: editNotes.trim(),
                };
            } else if (actionType === "pause") {
                payload = {
                    status: "paused",
                    adminNotes: editNotes.trim(),
                };
            } else if (actionType === "move_reviewing") {
                payload = {
                    status: "reviewing",
                    adminNotes: editNotes.trim(),
                };
            } else if (actionType === "reject") {
                payload = {
                    status: "rejected",
                    adminNotes: editNotes.trim(),
                };
            } else if (actionType === "complete") {
                payload = {
                    status: "completed",
                    adminNotes: editNotes.trim(),
                };
            } else {
                payload = {
                    status: editStatus,
                    businessId: editBusinessId || undefined,
                    sponsoredTagline: editTagline.trim(),
                    sponsoredBadge: editBadge.trim(),
                    priority: Number(editPriority || 0),
                    adminNotes: editNotes.trim(),
                };
            }

            const res = await fetch(`/api/admin/promotions/${selectedItem._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update promotion");

            const noticeText =
                actionType === "approve_active" || actionType === "resume"
                    ? "🎉 Promotion activated! The business is now prominently displayed as a Sponsored Ad on the public website."
                    : actionType === "pause"
                    ? "⏸ Ad paused successfully. Sponsored placement is temporarily disabled on the public site."
                    : actionType === "reject"
                    ? "Ad request marked as rejected."
                    : "Promotion updated successfully.";

            setNotice(noticeText);
            setSelectedItem(null);
            fetchPromotions();
        } catch (err) {
            setError(err.message || "Action failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this promotion request?")) return;
        try {
            const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setNotice("Promotion request deleted.");
            if (selectedItem?._id === id) setSelectedItem(null);
            fetchPromotions();
        } catch (err) {
            setError(err.message || "Failed to delete");
        }
    };

    // Calculate dates helper for modal preview
    const previewEndDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + Number(editDays || 7));
        return formatDate(d);
    }, [editDays]);

    return (
        <main className="min-h-[calc(100vh-76px)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
            <div className="mx-auto max-w-[1440px] space-y-6">
                {/* Admin Breadcrumb */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <Link href="/admin/dashboard" className="transition hover:text-blue-600">
                        Dashboard
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-600">Monetization &amp; Sponsored Ads</span>
                </div>

                <PageHeader
                    eyebrow="MONETIZATION & ADS ENGINE"
                    title="Promotions & Sponsored Ads"
                    description="Review promotion requests from local businesses and manage high-visibility sponsored ad placements across GaavConnect."
                    action={
                        <a
                            href="/promote"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                        >
                            <span>✦ Public Ad Request Form</span>
                            <span>↗</span>
                        </a>
                    }
                />

                {/* Notification alert */}
                {notice && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4.5 py-3.5 text-sm font-medium text-emerald-800 shadow-sm">
                        <span className="flex items-center gap-2">
                            <span>✅</span>
                            <span>{notice}</span>
                        </span>
                        <button type="button" onClick={() => setNotice("")} className="text-emerald-600 hover:text-emerald-950 font-bold">
                            ✕
                        </button>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4.5 py-3.5 text-sm font-medium text-rose-800 shadow-sm">
                        <span className="flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </span>
                        <button type="button" onClick={() => setError("")} className="text-rose-600 hover:text-rose-950 font-bold">
                            ✕
                        </button>
                    </div>
                )}

                {/* Top Metric Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4.5">
                    <StatCard label="Pending Review" value={summary.pending} tone="amber" icon="⏳" />
                    <StatCard label="Active Sponsored Ads" value={summary.active} tone="emerald" icon="🚀" />
                    <StatCard label="Under Review / Paused" value={summary.underReview} tone="blue" icon="⏸" />
                    <StatCard label="Total Received" value={summary.total} tone="slate" icon="📊" />
                </div>

                {/* Filter & Controls Bar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm space-y-3.5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Search box */}
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Search business name, owner, phone, area, or headline..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setPage(1);
                                    }}
                                    className="absolute right-3 top-3 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Quick Action Refresh */}
                        <button
                            type="button"
                            onClick={() => fetchPromotions()}
                            disabled={loading}
                            className="inline-flex h-10.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <span className={loading ? "animate-spin" : ""}>↻</span>
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        {STATUS_FILTERS.map((f) => {
                            const count = summary[f.countKey] ?? 0;
                            const isActive = statusFilter === f.id;
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(f.id);
                                        setPage(1);
                                    }}
                                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                                        isActive
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    <span>{f.label}</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                            isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* List / Table */}
                {loading ? (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                            <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Loading promotion requests...
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xl font-bold">
                            ✦
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">No promotion requests found</h3>
                        <p className="mt-1 max-w-sm text-xs text-slate-500">
                            {statusFilter
                                ? `There are no requests matching this filter. Try selecting "All Requests".`
                                : "Promotion requests submitted from the public site will appear here for review and activation."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Desktop View Table */}
                        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Business &amp; Target</th>
                                        <th className="px-6 py-4">Package &amp; Offer</th>
                                        <th className="px-6 py-4">Contact Details</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Schedule</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {items.map((item) => {
                                        const plan = PLAN_LABELS[item.plan] || PLAN_LABELS.starter_7;
                                        const targetArea = getLabel(item.targetLocation, item.targetLocationName || "");
                                        const targetCat = getLabel(item.targetCategory, item.targetCategoryName || "");

                                        return (
                                            <tr key={item._id} className="transition hover:bg-slate-50/60">
                                                {/* Column 1: Business & Target */}
                                                <td className="px-6 py-4.5">
                                                    <div className="font-bold text-slate-900 text-sm">
                                                        {item.businessName}
                                                    </div>

                                                    {/* Target Location & Category Chips */}
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                        {targetArea && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                                                <span>📍</span>
                                                                <span>{targetArea}</span>
                                                            </span>
                                                        )}
                                                        {targetCat && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                                <span>🏷️</span>
                                                                <span>{targetCat}</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Linked Business Listing Indicator */}
                                                    <div className="mt-2">
                                                        {item.business ? (
                                                            <Link
                                                                href={`/businesses/${item.business.slug || item.business._id}`}
                                                                target="_blank"
                                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                                                            >
                                                                <span>✓ Linked Listing</span>
                                                                <span>↗</span>
                                                            </Link>
                                                        ) : (
                                                            <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                                                ⚠️ Needs listing link
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Column 2: Package & Offer */}
                                                <td className="px-6 py-4.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${plan.badge}`}>
                                                            {plan.label}
                                                        </span>
                                                        {item.budget && (
                                                            <span className="text-[11px] font-semibold text-slate-600">
                                                                {formatBudget(item.budget)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {item.promotionalHeadline && (
                                                        <p className="mt-2 line-clamp-2 max-w-xs rounded-lg bg-amber-50/80 p-2 text-[11px] font-medium text-amber-900 border border-amber-200/60">
                                                            “{item.promotionalHeadline}”
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Column 3: Contact */}
                                                <td className="px-6 py-4.5">
                                                    <p className="font-semibold text-slate-900">{item.contactName || "—"}</p>
                                                    <div className="mt-1.5 flex items-center gap-2.5">
                                                        <a href={`tel:${item.phone}`} className="text-slate-600 hover:text-blue-600 font-medium">
                                                            📞 {item.phone}
                                                        </a>
                                                        {item.whatsapp && (
                                                            <a
                                                                href={`https://wa.me/${item.whatsapp.replace(/[^0-9]/g, "")}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-emerald-700 font-bold hover:underline"
                                                            >
                                                                💬 WA
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-400">{item.email}</p>
                                                </td>

                                                {/* Column 4: Status */}
                                                <td className="px-6 py-4.5">
                                                    <StatusBadge status={item.status} />
                                                </td>

                                                {/* Column 5: Schedule */}
                                                <td className="px-6 py-4.5">
                                                    {item.status === "active" && item.startDate ? (
                                                        <div>
                                                            <p className="font-semibold text-emerald-700">
                                                                Active until: {formatDate(item.endDate)}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                Started: {formatDate(item.startDate)}
                                                            </p>
                                                        </div>
                                                    ) : item.status === "paused" ? (
                                                        <div>
                                                            <p className="font-semibold text-orange-700">Currently Paused</p>
                                                            <p className="text-[10px] text-slate-400">Ready to resume</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-400">Requested: {formatDate(item.createdAt)}</p>
                                                    )}
                                                </td>

                                                {/* Column 6: Actions */}
                                                <td className="px-6 py-4.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openReviewModal(item)}
                                                            className="rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-sm"
                                                        >
                                                            Review &amp; Setup
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item._id)}
                                                            className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                                            title="Delete request"
                                                        >
                                                            🗑
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile & Tablet Card View */}
                        <div className="grid grid-cols-1 gap-3.5 lg:hidden">
                            {items.map((item) => {
                                const plan = PLAN_LABELS[item.plan] || PLAN_LABELS.starter_7;
                                const targetArea = getLabel(item.targetLocation, item.targetLocationName || "");

                                return (
                                    <div
                                        key={item._id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{item.businessName}</h4>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${plan.badge}`}>
                                                        {plan.label}
                                                    </span>
                                                    <StatusBadge status={item.status} />
                                                    {targetArea && (
                                                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                                            📍 {targetArea}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openReviewModal(item)}
                                                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                                            >
                                                Review
                                            </button>
                                        </div>

                                        {item.promotionalHeadline && (
                                            <div className="mt-3 rounded-xl bg-amber-50/80 p-2.5 text-xs font-medium text-amber-900 border border-amber-200/60">
                                                “{item.promotionalHeadline}”
                                            </div>
                                        )}

                                        <div className="mt-3.5 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                            <div>
                                                <span className="font-semibold text-slate-700">{item.contactName}</span> · {item.phone}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {formatDate(item.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                                <span className="text-xs text-slate-500 font-medium">
                                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={pagination.page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={pagination.page >= pagination.pages}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Review & Activation Modal */}
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
                        <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">
                                            PROMOTION ACTION
                                        </span>
                                        <StatusBadge status={selectedItem.status} />
                                    </div>
                                    <h3 className="mt-1.5 text-lg font-bold text-slate-950">
                                        Review: {selectedItem.businessName}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedItem(null)}
                                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Status context alert inside modal */}
                            {selectedItem.status === "paused" && (
                                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-medium text-orange-900">
                                    ⏸ <strong>This ad is currently PAUSED.</strong> It is currently not showing with the sponsored badge on the public site. You can resume it anytime below.
                                </div>
                            )}

                            {selectedItem.status === "active" && (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">
                                    🚀 <strong>This ad is currently ACTIVE on GaavConnect.</strong> Active until: <strong>{formatDate(selectedItem.endDate)}</strong>.
                                </div>
                            )}

                            {/* Request Summary details */}
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                                <div>
                                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Owner / Contact</span>
                                    <p className="mt-0.5 font-bold text-slate-900">{selectedItem.contactName || "—"}</p>
                                    <p className="text-slate-500">Phone: {selectedItem.phone}</p>
                                    <p className="text-slate-500">Email: {selectedItem.email || "—"}</p>
                                </div>
                                <div>
                                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Package &amp; Target</span>
                                    <p className="mt-0.5 font-bold text-slate-900">
                                        {PLAN_LABELS[selectedItem.plan]?.label || selectedItem.plan}
                                    </p>
                                    <p className="text-slate-500">Budget: {selectedItem.budget ? formatBudget(selectedItem.budget) : "Not specified"}</p>
                                    <p className="text-slate-500">
                                        Target Area: <strong>{getLabel(selectedItem.targetLocation, selectedItem.targetLocationName || "All areas")}</strong>
                                    </p>
                                    <p className="text-slate-500">
                                        Category: <strong>{getLabel(selectedItem.targetCategory, selectedItem.targetCategoryName || "General")}</strong>
                                    </p>
                                </div>
                                {selectedItem.message && (
                                    <div className="sm:col-span-2">
                                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">User Notes / Message</span>
                                        <p className="mt-0.5 text-slate-700 italic">“{selectedItem.message}”</p>
                                    </div>
                                )}
                            </div>

                            {/* Match with Business Listing */}
                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800">
                                        Link to Published Business Listing *
                                    </label>
                                    <p className="text-[11px] text-slate-500 mb-1.5">
                                        Attaching this request to the listing activates the sponsored badge and elevates its ranking across category and home pages.
                                    </p>
                                    <select
                                        value={editBusinessId}
                                        onChange={(e) => setEditBusinessId(e.target.value)}
                                        className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">— Select a published business listing —</option>
                                        {businessesList.map((b) => {
                                            const catName = getLabel(b.category) || getLabel(b.primaryCategory) || "General";
                                            const locName = getLabel(b.location) || getLabel(b.primaryLocation) || b.city || "Nashik";
                                            return (
                                                <option key={b._id} value={b._id}>
                                                    {b.name} ({catName} · {locName})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Promotional Headline / Offer */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800">
                                        Promotional Offer / Tagline (Social-Ad Headline)
                                    </label>
                                    <p className="text-[11px] text-slate-500 mb-1.5">
                                        This offer line is prominently highlighted on the business card with special sponsored styling.
                                    </p>
                                    <input
                                        type="text"
                                        value={editTagline}
                                        onChange={(e) => setEditTagline(e.target.value)}
                                        placeholder="e.g. 🔥 Weekend Special: Flat 20% Off on Family Dinners!"
                                        className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* Ad Duration & Priority */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-800">Duration (Days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={editDays}
                                            onChange={(e) => setEditDays(e.target.value)}
                                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                                        />
                                        <span className="text-[10px] text-slate-500">Until ~ {previewEndDate}</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-800">Sponsored Badge</label>
                                        <input
                                            type="text"
                                            value={editBadge}
                                            onChange={(e) => setEditBadge(e.target.value)}
                                            placeholder="✦ Sponsored"
                                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-800">Placement Priority</label>
                                        <input
                                            type="number"
                                            value={editPriority}
                                            onChange={(e) => setEditPriority(e.target.value)}
                                            placeholder="10"
                                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                                        />
                                        <span className="text-[10px] text-slate-500">Higher = displayed first</span>
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800">Admin Internal Notes</label>
                                    <textarea
                                        rows="2"
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        placeholder="Payment received via UPI, promo scheduled..."
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Live Ad Mockup Preview */}
                                <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-4">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                        <span className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                                            <span>✨</span> Public Ad Live Preview
                                        </span>
                                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                            {editBadge || "✦ Sponsored"}
                                        </span>
                                    </div>
                                    <div className="mt-2.5 rounded-xl bg-white p-3.5 shadow-sm border border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900 text-sm">{selectedItem.businessName}</p>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                Top Ranked Ad
                                            </span>
                                        </div>
                                        <div className="mt-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-2.5 text-xs font-bold text-amber-900">
                                            {editTagline || selectedItem.promotionalHeadline || "Special Promotion Available!"}
                                        </div>
                                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Target: {getLabel(selectedItem.targetLocation, selectedItem.targetLocationName || "Nashik Region")}</span>
                                            <span className="font-semibold text-blue-600">Call / WhatsApp Direct</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Action Buttons: Full Scenario Handling */}
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => handleAction("reject")}
                                        className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                    >
                                        Reject Request
                                    </button>

                                    {selectedItem.status === "active" ? (
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleAction("pause")}
                                            className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100 disabled:opacity-50"
                                        >
                                            ⏸ Pause Ad
                                        </button>
                                    ) : selectedItem.status === "paused" ? (
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleAction("move_reviewing")}
                                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                        >
                                            Move to In Review
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleAction("move_reviewing")}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Move to In Review
                                        </button>
                                    )}

                                    {selectedItem.status !== "completed" && (
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleAction("complete")}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItem(null)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>

                                    {selectedItem.status === "active" ? (
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleAction("update_active")}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4.5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {submitting ? "Saving..." : "💾 Save Live Ad Changes"}
                                        </button>
                                    ) : selectedItem.status === "paused" ? (
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleAction("resume")}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4.5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {submitting ? "Resuming..." : "▶️ Resume & Activate Ad"}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleAction("approve_active")}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4.5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {submitting ? "Activating..." : "🚀 Approve & Activate Sponsored Ad"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
