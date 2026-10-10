"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

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

const WEEK_DAYS = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
];

function getTodayDayKey() {
  const map = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return map[new Date().getDay()];
}

function hasWeeklyHours(weekly) {
  if (!weekly || typeof weekly !== "object") return false;
  return WEEK_DAYS.some(([day]) => Array.isArray(weekly[day]) && weekly[day].length > 0);
}

function hasSocialLinks(links) {
  if (!links || typeof links !== "object") return false;
  return Boolean(
    links.instagram || links.facebook || links.youtube || links.linkedin || links.x || links.tiktok
  );
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
    <article className={`saas-business-card ${item.isSponsored ? "is-sponsored-card" : ""}`}>
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
            {item.isSponsored && (
              <span className="card-badge sponsored-badge" title="Promoted Sponsored Ad">
                <span className="sponsored-sparkle">✦</span>
                <span>{item.sponsoredBadge || "Sponsored"}</span>
              </span>
            )}
            {item.isFeatured && !item.isSponsored && (
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
        {item.isSponsored && (
          <div className="sponsored-card-header-bar">
            <span className="sponsored-platform-label">
              <span className="sponsored-sparkle">✦</span> {item.sponsoredBadge || "Sponsored"}
            </span>
            <span className="sponsored-promoted-pill">Promoted Ad</span>
          </div>
        )}

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

        {item.isSponsored && item.sponsoredTagline && (
          <div className="sponsored-ad-offer-banner">
            <span className="offer-badge-icon">🏷️ OFFER</span>
            <p className="offer-badge-text">{item.sponsoredTagline}</p>
          </div>
        )}

        <p className="saas-card-description">
          {item.tagline ||
            item.description ||
            "Discover verified services, local contact, and directions."}
        </p>

        {/* Sponsored direct quick actions */}
        {item.isSponsored && (item.contact?.phone || item.contact?.whatsapp) && (
          <div className="sponsored-quick-actions">
            {item.contact?.phone && (
              <a
                href={`tel:${item.contact.phone}`}
                className="sponsored-action-btn action-call"
                title="Call Business"
              >
                📞 Call
              </a>
            )}
            {item.contact?.whatsapp && (
              <a
                href={`https://wa.me/${item.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sponsored-action-btn action-wa"
                title="WhatsApp Business"
              >
                💬 WhatsApp
              </a>
            )}
            <Link
              href={`/businesses/${item.slug}`}
              className="sponsored-action-btn action-view"
            >
              Explore →
            </Link>
          </div>
        )}

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

function CategoryShowcaseCard({ title, item, parent, subcategories = [], businessCount, slug }) {
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
          <span className="cat-stat-num">{subcategories.length}</span>
          <span className="cat-stat-lbl">{subcategories.length === 1 ? "Subcategory" : "Subcategories"}</span>
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
                {isBusiness && item.isSponsored && (
                  <span className="sponsored-detail-badge">
                    <span className="sponsored-sparkle">✦</span>
                    <span>{item.sponsoredBadge || "Sponsored Business"}</span>
                  </span>
                )}
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

              {isBusiness && item.logo?.url && (
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                  <img
                    src={item.logo.url}
                    alt={item.logo.alt || `${title} logo`}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "14px",
                      objectFit: "cover",
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                      background: "#fff",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2f5236", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Verified Business
                    </span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      GaavConnect Directory
                    </span>
                  </div>
                </div>
              )}

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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                    <span>{item.category.name}</span>
                  </Link>
                )}
                {isBusiness && item.location?.name && (
                  <Link href={`/locations/${item.location.slug}`} className="saas-chip link-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span>{item.location.name}</span>
                  </Link>
                )}
                {isBusiness && item.priceRange && item.priceRange !== "not_applicable" && (
                  <span className="saas-chip" style={{ fontWeight: 600 }}>
                    <span style={{ color: "#047857" }}>
                      {item.priceRange === "budget" ? "₹ Budget" : item.priceRange === "moderate" ? "₹₹ Moderate" : item.priceRange === "premium" ? "₹₹₹ Premium" : "₹₹₹₹ Luxury"}
                    </span>
                  </span>
                )}
                {isBusiness && item.establishedYear && (
                  <span className="saas-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Est. {item.establishedYear}</span>
                  </span>
                )}
                {isBusiness && item.businessType && (
                  <span className="saas-chip" style={{ textTransform: "capitalize" }}>
                    <span>{item.businessType.replace(/_/g, " ")}</span>
                  </span>
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

              {isLocation && (
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
                    <Link href={`/add-business?location=${encodeURIComponent(slug)}`} className="saas-btn-primary">
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
                  <Link href="/locations" className="saas-btn-subtle">
                    <span>← All locations</span>
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
                      Call: {item.contact.phone} ↗
                    </a>
                  )}
                  {item.contact?.alternatePhone && (
                    <a
                      className="detail-secondary"
                      href={`tel:${item.contact.alternatePhone.replace(/[^+\d]/g, "")}`}
                    >
                      Alt: {item.contact.alternatePhone} ↗
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
                  {item.socialLinks?.instagram && (
                    <a
                      className="detail-secondary"
                      target="_blank"
                      rel="noreferrer"
                      href={item.socialLinks.instagram.startsWith("http") ? item.socialLinks.instagram : `https://instagram.com/${item.socialLinks.instagram.replace(/^@/, "")}`}
                      style={{ background: "#fdf2f8", color: "#be185d", borderColor: "#fbcfe8" }}
                    >
                      Instagram ↗
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
                  subcategories={children}
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
              {item.isSponsored && item.sponsoredTagline && (
                <div className="sponsored-detail-offer-box">
                  <div className="sponsored-offer-header">
                    <span className="sponsored-offer-tag">✨ SPECIAL SPONSORED OFFER</span>
                    <span className="sponsored-verified-pill">Verified Promotion</span>
                  </div>
                  <p className="sponsored-offer-text">{item.sponsoredTagline}</p>
                </div>
              )}

              <section className="detail-content-grid">
                <article className="detail-panel">
                  <span className="eyebrow">A LITTLE MORE ABOUT THEM</span>
                  <h2>Good to know</h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{description}</p>

                  {/* Services & Specialties */}
                  {item.services?.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                      <h3>Services & Specialties</h3>
                      <div className="detail-tags">
                        {item.services.map((s, i) => (
                          <span key={i}>
                            {typeof s === "string" ? s : s.name || s.title || "Service"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amenities & Facilities */}
                  {item.amenities?.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                      <h3>Amenities & Facilities</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                        {item.amenities.map((a, i) => (
                          <span
                            key={i}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              borderRadius: "20px",
                              background: "#edf5eb",
                              border: "1px solid #d4e5d1",
                              color: "#284b2e",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            <span style={{ color: "#22c55e" }}>✓</span>
                            <span>{a}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accepted Payment Methods & Languages */}
                  {(item.paymentMethods?.length > 0 || item.languages?.length > 0) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "24px" }}>
                      {item.paymentMethods?.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>Payment Modes</h4>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {item.paymentMethods.map((pm, i) => (
                              <span key={i} style={{ padding: "4px 10px", background: "#f3f4f6", borderRadius: "6px", fontSize: "11px", color: "#374151" }}>
                                💳 {pm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.languages?.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>Languages Spoken</h4>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {item.languages.map((l, i) => (
                              <span key={i} style={{ padding: "4px 10px", background: "#f3f4f6", borderRadius: "6px", fontSize: "11px", color: "#374151" }}>
                                🗣️ {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Service Areas */}
                  {item.serviceAreas?.length > 0 && (
                    <div style={{ marginTop: "24px" }}>
                      <h3>Service Coverage Areas</h3>
                      <p style={{ color: "#4b5563", fontSize: "13px", marginTop: "4px" }}>
                        Serving customers across {item.serviceAreas.join(", ")}.
                      </p>
                    </div>
                  )}

                  {/* Physical Address */}
                  {item.address && (
                    <div style={{ marginTop: "24px" }}>
                      <h3>Physical Location</h3>
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
                    </div>
                  )}

                  {/* Operating Hours Timetable */}
                  {(hasWeeklyHours(item.openingHours?.weekly) || item.openingHours?.notes) && (
                    <div style={{ marginTop: "28px", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <h3 style={{ margin: 0 }}>Operating Hours</h3>
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>{item.openingHours?.timezone || "Asia/Kolkata"}</span>
                      </div>

                      {hasWeeklyHours(item.openingHours?.weekly) && (
                        <div style={{ borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden", background: "#fafafa" }}>
                          {WEEK_DAYS.map(([dayKey, dayLabel]) => {
                            const periods = item.openingHours?.weekly?.[dayKey] || [];
                            const isToday = getTodayDayKey() === dayKey;
                            const hoursText = periods.length > 0
                              ? periods.map((p) => `${p.open} - ${p.close}`).join(", ")
                              : "Closed";
                            return (
                              <div
                                key={dayKey}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "9px 14px",
                                  borderBottom: "1px solid #f3f4f6",
                                  background: isToday ? "#edf7ed" : "transparent",
                                  fontWeight: isToday ? 600 : 400,
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: isToday ? "#1b4322" : "#374151" }}>
                                  {isToday && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />}
                                  {dayLabel} {isToday && "(Today)"}
                                </span>
                                <span style={{ fontSize: "12px", color: hoursText === "Closed" ? "#9ca3af" : isToday ? "#1b4322" : "#111827" }}>
                                  {hoursText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {item.openingHours?.notes && (
                        <p style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
                          ℹ️ {item.openingHours.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Social Profiles */}
                  {hasSocialLinks(item.socialLinks) && (
                    <div style={{ marginTop: "28px", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
                      <h3 style={{ marginBottom: "12px" }}>Follow & Connect</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {item.socialLinks?.instagram && (
                          <a
                            href={item.socialLinks.instagram.startsWith("http") ? item.socialLinks.instagram : `https://instagram.com/${item.socialLinks.instagram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#fdf2f8", border: "1px solid #fbcfe8", color: "#be185d", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                          >
                            <span>📸 Instagram</span>
                          </a>
                        )}
                        {item.socialLinks?.facebook && (
                          <a
                            href={item.socialLinks.facebook}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                          >
                            <span>📘 Facebook</span>
                          </a>
                        )}
                        {item.socialLinks?.youtube && (
                          <a
                            href={item.socialLinks.youtube}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                          >
                            <span>▶️ YouTube</span>
                          </a>
                        )}
                        {item.socialLinks?.x && (
                          <a
                            href={item.socialLinks.x}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                          >
                            <span>𝕏 Twitter</span>
                          </a>
                        )}
                        {item.socialLinks?.linkedin && (
                          <a
                            href={item.socialLinks.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0f766e", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                          >
                            <span>💼 LinkedIn</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </article>

                <aside className="detail-panel detail-contact">
                  <span className="eyebrow">MAKE A CONNECTION</span>
                  <h2>Ready to reach out?</h2>
                  <p>Contact the business directly to confirm services, availability and details.</p>
                  {item.contact?.phone && (
                    <a href={`tel:${item.contact.phone.replace(/[^+\d]/g, "")}`} style={{ fontWeight: 600 }}>
                      ☎ Call: {item.contact.phone}
                    </a>
                  )}
                  {item.contact?.alternatePhone && (
                    <a href={`tel:${item.contact.alternatePhone.replace(/[^+\d]/g, "")}`}>
                      📞 Alt: {item.contact.alternatePhone}
                    </a>
                  )}
                  {item.contact?.whatsapp && (
                    <a
                      href={`https://wa.me/${item.contact.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#15803d", fontWeight: 600 }}
                    >
                      💬 WhatsApp: {item.contact.whatsapp}
                    </a>
                  )}
                  {item.contact?.email && <a href={`mailto:${item.contact.email}`}>✉ {item.contact.email}</a>}
                  {item.contact?.website && (
                    <a href={item.contact.website} target="_blank" rel="noreferrer">
                      🌐 Visit Website ↗
                    </a>
                  )}
                  {item.address?.city && (
                    <p style={{ marginTop: "12px", fontSize: "13px" }}>
                      ⌖ {[item.address.line1, item.address.area, item.address.city, item.address.postalCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {(Number.isFinite(item.coordinates?.latitude) &&
                    Number.isFinite(item.coordinates?.longitude)) ||
                  item.address?.formatted ? (
                    <a
                      className="detail-primary"
                      style={{ marginTop: "12px", textAlign: "center" }}
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
                      📍 Get directions on Google Maps ↗
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
      <PublicFooter />
    </main>
  );
}

