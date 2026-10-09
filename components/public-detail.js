"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicNavbar from "@/components/public-navbar";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #edf5eb 0%, #dceadc 100%)",
  "linear-gradient(135deg, #edf3f7 0%, #d8e5ef 100%)",
  "linear-gradient(135deg, #f7f1e9 0%, #ece0d2 100%)",
  "linear-gradient(135deg, #f2f7ef 0%, #e1ece0 100%)",
  "linear-gradient(135deg, #f4eff7 0%, #e5dce9 100%)",
  "linear-gradient(135deg, #edf6f5 0%, #d8ebe9 100%)",
];

function imageOf(item) {
  return item?.coverImage?.url || item?.images?.[0]?.url || item?.logo?.url || "";
}

function renderCategorySvg(iconName, size = 22) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const name = String(iconName || "").toLowerCase();

  if (
    name.includes("utensil") ||
    name.includes("food") ||
    name.includes("restaurant") ||
    name.includes("dhaba") ||
    name.includes("cafe") ||
    name.includes("dine")
  ) {
    return (
      <svg {...common}>
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
        <path d="M15 11v11" />
        <path d="M6 2v20" />
        <path d="M6 2c2 0 3 2 3 4s-1 4-3 4" />
      </svg>
    );
  }
  if (
    name.includes("bed") ||
    name.includes("hotel") ||
    name.includes("stay") ||
    name.includes("resort") ||
    name.includes("lodge")
  ) {
    return (
      <svg {...common}>
        <path d="M2 4v16" />
        <path d="M2 8h18a2 2 0 0 1 2 2v10" />
        <path d="M2 17h20" />
        <path d="M6 8v9" />
      </svg>
    );
  }
  if (
    name.includes("bag") ||
    name.includes("shop") ||
    name.includes("retail") ||
    name.includes("store") ||
    name.includes("market")
  ) {
    return (
      <svg {...common}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  if (
    name.includes("health") ||
    name.includes("medic") ||
    name.includes("clinic") ||
    name.includes("doctor") ||
    name.includes("pharmacy") ||
    name.includes("wellness")
  ) {
    return (
      <svg {...common}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }
  if (
    name.includes("briefcase") ||
    name.includes("service") ||
    name.includes("profess") ||
    name.includes("finance") ||
    name.includes("legal")
  ) {
    return (
      <svg {...common}>
        <rect width="20" height="14" x="2" y="7" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (
    name.includes("map") ||
    name.includes("tour") ||
    name.includes("attract") ||
    name.includes("visit") ||
    name.includes("guide")
  ) {
    return (
      <svg {...common}>
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" x2="9" y1="3" y2="18" />
        <line x1="15" x2="15" y1="6" y2="21" />
      </svg>
    );
  }
  if (name.includes("camera") || name.includes("photo")) {
    return (
      <svg {...common}>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    );
  }
  if (
    name.includes("wrench") ||
    name.includes("repair") ||
    name.includes("auto") ||
    name.includes("tool") ||
    name.includes("garage")
  ) {
    return (
      <svg {...common}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    );
  }

  // Default store / location icon
  return (
    <svg {...common}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2" />
    </svg>
  );
}

function Card({ item }) {
  const image = imageOf(item);
  const initial = (item.name || "L").charAt(0).toUpperCase();
  const place = [item.address?.area, item.address?.city, item.location?.name]
    .filter(Boolean)
    .join(", ");
  const fallbackGradient =
    FALLBACK_GRADIENTS[Math.abs(item.name?.charCodeAt(0) || 0) % FALLBACK_GRADIENTS.length];

  return (
    <article className="saas-business-card">
      <Link href={`/businesses/${item.slug}`} className="saas-card-media" tabIndex={-1}>
        {image ? (
          <img
            src={image}
            alt={item.coverImage?.alt || item.name}
            loading="lazy"
            className="saas-card-img"
          />
        ) : (
          <div className="saas-card-art-fallback" style={{ background: fallbackGradient }}>
            <div className="art-pattern-grid" aria-hidden="true" />
            <div className="art-monogram-circle">
              <span>{initial}</span>
            </div>
            <span className="art-watermark">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
                <path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2" />
              </svg>
              <span>GAAVCONNECT LOCAL</span>
            </span>
          </div>
        )}

        {/* Badges floating on card media */}
        <div className="saas-card-badges-top">
          <span className="card-badge category-badge">
            {item.category?.name || "Local place"}
          </span>

          <div className="card-badges-right">
            {item.isFeatured && (
              <span className="card-badge featured-badge" title="Featured local business">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Featured</span>
              </span>
            )}
            {item.verificationStatus === "verified" && (
              <span className="card-badge verified-badge" title="Verified local listing">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Verified</span>
              </span>
            )}
          </div>
        </div>

        <div className="saas-card-overlay" aria-hidden="true" />
      </Link>

      <div className="saas-card-body">
        <div className="saas-card-type-row">
          <span className="type-badge-pill">
            {item.businessType?.replace(/_/g, " ") || "local business"}
          </span>
          {item.contact?.phone && (
            <span className="quick-contact-pill" title="Phone verified">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Available</span>
            </span>
          )}
        </div>

        <h3 className="saas-card-title">
          <Link href={`/businesses/${item.slug}`}>{item.name}</Link>
        </h3>

        <p className="saas-card-description">
          {item.tagline ||
            item.description ||
            "Discover verified services, local contact, and directions."}
        </p>

        <div className="saas-card-footer">
          <span className="saas-location-tag" title={place || "Local area"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{place || "Nashik District"}</span>
          </span>

          <Link
            href={`/businesses/${item.slug}`}
            className="saas-details-action"
            aria-label={`Explore ${item.name}`}
          >
            <span>View details</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

function CategoryShowcaseCard({ title, item, parent, children, businessCount, slug }) {
  const icon = item?.icon || "utensils";
  return (
    <div className="saas-category-hero-card">
      <div className="cat-card-top">
        <div className="cat-card-icon-wrap">
          {renderCategorySvg(icon, 24)}
        </div>
        <div className="cat-card-status-pill">
          <span className="cat-pulse-dot" />
          <span>Verified Sector</span>
        </div>
      </div>

      <div className="cat-card-body">
        <span className="cat-card-subtitle">SECTOR OVERVIEW</span>
        <h2 className="cat-card-heading">{title}</h2>
        {parent && (
          <Link href={`/categories/${parent.slug}`} className="cat-card-parent-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Part of {parent.name}</span>
          </Link>
        )}
        <p className="cat-card-desc">
          {item?.description || "Curated local business directory for Ghoti, Igatpuri and Nashik district."}
        </p>
      </div>

      <div className="cat-card-stats-row">
        <div className="cat-stat-cell">
          <span className="cat-stat-num">{businessCount}</span>
          <span className="cat-stat-lbl">{businessCount === 1 ? "Listed place" : "Listed places"}</span>
        </div>
        <div className="cat-stat-divider" />
        <div className="cat-stat-cell">
          <span className="cat-stat-num">{children.length}</span>
          <span className="cat-stat-lbl">{children.length === 1 ? "Subcategory" : "Subcategories"}</span>
        </div>
        <div className="cat-stat-divider" />
        <div className="cat-stat-cell">
          <span className="cat-stat-num">Nashik</span>
          <span className="cat-stat-lbl">District</span>
        </div>
      </div>

      <div className="cat-card-bottom">
        <span className="cat-card-verified-tag">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>GaavConnect Directory</span>
        </span>
        <Link href={`/add-business?category=${encodeURIComponent(slug)}`} className="cat-card-add-btn">
          <span>+ Add Place</span>
        </Link>
      </div>
    </div>
  );
}

export default function PublicDetail({ kind, slug, initialItem = null, initialData = null }) {
  const [data, setData] = useState(
    initialData
      ? initialData
      : initialItem
      ? { success: true, item: initialItem }
      : null
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(!initialData && !initialItem);
  const [error, setError] = useState("");
  const [activeGalleryImage, setActiveGalleryImage] = useState(null);

  useEffect(() => {
    // If initialData is supplied and we're on page 1, skip re-fetch
    if (initialData && page === 1) {
      return;
    }
    // If we already have the initial item for a single business and we're on page 1, skip re-fetch
    if (initialItem && kind === "businesses" && page === 1) {
      return;
    }

    let active = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/${kind}/${encodeURIComponent(slug)}?page=${page}&limit=12`,
          { signal: controller.signal }
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "This page could not be found.");
        }
        if (active) setData(result);
      } catch (err) {
        if (active && err.name !== "AbortError") {
          setError(err.message || "Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [kind, slug, page, initialItem, initialData]);

  const item = data?.item;
  const parent = data?.parent;
  const isBusiness = kind === "businesses";
  const isCategory = kind === "categories";
  const isLocation = kind === "locations";
  const children = data?.children || [];
  const businesses = isBusiness ? [] : data?.businesses || [];
  const pagination = data?.pagination || data?.businessPagination || null;
  const totalBusinesses = pagination?.total ?? businesses.length;
  const title = item?.name || (isBusiness ? "Local business" : isCategory ? "Category" : "Discover locally");
  const description =
    item?.description || item?.tagline || "Discover trusted local places, useful services and people worth knowing.";
  const image = imageOf(item);
  const galleryImages = Array.isArray(item?.images)
    ? item.images.filter(
        (entry) =>
          entry?.url &&
          (entry.url.startsWith("https://") || entry.url.startsWith("http://"))
      )
    : [];

  return (
    <main className="directory-page saas-detail-wrapper">
      <PublicNavbar activePath={isBusiness ? "/businesses" : `/${kind}`} />

      {loading && !item ? (
        <section className="detail-state">
          <span className="eyebrow">JUST A MOMENT</span>
          <h1>Finding the good stuff…</h1>
          <p>Loading the details for this local page.</p>
        </section>
      ) : error && !item ? (
        <section className="detail-state">
          <span className="eyebrow">WE COULDN’T FIND THAT</span>
          <h1>Let’s find another way.</h1>
          <p>{error}</p>
          <Link
            className="detail-primary"
            href={isBusiness ? "/businesses" : isCategory ? "/categories" : "/locations"}
          >
            Browse {isBusiness ? "all businesses" : kind}
          </Link>
        </section>
      ) : item ? (
        <>
          {/* SaaS Styled Breadcrumb */}
          <nav className="detail-breadcrumb saas-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="crumb-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </Link>
            <span className="crumb-sep" aria-hidden="true">/</span>
            <Link
              href={isBusiness ? "/businesses" : isCategory ? "/categories" : "/locations"}
              className="crumb-link"
            >
              {isBusiness ? "Businesses" : isCategory ? "Categories" : "Locations"}
            </Link>
            {parent && isCategory && (
              <>
                <span className="crumb-sep" aria-hidden="true">/</span>
                <Link href={`/categories/${parent.slug}`} className="crumb-link">
                  {parent.name}
                </Link>
              </>
            )}
            <span className="crumb-sep" aria-hidden="true">/</span>
            <span className="crumb-current" aria-current="page">{title}</span>
          </nav>

          {/* Hero Section */}
          <section className="detail-hero saas-category-hero">
            <div className="detail-copy saas-category-copy">
              <div className="saas-hero-eyebrow-row">
                <span className="saas-hero-pill">
                  <span className="pill-dot" />
                  <span>
                    {isBusiness
                      ? "LOCAL BUSINESS"
                      : isCategory
                      ? "DIRECTORY CATEGORY"
                      : (item.type || "LOCAL AREA").toUpperCase()}
                  </span>
                </span>
                {parent && isCategory && (
                  <Link href={`/categories/${parent.slug}`} className="saas-parent-pill">
                    <span>Part of <strong>{parent.name}</strong></span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>

              <h1 className="saas-hero-title">{title}</h1>
              {item.tagline && <p className="detail-tagline">{item.tagline}</p>}
              <p className="saas-hero-description">
                {description ||
                  `Explore verified local businesses, shops, and services in ${title} across Ghoti, Igatpuri, and Nashik district.`}
              </p>

              {/* Dynamic Meta Pills */}
              <div className="saas-meta-chips">
                {!isBusiness && (
                  <span className="saas-chip count-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{totalBusinesses} {totalBusinesses === 1 ? "Listed place" : "Listed places"}</span>
                  </span>
                )}
                {children.length > 0 && (
                  <span className="saas-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                    <span>{children.length} {children.length === 1 ? "Subcategory" : "Subcategories"}</span>
                  </span>
                )}
                {isBusiness && item.category?.name && (
                  <Link href={`/categories/${item.category.slug}`} className="saas-chip link-chip">
                    <span>📂 {item.category.name}</span>
                  </Link>
                )}
                {isBusiness && item.location?.name && (
                  <Link href={`/locations/${item.location.slug}`} className="saas-chip link-chip">
                    <span>⌖ {item.location.name}</span>
                  </Link>
                )}
                <span className="saas-chip district-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                  <span>Nashik District</span>
                </span>
                <span className="saas-chip verified-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Directory Active</span>
                </span>
              </div>

              {/* Action Buttons */}
              {isCategory && (
                <div className="saas-hero-actions">
                  {totalBusinesses > 0 ? (
                    <a href="#places-section" className="saas-btn-primary">
                      <span>Browse {totalBusinesses} Places</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14" />
                        <path d="m19 12-7 7-7-7" />
                      </svg>
                    </a>
                  ) : (
                    <Link href={`/add-business?category=${encodeURIComponent(slug)}`} className="saas-btn-primary">
                      <span>+ List a business in {title}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                  <Link href="/businesses" className="saas-btn-secondary">
                    <span>Explore all businesses</span>
                  </Link>
                  <Link href="/categories" className="saas-btn-subtle">
                    <span>← All categories</span>
                  </Link>
                </div>
              )}

              {isBusiness && (
                <div className="detail-actions">
                  {item.contact?.phone && (
                    <a
                      className="detail-primary"
                      href={`tel:${item.contact.phone.replace(/[^+\d]/g, "")}`}
                    >
                      Call business ↗
                    </a>
                  )}
                  {item.contact?.whatsapp && (
                    <a
                      className="detail-secondary"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://wa.me/${item.contact.whatsapp.replace(/\D/g, "")}`}
                    >
                      WhatsApp ↗
                    </a>
                  )}
                  {item.contact?.website && (
                    <a
                      className="detail-secondary"
                      target="_blank"
                      rel="noreferrer"
                      href={item.contact.website}
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Right Hero Visual Column */}
            <div className="detail-visual saas-detail-visual">
              {isCategory ? (
                <CategoryShowcaseCard
                  title={title}
                  item={item}
                  parent={parent}
                  children={children}
                  businessCount={totalBusinesses}
                  slug={slug}
                />
              ) : image ? (
                <img src={image} alt={item.coverImage?.alt || title} />
              ) : (
                <div className="saas-category-hero-card">
                  <div className="cat-card-glass-glow" aria-hidden="true" />
                  <div className="cat-card-top">
                    <div className="cat-card-icon-wrap">
                      <span style={{ fontSize: "28px", fontWeight: "800" }}>{title.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="cat-card-status-pill">
                      <span className="cat-pulse-dot" />
                      <span>{isLocation ? "Location Hub" : "Local Find"}</span>
                    </div>
                  </div>
                  <div className="cat-card-body">
                    <span className="cat-card-subtitle">GAAVCONNECT</span>
                    <h2 className="cat-card-heading">{title}</h2>
                    <p className="cat-card-desc">{description}</p>
                  </div>
                  <div className="cat-card-bottom">
                    <span className="cat-card-verified-tag">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Nashik District</span>
                    </span>
                    <Link href="/businesses" className="cat-card-add-btn">
                      <span>Explore →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          {isBusiness ? (
            <>
              <section className="detail-content-grid">
                <article className="detail-panel">
                  <span className="eyebrow">A LITTLE MORE ABOUT THEM</span>
                  <h2>Good to know</h2>
                  <p>{description}</p>
                  {item.services?.length > 0 && (
                    <>
                      <h3>Services</h3>
                      <div className="detail-tags">
                        {item.services.map((s, i) => (
                          <span key={i}>
                            {typeof s === "string" ? s : s.name || s.title || "Service"}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {item.address && (
                    <>
                      <h3>Find them</h3>
                      <p>
                        {[
                          item.address?.line1,
                          item.address?.line2,
                          item.address?.area,
                          item.address?.city,
                          item.address?.state,
                          item.address?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </>
                  )}
                  {item.openingHours?.notes && (
                    <>
                      <h3>Opening hours</h3>
                      <p>{item.openingHours.notes}</p>
                    </>
                  )}
                </article>
                <aside className="detail-panel detail-contact">
                  <span className="eyebrow">MAKE A CONNECTION</span>
                  <h2>Ready to reach out?</h2>
                  <p>Contact the business directly to confirm services, availability and details.</p>
                  {item.contact?.email && <a href={`mailto:${item.contact.email}`}>✉ {item.contact.email}</a>}
                  {item.contact?.phone && <a href={`tel:${item.contact.phone}`}>☎ {item.contact.phone}</a>}
                  {item.address?.city && (
                    <p>
                      ⌖ {item.address.area ? item.address.area + ", " : ""}
                      {item.address.city}
                    </p>
                  )}
                  {(Number.isFinite(item.coordinates?.latitude) &&
                    Number.isFinite(item.coordinates?.longitude)) ||
                  item.address?.formatted ? (
                    <a
                      className="detail-secondary"
                      target="_blank"
                      rel="noreferrer"
                      href={
                        Number.isFinite(item.coordinates?.latitude) &&
                        Number.isFinite(item.coordinates?.longitude)
                          ? `https://www.google.com/maps/dir/?api=1&destination=${item.coordinates.latitude},${item.coordinates.longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              item.address.formatted
                            )}`
                      }
                    >
                      Get directions ↗
                    </a>
                  ) : null}
                  <Link className="detail-secondary" href="/businesses">
                    Explore more businesses →
                  </Link>
                </aside>
              </section>

              {galleryImages.length > 0 && (
                <section className="business-gallery">
                  <div className="business-gallery-heading">
                    <div>
                      <span className="eyebrow">A CLOSER LOOK</span>
                      <h2>Inside {title}</h2>
                      <p>Photos shared for this business listing.</p>
                    </div>
                    <span>
                      {galleryImages.length} {galleryImages.length === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                  <div className="business-gallery-grid">
                    {galleryImages.map((entry, index) => (
                      <button
                        className="business-gallery-item"
                        type="button"
                        key={entry.publicId || entry.url}
                        onClick={() => setActiveGalleryImage(entry)}
                        aria-label={`View photo ${index + 1} of ${title}`}
                      >
                        <img
                          src={entry.url}
                          alt={entry.alt || `${title} photo ${index + 1}`}
                          loading="lazy"
                        />
                        <span aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              {/* Subcategories Section */}
              {children.length > 0 && (
                <section className="saas-subcategories-section">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">KEEP EXPLORING</span>
                      <h2>Explore {isCategory ? `${title} Subcategories` : "Nearby Places"}</h2>
                      <p>Browse specialized sectors and regional hubs.</p>
                    </div>
                  </div>
                  <div className="saas-subcategory-grid">
                    {children.map((child) => (
                      <Link className="saas-subcategory-tile" key={child._id} href={`/${kind}/${child.slug}`}>
                        <div className="tile-icon-bubble">
                          {renderCategorySvg(child.icon || "compass", 22)}
                        </div>
                        <div className="tile-content">
                          <strong>{child.name}</strong>
                          <p>{child.description || `Explore ${child.name.toLowerCase()} listings`}</p>
                        </div>
                        <span className="tile-arrow" aria-hidden="true">↗</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Places Section */}
              <section className="detail-listing-section saas-places-section" id="places-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">THE LOCAL DIRECTORY</span>
                    <h2>{isCategory ? `Places in ${title}` : `Places around ${title}`}</h2>
                    <p>Verified local listings and community recommendations in Nashik district.</p>
                  </div>
                  {totalBusinesses > 0 && (
                    <div className="heading-count-badge">
                      <span>Showing {businesses.length} of {totalBusinesses} listings</span>
                    </div>
                  )}
                </div>

                {businesses.length > 0 ? (
                  <div className="directory-cards saas-business-grid">
                    {businesses.map((b) => (
                      <Card key={b._id} item={b} />
                    ))}
                  </div>
                ) : (
                  <div className="saas-empty-category-card">
                    <div className="empty-icon-ring">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                        <path d="M2 7h20" />
                        <path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2" />
                      </svg>
                    </div>
                    <h3>No listings in &ldquo;{title}&rdquo; yet</h3>
                    <p>
                      We haven&apos;t listed businesses in this category yet. Be the first local provider or business owner to appear here and gain online visibility in Nashik, Ghoti, and Igatpuri.
                    </p>
                    <div className="empty-action-group">
                      <Link className="saas-btn-primary" href={`/add-business?category=${encodeURIComponent(slug)}`}>
                        <span>+ Add your business in {title}</span>
                      </Link>
                      {parent && (
                        <Link className="saas-btn-secondary" href={`/categories/${parent.slug}`}>
                          <span>Browse {parent.name} listings →</span>
                        </Link>
                      )}
                      <Link className="saas-btn-subtle" href="/businesses">
                        <span>Explore all businesses</span>
                      </Link>
                    </div>
                  </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                  <div className="saas-pagination-bar">
                    <button
                      className="saas-page-btn"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => p - 1);
                        const el = document.getElementById("places-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      ← Previous
                    </button>
                    <span className="saas-page-info">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      className="saas-page-btn"
                      disabled={page >= pagination.totalPages}
                      onClick={() => {
                        setPage((p) => p + 1);
                        const el = document.getElementById("places-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      ) : null}

      {activeGalleryImage && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Business gallery photo"
          onClick={() => setActiveGalleryImage(null)}
        >
          <button
            className="gallery-lightbox-close"
            type="button"
            aria-label="Close photo"
            onClick={() => setActiveGalleryImage(null)}
          >
            ×
          </button>
          <img
            src={activeGalleryImage.url}
            alt={activeGalleryImage.alt || title}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {/* Directory Footer */}
      <footer className="saas-directory-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <Link href="/" className="footer-brand">
              GaavConnect
            </Link>
            <p>Empowering local businesses and regional communities with modern visibility.</p>
          </div>
          <div className="footer-right">
            <span>© {new Date().getFullYear()} GaavConnect · Made for Nashik & Maharashtra</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

