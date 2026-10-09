
"use client";

import { useEffect, useState } from "react";
import OpenStreetMapPlaceAutocomplete from "@/components/openstreetmap-place-autocomplete";

const TYPES = [
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

const METHODS = [
    ["any", "Any method"],
    ["phone", "Phone"],
    ["whatsapp", "WhatsApp"],
    ["email", "Email"],
    ["website", "Website"],
];

const PRICES = [
    ["not_applicable", "Not applicable"],
    ["budget", "Budget"],
    ["moderate", "Moderate"],
    ["premium", "Premium"],
    ["luxury", "Luxury"],
];

const inputClass =
    "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClass = "block text-xs font-semibold text-slate-700";
const blankImage = { url: "", publicId: "", alt: "" };

function slugify(value) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 180);
}

function imageValue(value) {
    return value ? { ...blankImage, ...value } : { ...blankImage };
}

const DAYS = [
    ["monday", "Monday"],
    ["tuesday", "Tuesday"],
    ["wednesday", "Wednesday"],
    ["thursday", "Thursday"],
    ["friday", "Friday"],
    ["saturday", "Saturday"],
    ["sunday", "Sunday"],
];

function weeklyHoursToText(weekly = {}) {
    return Object.fromEntries(
        DAYS.map(([day]) => [
            day,
            (weekly[day] || [])
                .map((period) => `${period.open}-${period.close}`)
                .join(", "),
        ])
    );
}

function parseWeeklyHours(textByDay) {
    const weekly = {};
    for (const [day] of DAYS) {
        const value = String(textByDay?.[day] || "").trim();
        if (!value) {
            weekly[day] = [];
            continue;
        }
        weekly[day] = value.split(",").map((range) => {
            const [open, close, ...extra] = range.trim().split("-").map((part) => part.trim());
            if (!open || !close || extra.length) {
                throw new Error(`Enter opening hours for ${day} as HH:mm-HH:mm. Separate multiple periods with commas.`);
            }
            return { open, close };
        });
    }
    return weekly;
}

function linesToArray(value) {
    return String(value || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
}

function buildInitialForm(business) {
    return {
        name: business?.name || "",
        slug: business?.slug || "",
        tagline: business?.tagline || "",
        description: business?.description || "",
        businessType: business?.businessType || "business",
        establishedYear: business?.establishedYear ?? "",
        category: business?.category?._id || business?.category || "",
        location: business?.location?._id || business?.location || "",
        status: business?.status || "draft",
        verificationStatus: business?.verificationStatus || "unverified",
        isFeatured: Boolean(business?.isFeatured),
        contact: {
            phone: "",
            alternatePhone: "",
            whatsapp: "",
            email: "",
            website: "",
            preferredMethod: "any",
            ...(business?.contact || {}),
        },
        address: {
            line1: "",
            line2: "",
            area: "",
            city: "",
            district: "",
            state: "",
            country: "India",
            postalCode: "",
            formatted: "",
            ...(business?.address || {}),
        },
        logo: imageValue(business?.logo),
        coverImage: imageValue(business?.coverImage),
        images: (business?.images || []).map(imageValue),
        socialLinks: {
            instagram: "",
            facebook: "",
            youtube: "",
            linkedin: "",
            x: "",
            tiktok: "",
            ...(business?.socialLinks || {}),
        },
        openingHoursText: weeklyHoursToText(business?.openingHours?.weekly),
        openingHoursNotes: business?.openingHours?.notes || "",
        paymentMethodsText: (business?.paymentMethods || []).join("\n"),
        languagesText: (business?.languages || []).join("\n"),
        seo: {
            title: "",
            description: "",
            canonicalUrl: "",
            noIndex: false,
            ...(business?.seo || {}),
        },
        priceRange: business?.priceRange || "not_applicable",
        servicesText: (business?.services || []).join("\n"),
        amenitiesText: (business?.amenities || []).join("\n"),
        serviceAreasText: (business?.serviceAreas || []).join(", "),
        coordinates: {
            latitude: business?.coordinates?.latitude ?? "",
            longitude: business?.coordinates?.longitude ?? "",
        },
    };
}

function toPayload(form) {
    const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        businessType: form.businessType,
        category: form.category,
        location: form.location,
        status: form.status,
        verificationStatus: form.verificationStatus,
        isFeatured: Boolean(form.isFeatured),
        priceRange: form.priceRange,
        contact: {
            phone: form.contact.phone.trim(),
            alternatePhone: form.contact.alternatePhone.trim(),
            whatsapp: form.contact.whatsapp.trim(),
            email: form.contact.email.trim(),
            website: form.contact.website.trim(),
            preferredMethod: form.contact.preferredMethod,
        },
        socialLinks: Object.fromEntries(
            Object.entries(form.socialLinks).map(([key, value]) => [
                key,
                typeof value === "string" ? value.trim() : value,
            ])
        ),
        address: Object.fromEntries(
            Object.entries(form.address).map(([key, value]) => [
                key,
                typeof value === "string" ? value.trim() : value,
            ])
        ),
        openingHours: {
            timezone: "Asia/Kolkata",
            notes: form.openingHoursNotes.trim(),
            weekly: parseWeeklyHours(form.openingHoursText),
        },
        paymentMethods: linesToArray(form.paymentMethodsText),
        languages: linesToArray(form.languagesText),
        images: form.images,
        services: form.servicesText
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
        amenities: form.amenitiesText
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
        serviceAreas: form.serviceAreasText
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        seo: {
            title: form.seo.title.trim(),
            description: form.seo.description.trim(),
            canonicalUrl: form.seo.canonicalUrl.trim(),
            noIndex: Boolean(form.seo.noIndex),
        },
        logo: form.logo.url ? form.logo : null,
        coverImage: form.coverImage.url ? form.coverImage : null,
        coordinates: {
            latitude:
                form.coordinates.latitude === ""
                    ? null
                    : Number(form.coordinates.latitude),
            longitude:
                form.coordinates.longitude === ""
                    ? null
                    : Number(form.coordinates.longitude),
        },
    };

    if (form.establishedYear === "" || form.establishedYear === null) {
        payload.establishedYear = null;
    } else {
        payload.establishedYear = Number(form.establishedYear);
    }

    return payload;
}

function Field({ label, children, hint }) {
    return (
        <label className={labelClass}>
            {label}
            {children}
            {hint && <span className="mt-1 block text-[11px] font-normal leading-5 text-slate-500">{hint}</span>}
        </label>
    );
}

function Section({ title, description, children }) {
    return (
        <section className="border-b border-slate-100 px-5 py-6 sm:px-7">
            <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}

export default function BusinessForm({ business, onClose, onSaved }) {
    const isEditing = Boolean(business?._id);
    const [form, setForm] = useState(() => buildInitialForm(business));
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [slugTouched, setSlugTouched] = useState(isEditing);

    useEffect(() => {
        let active = true;

        async function loadOptions() {
            setLoadingOptions(true);

            try {
                const [categoryResponse, locationResponse] = await Promise.all([
                    fetch("/api/admin/categories?limit=100&status=active", {
                        credentials: "same-origin",
                        cache: "no-store",
                    }),
                    fetch("/api/admin/locations?limit=100&status=active", {
                        credentials: "same-origin",
                        cache: "no-store",
                    }),
                ]);

                const [categoryData, locationData] = await Promise.all([
                    categoryResponse.json(),
                    locationResponse.json(),
                ]);

                if (!categoryResponse.ok || !categoryData.success) {
                    throw new Error(categoryData.message || "Could not load categories.");
                }

                if (!locationResponse.ok || !locationData.success) {
                    throw new Error(locationData.message || "Could not load locations.");
                }

                if (active) {
                    setCategories(categoryData.items || []);
                    setLocations(locationData.items || []);
                }
            } catch (err) {
                if (active) setError(err.message || "Could not load categories and locations.");
            } finally {
                if (active) setLoadingOptions(false);
            }
        }

        loadOptions();

        return () => {
            active = false;
        };
    }, []);

    function setValue(key, value) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function setNested(group, key, value) {
        setForm((current) => ({
            ...current,
            [group]: { ...current[group], [key]: value },
        }));
    }

    async function uploadImage(file, purpose) {
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

        if (!allowedTypes.includes(file.type)) {
            setError("Choose a JPG, PNG, WebP, or AVIF image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Each image must be 5 MB or smaller.");
            return;
        }

        setError("");
        setUploading(purpose);

        try {
            const signatureResponse = await fetch("/api/admin/uploads/signature", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purpose }),
            });

            const signatureData = await signatureResponse.json();

            if (!signatureResponse.ok || !signatureData.success) {
                throw new Error(signatureData.message || "Could not prepare image upload.");
            }

            const config = signatureData.upload;
            const body = new FormData();

            body.append("file", file);
            body.append("api_key", config.apiKey);
            body.append("timestamp", String(config.timestamp));
            body.append("signature", config.signature);
            body.append("folder", config.folder);
            body.append("public_id", config.publicId);
            body.append("upload_preset", config.uploadPreset);

            const uploadResponse = await fetch(config.uploadUrl, {
                method: "POST",
                body,
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadData.secure_url || !uploadData.public_id) {
                throw new Error(uploadData.error?.message || "Cloudinary image upload failed.");
            }

            const image = {
                url: uploadData.secure_url,
                publicId: uploadData.public_id,
                alt: file.name.replace(/\.[^.]+$/, "").slice(0, 200),
            };

            if (purpose === "business-logo") setValue("logo", image);
            else if (purpose === "business-cover") setValue("coverImage", image);
            else setForm((current) => ({
                ...current,
                images: [...current.images, image].slice(0, 20),
            }));

            setError("");
        } catch (err) {
            setError(err.message || "Image upload failed.");
        } finally {
            setUploading("");
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setFieldErrors({});

        const publishIntent = event.nativeEvent?.submitter?.value === "publish";
        let payload;

        try {
            payload = toPayload(form);
        } catch (payloadError) {
            setError(payloadError.message || "Check the business form values.");
            return;
        }

        // The dedicated Publish action must publish even when the status
        // dropdown is still set to Draft.
        if (publishIntent) payload.status = "published";

        if (!payload.name || payload.name.length < 2) {
            setFieldErrors({ name: "Enter a business name of at least 2 characters." });
            return;
        }

        if (!payload.slug) {
            setFieldErrors({ slug: "Enter a valid URL slug." });
            return;
        }

        if (payload.status === "published" && !payload.description.trim()) {
            setError("Add a business description before publishing this listing.");
            return;
        }

        if (!payload.category || !payload.location) {
            setError("Choose both a category and a location.");
            return;
        }

        if (
            (payload.coordinates.latitude === null) !==
            (payload.coordinates.longitude === null)
        ) {
            setError("Provide both latitude and longitude, or leave both empty.");
            return;
        }

        if (payload.establishedYear !== null && (
            !Number.isInteger(payload.establishedYear) ||
            payload.establishedYear < 1800 ||
            payload.establishedYear > new Date().getFullYear()
        )) {
            setError("Enter a valid established year.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                isEditing
                    ? `/api/admin/businesses/${business._id}`
                    : "/api/admin/businesses",
                {
                    method: isEditing ? "PATCH" : "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (Array.isArray(data.details)) {
                    setFieldErrors(
                        Object.fromEntries(
                            data.details.map((item) => [item.field, item.message])
                        )
                    );
                }

                throw new Error(
                    data.details?.[0]?.message ||
                    data.message ||
                    "Could not save business."
                );
            }

            onSaved(
                payload.status === "published"
                    ? "Business published successfully."
                    : payload.status === "archived"
                        ? "Business archived successfully."
                        : isEditing
                            ? "Business draft saved successfully."
                            : "Business draft created successfully."
            );
        } catch (err) {
            setError(err.message || "Could not save business.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mb-6 w-full min-w-0">
            <section aria-labelledby="business-form-title" className="flex max-h-[calc(100vh-9rem)] min-h-[32rem] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                            BUSINESS MANAGEMENT
                        </p>
                        <h2 id="business-form-title" className="mt-1 text-lg font-bold text-slate-900">
                            {isEditing ? "Edit business" : "Add business"}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {isEditing ? "Update this business record." : "Create a new business listing."}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close form" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                        ✕
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {error && (
                            <div role="alert" className="mx-5 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800 sm:mx-7">
                                {error}
                            </div>
                        )}

                        <Section title="Business identity" description="Public name, URL, classification, and publication state.">
                            <Field label="Business name *">
                                <input required minLength={2} maxLength={160} className={inputClass} value={form.name} onChange={(event) => {
                                    const name = event.target.value;
                                    setForm((current) => ({
                                        ...current,
                                        name,
                                        slug: slugTouched ? current.slug : slugify(name),
                                    }));
                                }} placeholder="e.g. Ghoti Family Restaurant" />
                                {fieldErrors.name && <span className="mt-1 block text-[11px] text-rose-600">{fieldErrors.name}</span>}
                            </Field>

                            <Field label="URL slug *" hint="Lowercase letters, numbers, and hyphens only.">
                                <input required maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} value={form.slug} onChange={(event) => {
                                    setSlugTouched(true);
                                    setValue("slug", slugify(event.target.value));
                                }} placeholder="ghoti-family-restaurant" />
                                {fieldErrors.slug && <span className="mt-1 block text-[11px] text-rose-600">{fieldErrors.slug}</span>}
                            </Field>

                            <Field label="Tagline">
                                <input maxLength={200} className={inputClass} value={form.tagline} onChange={(event) => setValue("tagline", event.target.value)} />
                            </Field>

                            <Field label="Business type *">
                                <select className={inputClass} value={form.businessType} onChange={(event) => setValue("businessType", event.target.value)}>
                                    {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </Field>

                            <Field label="Category *">
                                <select required disabled={loadingOptions} className={inputClass} value={form.category} onChange={(event) => setValue("category", event.target.value)}>
                                    <option value="">{loadingOptions ? "Loading categories…" : "Select category"}</option>
                                    {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                                    {isEditing && form.category && !categories.some((item) => item._id === form.category) && <option value={form.category}>Current category (inactive)</option>}
                                </select>
                            </Field>

                            <Field label="Location *">
                                <select required disabled={loadingOptions} className={inputClass} value={form.location} onChange={(event) => setValue("location", event.target.value)}>
                                    <option value="">{loadingOptions ? "Loading locations…" : "Select location"}</option>
                                    {locations.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.type}</option>)}
                                    {isEditing && form.location && !locations.some((item) => item._id === form.location) && <option value={form.location}>Current location (inactive)</option>}
                                </select>
                            </Field>

                            <Field label="Publication status">
                                <select className={inputClass} value={form.status} onChange={(event) => setValue("status", event.target.value)}>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </Field>

                            <Field label="Verification status">
                                <select className={inputClass} value={form.verificationStatus} onChange={(event) => setValue("verificationStatus", event.target.value)}>
                                    <option value="unverified">Unverified</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </Field>

                            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                                <input type="checkbox" checked={form.isFeatured} onChange={(event) => setValue("isFeatured", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                <span>
                                    <span className="block text-xs font-semibold text-slate-800">Featured listing</span>
                                    <span className="mt-1 block text-[11px] leading-5 text-slate-500">Mark this business as featured for supported directory placements.</span>
                                </span>
                            </label>

                            <div className="sm:col-span-2">
                                <Field label="Description *" hint="Required before a business can be published.">
                                    <textarea required={form.status === "published"} maxLength={10000} rows={5} className={`${inputClass} py-3`} value={form.description} onChange={(event) => setValue("description", event.target.value)} placeholder="Describe the business, services, and what visitors should know." />
                                </Field>
                            </div>

                            <Field label="Established year">
                                <input type="number" min="1800" max={new Date().getFullYear()} className={inputClass} value={form.establishedYear} onChange={(event) => setValue("establishedYear", event.target.value)} placeholder="e.g. 2018" />
                            </Field>

                            <Field label="Price range">
                                <select className={inputClass} value={form.priceRange} onChange={(event) => setValue("priceRange", event.target.value)}>
                                    {PRICES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </Field>
                        </Section>

                        <Section title="Contact information" description="These fields are optional unless your business requirements specify otherwise.">
                            {[
                                ["phone", "Phone", "tel"],
                                ["alternatePhone", "Alternate phone", "tel"],
                                ["whatsapp", "WhatsApp number", "tel"],
                                ["email", "Email address", "email"],
                                ["website", "Website URL", "url"],
                            ].map(([key, label, type]) => (
                                <Field key={key} label={label}>
                                    <input type={type} maxLength={key === "email" ? 254 : 2048} className={inputClass} value={form.contact[key] || ""} onChange={(event) => setNested("contact", key, event.target.value)} placeholder={type === "url" ? "https://example.com" : ""} />
                                </Field>
                            ))}

                            <Field label="Preferred contact method">
                                <select className={inputClass} value={form.contact.preferredMethod} onChange={(event) => setNested("contact", "preferredMethod", event.target.value)}>
                                    {METHODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </Field>
                        </Section>

                        <Section title="Address & coordinates" description="Search OpenStreetMap to fill available address fields and coordinates.">
                            <div className="sm:col-span-2">
                                <OpenStreetMapPlaceAutocomplete
                                    inputId="admin-business-address-search"
                                    label="FIND ADDRESS WITH OPENSTREETMAP"
                                    value={form.address.formatted || ""}
                                    placeholder="Search a business address, town or village"
                                    onChange={(value) => {
                                        setNested("address", "formatted", value);
                                        setValue("coordinates", { latitude: "", longitude: "" });
                                    }}
                                    onSelect={(place) => {
                                        if (!place) {
                                            setValue("coordinates", { latitude: "", longitude: "" });
                                            return;
                                        }
                                        setValue("address", {
                                            ...form.address,
                                            formatted: place.formattedAddress || place.description || "",
                                            area: place.address?.area || form.address.area || "",
                                            city: place.address?.city || form.address.city || "",
                                            district: place.address?.district || form.address.district || "",
                                            state: place.address?.state || form.address.state || "",
                                            country: place.address?.country || form.address.country || "India",
                                            postalCode: place.address?.postalCode || form.address.postalCode || "",
                                        });
                                        setValue("coordinates", {
                                            latitude: place.latitude ?? "",
                                            longitude: place.longitude ?? "",
                                        });
                                    }}
                                />
                                <p className="mt-2 text-xs font-normal leading-5 text-slate-500">Choose an OpenStreetMap result to save its available coordinates. You can still edit the address fields below.</p>
                            </div>
                            {[
                                ["line1", "Address line 1"],
                                ["line2", "Address line 2"],
                                ["area", "Area / locality"],
                                ["city", "City / town"],
                                ["district", "District"],
                                ["state", "State"],
                                ["postalCode", "Postal code"],
                                ["country", "Country"],
                                ["formatted", "Formatted address"],
                            ].map(([key, label]) => (
                                <Field key={key} label={label}>
                                    <input maxLength={key === "formatted" ? 500 : 200} className={inputClass} value={form.address[key] || ""} onChange={(event) => setNested("address", key, event.target.value)} />
                                </Field>
                            ))}

                            <Field label="Latitude">
                                <input type="number" step="any" min="-90" max="90" className={inputClass} value={form.coordinates.latitude} onChange={(event) => setNested("coordinates", "latitude", event.target.value)} placeholder="Optional" />
                            </Field>

                            <Field label="Longitude">
                                <input type="number" step="any" min="-180" max="180" className={inputClass} value={form.coordinates.longitude} onChange={(event) => setNested("coordinates", "longitude", event.target.value)} placeholder="Optional" />
                            </Field>

                            <div className="sm:col-span-2">
                                <Field label="Service areas" hint="Separate areas with commas.">
                                    <input maxLength={3000} className={inputClass} value={form.serviceAreasText} onChange={(event) => setValue("serviceAreasText", event.target.value)} placeholder="Ghoti, Igatpuri, Nashik" />
                                </Field>
                            </div>
                        </Section>

                        <Section title="Social links" description="Optional public profiles. Use full HTTP or HTTPS URLs.">
                            {[
                                ["instagram", "Instagram"],
                                ["facebook", "Facebook"],
                                ["youtube", "YouTube"],
                                ["linkedin", "LinkedIn"],
                                ["x", "X"],
                                ["tiktok", "TikTok"],
                            ].map(([key, label]) => (
                                <Field key={key} label={label}>
                                    <input type="url" maxLength={2048} className={inputClass} value={form.socialLinks[key] || ""} onChange={(event) => setNested("socialLinks", key, event.target.value)} placeholder="https://…" />
                                </Field>
                            ))}
                        </Section>

                        <Section title="Opening hours" description="Use 24-hour HH:mm times. Example: 09:00-13:00, 17:00-21:00. Leave a day empty when closed.">
                            {DAYS.map(([day, label]) => (
                                <Field key={day} label={label} hint="Multiple periods can be separated by commas.">
                                    <input maxLength={300} className={inputClass} value={form.openingHoursText[day] || ""} onChange={(event) => setNested("openingHoursText", day, event.target.value)} placeholder="09:00-18:00" />
                                </Field>
                            ))}
                            <div className="sm:col-span-2">
                                <Field label="Opening-hours notes">
                                    <textarea rows={2} maxLength={500} className={`${inputClass} py-3`} value={form.openingHoursNotes} onChange={(event) => setValue("openingHoursNotes", event.target.value)} placeholder="Holiday hours, appointment-only details, etc." />
                                </Field>
                            </div>
                        </Section>

                        <Section title="Business images" description="JPG, PNG, WebP, or AVIF. Maximum 5 MB per image.">
                            {[
                                ["logo", "Business logo", "business-logo"],
                                ["coverImage", "Cover image", "business-cover"],
                            ].map(([key, label, purpose]) => (
                                <div key={key} className="min-w-0">
                                    <p className={labelClass}>{label}</p>
                                    {form[key].url && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <img src={form[key].url} alt={form[key].alt || ""} className="h-16 w-16 rounded-xl border border-slate-200 object-cover" />
                                            <button type="button" onClick={() => setValue(key, { ...blankImage })} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Remove image</button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        disabled={Boolean(uploading)}
                                        className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700`}
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            event.target.value = "";
                                            uploadImage(file, purpose);
                                        }}
                                    />
                                    {uploading === purpose && <p role="status" className="mt-2 text-xs text-blue-600">Uploading image…</p>}
                                </div>
                            ))}
                        </Section>

                        <Section title="Services & amenities" description="Enter one item per line.">
                            <Field label="Services">
                                <textarea rows={4} maxLength={12000} className={`${inputClass} py-3`} value={form.servicesText} onChange={(event) => setValue("servicesText", event.target.value)} placeholder={"Dine-in\nTakeaway"} />
                            </Field>
                            <Field label="Amenities">
                                <textarea rows={4} maxLength={8000} className={`${inputClass} py-3`} value={form.amenitiesText} onChange={(event) => setValue("amenitiesText", event.target.value)} placeholder={"Parking\nWi-Fi"} />
                            </Field>
                        </Section>

                        <Section title="Gallery images" description="Upload up to 20 gallery images. Add alt text to improve accessibility.">
                            <div className="sm:col-span-2">
                                <div className={labelClass}>
                                    <span>Gallery images ({form.images.length}/20)</span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        disabled={Boolean(uploading) || form.images.length >= 20}
                                        className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700`}
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            event.target.value = "";
                                            if (form.images.length >= 20) {
                                                setError("A business can have at most 20 gallery images.");
                                                return;
                                            }
                                            uploadImage(file, "business-gallery");
                                        }}
                                    />
                                    {form.images.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            {form.images.map((image, index) => (
                                                <div key={image.publicId || `${image.url}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200">
                                                    <img src={image.url} alt={image.alt || ""} className="h-28 w-full object-cover" />
                                                    <button type="button" onClick={() => setValue("images", form.images.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-xs font-semibold text-rose-700 shadow">Remove</button>
                                                    <input aria-label={`Gallery image ${index + 1} alt text`} maxLength={200} value={image.alt || ""} onChange={(event) => setValue("images", form.images.map((item, imageIndex) => imageIndex === index ? { ...item, alt: event.target.value } : item))} className="w-full border-t border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500" placeholder="Image alt text" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Section>

                        <Section title="Additional details" description="Optional payment options and languages supported. Enter one item per line.">
                            <Field label="Payment methods">
                                <textarea rows={3} maxLength={1500} className={`${inputClass} py-3`} value={form.paymentMethodsText} onChange={(event) => setValue("paymentMethodsText", event.target.value)} placeholder={"Cash\\nUPI\\nCredit card"} />
                            </Field>
                            <Field label="Languages">
                                <textarea rows={3} maxLength={1500} className={`${inputClass} py-3`} value={form.languagesText} onChange={(event) => setValue("languagesText", event.target.value)} placeholder={"Marathi\\nHindi\\nEnglish"} />
                            </Field>
                        </Section>

                        <Section title="SEO overrides" description="These overrides will be used by the SEO engine when it is implemented.">
                            <div className="sm:col-span-2">
                                <Field label="SEO title" hint="Maximum 70 characters. Leave empty to use the future template fallback.">
                                    <input maxLength={70} className={inputClass} value={form.seo.title} onChange={(event) => setNested("seo", "title", event.target.value)} />
                                    <span className="mt-1 block text-right text-[11px] font-normal text-slate-400">{form.seo.title.length}/70</span>
                                </Field>
                            </div>

                            <div className="sm:col-span-2">
                                <Field label="SEO description" hint="Maximum 170 characters.">
                                    <textarea rows={3} maxLength={170} className={`${inputClass} py-3`} value={form.seo.description} onChange={(event) => setNested("seo", "description", event.target.value)} />
                                    <span className="mt-1 block text-right text-[11px] font-normal text-slate-400">{form.seo.description.length}/170</span>
                                </Field>
                            </div>

                            <div className="sm:col-span-2">
                                <Field label="Canonical URL" hint="Optional absolute HTTP/HTTPS URL.">
                                    <input type="url" maxLength={2048} className={inputClass} value={form.seo.canonicalUrl} onChange={(event) => setNested("seo", "canonicalUrl", event.target.value)} placeholder="https://example.com/business/slug" />
                                </Field>
                            </div>

                            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2">
                                <input type="checkbox" checked={Boolean(form.seo.noIndex)} onChange={(event) => setNested("seo", "noIndex", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                <span>
                                    <span className="block text-xs font-semibold text-slate-800">No-index this business</span>
                                    <span className="mt-1 block text-[11px] leading-5 text-slate-500">SEO directive only. The actual public metadata behavior must be wired into the central SEO engine.</span>
                                </span>
                            </label>
                        </Section>
                    </div>

                    <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <p className="text-[11px] text-slate-400">
                            {isEditing ? "Changes update the existing record." : "The business will be saved using the selected status."}
                        </p>
                        <div className="flex flex-wrap justify-end gap-3">
                            <button type="button" onClick={onClose} disabled={saving || Boolean(uploading)} className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                                Cancel
                            </button>
                            {form.status !== "published" && (
                                <button
                                    type="submit"
                                    name="intent"
                                    value="publish"
                                    disabled={saving || Boolean(uploading) || loadingOptions}
                                    className="min-h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? "Saving…" : "Publish business"}
                                </button>
                            )}
                            <button type="submit" name="intent" value="save" disabled={saving || Boolean(uploading) || loadingOptions} className="min-h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                                {saving
                                    ? "Saving…"
                                    : form.status === "published"
                                        ? "Save & publish"
                                        : form.status === "archived"
                                            ? "Save as archived"
                                            : isEditing
                                                ? "Save draft"
                                                : "Create draft"}
                            </button>
                        </div>
                    </footer>
                </form>
            </section>
        </div>
    );
}
