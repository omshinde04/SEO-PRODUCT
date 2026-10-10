"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

function renderCategorySvg(iconName, size = 24) {
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

export default function CategoryBrowser({ categories = [], countMap = {} }) {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, search]);

  return (
    <main className="directory-page saas-categories-page">
      <PublicNavbar activePath="/categories" />

      {/* Breadcrumb */}
      <nav className="detail-breadcrumb saas-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="crumb-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="crumb-current" aria-current="page">Categories</span>
      </nav>

      {/* Hero Section */}
      <section className="categories-hero-section">
        <div className="categories-hero-inner">
          <span className="saas-hero-pill">
            <span className="pill-dot" />
            <span>DIRECTORY SECTORS</span>
          </span>
          <h1 className="categories-hero-heading">
            Browse local business categories
          </h1>
          <p className="categories-hero-subtext">
            Explore authentic eateries, highway dhabas, farm stays, shops, clinics, and professional services across Ghoti, Igatpuri, Nashik and rural Maharashtra.
          </p>

          {/* Quick Stats Chips */}
          <div className="categories-stats-chips">
            <span className="cat-stat-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>{categories.length} Curated Sectors</span>
            </span>
            <span className="cat-stat-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>Nashik District</span>
            </span>
            <span className="cat-stat-badge highlight">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Verified Listings</span>
            </span>
          </div>

          {/* Instant Search Filter */}
          <div className="categories-search-box">
            <div className="cat-search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories (e.g. food, hotel, clinic, auto)…"
              className="cat-search-input"
              aria-label="Filter categories"
            />
            {search && (
              <button
                type="button"
                className="cat-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid of Categories */}
      <section className="categories-grid-section">
        {filteredCategories.length > 0 ? (
          <div className="saas-category-grid">
            {filteredCategories.map((cat) => {
              const count = countMap[cat._id?.toString()] || 0;
              return (
                <Link
                  key={cat._id}
                  href={`/categories/${cat.slug}`}
                  className="saas-cat-card"
                >
                  <div className="cat-card-header">
                    <div className="cat-card-icon-bubble">
                      {renderCategorySvg(cat.icon || "store", 24)}
                    </div>
                    <span className="cat-card-count-badge">
                      {count} {count === 1 ? "listing" : "listings"}
                    </span>
                  </div>

                  <div className="cat-card-info">
                    <h2 className="cat-card-title">{cat.name}</h2>
                    <p className="cat-card-description">
                      {cat.description ||
                        `Explore trusted local businesses and services under ${cat.name}.`}
                    </p>
                  </div>

                  <div className="cat-card-footer">
                    <span className="cat-card-action">
                      <span>Explore category</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="saas-empty-category-card">
            <div className="empty-icon-ring">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3>No categories match &ldquo;{search}&rdquo;</h3>
            <p>
              Try typing a different keyword, or clear your search to see all available business categories.
            </p>
            <div className="empty-action-group">
              <button
                type="button"
                className="saas-btn-primary"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
              <Link className="saas-btn-secondary" href="/businesses">
                Browse all businesses →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Business Owner Promotion Banner */}
      <section className="categories-cta-section">
        <div className="categories-cta-inner">
          <div className="cta-copy">
            <span className="eyebrow" style={{ color: "#a2e0b5" }}>BUSINESS DIRECTORY ONBOARDING</span>
            <h3>Are you a local business owner or artisan in Nashik district?</h3>
            <p>
              Get listed in our community directory so nearby customers and tourists can discover your services, timings, and location on GaavConnect.
            </p>
          </div>
          <Link href="/add-business" className="cta-btn">
            <span>+ List your business for free</span>
          </Link>
        </div>
      </section>

      {/* Directory Footer */}
      <PublicFooter />
    </main>
  );
}
