"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/page-header";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
    ["", "All statuses"], ["pending", "Pending review"], ["reviewing", "In review"],
    ["approved", "Approved"], ["rejected", "Rejected"],
];
const controlClass = "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function StatusBadge({ status }) {
    const styles = {
        pending: "bg-amber-50 text-amber-700 ring-amber-200",
        reviewing: "bg-blue-50 text-blue-700 ring-blue-200",
        approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    };
    const labels = { pending: "Pending review", reviewing: "In review", approved: "Approved", rejected: "Rejected" };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
}
function Stat({ label, value, tone }) {
    const tones = { amber: "bg-amber-50 text-amber-700", blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", red: "bg-rose-50 text-rose-700", slate: "bg-slate-100 text-slate-700" };
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-slate-500">{label}</span><span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${tones[tone]}`}>LIVE</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p></div>;
}
function Field({ label, children }) {
    return <div className="min-w-0"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><div className="break-words text-sm text-slate-700">{children || "—"}</div></div>;
}

export default function SubmissionsClient({ user }) {
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({ pending: 0, reviewing: 0, approved: 0, rejected: 0, total: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [queryInput, setQueryInput] = useState("");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [expandedId, setExpandedId] = useState("");
    const [notesDraft, setNotesDraft] = useState({});
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [listingDrafts, setListingDrafts] = useState({});

    useEffect(() => {
        const timer = setTimeout(() => { setQuery(queryInput.trim()); setPage(1); }, 250);
        return () => clearTimeout(timer);
    }, [queryInput]);

    const load = useCallback(async ({ quiet = false } = {}) => {
        if (!quiet) setLoading(true);
        setError("");
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (status) params.set("status", status);
        if (query) params.set("q", query);
        try {
            const response = await fetch("/api/admin/submissions?" + params, { credentials: "same-origin", cache: "no-store" });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to load business submissions.");
            const next = data.pagination || { page, limit: PAGE_SIZE, total: (data.items || []).length, totalPages: 1 };
            if (page > Math.max(1, next.totalPages || 0)) { setPage(Math.max(1, next.totalPages || 1)); return; }
            setItems(Array.isArray(data.items) ? data.items : []);
            setSummary(data.summary || { pending: 0, reviewing: 0, approved: 0, rejected: 0, total: 0 });
            setPagination(next);
            setNotesDraft(current => {
                const copy = { ...current };
                for (const item of (data.items || [])) if (copy[item._id] === undefined) copy[item._id] = item.adminNotes || "";
                return copy;
            });
        } catch (err) { setError(err.message || "Unable to load business submissions."); setItems([]); }
        finally { setLoading(false); }
    }, [page, status, query]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        let active = true;
        async function loadListingOptions() {
            try {
                const [categoryResponse, locationResponse] = await Promise.all([
                    fetch("/api/admin/categories?limit=100&status=active", { credentials: "same-origin", cache: "no-store" }),
                    fetch("/api/admin/locations?limit=100&status=active", { credentials: "same-origin", cache: "no-store" }),
                ]);
                const [categoryData, locationData] = await Promise.all([
                    categoryResponse.json(), locationResponse.json(),
                ]);
                if (!categoryResponse.ok || !categoryData?.success) throw new Error(categoryData?.message || "Could not load active categories.");
                if (!locationResponse.ok || !locationData?.success) throw new Error(locationData?.message || "Could not load active locations.");
                if (active) {
                    setCategories(categoryData.items || []);
                    setLocations(locationData.items || []);
                }
            } catch (optionError) {
                if (active) setError(optionError.message || "Could not load categories and locations.");
            }
        }
        loadListingOptions();
        return () => { active = false; };
    }, []);

    function updateListingDraft(id, updates, item) {
        setListingDrafts(current => ({
            ...current,
            [id]: {
                category: current[id]?.category || "",
                location: current[id]?.location || "",
                businessType: current[id]?.businessType || "business",
                description: current[id]?.description ?? item.message ?? "",
                ...updates,
            },
        }));
    }

    async function createListing(item, publish) {
        const draft = listingDrafts[item._id] || {};
        if (!draft.category || !draft.location) {
            setError("Choose an active category and location before creating the listing.");
            setExpandedId(item._id);
            return;
        }
        const description = (draft.description ?? item.message ?? "").trim();
        if (publish && !description) {
            setError("Add a business description before publishing. The public listing requires one.");
            setExpandedId(item._id);
            return;
        }
        setBusyId(item._id); setError(""); setNotice("");
        try {
            const response = await fetch(`/api/admin/submissions/${item._id}`, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: draft.category,
                    location: draft.location,
                    businessType: draft.businessType || "business",
                    description,
                    publish,
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to create this listing.");
            setNotice(data.message || (publish ? "Business published successfully." : "Business draft created."));
            await load({ quiet: true });
            if (publish && data.publicUrl) {
                setNotice(`Published successfully: ${window.location.origin}${data.publicUrl}`);
            }
        } catch (err) {
            setError(err.message || "Unable to create this listing.");
        } finally {
            setBusyId("");
        }
    }

    async function updateSubmission(item, updates, successMessage) {
        setBusyId(item._id); setError(""); setNotice("");
        try {
            const response = await fetch(`/api/admin/submissions/${item._id}`, {
                method: "PATCH", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to update this submission.");
            setNotice(successMessage || data.message || "Submission updated.");
            await load({ quiet: true });
        } catch (err) { setError(err.message || "Unable to update this submission."); }
        finally { setBusyId(""); }
    }

    const filteredTotal = pagination.total || 0;
    const summaryCards = useMemo(() => [
        { label: "Awaiting review", value: summary.pending, tone: "amber" },
        { label: "Currently reviewing", value: summary.reviewing, tone: "blue" },
        { label: "Approved requests", value: summary.approved, tone: "green" },
        { label: "Rejected requests", value: summary.rejected, tone: "red" },
    ], [summary]);

    return <main className="min-h-[calc(100vh-76px)] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="mx-auto max-w-[1400px]">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-400"><Link href="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="font-semibold text-slate-600">Business submissions</span></div>
            <PageHeader eyebrow="INCOMING BUSINESS REQUESTS" title="Business submissions" description="Review local business listing requests, keep internal notes, and track each request from first contact to a decision." action={<button type="button" className={buttonClass} onClick={() => load()} disabled={loading}>↻ Refresh</button>} />
            <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{summaryCards.map(card => <Stat key={card.label} {...card}/>)}</section>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div><h2 className="text-sm font-bold text-slate-900">Listing request inbox</h2><p className="mt-1 text-xs text-slate-500">{filteredTotal} {status ? STATUS_OPTIONS.find(([value])=>value===status)?.[1].toLowerCase() : "total"} · newest requests first</p></div>
                        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_190px] lg:w-[510px]">
                            <label><span className="sr-only">Search submissions</span><input className={controlClass} value={queryInput} onChange={e=>setQueryInput(e.target.value)} placeholder="Search business, contact, email…"/></label>
                            <label><span className="sr-only">Filter by status</span><select className={controlClass} value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>{STATUS_OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                        </div>
                    </div>
                </div>
                {notice && <div className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 sm:mx-5" role="status">{notice}</div>}
                {error && <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 sm:mx-5" role="alert"><span>{error}</span><button className={buttonClass} onClick={()=>load()} type="button">Try again</button></div>}
                {loading ? <div className="grid gap-3 p-4 sm:p-5">{[1,2,3].map(n=><div key={n} className="h-32 animate-pulse rounded-xl bg-slate-100"/>)}</div> : items.length===0 && !error ? <div className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">✓</div><h3 className="mt-4 text-base font-bold text-slate-900">{query || status ? "No requests match these filters" : "No business requests yet"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{status==="pending"&&!query ? "You’re all caught up. New requests sent through the public List Your Business form will appear here." : "Try another status or search term to find the request you need."}</p><div className="mt-4 flex flex-wrap justify-center gap-2">{(status||query)&&<button type="button" className={buttonClass} onClick={()=>{setStatus("");setQueryInput("");setQuery("");setPage(1);}}>Show all requests</button>}<Link className={buttonClass} href="/add-business">Open public submission form ↗</Link></div></div> : <div className="divide-y divide-slate-100">{items.map(item=><article key={item._id} className="p-4 transition hover:bg-slate-50/70 sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <button type="button" onClick={()=>setExpandedId(expandedId===item._id?"":item._id)} className="min-w-0 flex-1 text-left">
                            <div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-bold text-slate-900 sm:text-base">{item.businessName}</h3><StatusBadge status={item.status}/></div>
                            <p className="mt-1 text-xs text-slate-500">{item.contactName} <span className="px-1 text-slate-300">·</span> {item.email}</p>
                            <p className="mt-2 line-clamp-2 max-w-3xl text-xs leading-5 text-slate-600">{item.message || "No additional business description was provided."}</p>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400"><span>Submitted {formatDate(item.createdAt)}</span>{item.locationName&&<span>⌖ {item.locationName}</span>}{item.categoryName&&<span>Category: {item.categoryName}</span>}</div>
                        </button>
                        <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
                            {item.status==="pending"&&<button className={primaryClass} type="button" disabled={busyId===item._id} onClick={()=>updateSubmission(item,{status:"reviewing"},"Request moved to In review.")}>{busyId===item._id?"Saving…":"Start review"}</button>}
                            {item.status==="reviewing"&&<button className={primaryClass} type="button" disabled={busyId===item._id} onClick={()=>updateSubmission(item,{status:"approved"},"Request approved. You can now create the business listing in Business Management.")}>{busyId===item._id?"Saving…":"Approve"}</button>}
                            {["pending","reviewing"].includes(item.status)&&<button className={buttonClass} type="button" disabled={busyId===item._id} onClick={()=>{setExpandedId(item._id);setNotesDraft(current=>({...current,[item._id]:current[item._id]??item.adminNotes??""}));}}>Review details</button>}
                            {["pending","reviewing"].includes(item.status)&&<button className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50" type="button" disabled={busyId===item._id} onClick={()=>updateSubmission(item,{status:"rejected"},"Request rejected.")}>Reject</button>}
                            {["approved","rejected"].includes(item.status)&&<button className={buttonClass} type="button" onClick={()=>setExpandedId(expandedId===item._id?"":item._id)}>{expandedId===item._id?"Hide details":"View details"}</button>}
                        </div>
                    </div>
                    {expandedId===item._id&&<div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                            <Field label="Contact name">{item.contactName}</Field><Field label="Email"><a className="text-blue-700 hover:underline" href={`mailto:${item.email}`}>{item.email}</a></Field><Field label="Phone"><a className="text-blue-700 hover:underline" href={`tel:${item.phone}`}>{item.phone}</a></Field>
                            <Field label="Business location">{item.locationName}</Field><Field label="Requested category">{item.categoryName}</Field><Field label="Website">{item.website?<a className="break-all text-blue-700 hover:underline" href={item.website} target="_blank" rel="noreferrer">{item.website}</a>:"—"}</Field>
                            <div className="sm:col-span-2 xl:col-span-3"><Field label="Business description / message">{item.message}</Field></div>
                            <Field label="Submitted on">{formatDate(item.createdAt)}</Field><Field label="Last updated">{formatDate(item.updatedAt)}</Field><Field label="Decision date">{formatDate(item.reviewedAt)}</Field>{item.business&&<Field label="Created listing">{item.business.name} · {item.business.status}</Field>}
                        </div>
                        <div className="mt-6 border-t border-slate-200 pt-5"><label className="block text-xs font-bold text-slate-700" htmlFor={`notes-${item._id}`}>Internal admin notes <span className="font-normal text-slate-400">· visible to admins only</span></label><textarea id={`notes-${item._id}`} className={`mt-2 ${controlClass}`} rows={3} maxLength={3000} value={notesDraft[item._id]??item.adminNotes??""} onChange={e=>setNotesDraft(current=>({...current,[item._id]:e.target.value}))} placeholder="Record follow-up attempts, missing details, or why a decision was made…"/><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-slate-400">{(notesDraft[item._id]??item.adminNotes??"").length}/3000 characters</span><div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} disabled={busyId===item._id} onClick={()=>updateSubmission(item,{adminNotes:notesDraft[item._id]??item.adminNotes??""},"Internal notes saved.")}>Save notes</button>{item.status==="rejected"&&<button type="button" className={buttonClass} disabled={busyId===item._id} onClick={()=>updateSubmission(item,{status:"pending"},"Request reopened for review.")}>Reopen request</button>}{item.status==="approved"&&<button type="button" className={buttonClass} disabled={busyId===item._id} onClick={()=>updateSubmission(item,{status:"reviewing"},"Request returned to review.")}>Return to review</button>}</div></div>
                        {item.status==="approved"&&!item.business&&<div className="mt-6 border-t border-slate-200 pt-5"><div><h4 className="text-sm font-bold text-slate-900">Create the public business listing</h4><p className="mt-1 text-xs leading-5 text-slate-500">Approval does not publish automatically. Confirm the category and location, review the description, then publish to make it visible in public search.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><label className="text-xs font-semibold text-slate-700">Category<select className={`mt-1.5 ${controlClass}`} value={listingDrafts[item._id]?.category||""} onChange={e=>updateListingDraft(item._id,{category:e.target.value},item)} required><option value="">Choose active category</option>{categories.filter(option=>option.status==="active").map(option=><option key={option._id} value={option._id}>{option.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Location<select className={`mt-1.5 ${controlClass}`} value={listingDrafts[item._id]?.location||""} onChange={e=>updateListingDraft(item._id,{location:e.target.value},item)} required><option value="">Choose active location</option>{locations.filter(option=>option.status==="active").map(option=><option key={option._id} value={option._id}>{option.name}{option.type?` · ${option.type}`:""}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Business type<select className={`mt-1.5 ${controlClass}`} value={listingDrafts[item._id]?.businessType||"business"} onChange={e=>updateListingDraft(item._id,{businessType:e.target.value},item)}><option value="business">General business</option><option value="restaurant">Restaurant</option><option value="hotel">Hotel</option><option value="professional_service">Professional service</option><option value="healthcare">Healthcare</option><option value="retail">Retail</option><option value="tourism">Tourism</option><option value="attraction">Attraction</option><option value="guide">Guide</option><option value="event_venue">Event venue</option><option value="other">Other</option></select></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2 xl:col-span-3">Public business description<textarea className={`mt-1.5 ${controlClass}`} rows={4} maxLength={10000} value={listingDrafts[item._id]?.description??item.message??""} onChange={e=>updateListingDraft(item._id,{description:e.target.value},item)} placeholder="Describe services, what makes the business useful, and what visitors should know."/><span className="mt-1 block text-[10px] font-normal text-slate-400">Required to publish. Contact details from the submission will be included.</span></label></div><div className="mt-4 flex flex-wrap gap-2"><button className={primaryClass} type="button" disabled={busyId===item._id||!categories.length||!locations.length} onClick={()=>createListing(item,true)}>{busyId===item._id?"Publishing…":"Create & publish listing ↗"}</button><button className={buttonClass} type="button" disabled={busyId===item._id||!categories.length||!locations.length} onClick={()=>createListing(item,false)}>{busyId===item._id?"Saving…":"Save as draft"}</button><span className="self-center text-[10px] text-slate-400">Publishing makes it eligible for /businesses and its own public profile.</span></div></div>}
                        {item.business?.slug&&<div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">Listing created: {item.business.name}</p><p className="mt-1 text-xs text-emerald-800">Status: {item.business.status}</p>{item.business.status==="published"?<Link className="mt-3 inline-flex text-xs font-bold text-emerald-900 underline" href={`/businesses/${item.business.slug}`}>Open public listing ↗</Link>:<Link className="mt-3 inline-flex text-xs font-bold text-emerald-900 underline" href="/admin/businesses">Open Business Management to publish ↗</Link>}</div>}
                        </div>
                    </div>}
                </article>)}</div>}
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-xs text-slate-500">Page {pagination.page||page} of {Math.max(1,pagination.totalPages||0)} <span className="px-1 text-slate-300">·</span> {filteredTotal} requests</p><div className="flex gap-2"><button className={buttonClass} type="button" disabled={loading||page<=1} onClick={()=>setPage(p=>p-1)}>← Previous</button><button className={buttonClass} type="button" disabled={loading||page>=Math.max(1,pagination.totalPages||0)} onClick={()=>setPage(p=>p+1)}>Next →</button></div></div>
            </section>
            <p className="mt-5 text-[11px] text-slate-400">Signed in as {user?.email || "Administrator"} · Approve a request, then create and publish its listing here. Published listings are available to everyone.</p>
        </div>
    </main>;
}
