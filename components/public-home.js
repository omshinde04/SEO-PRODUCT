"use client";

import Link from "next/link";
import OpenStreetMapPlaceAutocomplete from "@/components/openstreetmap-place-autocomplete";
import PublicNavbar from "@/components/public-navbar";
import { useCallback, useMemo, useState } from "react";

const TYPES = [
  { value: "", label: "All categories" },
  { value: "restaurant", label: "Food & dining" },
  { value: "hotel", label: "Hotels & stays" },
  { value: "retail", label: "Shopping" },
  { value: "healthcare", label: "Health & wellness" },
  { value: "professional_service", label: "Professional services" },
  { value: "tourism", label: "Tours & experiences" },
  { value: "attraction", label: "Places to visit" },
];

const GRADIENTS = [
  "linear-gradient(135deg, #1f4231 0%, #11281e 100%)",
  "linear-gradient(135deg, #2b4859 0%, #152631 100%)",
  "linear-gradient(135deg, #5c3e2e 0%, #321f14 100%)",
  "linear-gradient(135deg, #374637 0%, #1b261c 100%)",
  "linear-gradient(135deg, #443754 0%, #22182c 100%)",
  "linear-gradient(135deg, #2a4747 0%, #142828 100%)",
];

function HomeIcon({ name, size = 20 }) {
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
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
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
    case "utensils":
      return (
        <svg {...common}>
          <path d="M18 2v20M21 15V2a3 3 0 0 0-3 3v5a3 3 0 0 0 3 5ZM3 2v7c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V2M6 11v11" />
        </svg>
      );
    case "hotel":
    case "bed":
      return (
        <svg {...common}>
          <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
        </svg>
      );
    case "shopping":
    case "retail":
    case "bag":
      return (
        <svg {...common}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "healthcare":
    case "activity":
      return (
        <svg {...common}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="m12 8 4 4-4 4M8 12h8" />
        </svg>
      );
  }
}

function resolveCategoryIcon(iconName) {
  if (!iconName) return "compass";
  const lower = String(iconName).toLowerCase().trim();
  if (lower.includes("utensil") || lower.includes("food") || lower.includes("restaurant")) return "utensils";
  if (lower.includes("hotel") || lower.includes("stay") || lower.includes("bed")) return "bed";
  if (lower.includes("shop") || lower.includes("retail") || lower.includes("store")) return "shopping";
  if (lower.includes("health") || lower.includes("care") || lower.includes("medic")) return "healthcare";
  if (lower.includes("star") || lower.includes("feature")) return "star";
  return "compass";
}

function imageOf(item) {
  return item?.coverImage?.url || item?.images?.[0]?.url || item?.logo?.url || "";
}

function BusinessCard({ item, index }) {
  const image = imageOf(item);
  const location = [item.address?.area, item.address?.city, item.location?.name]
    .filter(Boolean)
    .filter((value, i, all) => all.indexOf(value) === i)
    .join(", ");
  const initial = (item.name || "G").charAt(0).toUpperCase();
  const fallbackGradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <article className="saas-business-card">
      <Link
        href={`/businesses/${item.slug}`}
        className="saas-card-media"
        aria-label={`View details for ${item.name}`}
      >
        {image ? (
          <img
            src={image}
            alt={item.coverImage?.alt || item.name}
            loading={index < 3 ? "eager" : "lazy"}
            className="saas-card-img"
          />
        ) : (
          <div className="saas-card-art-fallback" style={{ background: fallbackGradient }}>
            <div className="art-pattern-grid" aria-hidden="true" />
            <div className="art-monogram-circle">
              <span>{initial}</span>
            </div>
            <span className="art-watermark">
              <HomeIcon name="store" size={13} />
              <span>GAAVCONNECT LOCAL</span>
            </span>
          </div>
        )}

        <div className="saas-card-badges-top">
          <span className="card-badge category-badge">
            {item.category?.name || "Local place"}
          </span>

          <div className="card-badges-right">
            {item.isFeatured && (
              <span className="card-badge featured-badge" title="Featured local business">
                <HomeIcon name="star" size={12} />
                <span>Featured</span>
              </span>
            )}
            {item.verificationStatus === "verified" && (
              <span className="card-badge verified-badge" title="Verified local listing">
                <HomeIcon name="check" size={12} />
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
              <HomeIcon name="phone" size={12} />
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
            "Discover verified services, timings, customer reviews, and directions."}
        </p>

        <div className="saas-card-footer">
          <span className="saas-location-tag" title={location || "Local area"}>
            <HomeIcon name="pin" size={14} />
            <span>{location || "Nashik District"}</span>
          </span>

          <Link
            href={`/businesses/${item.slug}`}
            className="saas-details-action"
            aria-label={`Explore ${item.name}`}
          >
            <span>View details</span>
            <HomeIcon name="arrow" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, href, linkLabel = "Explore all" }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          {linkLabel}
          <HomeIcon name="arrow" size={17} />
        </Link>
      )}
    </div>
  );
}

export default function PublicHome({ initialData = null }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [businessType, setBusinessType] = useState("");
  const [submitted, setSubmitted] = useState({ q: "", location: "", businessType: "" });
  const [businesses, setBusinesses] = useState(initialData?.businesses || []);
  const [categories, setCategories] = useState(initialData?.categories || []);
  const [pagination, setPagination] = useState(initialData?.pagination || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");

  const loadData = useCallback(
    async (filters = submitted) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "8" });
        if (filters.q) params.set("q", filters.q);
        if (filters.location) params.set("locationText", filters.location);
        if (filters.businessType) params.set("businessType", filters.businessType);

        const [businessResponse, categoryResponse] = await Promise.all([
          fetch(`/api/businesses?${params.toString()}`, { cache: "no-store" }),
          fetch("/api/categories?limit=12", { cache: "no-store" }),
        ]);

        const [businessData, categoryData] = await Promise.all([
          businessResponse.json(),
          categoryResponse.json(),
        ]);

        if (!businessResponse.ok || !businessData.success) {
          throw new Error(businessData.message || "We couldn't load listings right now.");
        }

        setBusinesses(businessData.items || []);
        setPagination(businessData.pagination || null);
        setCategories(categoryData.success ? categoryData.items || [] : []);
      } catch (loadError) {
        setError(loadError.message || "Something went wrong while loading local discoveries.");
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    },
    [submitted]
  );

  const featuredCategories = useMemo(() => categories.slice(0, 6), [categories]);

  function handleSearch(event) {
    event.preventDefault();
    const next = {
      q: query.trim(),
      location: selectedPlace?.searchText || location.trim(),
      businessType,
    };
    setSubmitted(next);
    loadData(next);
  }

  function clearFilters() {
    setQuery("");
    setLocation("");
    setSelectedPlace(null);
    setBusinessType("");
    const empty = { q: "", location: "", businessType: "" };
    setSubmitted(empty);
    loadData(empty);
  }

  return (
    <main className="site-shell">
      {/* Top Announcement Bar */}
      <div className="announcement-bar">
        <span className="announcement-dot" />
        <span>Your neighbourhood, better discovered</span>
        <span className="announcement-separator">·</span>
        <span>Starting in Nashik district</span>
        <span className="announcement-right">
          Made for the places we call home <span aria-hidden="true">✳</span>
        </span>
      </div>

      <PublicNavbar activePath="/" />

      {/* Hero Section */}
      <section className="hero" id="discover">
        <div className="hero-grid-pattern" aria-hidden="true" />

        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="kicker-icon">
              <HomeIcon name="spark" size={15} />
            </span>
            <span>THE LOCAL WAY TO FIND YOUR WAY</span>
            <span className="kicker-line" />
          </div>

          <h1>
            Find your kind
            <br />
            of <span className="hero-highlight">wonder.</span>
            <span className="hero-period">✳</span>
          </h1>

          <p className="hero-description">
            The little-known gems, trusted local businesses, and places worth the trip across Ghoti, Igatpuri, and Nashik. All the good stuff, closer than you think.
          </p>

          <div className="hero-proof">
            <div className="proof-avatars">
              <span>N</span>
              <span>G</span>
              <span>I</span>
              <span>+</span>
            </div>
            <span>
              Built around <strong>verified local places</strong>
            </span>
            <span className="proof-divider" />
            <span>
              <HomeIcon name="shield" size={15} /> Community-first discovery
            </span>
          </div>
        </div>

        {/* SaaS Visual Showcase Card (Replaced flat box drawing) */}
        <div className="hero-showcase-panel" aria-label="Interactive local preview showcase">
          <div className="showcase-card-main">
            <div className="showcase-badge-row">
              <span className="showcase-live-pill">
                <span className="pulse-dot" /> Live in Nashik District
              </span>
              <span className="showcase-verified-tag">
                <HomeIcon name="shield" size={13} /> Verified Directory
              </span>
            </div>

            <div className="showcase-visual-box">
              <div className="showcase-visual-overlay" />
              <div className="showcase-stat-chip chip-top-left">
                <span className="stat-num">⭐ 4.9</span>
                <span className="stat-label">Local Rating</span>
              </div>
              <div className="showcase-stat-chip chip-bottom-right">
                <span className="stat-num">📍 Ghoti & Igatpuri</span>
                <span className="stat-label">Fast Discovery</span>
              </div>
              <div className="showcase-hero-center">
                <span className="showcase-center-icon">
                  <HomeIcon name="spark" size={28} />
                </span>
                <strong>Authentic Local Finds</strong>
                <small>Food · Stays · Healthcare · Retail</small>
              </div>
            </div>

            <div className="showcase-features-bar">
              <div className="feature-item">
                <HomeIcon name="check" size={14} />
                <span>Direct Contact</span>
              </div>
              <div className="feature-item">
                <HomeIcon name="check" size={14} />
                <span>Zero Commission</span>
              </div>
              <div className="feature-item">
                <HomeIcon name="check" size={14} />
                <span>100% Free to Search</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Search Panel */}
        <div className="search-panel-wrap">
          <form className="search-panel" onSubmit={handleSearch}>
            <label className="search-field search-keyword">
              <span className="search-icon">
                <HomeIcon name="search" size={20} />
              </span>
              <span className="field-content">
                <span className="field-label">WHAT ARE YOU LOOKING FOR?</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Coffee, stays, a great mechanic…"
                  aria-label="Search businesses and services"
                />
              </span>
            </label>

            <span className="search-divider" />

            <div className="search-field search-location">
              <span className="search-icon">
                <HomeIcon name="pin" size={20} />
              </span>
              <div className="field-content">
                <OpenStreetMapPlaceAutocomplete
                  inputId="home-location-search"
                  label="AROUND WHERE?"
                  value={location}
                  onChange={(value) => {
                    setLocation(value);
                    setSelectedPlace(null);
                  }}
                  onSelect={(place) =>
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
                    )
                  }
                  placeholder="Search a town or village (e.g. Ghoti)"
                />
              </div>
            </div>

            <span className="search-divider" />

            <label className="search-field search-category">
              <span className="search-icon">
                <HomeIcon name="compass" size={20} />
              </span>
              <span className="field-content">
                <span className="field-label">CATEGORY</span>
                <select
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  aria-label="Filter by business category"
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <button className="search-submit" type="submit">
              <HomeIcon name="search" size={18} />
              <span>Find it</span>
            </button>
          </form>

          <div className="popular-searches">
            <span>POPULAR SEARCHES:</span>
            <button
              type="button"
              onClick={() => {
                setQuery("coffee");
                const next = {
                  q: "coffee",
                  location: selectedPlace?.searchText || location.trim(),
                  businessType,
                };
                setSubmitted(next);
                loadData(next);
              }}
            >
              Coffee spots
            </button>
            <i>·</i>
            <button
              type="button"
              onClick={() => {
                setBusinessType("hotel");
                const next = {
                  q: query,
                  location: selectedPlace?.searchText || location.trim(),
                  businessType: "hotel",
                };
                setSubmitted(next);
                loadData(next);
              }}
            >
              Weekend stays
            </button>
            <i>·</i>
            <button
              type="button"
              onClick={() => {
                setBusinessType("healthcare");
                const next = {
                  q: query,
                  location: selectedPlace?.searchText || location.trim(),
                  businessType: "healthcare",
                };
                setSubmitted(next);
                loadData(next);
              }}
            >
              Health & wellness
            </button>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="trust-strip" aria-label="Our values">
        <div>
          <span className="trust-icon">
            <HomeIcon name="shield" size={19} />
          </span>
          <span>
            <strong>Thoughtfully discovered</strong>
            <small>Useful verified places, not endless noise</small>
          </span>
        </div>
        <div>
          <span className="trust-icon">
            <HomeIcon name="heart" size={19} />
          </span>
          <span>
            <strong>Rooted in community</strong>
            <small>Local stories deserve the spotlight</small>
          </span>
        </div>
        <div>
          <span className="trust-icon">
            <HomeIcon name="spark" size={19} />
          </span>
          <span>
            <strong>Made for real life</strong>
            <small>Find your next everyday favourite</small>
          </span>
        </div>
        <div className="trust-note">
          Small places. <em>Big part of life.</em>
        </div>
      </section>

      {/* Categories Section with Clean SVG Icon Badges (Fixed text overflow) */}
      <section className="content-section category-section" id="categories">
        <SectionHeading
          eyebrow="A GOOD PLACE TO START"
          title={
            <>
              What are you <em>in the mood for?</em>
            </>
          }
          description="From everyday essentials to the places that make a day feel special."
          href="/categories"
          linkLabel="All categories"
        />

        <div className="category-grid">
          {featuredCategories.length
            ? featuredCategories.map((category) => {
                const iconType = resolveCategoryIcon(category.icon);
                return (
                  <Link
                    className="saas-category-tile"
                    href={`/categories/${category.slug}`}
                    key={category._id}
                  >
                    <div className="saas-category-icon-wrap">
                      <HomeIcon name={iconType} size={24} />
                    </div>
                    <div className="saas-category-tile-copy">
                      <strong>{category.name}</strong>
                      <small>{category.description || "Explore local businesses and services."}</small>
                    </div>
                    <span className="saas-category-arrow" aria-hidden="true">
                      <HomeIcon name="arrow" size={16} />
                    </span>
                  </Link>
                );
              })
            : [
                { name: "Food & drink", icon: "utensils" },
                { name: "Places to stay", icon: "bed" },
                { name: "Health & care", icon: "healthcare" },
                { name: "Shopping", icon: "shopping" },
                { name: "Things to do", icon: "compass" },
                { name: "Everyday services", icon: "store" },
              ].map((item) => (
                <div className="saas-category-tile placeholder-tile" key={item.name}>
                  <div className="saas-category-icon-wrap">
                    <HomeIcon name={item.icon} size={24} />
                  </div>
                  <div className="saas-category-tile-copy">
                    <strong>{item.name}</strong>
                    <small>{loading ? "Finding local listings…" : "More local finds coming soon"}</small>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* Listings Section (Using the Premium SaaS Cards) */}
      <section className="content-section listings-section" id="places">
        <SectionHeading
          eyebrow="GOOD PEOPLE. GOOD PLACES."
          title={
            submitted.q || submitted.location || submitted.businessType ? (
              "Your local finds"
            ) : (
              <>
                A few places worth <em>knowing.</em>
              </>
            )
          }
          description={
            submitted.q || submitted.location || submitted.businessType
              ? "Results matching your search from our local directory."
              : "Meet the local businesses that make our corner of the world feel like ours."
          }
          href="/businesses"
          linkLabel="Browse all places"
        />

        {(submitted.q || submitted.location || submitted.businessType) && (
          <div className="active-filters">
            <span>Showing filtered results</span>
            {submitted.q && (
              <button
                type="button"
                onClick={() => {
                  const next = { ...submitted, q: "" };
                  setQuery("");
                  setSubmitted(next);
                  loadData(next);
                }}
              >
                &ldquo;{submitted.q}&rdquo; ×
              </button>
            )}
            {submitted.location && (
              <button
                type="button"
                onClick={() => {
                  const next = { ...submitted, location: "" };
                  setLocation("");
                  setSubmitted(next);
                  loadData(next);
                }}
              >
                Location ×
              </button>
            )}
            {submitted.businessType && (
              <button
                type="button"
                onClick={() => {
                  const next = { ...submitted, businessType: "" };
                  setBusinessType("");
                  setSubmitted(next);
                  loadData(next);
                }}
              >
                Category ×
              </button>
            )}
            <button className="clear-filters" type="button" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        <div className="listing-discovery-note">
          <span className="discovery-note-icon">
            <HomeIcon name="spark" size={16} />
          </span>
          <span>
            <strong>There’s more behind every listing.</strong>
            <small>Open a place to see its photos, verified services, contact details, and directions.</small>
          </span>
          <span className="discovery-note-end">Explore local · Shop local</span>
        </div>

        {error && (
          <div className="load-message load-error">
            <strong>We hit a small bump.</strong>
            <span>{error}</span>
            <button type="button" onClick={() => loadData()}>
              Try again
            </button>
          </div>
        )}

        {loading && !businesses.length ? (
          <div className="saas-cards-grid">
            {[1, 2, 3, 4].map((item) => (
              <div className="saas-card-skeleton" key={item}>
                <div className="skeleton-image" />
                <div className="skeleton-body">
                  <div className="skeleton-line line-sm" />
                  <div className="skeleton-line line-title" />
                  <div className="skeleton-line line-text" />
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length ? (
          <div className="saas-cards-grid">
            {businesses.slice(0, 8).map((item, index) => (
              <BusinessCard key={item._id} item={item} index={index} />
            ))}
          </div>
        ) : !error ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <HomeIcon name="compass" size={28} />
            </span>
            <h3>
              {submitted.q || submitted.location || submitted.businessType
                ? "No exact matches just yet."
                : "The local story is just getting started."}
            </h3>
            <p>
              {submitted.q || submitted.location || submitted.businessType
                ? "Try a different search or remove a filter to see more of what’s nearby."
                : "We're getting the first local favourites ready. Check back soon, or help us grow the directory."}
            </p>
            <div>
              <button className="button-primary" onClick={clearFilters} type="button">
                Explore all listings <HomeIcon name="arrow" size={16} />
              </button>
              <Link className="button-secondary" href="/add-business">
                Add a business
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && pagination?.total > 8 && (
          <div className="section-bottom-note">
            <span>Showing 8 of {pagination.total} local places</span>
            <Link className="button-secondary" href="/businesses">
              See every result <HomeIcon name="arrow" size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* Local Story Feature Banner */}
      <section className="local-story" id="about">
        <div className="story-decoration">✳</div>
        <div className="story-copy">
          <span className="eyebrow">A LITTLE MORE LOCAL</span>
          <h2>
            There&apos;s more to a place than <em>its pin on a map.</em>
          </h2>
          <p>
            It&apos;s the chai spot that remembers your order. The shop that has exactly what you need. The hidden viewpoint you can&apos;t stop telling people about.
          </p>
          <p>
            We&apos;re here to help you find those places — and help the hardworking people behind them get discovered online.
          </p>
          <Link href="/add-business" className="story-link">
            Know a place we should know? <HomeIcon name="arrow" size={17} />
          </Link>
        </div>

        <div className="story-showcase-card">
          <div className="story-showcase-inner">
            <span className="story-showcase-badge">
              <HomeIcon name="heart" size={16} /> Made with local care
            </span>
            <h3>Empowering Rural Commerce</h3>
            <p>
              Direct contact, verified hours, and zero commissions. Helping local business owners in Ghoti, Igatpuri, and Nashik connect directly with customers.
            </p>
            <div className="story-perks-list">
              <div>✓ SEO & Google crawlable profiles</div>
              <div>✓ Direct WhatsApp & phone inquiries</div>
              <div>✓ Zero platform cut or hidden fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="add-cta">
        <div className="cta-icon">
          <HomeIcon name="spark" size={25} />
        </div>
        <div>
          <span className="eyebrow">FOR THE PEOPLE WHO MAKE A PLACE</span>
          <h2>
            Your business belongs <em>in the picture.</em>
          </h2>
          <p>
            Help your neighbours find you. Share what you do, where you are, and what makes you special.
          </p>
        </div>
        <Link href="/add-business" className="cta-button">
          Get your business discovered <HomeIcon name="arrow" size={18} />
        </Link>
        <span className="cta-doodle">↗</span>
      </section>

      {/* Site Footer */}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="brand footer-brand-logo-link" aria-label="GaavConnect home">
              <img
                className="brand-logo footer-brand-logo"
                src="/gaavconnect-logo.svg"
                alt="GaavConnect — Your Local Connection"
                width="270"
                height="75"
                loading="lazy"
              />
            </Link>
            <p>
              A more thoughtful way to find the businesses, people and places that make a place feel like home.
            </p>
          </div>

          <div className="footer-links">
            <strong>Discover</strong>
            <Link href="/businesses">All businesses</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/locations">Places & locations</Link>
          </div>

          <div className="footer-links">
            <strong>For business owners</strong>
            <Link href="/add-business">List your business</Link>
            <Link href="/for-businesses">Business resources</Link>
            <a href="#about">Why GaavConnect?</a>
          </div>

          <div className="footer-links">
            <strong>Trust & privacy</strong>
            <Link href="/about">About GaavConnect</Link>
            <Link href="/help">Help centre</Link>
            <Link href="/privacy">Privacy notice</Link>
            <Link href="/cookies">Cookie policy</Link>
            <button type="button" className="footer-cookie-settings" data-open-cookie-settings>
              Cookie settings
            </button>
          </div>

          <div className="footer-note">
            <span className="footer-spark">✳</span>
            <p>
              Find good things.
              <br />
              <em>Keep them close.</em>
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GaavConnect. Made for local life.</span>
          <span>
            Discover kindly. Support locally. <span aria-hidden="true">♥</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
