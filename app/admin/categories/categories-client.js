"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;
const inputClass =
    "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const buttonClass =
    "inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass =
    "inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

function blankForm() {
    return {
        name: "",
        slug: "",
        description: "",
        parent: "",
        icon: "",
        status: "active",
        sortOrder: "0",
        seo: { title: "", description: "", noIndex: false },
    };
}

function slugify(value) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}

function Field({ label, children, hint }) {
    return (
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
            <span>{label}</span>
            {children}
            {hint && <span className="text-[11px] font-normal text-slate-500">{hint}</span>}
        </label>
    );
}

async function readResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
        throw new Error(data.message || "The request could not be completed.");
    }
    return data;
}

export default function CategoriesClient() {
    const [items, setItems] = useState([]);
    const [parentOptions, setParentOptions] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [form, setForm] = useState(blankForm);
    const [editingId, setEditingId] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [busyId, setBusyId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const totalPages = Math.max(1, pagination.totalPages || Math.ceil(pagination.total / PAGE_SIZE));
    const parentNames = useMemo(
        () => new Map(parentOptions.map((item) => [String(item._id), item.name])),
        [parentOptions]
    );

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
            page: String(page),
            limit: String(PAGE_SIZE),
        });
        if (search) params.set("q", search);
        if (statusFilter) params.set("status", statusFilter);

        try {
            const [listResponse, optionsResponse] = await Promise.all([
                fetch("/api/admin/categories?" + params, {
                    credentials: "same-origin",
                    cache: "no-store",
                }),
                fetch("/api/admin/categories?limit=100", {
                    credentials: "same-origin",
                    cache: "no-store",
                }),
            ]);
            const [listData, optionsData] = await Promise.all([
                readResponse(listResponse),
                readResponse(optionsResponse),
            ]);

            setItems(listData.items || []);
            setPagination({
                page: listData.pagination?.page || page,
                limit: listData.pagination?.limit || PAGE_SIZE,
                total: listData.pagination?.total || 0,
                totalPages: listData.pagination?.totalPages || 0,
            });
            setParentOptions(optionsData.items || []);

            const pages = Math.max(1, listData.pagination?.totalPages || 0);
            if (page > pages) setPage(pages);
        } catch (loadError) {
            setError(loadError.message || "Could not load categories.");
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) load();
        });
        return () => {
            cancelled = true;
        };
    }, [load]);

    function resetForm() {
        setForm(blankForm());
        setEditingId("");
    }

    function editCategory(item) {
        setEditingId(item._id);
        setForm({
            name: item.name || "",
            slug: item.slug || "",
            description: item.description || "",
            parent: item.parent?._id || item.parent || "",
            icon: item.icon || "",
            status: item.status || "active",
            sortOrder: String(item.sortOrder ?? 0),
            seo: {
                title: item.seo?.title || "",
                description: item.seo?.description || "",
                noIndex: Boolean(item.seo?.noIndex),
            },
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function saveCategory(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        const payload = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim(),
            parent: form.parent || null,
            icon: form.icon.trim(),
            status: form.status,
            sortOrder: Number(form.sortOrder) || 0,
            seo: {
                title: form.seo.title.trim(),
                description: form.seo.description.trim(),
                noIndex: Boolean(form.seo.noIndex),
            },
        };

        try {
            const url = editingId
                ? "/api/admin/categories/" + encodeURIComponent(editingId)
                : "/api/admin/categories";
            const response = await fetch(url, {
                method: editingId ? "PATCH" : "POST",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await readResponse(response);

            setNotice(data.message || (editingId ? "Category updated successfully." : "Category created successfully."));
            resetForm();
            setPage(1);
            await load();
        } catch (saveError) {
            setError(saveError.message || "Could not save the category.");
        } finally {
            setBusy(false);
        }
    }

    async function toggleStatus(item) {
        const activating = item.status === "inactive";
        if (!activating && !window.confirm(`Deactivate "${item.name}"? This category and its listed places will be unlisted from the public website until reactivated.`)) {
            return;
        }

        setBusy(true);
        setBusyId(item._id);
        setError("");
        setNotice("");

        try {
            let response;
            if (activating) {
                response = await fetch("/api/admin/categories/" + encodeURIComponent(item._id), {
                    method: "PATCH",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ status: "active" }),
                });
            } else {
                response = await fetch("/api/admin/categories/" + encodeURIComponent(item._id), {
                    method: "DELETE",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: { Accept: "application/json" },
                });
            }

            const data = await readResponse(response);
            setNotice(data.message || (activating ? "Category activated." : "Category deactivated."));
            await load();
        } catch (statusError) {
            setError(statusError.message || "Could not change category status.");
        } finally {
            setBusyId("");
            setBusy(false);
        }
    }

    function submitSearch(event) {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    return (
        <main className="mx-auto max-w-7xl p-5 sm:p-8">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Admin workspace</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Categories</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Organize business types with parent-child categories, publication status, ordering, and SEO defaults.
                    </p>
                </div>
                <button type="button" onClick={load} disabled={loading || busy} className={buttonClass}>Refresh</button>
            </header>

            {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
            {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

            <form onSubmit={saveCategory} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit category" : "Create category"}</h2>
                        <p className="mt-1 text-xs text-slate-500">Slugs are permanent URL identifiers and must be unique.</p>
                    </div>
                    {editingId && <button type="button" onClick={resetForm} className={buttonClass}>Cancel edit</button>}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Category name">
                        <input required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({
                            ...current,
                            name: event.target.value,
                            slug: !current.slug || current.slug === slugify(current.name) ? slugify(event.target.value) : current.slug,
                        }))} className={inputClass} placeholder="Restaurants" />
                    </Field>
                    <Field label="Slug">
                        <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className={inputClass} placeholder="restaurants" />
                    </Field>
                    <Field label="Parent category" hint="Leave empty for a top-level category.">
                        <select value={form.parent} onChange={(event) => setForm((current) => ({ ...current, parent: event.target.value }))} className={inputClass}>
                            <option value="">Top-level category</option>
                            {parentOptions.filter((item) => item.status === "active" && String(item._id) !== editingId).map((item) => (
                                <option key={item._id} value={item._id}>{item.name}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Description">
                        <textarea rows={3} maxLength={1000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} placeholder="Short explanation of this category." />
                    </Field>
                    <Field label="Icon identifier (optional)" hint="Use a short icon name or emoji.">
                        <input maxLength={80} value={form.icon} onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))} className={inputClass} placeholder="utensils" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Status">
                            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </Field>
                        <Field label="Sort order">
                            <input type="number" min={0} max={100000} step={1} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} className={inputClass} />
                        </Field>
                    </div>
                    <Field label="SEO title (optional)">
                        <input maxLength={70} value={form.seo.title} onChange={(event) => setForm((current) => ({ ...current, seo: { ...current.seo, title: event.target.value } }))} className={inputClass} />
                    </Field>
                    <Field label="SEO description (optional)">
                        <textarea rows={2} maxLength={170} value={form.seo.description} onChange={(event) => setForm((current) => ({ ...current, seo: { ...current.seo, description: event.target.value } }))} className={inputClass} />
                    </Field>
                    <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700">
                        <input type="checkbox" checked={form.seo.noIndex} onChange={(event) => setForm((current) => ({ ...current, seo: { ...current.seo, noIndex: event.target.checked } }))} />
                        Exclude from indexing
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <button disabled={busy} className={primaryButtonClass}>{busy ? "Saving…" : editingId ? "Save changes" : "Create category"}</button>
                    {!editingId && <button type="button" onClick={resetForm} disabled={busy} className={buttonClass}>Reset</button>}
                </div>
            </form>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                        <h2 className="font-bold text-slate-900">Category directory</h2>
                        <p className="mt-1 text-xs text-slate-500">{loading ? "Loading categories…" : `${pagination.total} total categories`}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <form onSubmit={submitSearch} className="flex gap-2">
                            <input aria-label="Search categories" maxLength={100} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name or slug" className={inputClass + " sm:min-w-56"} />
                            <button disabled={loading} className={buttonClass}>Search</button>
                        </form>
                        <select aria-label="Filter category status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={inputClass + " sm:w-40"}>
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 p-5" aria-label="Loading categories">
                        {[1, 2, 3].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
                    </div>
                ) : items.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">{search ? "No categories match your search." : "No categories found. Create your first category above."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Category</th>
                                    <th className="px-5 py-3 font-semibold">Parent</th>
                                    <th className="px-5 py-3 font-semibold">Order</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => {
                                    const parentId = item.parent?._id || item.parent;
                                    const parentName = parentId ? parentNames.get(String(parentId)) || "Inactive or unavailable parent" : "Top level";
                                    return (
                                        <tr key={item._id} className="align-top hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">{item.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">/{item.slug}</p>
                                                {item.description && <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{item.description}</p>}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">{parentName}</td>
                                            <td className="px-5 py-4 tabular-nums text-slate-600">{item.sortOrder ?? 0}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.status}</span>
                                                {item.seo?.noIndex && <span className="ml-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">No index</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" disabled={busy || Boolean(busyId)} onClick={() => editCategory(item)} className={buttonClass}>Edit</button>
                                                    <button type="button" disabled={busy || busyId === item._id} onClick={() => toggleStatus(item)} className={buttonClass}>
                                                        {busyId === item._id ? "Working…" : item.status === "active" ? "Deactivate" : "Activate"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
                        <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className={buttonClass}>Previous</button>
                            <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className={buttonClass}>Next</button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
