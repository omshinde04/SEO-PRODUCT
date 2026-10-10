"use client";

import Link from "next/link";
import OpenStreetMapPlaceAutocomplete from "@/components/openstreetmap-place-autocomplete";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";
import { useEffect, useMemo, useState } from "react";

const TYPES = [
  ["", "All types", "compass"],
  ["restaurant", "Food & dining", "utensils"],
  ["hotel", "Hotels & stays", "bed"],
  ["retail", "Shopping & retail", "bag"],
  ["healthcare", "Health & wellness", "activity"],
  ["professional_service", "Professional services", "briefcase"],
  ["tourism", "Tours & experiences", "map"],
  ["attraction", "Places to visit", "camera"],
  ["guide", "Local guides", "user-check"],
  ["other", "Other services", "grid"],
];

const GRADIENTS = [
  "linear-gradient(135deg, #1f4231 0%, #11281e 100%)",
  "linear-gradient(135deg, #2b4859 0%, #152631 100%)",
  "linear-gradient(135deg, #5c3e2e 0%, #321f14 100%)",
  "linear-gradient(135deg, #374637 0%, #1b261c 100%)",
  "linear-gradient(135deg, #443754 0%, #22182c 100%)",
  "linear-gradient(135deg, #2a4747 0%, #142828 100%)",
];

function DirectoryIcon({ name, size = 18 }) {
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

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
          <circle cx="7" cy="7" r="1.5" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      );
    case "arrow-up-right":
      return (
        <svg {...common}>
          <path d="M7 17 17 7" />
          <path d="M7 7h10v10" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
          <path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

function imageFor(item) {
  return item?.coverImage?.url || item?.images?.[0]?.url || item?.logo?.url || "";
}

export default function BusinessDirectory() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: null });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load available categories for filter dropdown
  useEffect(() => {
    let active = true;
    fetch("/api/categories?limit=100")
      .then((r) => r.json())
      .then((cats) => {
        if (active && cats.success) setCategories(cats.items || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Fetch directory listings with debouncing
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (query.trim()) params.set("q", query.trim());
      if (location.trim()) params.set("locationText", selectedPlace?.searchText || location.trim());
      if (category) params.set("category", category);
      if (type) params.set("businessType", type);

      try {
        const response = await fetch(`/api/businesses?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load local listings.");
        if (active) {
          setData({ items: result.items || [], pagination: result.pagination || null });
          if (query.trim() && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("gaavconnect:analytics", {
                detail: {
                  eventType: "search",
                  metadata: {
                    searchQuery: query.trim(),
                    resultsCount: (result.items || []).length,
                    locationFilter: location.trim(),
                  },
                },
              })
            );
          }
        }
      } catch (err) {
        if (active && err.name !== "AbortError") setError(err.message || "Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, location, selectedPlace, category, type, page]);

  function reset() {
    setQuery("");
    setLocation("");
    setSelectedPlace(null);
    setCategory("");
    setType("");
    setPage(1);
  }

  const activeCategoryName = useMemo(() => {
    if (!category) return "";
    const found = categories.find((c) => c.slug === category);
    return found ? found.name : category;
  }, [category, categories]);

  const activeTypeLabel = useMemo(() => {
    if (!type) return "";
    const found = TYPES.find(([val]) => val === type);
    return found ? found[1] : type;
  }, [type]);

  const hasActiveFilters = Boolean(query || location || category || type);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <main className="directory-page">
      <PublicNavbar activePath="/businesses" />

      {/* SaaS Hero Section with integrated floating search widget */}
      <section className="directory-hero-saas">
        <div className="directory-hero-content">
          <div className="directory-eyebrow-badge">
            <span className="badge-glow-dot" />
            <span>GAAVCONNECT DIRECTORY</span>
            <span className="badge-sep">·</span>
            <span>NASHIK DISTRICT</span>
          </div>

          <h1 className="directory-hero-title">
            Discover Trusted Places.
            <br />
            <em>Closer than you think.</em>
          </h1>

          <p className="directory-hero-subtitle">
            Explore authentic local businesses, dining, stays, and essential services across Ghoti, Igatpuri, Nashik, and regional Maharashtra.
          </p>

          {/* Unified SaaS Floating Search Bar */}
          <form className="saas-search-widget" onSubmit={handleSearchSubmit} role="search">
            {/* Field 1: Keyword */}
            <div className="saas-search-field field-keyword">
              <span className="saas-field-icon" aria-hidden="true">
                <DirectoryIcon name="search" size={20} />
              </span>
              <div className="saas-field-inner">
                <label htmlFor="saas-search-query">WHAT ARE YOU LOOKING FOR?</label>
                <input
                  id="saas-search-query"
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Business name, service, or keyword…"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="saas-search-divider" aria-hidden="true" />

            {/* Field 2: Location */}
            <div className="saas-search-field field-location">
              <span className="saas-field-icon" aria-hidden="true">
                <DirectoryIcon name="pin" size={20} />
              </span>
              <div className="saas-field-inner">
                <OpenStreetMapPlaceAutocomplete
                  inputId="saas-search-location"
                  label="AROUND WHERE?"
                  value={location}
                  onChange={(val) => {
                    setLocation(val);
                    setSelectedPlace(null);
                    setPage(1);
                  }}
                  onSelect={(place) => {
                    setSelectedPlace(
                      place
                        ? {
                            ...place,
                            searchText:
                              place.searchText ||
                              place.name ||
                              place.address?.city ||
                              place.address?.area ||
                              place.address?.district ||
                              place.description,
                          }
                        : null
                    );
                    setPage(1);
                  }}
                  placeholder="Town, village, or area (e.g. Ghoti)"
                />
              </div>
            </div>

            <div className="saas-search-divider" aria-hidden="true" />

            {/* Field 3: Category */}
            <div className="saas-search-field field-category">
              <span className="saas-field-icon" aria-hidden="true">
                <DirectoryIcon name="tag" size={20} />
              </span>
              <div className="saas-field-inner">
                <label htmlFor="saas-search-category">CATEGORY</label>
                <select
                  id="saas-search-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((item) => (
                    <option key={item._id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Submit Action */}
            <button type="submit" className="saas-search-btn" aria-label="Search places">
              <DirectoryIcon name="search" size={18} />
              <span>Search</span>
            </button>
          </form>

          {/* Horizontal Quick-Filter Pill Tabs */}
          <div className="saas-pills-container">
            <div className="saas-pills-track" role="tablist" aria-label="Filter by place type">
              {TYPES.map(([val, label]) => {
                const isSelected = type === val;
                return (
                  <button
                    key={val}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`saas-pill-btn ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setType(val);
                      setPage(1);
                    }}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Directory Listings Container */}
      <section className="directory-main-container">
        {/* Results Toolbar with Active Filter Tags */}
        <div className="directory-toolbar-saas">
          <div className="toolbar-left">
            <span className="results-badge-indicator">
              <span className="pulse-dot" />
              <strong>{data.pagination?.total ?? data.items.length}</strong> places found
            </span>

            {hasActiveFilters && (
              <div className="active-filter-chips">
                {query && (
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => {
                      setQuery("");
                      setPage(1);
                    }}
                  >
                    <span>Keyword: &ldquo;{query}&rdquo;</span>
                    <i>✕</i>
                  </button>
                )}
                {location && (
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => {
                      setLocation("");
                      setSelectedPlace(null);
                      setPage(1);
                    }}
                  >
                    <span>Location: {location}</span>
                    <i>✕</i>
                  </button>
                )}
                {category && (
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => {
                      setCategory("");
                      setPage(1);
                    }}
                  >
                    <span>Category: {activeCategoryName}</span>
                    <i>✕</i>
                  </button>
                )}
                {type && (
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => {
                      setType("");
                      setPage(1);
                    }}
                  >
                    <span>Type: {activeTypeLabel}</span>
                    <i>✕</i>
                  </button>
                )}
                <button type="button" className="chip-reset-all" onClick={reset}>
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          <div className="toolbar-right">
            <span className="page-indicator-text">
              Page {page} {data.pagination?.totalPages ? `of ${Math.max(1, data.pagination.totalPages)}` : ""}
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="saas-empty-card">
            <span className="empty-icon-wrap">⚠️</span>
            <h3>We couldn&apos;t load the directory</h3>
            <p>{error}</p>
            <button className="saas-btn-primary" onClick={() => setPage((v) => v)} type="button">
              Try again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && !data.items.length && (
          <div className="saas-cards-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div className="saas-card-skeleton" key={n}>
                <div className="skeleton-image" />
                <div className="skeleton-body">
                  <div className="skeleton-line line-sm" />
                  <div className="skeleton-line line-title" />
                  <div className="skeleton-line line-text" />
                  <div className="skeleton-footer">
                    <div className="skeleton-line line-xs" />
                    <div className="skeleton-btn" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Business Listings Grid */}
        {!loading || data.items.length ? (
          data.items.length ? (
            <div className="saas-cards-grid">
              {data.items.map((item, index) => {
                const image = imageFor(item);
                const place = [item.address?.area, item.address?.city, item.location?.name]
                  .filter(Boolean)
                  .filter((value, i, all) => all.indexOf(value) === i)
                  .join(", ");
                const initial = (item.name || "G").charAt(0).toUpperCase();
                const fallbackGradient = GRADIENTS[index % GRADIENTS.length];

                return (
                  <article className={`saas-business-card ${item.isSponsored ? "is-sponsored-card" : ""}`} key={item._id}>
                    {/* Card Media Header */}
                    <Link
                      href={`/businesses/${item.slug}`}
                      className="saas-card-media"
                      aria-label={`View details for ${item.name}`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={item.coverImage?.alt || item.name}
                          loading="lazy"
                          className="saas-card-img"
                        />
                      ) : (
                        <div
                          className="saas-card-art-fallback"
                          style={{ background: fallbackGradient }}
                        >
                          <div className="art-pattern-grid" aria-hidden="true" />
                          <div className="art-monogram-circle">
                            <span>{initial}</span>
                          </div>
                          <span className="art-watermark">
                            <DirectoryIcon name="store" size={13} />
                            <span>GAAVCONNECT LOCAL</span>
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
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
                              <DirectoryIcon name="star" size={12} />
                              <span>Featured</span>
                            </span>
                          )}
                          {item.verificationStatus === "verified" && (
                            <span className="card-badge verified-badge" title="Verified local listing">
                              <DirectoryIcon name="check" size={12} />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Gradient overlay for contrast */}
                      <div className="saas-card-overlay" aria-hidden="true" />
                    </Link>

                    {/* Card Content Body */}
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
                        {item.priceRange && item.priceRange !== "not_applicable" && (
                          <span className="type-badge-pill" style={{ color: "#047857", background: "#ecfdf5", borderColor: "#a7f3d0" }}>
                            {item.priceRange === "budget" ? "₹ Budget" : item.priceRange === "moderate" ? "₹₹ Moderate" : item.priceRange === "premium" ? "₹₹₹ Premium" : "₹₹₹₹ Luxury"}
                          </span>
                        )}
                        {item.contact?.phone && (
                          <span className="quick-contact-pill" title="Phone verified">
                            <DirectoryIcon name="phone" size={12} />
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
                          "Discover services, verified timings, customer reviews, and directions."}
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

                      {/* Card Footer with Location & Action */}
                      <div className="saas-card-footer">
                        <span className="saas-location-tag" title={place || "Local area"}>
                          <DirectoryIcon name="pin" size={14} />
                          <span>{place || "Nashik District"}</span>
                        </span>

                        <Link
                          href={`/businesses/${item.slug}`}
                          className="saas-details-action"
                          aria-label={`Explore ${item.name}`}
                        >
                          <span>View details</span>
                          <DirectoryIcon name="arrow" size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : !error ? (
            /* Empty Search State */
            <div className="saas-empty-card">
              <span className="empty-icon-wrap">🔍</span>
              <h3>No matching places found</h3>
              <p>We couldn&apos;t find businesses matching your current search criteria. Try clearing filters or exploring other locations.</p>
              <div className="empty-actions">
                <button className="saas-btn-primary" onClick={reset} type="button">
                  Clear all filters
                </button>
                <Link className="saas-btn-secondary" href="/add-business">
                  + List your business
                </Link>
              </div>
            </div>
          ) : null
        ) : null}

        {/* Pagination Controls */}
        {Boolean(data.pagination?.totalPages && data.pagination.totalPages > 1) && (
          <nav className="saas-pagination-nav" aria-label="Directory pagination">
            <button
              type="button"
              className="pagination-btn prev-btn"
              disabled={page <= 1 || loading}
              onClick={() => {
                setPage((v) => v - 1);
                window.scrollTo({ top: 380, behavior: "smooth" });
              }}
            >
              <DirectoryIcon name="arrow" size={16} />
              <span>Previous</span>
            </button>

            <span className="pagination-status">
              Page <strong>{page}</strong> of <strong>{data.pagination.totalPages}</strong>
            </span>

            <button
              type="button"
              className="pagination-btn next-btn"
              disabled={loading || page >= data.pagination.totalPages}
              onClick={() => {
                setPage((v) => v + 1);
                window.scrollTo({ top: 380, behavior: "smooth" });
              }}
            >
              <span>Next</span>
              <DirectoryIcon name="arrow" size={16} />
            </button>
          </nav>
        )}
      </section>

      {/* Directory Footer */}
      <PublicFooter />
    </main>
  );
}
