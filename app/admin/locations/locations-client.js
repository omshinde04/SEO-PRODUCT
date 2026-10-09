"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;
const LOCATION_TYPES = [
    ["country", "Country"],
    ["state", "State"],
    ["district", "District"],
    ["city", "City"],
    ["town", "Town"],
    ["village", "Village"],
    ["locality", "Locality"],
    ["region", "Region"],
];
const ALLOWED_PARENT_TYPES = {
    country: [],
    state: ["country"],
    district: ["state"],
    city: ["district"],
    town: ["district", "city", "region"],
    village: ["district", "town", "region"],
    locality: ["city", "town", "village", "locality", "region"],
    region: ["country", "state", "district", "city", "region"],
};
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
        type: "city",
        parent: "",
        address: {
            district: "",
            state: "",
            country: "India",
            postalCodesText: "",
        },
        coordinates: { latitude: "", longitude: "" },
        description: "",
        coverImage: { url: "", publicId: "", alt: "" },
        seo: { title: "", description: "", noIndex: false },
        status: "active",
        sortOrder: "0",
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
        .slice(0, 140);
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

export default function LocationsClient() {
    const [items, setItems] = useState([]);
    const [parentOptions, setParentOptions] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
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
    const [typeFilter, setTypeFilter] = useState("");
    const [form, setForm] = useState(blankForm);
    const [editingId, setEditingId] = useState("");
    const [loading, setLoading] = useState(true);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [busyId, setBusyId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [coverUploading, setCoverUploading] = useState(false);

    const totalPages = Math.max(1, pagination.totalPages || Math.ceil(pagination.total / PAGE_SIZE));
    const locationNames = useMemo(
        () => new Map(parentOptions.map((item) => [String(item._id), item.name])),
        [parentOptions]
    );
    const compatibleParents = useMemo(() => {
        const allowed = ALLOWED_PARENT_TYPES[form.type] || [];
        return parentOptions.filter((item) =>
            item.status === "active" &&
            allowed.includes(item.type) &&
            String(item._id) !== editingId
        );
    }, [editingId, form.type, parentOptions]);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
            page: String(page),
            limit: String(PAGE_SIZE),
        });
        if (search) params.set("q", search);
        if (statusFilter) params.set("status", statusFilter);
        if (typeFilter) params.set("type", typeFilter);

        try {
            const response = await fetch("/api/admin/locations?" + params, {
                credentials: "same-origin",
                cache: "no-store",
            });
            const data = await readResponse(response);

            setItems(data.items || []);
            setPagination({
                page: data.pagination?.page || page,
                limit: data.pagination?.limit || PAGE_SIZE,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0,
            });

            const pages = Math.max(1, data.pagination?.totalPages || 0);
            if (page > pages) setPage(pages);
        } catch (loadError) {
            setError(loadError.message || "Could not load locations.");
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, typeFilter]);

    const loadOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const [locationsResponse, mediaResponse] = await Promise.all([
                fetch("/api/admin/locations?limit=100", {
                    credentials: "same-origin",
                    cache: "no-store",
                }),
                fetch("/api/admin/content/media?limit=100", {
                    credentials: "same-origin",
                    cache: "no-store",
                }),
            ]);
            const [locationsData, mediaData] = await Promise.all([
                readResponse(locationsResponse),
                readResponse(mediaResponse),
            ]);
            setParentOptions(locationsData.items || []);
            setMediaItems(mediaData.items || []);
        } catch (optionsError) {
            setError(optionsError.message || "Could not load location or media options.");
        } finally {
            setOptionsLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) load();
        });
        return () => {
            cancelled = true;
        };
    }, [load]);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) loadOptions();
        });
        return () => {
            cancelled = true;
        };
    }, [loadOptions]);

    function resetForm() {
        setForm(blankForm());
        setEditingId("");
    }

    function editLocation(item) {
        setEditingId(item._id);
        setForm({
            name: item.name || "",
            slug: item.slug || "",
            type: item.type || "city",
            parent: item.parent?._id || item.parent || "",
            address: {
                district: item.address?.district || "",
                state: item.address?.state || "",
                country: item.address?.country || "India",
                postalCodesText: (item.address?.postalCodes || []).join(", "),
            },
            coordinates: {
                latitude: item.coordinates?.latitude ?? "",
                longitude: item.coordinates?.longitude ?? "",
            },
            description: item.description || "",
            coverImage: {
                url: item.coverImage?.url || "",
                publicId: item.coverImage?.publicId || "",
                alt: item.coverImage?.alt || "",
            },
            seo: {
                title: item.seo?.title || "",
                description: item.seo?.description || "",
                noIndex: Boolean(item.seo?.noIndex),
            },
            status: item.status || "active",
            sortOrder: String(item.sortOrder ?? 0),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function saveLocation(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        const latitude = form.coordinates.latitude === "" ? null : Number(form.coordinates.latitude);
        const longitude = form.coordinates.longitude === "" ? null : Number(form.coordinates.longitude);
        const postalCodes = form.address.postalCodesText
            .split(/[\n,]/)
            .map((code) => code.trim())
            .filter(Boolean);

        const payload = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            type: form.type,
            parent: form.parent || null,
            address: {
                district: form.address.district.trim(),
                state: form.address.state.trim(),
                country: form.address.country.trim() || "India",
                postalCodes,
            },
            coordinates: { latitude, longitude },
            description: form.description.trim(),
            coverImage: {
                url: form.coverImage.url.trim(),
                publicId: form.coverImage.publicId.trim(),
                alt: form.coverImage.alt.trim(),
            },
            seo: {
                title: form.seo.title.trim(),
                description: form.seo.description.trim(),
                noIndex: Boolean(form.seo.noIndex),
            },
            status: form.status,
            sortOrder: Number(form.sortOrder) || 0,
        };

        try {
            const url = editingId
                ? "/api/admin/locations/" + encodeURIComponent(editingId)
                : "/api/admin/locations";
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

            setNotice(data.message || (editingId ? "Location updated successfully." : "Location created successfully."));
            resetForm();
            setPage(1);
            await Promise.all([load(), loadOptions()]);
        } catch (saveError) {
            setError(saveError.message || "Could not save the location.");
        } finally {
            setBusy(false);
        }
    }

    async function uploadCoverImage(selectedFile) {
        if (!selectedFile) return;

        if (!/^image\/(jpeg|png|webp|avif)$/.test(selectedFile.type)) {
            setError("Only JPG, PNG, WebP or AVIF images are allowed.");
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError("Maximum image size is 5 MB.");
            return;
        }

        setCoverUploading(true);
        setError("");
        setNotice("");

        try {
            const sigRes = await fetch("/api/admin/uploads/signature", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purpose: "location-cover" }),
            });
            const sigData = await sigRes.json();
            if (!sigRes.ok || !sigData.success) {
                throw new Error(sigData.message || "Failed to sign upload request.");
            }

            const upload = sigData.upload;
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("api_key", upload.apiKey);
            formData.append("timestamp", String(upload.timestamp));
            formData.append("signature", upload.signature);
            formData.append("folder", upload.folder);
            formData.append("public_id", upload.publicId);
            formData.append("upload_preset", upload.uploadPreset);

            const uploadRes = await fetch(upload.uploadUrl, {
                method: "POST",
                body: formData,
            });
            const asset = await uploadRes.json();
            if (!uploadRes.ok || !asset.secure_url || !asset.public_id) {
                throw new Error(asset.error?.message || "Cloud image upload failed.");
            }

            const autoAlt = selectedFile.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 200);
            setForm((current) => ({
                ...current,
                coverImage: {
                    url: asset.secure_url,
                    publicId: asset.public_id,
                    alt: current.coverImage.alt.trim() || autoAlt,
                },
            }));

            // Register in media library asynchronously
            try {
                await fetch("/api/admin/content/media", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: asset.secure_url,
                        publicId: asset.public_id,
                        folder: asset.folder || upload.folder,
                        alt: form.coverImage.alt.trim() || autoAlt,
                        caption: `Location cover: ${form.name || selectedFile.name}`,
                        mimeType: (asset.resource_type || "image") + "/" + (asset.format || "jpeg"),
                        bytes: asset.bytes || selectedFile.size,
                        width: asset.width || null,
                        height: asset.height || null,
                    }),
                });
                const mediaRes = await fetch("/api/admin/content/media?limit=100", { credentials: "same-origin" });
                const mediaData = await mediaRes.json();
                if (mediaData.items) setMediaItems(mediaData.items);
            } catch {
                // Non-blocking
            }

            setNotice("Location cover image uploaded successfully!");
        } catch (err) {
            setError(err.message || "Image upload failed.");
        } finally {
            setCoverUploading(false);
        }
    }

    async function toggleStatus(item) {
        const activating = item.status === "inactive";
        if (!activating && !window.confirm("Deactivate this location? Locations referenced by businesses or active child locations cannot be deactivated.")) {
            return;
        }

        setBusy(true);
        setBusyId(item._id);
        setError("");
        setNotice("");

        try {
            const response = await fetch("/api/admin/locations/" + encodeURIComponent(item._id), {
                method: activating ? "PATCH" : "DELETE",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    ...(activating ? { "Content-Type": "application/json" } : {}),
                },
                ...(activating ? { body: JSON.stringify({ status: "active" }) } : {}),
            });
            const data = await readResponse(response);
            setNotice(data.message || (activating ? "Location activated." : "Location deactivated."));
            await Promise.all([load(), loadOptions()]);
        } catch (statusError) {
            setError(statusError.message || "Could not change location status.");
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

    function changeType(nextType) {
        setForm((current) => {
            const allowed = ALLOWED_PARENT_TYPES[nextType] || [];
            const currentParent = parentOptions.find((item) => String(item._id) === current.parent);
            return {
                ...current,
                type: nextType,
                parent: currentParent && allowed.includes(currentParent.type) ? current.parent : "",
            };
        });
    }

    return (
        <main className="mx-auto max-w-7xl p-5 sm:p-8">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Admin workspace</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Locations</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Manage the location hierarchy, addresses, coordinates, images, and SEO settings for your discovery platform.
                    </p>
                </div>
                <button type="button" onClick={() => { load(); loadOptions(); }} disabled={loading || optionsLoading || busy} className={buttonClass}>Refresh</button>
            </header>

            {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
            {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

            <form onSubmit={saveLocation} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit location" : "Create location"}</h2>
                        <p className="mt-1 text-xs text-slate-500">Parent/type relationships and hierarchy integrity are validated by the API.</p>
                    </div>
                    {editingId && <button type="button" onClick={resetForm} className={buttonClass}>Cancel edit</button>}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Location name">
                        <input required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm((current) => ({
                            ...current,
                            name: event.target.value,
                            slug: !current.slug || current.slug === slugify(current.name) ? slugify(event.target.value) : current.slug,
                        }))} className={inputClass} placeholder="Igatpuri" />
                    </Field>
                    <Field label="Slug">
                        <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={140} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className={inputClass} placeholder="igatpuri" />
                    </Field>
                    <Field label="Location type">
                        <select required value={form.type} onChange={(event) => changeType(event.target.value)} className={inputClass}>
                            {LOCATION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </Field>
                    <Field label="Parent location" hint={["country", "region"].includes(form.type) ? "Optional for top-level country or region." : "Choose an active parent with a compatible location type."}>
                        <select required={!["country", "region"].includes(form.type)} value={form.parent} onChange={(event) => setForm((current) => ({ ...current, parent: event.target.value }))} className={inputClass} disabled={optionsLoading}>
                            <option value="">No parent</option>
                            {compatibleParents.map((item) => (
                                <option key={item._id} value={item._id}>{item.name} ({item.type})</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="District">
                        <input maxLength={120} value={form.address.district} onChange={(event) => setForm((current) => ({ ...current, address: { ...current.address, district: event.target.value } }))} className={inputClass} />
                    </Field>
                    <Field label="State">
                        <input maxLength={120} value={form.address.state} onChange={(event) => setForm((current) => ({ ...current, address: { ...current.address, state: event.target.value } }))} className={inputClass} />
                    </Field>
                    <Field label="Country">
                        <input maxLength={80} value={form.address.country} onChange={(event) => setForm((current) => ({ ...current, address: { ...current.address, country: event.target.value } }))} className={inputClass} />
                    </Field>
                    <Field label="Postal codes" hint="Separate multiple codes with commas or new lines.">
                        <textarea rows={2} maxLength={1200} value={form.address.postalCodesText} onChange={(event) => setForm((current) => ({ ...current, address: { ...current.address, postalCodesText: event.target.value } }))} className={inputClass} placeholder="422402, 422403" />
                    </Field>
                    <Field label="Latitude">
                        <input type="number" step="any" min={-90} max={90} value={form.coordinates.latitude} onChange={(event) => setForm((current) => ({ ...current, coordinates: { ...current.coordinates, latitude: event.target.value } }))} className={inputClass} placeholder="19.695" />
                    </Field>
                    <Field label="Longitude">
                        <input type="number" step="any" min={-180} max={180} value={form.coordinates.longitude} onChange={(event) => setForm((current) => ({ ...current, coordinates: { ...current.coordinates, longitude: event.target.value } }))} className={inputClass} placeholder="73.562" />
                    </Field>
                    <Field label="Status">
                        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </Field>
                    <Field label="Sort order">
                        <input type="number" min={0} max={100000} step={1} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} className={inputClass} />
                    </Field>
                    <Field label="Description">
                        <textarea rows={3} maxLength={3000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} />
                    </Field>
                    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Cover image</h3>
                                <p className="text-xs text-slate-500">
                                    Upload directly to Cloudinary or select from existing media.
                                </p>
                            </div>
                            {form.coverImage.url && (
                                <button
                                    type="button"
                                    onClick={() => setForm((current) => ({
                                        ...current,
                                        coverImage: { url: "", publicId: "", alt: "" },
                                    }))}
                                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                                >
                                    Remove image
                                </button>
                            )}
                        </div>

                        {form.coverImage.url ? (
                            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                <img
                                    src={form.coverImage.url}
                                    alt={form.coverImage.alt || "Location preview"}
                                    className="h-24 w-36 rounded-lg object-cover border border-slate-200 bg-slate-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Image attached & verified
                                    </p>
                                    <p className="mt-1 truncate text-xs text-slate-700 font-mono" title={form.coverImage.url}>
                                        {form.coverImage.url}
                                    </p>
                                    {form.coverImage.publicId && (
                                        <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
                                            Public ID: {form.coverImage.publicId}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Upload new cover image (JPG, PNG, WebP, AVIF &le; 5MB)
                                </label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/avif"
                                    disabled={coverUploading}
                                    onChange={(event) => {
                                        const uploadedFile = event.target.files?.[0];
                                        if (uploadedFile) {
                                            uploadCoverImage(uploadedFile);
                                            event.target.value = "";
                                        }
                                    }}
                                    className={inputClass}
                                />
                                {coverUploading && (
                                    <p className="mt-1.5 text-xs text-blue-600 animate-pulse font-medium">
                                        Uploading to Cloudinary…
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Or choose from media library
                                </label>
                                <select
                                    value={form.coverImage.publicId}
                                    disabled={optionsLoading}
                                    onChange={(event) => {
                                        const media = mediaItems.find((item) => item.publicId === event.target.value);
                                        setForm((current) => ({
                                            ...current,
                                            coverImage: {
                                                url: media?.url || "",
                                                publicId: media?.publicId || "",
                                                alt: media?.alt || "",
                                            },
                                        }));
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Choose image (optional)</option>
                                    {mediaItems.map((media) => (
                                        <option key={media._id} value={media.publicId}>
                                            {media.alt || media.caption || media.publicId}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Cover image alt text
                                </label>
                                <input
                                    maxLength={200}
                                    value={form.coverImage.alt}
                                    onChange={(event) => setForm((current) => ({
                                        ...current,
                                        coverImage: { ...current.coverImage, alt: event.target.value },
                                    }))}
                                    placeholder="Describe image for accessibility"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Direct cover image URL
                                </label>
                                <input
                                    type="url"
                                    maxLength={2048}
                                    value={form.coverImage.url}
                                    onChange={(event) => setForm((current) => ({
                                        ...current,
                                        coverImage: { ...current.coverImage, url: event.target.value },
                                    }))}
                                    placeholder="https://..."
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                    <Field label="SEO title">
                        <input maxLength={70} value={form.seo.title} onChange={(event) => setForm((current) => ({ ...current, seo: { ...current.seo, title: event.target.value } }))} className={inputClass} />
                    </Field>
                    <Field label="SEO description">
                        <textarea rows={2} maxLength={170} value={form.seo.description} onChange={(event) => setForm((current) => ({ ...current, seo: { ...current.seo, description: event.target.value } }))} className={inputClass} />
                    </Field>
                    <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700">
                        <input type="checkbox" checked={form.seo.noIndex} onChange={(event) => setForm((current) => ({ ...current, seo: { ...current.seo, noIndex: event.target.checked } }))} />
                        Exclude from indexing
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <button disabled={busy || optionsLoading} className={primaryButtonClass}>{busy ? "Saving…" : editingId ? "Save changes" : "Create location"}</button>
                    {!editingId && <button type="button" onClick={resetForm} disabled={busy} className={buttonClass}>Reset</button>}
                </div>
            </form>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                        <h2 className="font-bold text-slate-900">Location directory</h2>
                        <p className="mt-1 text-xs text-slate-500">{loading ? "Loading locations…" : `${pagination.total} total locations`}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <form onSubmit={submitSearch} className="flex gap-2">
                            <input aria-label="Search locations" maxLength={100} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name or slug" className={inputClass + " sm:min-w-56"} />
                            <button disabled={loading} className={buttonClass}>Search</button>
                        </form>
                        <select aria-label="Filter location type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} className={inputClass + " sm:w-40"}>
                            <option value="">All types</option>
                            {LOCATION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <select aria-label="Filter location status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={inputClass + " sm:w-36"}>
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 p-5" aria-label="Loading locations">
                        {[1, 2, 3].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
                    </div>
                ) : items.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">{search ? "No locations match your search." : "No locations found. Create your first location above."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Location</th>
                                    <th className="px-5 py-3 font-semibold">Type</th>
                                    <th className="px-5 py-3 font-semibold">Parent</th>
                                    <th className="px-5 py-3 font-semibold">Coordinates</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => {
                                    const parentId = item.parent?._id || item.parent;
                                    const parentName = parentId ? locationNames.get(String(parentId)) || "Inactive or unavailable parent" : "Top level";
                                    const latitude = item.coordinates?.latitude;
                                    const longitude = item.coordinates?.longitude;
                                    return (
                                        <tr key={item._id} className="align-top hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    {item.coverImage?.url && (
                                                        <img
                                                            src={item.coverImage.url}
                                                            alt=""
                                                            className="h-10 w-14 shrink-0 rounded-md object-cover border border-slate-200 bg-slate-100"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{item.name}</p>
                                                        <p className="mt-1 text-xs text-slate-500">/{item.slug}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{[item.address?.district, item.address?.state, item.address?.country].filter(Boolean).join(", ")}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 capitalize text-slate-600">{item.type}</td>
                                            <td className="px-5 py-4 text-slate-600">{parentName}</td>
                                            <td className="px-5 py-4 tabular-nums text-slate-600">{latitude != null && longitude != null ? `${latitude}, ${longitude}` : "—"}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.status}</span>
                                                {item.seo?.noIndex && <span className="ml-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">No index</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" disabled={busy || Boolean(busyId)} onClick={() => editLocation(item)} className={buttonClass}>Edit</button>
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
