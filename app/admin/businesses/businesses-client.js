"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BusinessForm from "./business-form";
import StatusBadge from "../components/status-badge";
import PageHeader from "../components/page-header";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
    ["", "All statuses"],
    ["published", "Published"],
    ["draft", "Draft"],
    ["archived", "Archived"],
];
const VERIFICATION_OPTIONS = [
    ["", "All verification"],
    ["verified", "Verified"],
    ["pending", "Pending"],
    ["unverified", "Unverified"],
    ["rejected", "Rejected"],
];
const FEATURED_OPTIONS = [
    ["", "All listings"],
    ["true", "Featured only"],
    ["false", "Not featured"],
];
const TYPE_OPTIONS = [
    ["", "All types"],
    ["business", "General business"],
    ["restaurant", "Restaurant"],
    ["hotel", "Hotel"],
    ["professional_service", "Professional service"],
    ["healthcare", "Healthcare"],
    ["retail", "Retail"],
    ["tourism", "Tourism"],
    ["attraction", "Attraction"],
    ["guide", "Guide"],
    ["event_venue", "Event venue"],
    ["other", "Other"],
];

const controlClass =
    "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const buttonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

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

function initials(name) {
    return String(name || "Business")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function getErrorMessage(data, fallback) {
    return typeof data?.message === "string" && data.message.trim()
        ? data.message
        : fallback;
}

export default function BusinessesClient() {
    const [businesses, setBusinesses] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [verificationStatus, setVerificationStatus] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [featured, setFeatured] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [busyId, setBusyId] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(query.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const loadBusinesses = useCallback(async ({ signal } = {}) => {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
            page: String(page),
            limit: String(PAGE_SIZE),
        });
        if (search) params.set("q", search);
        if (status) params.set("status", status);
        if (verificationStatus) params.set("verificationStatus", verificationStatus);
        if (businessType) params.set("businessType", businessType);
        if (featured) params.set("featured", featured);

        try {
            const response = await fetch(`/api/admin/businesses?${params.toString()}`, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                signal,
            });
            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                throw new Error(getErrorMessage(data, "Unable to load businesses."));
            }

            setBusinesses(Array.isArray(data.items) ? data.items : []);
            setPagination(data.pagination || {
                page,
                limit: PAGE_SIZE,
                total: Array.isArray(data.items) ? data.items.length : 0,
                totalPages: 1,
            });
        } catch (fetchError) {
            if (fetchError?.name !== "AbortError") {
                setError(fetchError.message || "Unable to load businesses.");
                setBusinesses([]);
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [page, search, status, verificationStatus, businessType, featured]);

    useEffect(() => {
        const controller = new AbortController();
        loadBusinesses({ signal: controller.signal });
        return () => controller.abort();
    }, [loadBusinesses]);

    const summary = useMemo(() => ({
        shown: businesses.length,
        total: pagination.total || 0,
        currentPage: pagination.page || page,
        totalPages: pagination.totalPages || 0,
    }), [businesses.length, pagination, page]);

    function openCreateForm() {
        setEditingBusiness(null);
        setNotice("");
        setFormOpen(true);
    }

    async function openEditForm(business) {
        setBusyId(business._id);
        setError("");
        setNotice("");
        try {
            const response = await fetch(`/api/admin/businesses/${business._id}`, {
                credentials: "same-origin",
                cache: "no-store",
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) {
                throw new Error(getErrorMessage(data, "Unable to load this business."));
            }
            setEditingBusiness(data.item || business);
            setFormOpen(true);
        } catch (fetchError) {
            setError(fetchError.message || "Unable to load this business.");
        } finally {
            setBusyId("");
        }
    }

    async function archiveBusiness(business) {
        const confirmed = window.confirm(
            `Archive "${business.name}"? This keeps the record in the database but removes it from active listings.`
        );
        if (!confirmed) return;

        setBusyId(business._id);
        setError("");
        setNotice("");
        try {
            const response = await fetch(`/api/admin/businesses/${business._id}`, {
                method: "DELETE",
                credentials: "same-origin",
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) {
                throw new Error(getErrorMessage(data, "Unable to archive this business."));
            }
            setNotice(data.message || "Business archived successfully.");
            await loadBusinesses();
        } catch (archiveError) {
            setError(archiveError.message || "Unable to archive this business.");
        } finally {
            setBusyId("");
        }
    }

    async function handleSaved(message) {
        setFormOpen(false);
        setEditingBusiness(null);
        setNotice(message);
        setPage(1);
        if (page === 1) {
            await loadBusinesses();
        }
    }

    function clearFilters() {
        setQuery("");
        setSearch("");
        setStatus("");
        setVerificationStatus("");
        setBusinessType("");
        setFeatured("");
        setPage(1);
    }

    return (
        <div className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            <PageHeader
                eyebrow="DIRECTORY MANAGEMENT"
                title="Businesses"
                description="Create, update, publish, and organize business listings for your local discovery platform."
                action={
                    <button type="button" onClick={openCreateForm} className={`${buttonClass} bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20`}>
                        <span aria-hidden="true" className="text-lg leading-none">+</span>
                        Add business
                    </button>
                }
            />

            {notice && (
                <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <span>{notice}</span>
                    <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message" className="font-semibold text-emerald-700">×</button>
                </div>
            )}
            {error && (
                <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-rose-800">{error}</p>
                    <button type="button" onClick={() => loadBusinesses()} disabled={loading} className={`${buttonClass} border border-rose-200 bg-white text-rose-700 hover:bg-rose-100`}>Try again</button>
                </div>
            )}

            <section aria-label="Business listing statistics" className="mb-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Total matching businesses</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{loading ? "…" : summary.total.toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Current page</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{loading ? "…" : `${summary.currentPage} / ${Math.max(summary.totalPages, 1)}`}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Records shown</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{loading ? "…" : summary.shown.toLocaleString("en-IN")}</p>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
                <div className="border-b border-slate-100 p-4 sm:p-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(135px,1fr))_auto]">
                        <label className="relative block">
                            <span className="sr-only">Search businesses</span>
                            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                            <input type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, slug, city…" className={`${controlClass} pl-9`} />
                        </label>
                        <label>
                            <span className="sr-only">Filter by status</span>
                            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={controlClass}>
                                {STATUS_OPTIONS.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className="sr-only">Filter by verification</span>
                            <select value={verificationStatus} onChange={(event) => { setVerificationStatus(event.target.value); setPage(1); }} className={controlClass}>
                                {VERIFICATION_OPTIONS.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className="sr-only">Filter by business type</span>
                            <select value={businessType} onChange={(event) => { setBusinessType(event.target.value); setPage(1); }} className={controlClass}>
                                {TYPE_OPTIONS.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className="sr-only">Filter by featured status</span>
                            <select value={featured} onChange={(event) => { setFeatured(event.target.value); setPage(1); }} className={controlClass}>
                                {FEATURED_OPTIONS.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
                            </select>
                        </label>
                        <button type="button" onClick={clearFilters} className={`${buttonClass} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>Clear</button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">Search updates automatically. Use filters to narrow your results.</p>
                        <button type="button" onClick={() => loadBusinesses()} disabled={loading} className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
                            <span aria-hidden="true" className={loading ? "animate-spin" : ""}>↻</span> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4 p-6" aria-label="Loading businesses">
                        {[1, 2, 3, 4, 5].map((item) => <div key={item} className="flex animate-pulse items-center gap-4"><div className="h-10 w-10 rounded-xl bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 w-52 max-w-full rounded bg-slate-100" /><div className="h-3 w-32 max-w-full rounded bg-slate-100" /></div><div className="h-7 w-20 rounded-full bg-slate-100" /></div>)}
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200" aria-hidden="true">▦</div>
                        <h2 className="mt-4 text-sm font-semibold text-slate-900">{search || status || verificationStatus || businessType || featured ? "No matching businesses" : "No businesses yet"}</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{search || status || verificationStatus || businessType || featured ? "Try changing your search or filters." : "Add your first business listing to start building the directory."}</p>
                        {(search || status || verificationStatus || businessType || featured) ? (
                            <button type="button" onClick={clearFilters} className={`${buttonClass} mt-4 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>Clear filters</button>
                        ) : (
                            <button type="button" onClick={openCreateForm} className={`${buttonClass} mt-4 bg-blue-600 text-white hover:bg-blue-700`}>Add business</button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left">
                            <thead className="bg-slate-50/80">
                                <tr className="border-b border-slate-100">
                                    <th scope="col" className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Business</th>
                                    <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                                    <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</th>
                                    <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                                    <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Verification</th>
                                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Added</th>
                                    <th scope="col" className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {businesses.map((business) => (
                                    <tr key={business._id} className="transition hover:bg-slate-50/70">
                                        <td className="px-5 py-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {business.logo?.url ? <img src={business.logo.url} alt={business.logo.alt || ""} className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{initials(business.name)}</div>}
                                                <div className="min-w-0">
                                                    <p className="max-w-56 truncate text-xs font-semibold text-slate-800">{business.name || "Unnamed business"}</p>
                                                    <p className="mt-1 max-w-56 truncate text-[11px] text-slate-400">/{business.slug || "no-slug"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{business.category?.name || "Uncategorized"}</td>
                                        <td className="px-4 py-4 text-xs text-slate-600">{business.location?.name || "Unknown"}</td>
                                        <td className="px-4 py-4"><StatusBadge status={business.status} /></td>
                                        <td className="px-4 py-4"><StatusBadge status={business.verificationStatus} /></td>
                                        <td className="px-4 py-4">{business.isFeatured ? <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">Featured</span> : <span className="text-xs text-slate-400">—</span>}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs text-slate-500">{formatDate(business.createdAt)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openEditForm(business)} disabled={Boolean(busyId)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" aria-label={`Edit ${business.name}`}>{busyId === business._id ? "Loading…" : "Edit"}</button>
                                                {business.status !== "archived" && <button type="button" onClick={() => archiveBusiness(business)} disabled={Boolean(busyId)} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50" aria-label={`Archive ${business.name}`}>Archive</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-xs text-slate-500">{loading ? "Loading records…" : `Showing ${summary.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, summary.total)} of ${summary.total.toLocaleString("en-IN")} businesses`}</p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || page <= 1} className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>Previous</button>
                        <span className="min-w-20 text-center text-xs font-medium text-slate-600">Page {page} of {Math.max(summary.totalPages, 1)}</span>
                        <button type="button" onClick={() => setPage((current) => current + 1)} disabled={loading || page >= summary.totalPages} className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>Next</button>
                    </div>
                </footer>
            </section>

            {formOpen && (
                <BusinessForm
                    key={editingBusiness?._id || "new-business"}
                    business={editingBusiness}
                    onClose={() => { setFormOpen(false); setEditingBusiness(null); }}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
