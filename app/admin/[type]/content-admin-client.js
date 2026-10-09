"use client";

import { useCallback, useEffect, useState } from "react";

const labels = {
    places: "Places",
    guides: "Guides",
    events: "Events",
    submissions: "Business submissions",
    media: "Media library",
    seo: "Global SEO settings",
    "seo-templates": "SEO templates",
};

const blankSeo = {
    siteName: "GaavConnect",
    siteUrl: "https://gaavconnect.in",
    defaultTitle: "GaavConnect — Discover Local Businesses in Nashik District",
    titleTemplate: "%s | GaavConnect",
    defaultDescription: "Discover local businesses, shops, restaurants and services across Ghoti, Igatpuri and Nashik, Maharashtra.",
    defaultImage: "",
    robotsIndex: true,
    sitemapEnabled: true,
    organizationName: "",
    organizationLogo: "",
};

const blankTemplate = {
    entityType: "business",
    titleTemplate: "%s | GaavConnect",
    descriptionTemplate: "%s",
    canonicalTemplate: "",
    noIndexByDefault: false,
};

const blankContentSeo = {
    title: "",
    description: "",
    canonicalUrl: "",
    noIndex: false,
};

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const buttonClass =
    "rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function Field({ label, children }) {
    return (
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>{label}</span>
            {children}
        </label>
    );
}

function toDateTimeInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
}

export default function ContentAdminPage({ type }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [locations, setLocations] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [summary, setSummary] = useState("");
    const [body, setBody] = useState("");
    const [status, setStatus] = useState("draft");
    const [locationId, setLocationId] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("");
    const [coverImagePublicId, setCoverImagePublicId] = useState("");
    const [coverImageAlt, setCoverImageAlt] = useState("");
    const [eventStartsAt, setEventStartsAt] = useState("");
    const [eventEndsAt, setEventEndsAt] = useState("");
    const [eventVenue, setEventVenue] = useState("");
    const [registrationUrl, setRegistrationUrl] = useState("");
    const [editingId, setEditingId] = useState("");
    const [contentSeo, setContentSeo] = useState(blankContentSeo);
    const [submissionNotes, setSubmissionNotes] = useState({});
    const [mediaMetadata, setMediaMetadata] = useState({});

    const [seo, setSeo] = useState(blankSeo);
    const [template, setTemplate] = useState(blankTemplate);
    const [editingTemplate, setEditingTemplate] = useState("");
    const [file, setFile] = useState(null);
    const [uploadPurpose, setUploadPurpose] = useState("place-cover");
    const [alt, setAlt] = useState("");
    const [caption, setCaption] = useState("");

    const isContent = ["places", "guides", "events"].includes(type);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const request = useCallback(async (url, options = {}) => {
        const headers = {
            Accept: "application/json",
            ...(options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }),
            ...(options.headers || {}),
        };

        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            ...options,
            headers,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Request failed.");
        }

        return data;
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pageSize),
            });
            if (search) params.set("q", search);

            const data = await request(
                "/api/admin/content/" + encodeURIComponent(type) + "?" + params
            );

            const nextItems = data.items || [];
            const nextTotal = Number(data.total ?? data.pagination?.total ?? nextItems.length);
            setItems(nextItems);
            setTotal(nextTotal);
            const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
            if (page > nextTotalPages) setPage(nextTotalPages);

            if (type === "seo" && data.items?.[0]) {
                setSeo(Object.fromEntries(Object.keys(blankSeo).map((key) => [key, data.items[0][key] ?? blankSeo[key]])));
            }

            if (isContent) {
                const [locationResult, mediaResult] = await Promise.all([
                    request("/api/admin/locations?status=active&limit=100"),
                    request("/api/admin/content/media?limit=100"),
                ]);
                setLocations(locationResult.items || []);
                setMediaItems(mediaResult.items || []);
            }
        } catch (loadError) {
            setError(loadError.message || "Could not load records.");
        } finally {
            setLoading(false);
        }
    }, [isContent, page, pageSize, request, search, type]);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) load();
        });
        return () => {
            cancelled = true;
        };
    }, [load]);

    function resetContentEditor() {
        setTitle("");
        setSlug("");
        setSummary("");
        setBody("");
        setStatus("draft");
        setLocationId("");
        setCoverImageUrl("");
        setCoverImagePublicId("");
        setCoverImageAlt("");
        setEventStartsAt("");
        setEventEndsAt("");
        setEventVenue("");
        setRegistrationUrl("");
        setContentSeo(blankContentSeo);
        setEditingId("");
    }

    async function createContent(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        try {
            const payload = {
                title,
                slug,
                summary,
                body,
                status,
                location: locationId || null,
                coverImage: {
                    url: coverImageUrl.trim(),
                    publicId: coverImagePublicId.trim(),
                    alt: coverImageAlt.trim(),
                },
                seo: contentSeo,
            };

            if (type === "events") {
                payload.event = {
                    startsAt: eventStartsAt ? new Date(eventStartsAt).toISOString() : null,
                    endsAt: eventEndsAt ? new Date(eventEndsAt).toISOString() : null,
                    venue: eventVenue.trim(),
                    registrationUrl: registrationUrl.trim(),
                };
            }

            if (editingId) {
                await request("/api/admin/content/" + type, {
                    method: "PATCH",
                    body: JSON.stringify({ id: editingId, data: payload }),
                });
            } else {
                await request("/api/admin/content/" + type, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }

            resetContentEditor();
            setNotice(editingId ? "Content changes saved." : "Content saved.");
            await load();
        } catch (saveError) {
            setError(saveError.message || "Could not save content.");
        } finally {
            setBusy(false);
        }
    }

    async function update(id, data) {
        setBusy(true);
        setError("");
        setNotice("");

        try {
            await request("/api/admin/content/" + type, {
                method: "PATCH",
                body: JSON.stringify({ id, data }),
            });
            if (type === "media") {
                setMediaMetadata((current) => {
                    const next = { ...current };
                    delete next[id];
                    return next;
                });
            }
            setNotice("Changes saved.");
            await load();
        } catch (updateError) {
            setError(updateError.message || "Could not save changes.");
        } finally {
            setBusy(false);
        }
    }

    async function reviewSubmission(item, nextStatus) {
        await update(item._id, {
            status: nextStatus,
            adminNotes: submissionNotes[item._id] ?? item.adminNotes ?? "",
        });
    }

    function editContent(item) {
        setEditingId(item._id);
        setTitle(item.title || "");
        setSlug(item.slug || "");
        setSummary(item.summary || "");
        setBody(item.body || "");
        setStatus(item.status || "draft");
        setLocationId(item.location?._id || item.location || "");
        setCoverImageUrl(item.coverImage?.url || "");
        setCoverImagePublicId(item.coverImage?.publicId || "");
        setCoverImageAlt(item.coverImage?.alt || "");
        setEventStartsAt(toDateTimeInput(item.event?.startsAt));
        setEventEndsAt(toDateTimeInput(item.event?.endsAt));
        setEventVenue(item.event?.venue || "");
        setRegistrationUrl(item.event?.registrationUrl || "");
        setContentSeo({
            title: item.seo?.title || "",
            description: item.seo?.description || "",
            canonicalUrl: item.seo?.canonicalUrl || "",
            noIndex: Boolean(item.seo?.noIndex),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function remove(id) {
        const message =
            type === "media"
                ? "Permanently delete this image from Cloudinary and the media library? Deletion is blocked while the image is assigned to content."
                : "Delete this record from the admin database?";
        if (!window.confirm(message)) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            await request(
                "/api/admin/content/" + type + "?id=" + encodeURIComponent(id),
                { method: "DELETE" }
            );
            setNotice(type === "media" ? "Image deleted from Cloudinary and the media library." : "Record removed.");
            await load();
        } catch (removeError) {
            setError(removeError.message || "Could not remove the record.");
        } finally {
            setBusy(false);
        }
    }

    async function saveSeo(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        try {
            await request("/api/admin/content/seo", {
                method: "PATCH",
                body: JSON.stringify({ data: seo }),
            });
            setNotice("Global SEO settings saved.");
            await load();
        } catch (saveError) {
            setError(saveError.message || "Could not save SEO settings.");
        } finally {
            setBusy(false);
        }
    }

    async function saveTemplate(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        try {
            if (editingTemplate) {
                await request("/api/admin/content/seo-templates", {
                    method: "PATCH",
                    body: JSON.stringify({ id: editingTemplate, data: template }),
                });
            } else {
                await request("/api/admin/content/seo-templates", {
                    method: "POST",
                    body: JSON.stringify(template),
                });
            }

            setTemplate(blankTemplate);
            setEditingTemplate("");
            setNotice("SEO template saved.");
            await load();
        } catch (saveError) {
            setError(saveError.message || "Could not save SEO template.");
        } finally {
            setBusy(false);
        }
    }

    async function uploadMedia(event) {
        event.preventDefault();
        const form = event.currentTarget;

        if (!file) {
            setError("Choose an image first.");
            return;
        }

        setBusy(true);
        setError("");
        setNotice("");

        try {
            if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
                throw new Error("Only JPG, PNG, WebP or AVIF images are allowed.");
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new Error("Maximum image size is 5 MB.");
            }

            const signed = await request("/api/admin/uploads/signature", {
                method: "POST",
                body: JSON.stringify({ purpose: uploadPurpose }),
            });
            const upload = signed.upload;
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", upload.apiKey);
            formData.append("timestamp", String(upload.timestamp));
            formData.append("signature", upload.signature);
            formData.append("folder", upload.folder);
            formData.append("public_id", upload.publicId);
            formData.append("upload_preset", upload.uploadPreset);

            const response = await fetch(upload.uploadUrl, {
                method: "POST",
                body: formData,
            });
            const asset = await response.json();

            if (!response.ok) {
                throw new Error(asset.error?.message || "Cloud image upload failed.");
            }
            if (!asset.secure_url || !asset.public_id || !asset.folder) {
                throw new Error("Cloud image provider returned incomplete asset details.");
            }

            await request("/api/admin/content/media", {
                method: "POST",
                body: JSON.stringify({
                    url: asset.secure_url,
                    publicId: asset.public_id,
                    folder: asset.folder,
                    alt,
                    caption,
                    mimeType: asset.resource_type + "/" + asset.format,
                    bytes: asset.bytes,
                    width: asset.width,
                    height: asset.height,
                }),
            });

            setFile(null);
            setUploadPurpose("place-cover");
            setAlt("");
            setCaption("");
            form.reset();
            setNotice("Image uploaded and added to the media library.");
            await load();
        } catch (uploadError) {
            setError(uploadError.message || "Upload failed.");
        } finally {
            setBusy(false);
        }
    }

    function searchRecords(event) {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    if (!labels[type]) {
        return (
            <main className="mx-auto max-w-4xl p-8">
                <h1 className="text-2xl font-bold">Module not found</h1>
                <p className="mt-2 text-slate-600">This admin module does not exist.</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-6xl p-5 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                        Admin workspace
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">{labels[type]}</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Manage records and settings stored in MongoDB.
                    </p>
                </div>
                <button type="button" onClick={load} disabled={loading || busy} className={buttonClass}>
                    Refresh
                </button>
            </div>

            {error && (
                <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {notice && (
                <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {notice}
                </p>
            )}

            {isContent && (
                <form onSubmit={createContent} className="mb-8 grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2">
                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">{editingId ? "Edit content" : "Create content"}</h2>
                        {editingId && (
                            <button type="button" onClick={resetContentEditor} className={buttonClass}>
                                Cancel edit
                            </button>
                        )}
                    </div>

                    <Field label="Title">
                        <input required minLength={2} maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="URL slug">
                        <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={200} value={slug} onChange={(event) => setSlug(event.target.value)} className={inputClass} placeholder="example-local-place" />
                    </Field>
                    <Field label="Summary">
                        <input maxLength={500} value={summary} onChange={(event) => setSummary(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Publication status">
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </Field>
                    <Field label="Location">
                        <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className={inputClass}>
                            <option value="">No location assigned</option>
                            {locations.map((location) => (
                                <option key={location._id} value={location._id}>
                                    {location.name} ({location.type})
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Select a cover image from the media library">
                        <select
                            value={coverImagePublicId}
                            onChange={(event) => {
                                const selected = mediaItems.find((item) => item.publicId === event.target.value);
                                setCoverImagePublicId(selected?.publicId || "");
                                setCoverImageUrl(selected?.url || "");
                                setCoverImageAlt(selected?.alt || "");
                            }}
                            className={inputClass}
                        >
                            <option value="">Choose an uploaded image (optional)</option>
                            {mediaItems.map((media) => (
                                <option key={media._id} value={media.publicId}>
                                    {media.alt || media.caption || media.publicId}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Cover image URL">
                        <input type="url" maxLength={2048} value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} className={inputClass} placeholder="https://..." />
                    </Field>
                    <Field label="Cover image public ID">
                        <input maxLength={300} value={coverImagePublicId} onChange={(event) => setCoverImagePublicId(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Cover image alt text">
                        <input maxLength={200} value={coverImageAlt} onChange={(event) => setCoverImageAlt(event.target.value)} className={inputClass} />
                    </Field>

                    {type === "events" && (
                        <>
                            <Field label="Event starts at">
                                <input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Event ends at (optional)">
                                <input type="datetime-local" value={eventEndsAt} min={eventStartsAt || undefined} onChange={(event) => setEventEndsAt(event.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Venue">
                                <input maxLength={240} value={eventVenue} onChange={(event) => setEventVenue(event.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Registration URL (optional)">
                                <input type="url" maxLength={2048} value={registrationUrl} onChange={(event) => setRegistrationUrl(event.target.value)} className={inputClass} placeholder="https://..." />
                            </Field>
                        </>
                    )}

                    <Field label="Body">
                        <textarea required={status === "published"} value={body} onChange={(event) => setBody(event.target.value)} maxLength={50000} rows={6} className={inputClass} />
                    </Field>
                    <div className="grid gap-3">
                        <Field label="SEO title (optional)">
                            <input maxLength={70} value={contentSeo.title} onChange={(event) => setContentSeo((current) => ({ ...current, title: event.target.value }))} className={inputClass} />
                        </Field>
                        <Field label="SEO description (optional)">
                            <textarea maxLength={170} rows={2} value={contentSeo.description} onChange={(event) => setContentSeo((current) => ({ ...current, description: event.target.value }))} className={inputClass} />
                        </Field>
                    </div>
                    <Field label="Canonical URL (optional)">
                        <input type="url" maxLength={2048} value={contentSeo.canonicalUrl} onChange={(event) => setContentSeo((current) => ({ ...current, canonicalUrl: event.target.value }))} className={inputClass} placeholder="https://..." />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={contentSeo.noIndex} onChange={(event) => setContentSeo((current) => ({ ...current, noIndex: event.target.checked }))} />
                        Exclude this content from search indexing
                    </label>
                    <p className="md:col-span-2 text-xs text-slate-500">
                        Published content requires a summary and body. Published events also require a start date and venue.
                    </p>
                    <button disabled={busy} className="w-fit rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                        {busy ? "Saving…" : editingId ? "Save changes" : status === "published" ? "Publish content" : "Save content"}
                    </button>
                </form>
            )}

            {type === "seo" && (
                <form onSubmit={saveSeo} className="mb-8 grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2">
                    <h2 className="md:col-span-2 text-lg font-semibold">Global SEO defaults</h2>
                    {[
                        ["siteName", "Site name"],
                        ["siteUrl", "Canonical site URL (https://...)"],
                        ["defaultTitle", "Default page title"],
                        ["titleTemplate", "Title template (use %s)"],
                        ["defaultDescription", "Default meta description"],
                        ["defaultImage", "Default social/share image URL"],
                        ["organizationName", "Organization name"],
                        ["organizationLogo", "Organization logo URL"],
                    ].map(([key, label]) => (
                        <Field key={key} label={label}>
                            <input type={["siteUrl", "defaultImage", "organizationLogo"].includes(key) ? "url" : "text"} className={inputClass} value={seo[key] || ""} maxLength={key === "defaultDescription" ? 170 : key === "defaultTitle" ? 70 : 2048} onChange={(event) => setSeo((current) => ({ ...current, [key]: event.target.value }))} />
                        </Field>
                    ))}
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={Boolean(seo.robotsIndex)} onChange={(event) => setSeo((current) => ({ ...current, robotsIndex: event.target.checked }))} />
                        Allow search engine indexing
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={Boolean(seo.sitemapEnabled)} onChange={(event) => setSeo((current) => ({ ...current, sitemapEnabled: event.target.checked }))} />
                        Enable XML sitemap
                    </label>
                    <p className="md:col-span-2 text-xs text-slate-500">
                        Set the canonical site URL before relying on sitemap output. Disabling indexing changes robots directives.
                    </p>
                    <button disabled={busy} className="w-fit rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Save SEO settings</button>
                </form>
            )}

            {type === "seo-templates" && (
                <form onSubmit={saveTemplate} className="mb-8 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2">
                    <h2 className="md:col-span-2 text-lg font-semibold">{editingTemplate ? "Edit SEO template" : "Add SEO template"}</h2>
                    <Field label="Content type">
                        <select disabled={Boolean(editingTemplate)} value={template.entityType} onChange={(event) => setTemplate((current) => ({ ...current, entityType: event.target.value }))} className={inputClass}>
                            {["business", "category", "location", "place", "guide", "event"].map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </Field>
                    <Field label="Title template">
                        <input value={template.titleTemplate} maxLength={160} onChange={(event) => setTemplate((current) => ({ ...current, titleTemplate: event.target.value }))} className={inputClass} />
                    </Field>
                    <Field label="Description template">
                        <input value={template.descriptionTemplate} maxLength={300} onChange={(event) => setTemplate((current) => ({ ...current, descriptionTemplate: event.target.value }))} className={inputClass} />
                    </Field>
                    <Field label="Canonical URL template (optional)">
                        <input value={template.canonicalTemplate} maxLength={300} onChange={(event) => setTemplate((current) => ({ ...current, canonicalTemplate: event.target.value }))} className={inputClass} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={template.noIndexByDefault} onChange={(event) => setTemplate((current) => ({ ...current, noIndexByDefault: event.target.checked }))} />
                        No-index by default
                    </label>
                    <div className="flex gap-2">
                        <button disabled={busy} className="w-fit rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
                            {busy ? "Saving…" : editingTemplate ? "Update template" : "Create template"}
                        </button>
                        {editingTemplate && (
                            <button type="button" onClick={() => { setEditingTemplate(""); setTemplate(blankTemplate); }} className={buttonClass}>Cancel edit</button>
                        )}
                    </div>
                </form>
            )}

            {type === "media" && (
                <form onSubmit={uploadMedia} className="mb-8 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2">
                    <h2 className="md:col-span-2 text-lg font-semibold">Upload image to media library</h2>
                    <Field label="Image file (JPG, PNG, WebP, AVIF; max 5 MB)">
                        <input required type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setFile(event.target.files?.[0] || null)} className={inputClass} />
                    </Field>
                    <Field label="Upload purpose">
                        <select value={uploadPurpose} onChange={(event) => setUploadPurpose(event.target.value)} className={inputClass}>
                            <option value="business-logo">Business logo</option>
                            <option value="business-cover">Business cover</option>
                            <option value="business-gallery">Business gallery</option>
                            <option value="location-cover">Location cover</option>
                            <option value="place-cover">Place cover</option>
                            <option value="place-gallery">Place gallery</option>
                        </select>
                    </Field>
                    <Field label="Alt text">
                        <input value={alt} maxLength={200} onChange={(event) => setAlt(event.target.value)} className={inputClass} placeholder="Describe the image" />
                    </Field>
                    <Field label="Caption (optional)">
                        <input value={caption} maxLength={500} onChange={(event) => setCaption(event.target.value)} className={inputClass} />
                    </Field>
                    <p className="text-xs text-slate-500">
                        Uses a server-signed Cloudinary upload. Do not upload private or sensitive images.
                    </p>
                    <button disabled={busy} className="w-fit rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
                        {busy ? "Uploading…" : "Upload image"}
                    </button>
                </form>
            )}

            <section className="overflow-hidden rounded-2xl border bg-white">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold">
                        {loading ? "Loading records…" : `${total} record${total === 1 ? "" : "s"}`}
                    </p>
                    {type !== "seo" && (
                        <form onSubmit={searchRecords} className="flex w-full gap-2 sm:max-w-md">
                            <input value={searchInput} maxLength={100} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search records…" aria-label="Search records" className={inputClass} />
                            <button disabled={loading} className={buttonClass}>Search</button>
                            {search && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className={buttonClass}>Clear</button>}
                        </form>
                    )}
                </div>

                {!loading && items.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">
                        {search ? "No records match your search." : "No records yet."}
                    </p>
                ) : (
                    <div className="divide-y">
                        {items.map((item) => (
                            <article key={item._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="break-words font-semibold text-slate-800">
                                        {item.title || item.businessName || item.publicId || item.siteName || item.entityType || "Untitled record"}
                                    </p>
                                    <p className="mt-1 break-all text-xs text-slate-500">
                                        {item.slug || item.email || item.folder || item.status || item.siteUrl || ""}
                                    </p>

                                    {type === "media" && (
                                        <>
                                            <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs text-blue-700 underline">
                                                {item.url}
                                            </a>
                                            <div className="mt-3 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                                                <input
                                                    aria-label={"Alt text for " + item.publicId}
                                                    maxLength={200}
                                                    value={mediaMetadata[item._id]?.alt ?? item.alt ?? ""}
                                                    onChange={(event) => setMediaMetadata((current) => ({
                                                        ...current,
                                                        [item._id]: {
                                                            alt: event.target.value,
                                                            caption: current[item._id]?.caption ?? item.caption ?? "",
                                                        },
                                                    }))}
                                                    placeholder="Alt text"
                                                    className="rounded-lg border border-slate-200 p-2 text-xs"
                                                />
                                                <input
                                                    aria-label={"Caption for " + item.publicId}
                                                    maxLength={500}
                                                    value={mediaMetadata[item._id]?.caption ?? item.caption ?? ""}
                                                    onChange={(event) => setMediaMetadata((current) => ({
                                                        ...current,
                                                        [item._id]: {
                                                            alt: current[item._id]?.alt ?? item.alt ?? "",
                                                            caption: event.target.value,
                                                        },
                                                    }))}
                                                    placeholder="Caption"
                                                    className="rounded-lg border border-slate-200 p-2 text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => update(item._id, {
                                                        alt: mediaMetadata[item._id]?.alt ?? item.alt ?? "",
                                                        caption: mediaMetadata[item._id]?.caption ?? item.caption ?? "",
                                                    })}
                                                    className={buttonClass}
                                                >
                                                    Save metadata
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {type === "submissions" && (
                                        <>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {item.contactName || ""} {item.email ? "· " + item.email : ""} {item.phone ? "· " + item.phone : ""}
                                            </p>
                                            <textarea aria-label={"Admin notes for " + (item.businessName || "submission")} maxLength={3000} value={submissionNotes[item._id] ?? item.adminNotes ?? ""} onChange={(event) => setSubmissionNotes((current) => ({ ...current, [item._id]: event.target.value }))} placeholder="Internal review notes" rows={2} className="mt-2 w-full max-w-xl rounded-lg border p-2 text-xs" />
                                            <button disabled={busy} onClick={() => update(item._id, { status: item.status || "pending", adminNotes: submissionNotes[item._id] ?? item.adminNotes ?? "" })} className={buttonClass}>Save notes</button>
                                        </>
                                    )}
                                    {type === "events" && item.event?.startsAt && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Starts {new Date(item.event.startsAt).toLocaleString()} {item.event.venue ? "· " + item.event.venue : ""}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {item.status && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{item.status}</span>}
                                    {isContent && <button disabled={busy} onClick={() => editContent(item)} className={buttonClass}>Edit</button>}
                                    {isContent && item.status !== "published" && (
                                        <button disabled={busy} onClick={() => update(item._id, { status: "published" })} className={buttonClass}>Publish</button>
                                    )}
                                    {isContent && item.status === "published" && (
                                        <button disabled={busy} onClick={() => update(item._id, { status: "draft" })} className={buttonClass}>Unpublish</button>
                                    )}
                                    {type === "submissions" && ["reviewing", "approved", "rejected"].filter((nextStatus) => nextStatus !== item.status).map((nextStatus) => (
                                        <button key={nextStatus} disabled={busy} onClick={() => reviewSubmission(item, nextStatus)} className={buttonClass}>{nextStatus}</button>
                                    ))}
                                    {type === "seo-templates" && (
                                        <button disabled={busy} onClick={() => {
                                            setEditingTemplate(item._id);
                                            setTemplate({
                                                entityType: item.entityType,
                                                titleTemplate: item.titleTemplate || "",
                                                descriptionTemplate: item.descriptionTemplate || "",
                                                canonicalTemplate: item.canonicalTemplate || "",
                                                noIndexByDefault: Boolean(item.noIndexByDefault),
                                            });
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }} className={buttonClass}>Edit</button>
                                    )}
                                    {["places", "guides", "events", "media", "seo-templates"].includes(type) && (
                                        <button disabled={busy} onClick={() => remove(item._id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Delete</button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
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
