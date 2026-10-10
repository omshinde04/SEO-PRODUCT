"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Search,
  X,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Store,
  Home,
  Mountain,
  Landmark,
  Phone,
  MessageCircle,
  Sparkles,
  Layers,
  Compass,
} from "lucide-react";

/**
 * 20% Curated static enrichment fallback for legacy locations.
 * 80% is dynamically pulled from MongoDB & Admin panel updates.
 */
const LOCATION_METADATA = {
  "igatpuri": {
    marathi: "इगतपुरी",
    categoryType: "Hill Station & Tourism",
    typeBadge: "Hill Station",
    tagline: "Western Ghats Gateway • Waterfalls & Mountain Stays",
    description: "Misty hill station gateway in the Western Ghats, renowned for scenic monsoon waterfalls, Vipassana meditation center, mountain resorts, and lush valley viewpoints.",
    tags: ["Resorts & Stays", "Monsoon Waterfalls", "Highway Dhabas", "Vipassana", "Camping"],
    taluka: "Igatpuri Taluka",
    pincode: "422403",
    colorTheme: "emerald",
  },
  "ghoti": {
    marathi: "घोटी",
    categoryType: "Highway & Market Towns",
    typeBadge: "Highway & Market Town",
    tagline: "NH-160 Crossroads • Agricultural Mandi Hub",
    description: "Dynamic highway junction connecting Mumbai-Nashik NH-160 and rural trading belts. Famous for vibrant weekly vegetable mandis, highway dhabas, and auto repair centers.",
    tags: ["Highway Dhabas", "Agro Mandi", "Auto Repair & Garages", "Local Bazaars", "Services"],
    taluka: "Igatpuri Taluka",
    pincode: "422402",
    colorTheme: "amber",
  },
  "trimbakeshwar": {
    marathi: "त्र्यंबकेश्वर",
    categoryType: "Pilgrimage & Heritage",
    typeBadge: "Pilgrimage Centre",
    tagline: "Sacred Jyotirlinga • Origin of Godavari",
    description: "Sacred pilgrimage center nestled at the foot of Brahmagiri hills. Renowned for the holy Trimbakeshwar Jyotirlinga temple, ancient dharmashalas, and religious hospitality.",
    tags: ["Jyotirlinga Temple", "Brahmagiri Hills", "Pilgrim Stays", "Pooja Samagri", "Bhojanalayas"],
    taluka: "Trimbakeshwar Taluka",
    pincode: "422212",
    colorTheme: "orange",
  },
  "nashik-city": {
    marathi: "नाशिक शहर",
    categoryType: "Urban & Metro",
    typeBadge: "District Capital & Metro",
    tagline: "Godavari Cultural & Commercial Center",
    description: "The vibrant cultural, commercial, and wine capital of Maharashtra. Features major hospitals, multi-cuisine dining, industrial zones, shopping avenues, and historic ghats.",
    tags: ["Hospitals & Clinics", "Fine Dining", "Automotive", "Retail Bazaars", "Wine Capital"],
    taluka: "Nashik Taluka",
    pincode: "422001",
    colorTheme: "blue",
  },
  "sinnar": {
    marathi: "सिन्नर",
    categoryType: "Highway & Market Towns",
    typeBadge: "Historic & MIDC Hub",
    tagline: "Gondeshwar Temple • Industrial Growth Corridor",
    description: "Historic manufacturing and architectural center renowned for the 11th-century stone Gondeshwar Temple, bustling MIDC industrial belt, and traditional craftsmen.",
    tags: ["Gondeshwar Temple", "MIDC Industrial Hub", "Automotive Spares", "Local Markets"],
    taluka: "Sinnar Taluka",
    pincode: "422103",
    colorTheme: "stone",
  },
  "pimpalgaon": {
    marathi: "पिंपळगाव बसवंत",
    categoryType: "Highway & Market Towns",
    typeBadge: "Agro & Mandi Capital",
    tagline: "Asia's Leading Onion & Grape Trade Center",
    description: "Agricultural commerce powerhouse of Asia, celebrated for its sprawling APMC onion and grape mandis, modern cold storage chains, and rural trading infrastructure.",
    tags: ["Onion & Grape Mandi", "Cold Storage", "Agri Inputs & Fertilizers", "Tractor Repairs"],
    taluka: "Niphad Taluka",
    pincode: "422209",
    colorTheme: "green",
  },
  "bhagur": {
    marathi: "भगूर",
    categoryType: "Pilgrimage & Heritage",
    typeBadge: "Historic Cantonment Town",
    tagline: "Heritage Town • Birthplace of Veer Savarkar",
    description: "Historic heritage cantonment town located near Deolali Camp, celebrated as the birthplace of Veer Vinayak Damodar Savarkar, with local markets and community businesses.",
    tags: ["Freedom Heritage", "Deolali Gateway", "Community Kirana", "Local Sweets"],
    taluka: "Nashik Taluka",
    pincode: "422502",
    colorTheme: "indigo",
  },
  "kavathe": {
    marathi: "कवठे",
    categoryType: "Rural Gaavs",
    typeBadge: "Rural Village Gaav",
    tagline: "Agricultural Countryside • Traditional Community",
    description: "Peaceful agricultural village community nestled near Ghoti and Igatpuri. Features traditional dairy farming, seasonal crops, and authentic rural provisions.",
    tags: ["Rural Village Life", "Farm Produce", "Dairy Provisions", "Community Trade"],
    taluka: "Igatpuri Taluka",
    pincode: "422402",
    colorTheme: "teal",
  },
};

const FILTER_TABS = [
  { id: "all", label: "All Locations", Icon: Layers },
  { id: "Highway & Market Towns", label: "Market Towns", Icon: Store },
  { id: "Hill Station & Tourism", label: "Hill Station", Icon: Mountain },
  { id: "Pilgrimage & Heritage", label: "Pilgrimage & Heritage", Icon: Landmark },
  { id: "Urban & Metro", label: "Urban & Metro", Icon: Building2 },
  { id: "Rural Gaavs", label: "Rural Villages", Icon: Home },
];

function renderLocationIcon(slug, type, size = 20) {
  const common = { size, strokeWidth: 2, className: "banner-svg-icon", "aria-hidden": true };
  if (slug === "igatpuri") return <Mountain {...common} />;
  if (slug === "trimbakeshwar") return <Landmark {...common} />;
  if (slug === "nashik-city") return <Building2 {...common} />;
  if (slug === "ghoti" || slug === "pimpalgaon" || slug === "sinnar") return <Store {...common} />;
  if (slug === "kavathe") return <Home {...common} />;
  if (slug === "bhagur") return <Landmark {...common} />;
  if (type === "city") return <Building2 {...common} />;
  if (type === "village") return <Home {...common} />;
  if (type === "town") return <Store {...common} />;
  return <Compass {...common} />;
}

export default function LocationsDirectoryClient({ initialLocations = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Merge database items with rich metadata: Admin fields take absolute priority (80/20 rule)
  const enrichedLocations = useMemo(() => {
    return initialLocations.map((item) => {
      const meta = LOCATION_METADATA[item.slug];

      const defaultTypeBadge =
        item.type === "city"
          ? "District Capital & Metro"
          : item.type === "village"
          ? "Rural Village Gaav"
          : item.type === "region"
          ? "Regional Belt"
          : "Market Town";

      const defaultCategory =
        item.type === "village"
          ? "Rural Gaavs"
          : item.type === "city"
          ? "Urban & Metro"
          : "Highway & Market Towns";

      const defaultColorTheme =
        item.type === "village"
          ? "teal"
          : item.type === "city"
          ? "blue"
          : item.type === "region"
          ? "emerald"
          : "green";

      const displayName = item.name;
      const marathiName = meta?.marathi || item.name;
      const displayDesc =
        item.description?.trim() ||
        meta?.description ||
        `Explore verified local businesses, trade centers, and places in ${item.name}, Maharashtra.`;

      const tagline =
        item.seo?.title?.trim() ||
        meta?.tagline ||
        `Local Discovery & Business Center in ${item.name}`;

      const pincode =
        item.address?.postalCodes?.[0] || meta?.pincode || "";

      const taluka = item.address?.district
        ? item.address.district.toLowerCase().includes("taluka") ||
          item.address.district.toLowerCase().includes("district")
          ? item.address.district
          : `${item.address.district} Taluka`
        : meta?.taluka || "Nashik District";

      const categoryType = meta?.categoryType || defaultCategory;
      const typeBadge = meta?.typeBadge || defaultTypeBadge;
      const colorTheme = meta?.colorTheme || defaultColorTheme;
      const tags = meta?.tags || [
        `${item.name} Businesses`,
        "Local Stores & Food",
        "Essential Services",
      ];
      const coverImageUrl = item.coverImage?.url || "";

      return {
        ...item,
        displayName,
        marathiName,
        displayDesc,
        tagline,
        pincode,
        taluka,
        categoryType,
        typeBadge,
        colorTheme,
        tags,
        coverImageUrl,
      };
    });
  }, [initialLocations]);

  // Filtered locations based on search and category
  const filteredLocations = useMemo(() => {
    return enrichedLocations.filter((item) => {
      // Category filter
      if (activeFilter !== "all" && item.categoryType !== activeFilter) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = item.displayName.toLowerCase().includes(q);
      const marathiMatch = item.marathiName.toLowerCase().includes(q);
      const descMatch = item.displayDesc.toLowerCase().includes(q);
      const pinMatch = item.pincode.includes(q);
      const tagMatch = item.tags.some((t) => t.toLowerCase().includes(q));
      const talukaMatch = item.taluka.toLowerCase().includes(q);

      return nameMatch || marathiMatch || descMatch || pinMatch || tagMatch || talukaMatch;
    });
  }, [enrichedLocations, activeFilter, searchQuery]);

  return (
    <div className="locations-directory-container">
      {/* Hero Section */}
      <section className="locations-hero">
        <div className="locations-hero-ambient" aria-hidden="true" />
        <div className="locations-hero-content">
          <div className="locations-eyebrow-pill">
            <span className="eyebrow-dot" />
            <span>NASHIK DISTRICT LOCAL DIRECTORY</span>
            <span className="eyebrow-badge">MAHARASHTRA</span>
          </div>

          <h1 className="locations-main-title">
            Explore Towns, Cities &amp; Villages{" "}
            <em>Across Maharashtra</em>
          </h1>

          <p className="locations-hero-sub">
            Find trusted dhabas, hill resorts, agricultural supply centers, clinics, and village provisions
            across highway corridors and rural belts in Nashik district.
          </p>

          {/* Metric Stats Banner */}
          <div className="locations-stats-ribbon">
            <div className="stat-item">
              <span className="stat-val">{enrichedLocations.length || 8}</span>
              <span className="stat-lbl">Connected Towns &amp; Gaavs</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-val">100%</span>
              <span className="stat-lbl">Verified Places</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-val">0%</span>
              <span className="stat-lbl">Aggregator Fees</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-val">NH-160</span>
              <span className="stat-lbl">Highway &amp; Rural Belt</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Controls Bar: Search & Category Filter */}
      <section className="locations-controls-section">
        <div className="controls-wrapper">
          {/* Search Box */}
          <div className="locations-search-box">
            <Search className="search-icon" size={17} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by town, village, PIN code or keyword (e.g. Igatpuri, Ghoti, Waterfalls, 422403)..."
              aria-label="Search local areas"
              className="locations-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="locations-filter-pills" role="tablist" aria-label="Location categories">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              const TabIcon = tab.Icon;
              const count =
                tab.id === "all"
                  ? enrichedLocations.length
                  : enrichedLocations.filter((loc) => loc.categoryType === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`filter-pill-btn ${isActive ? "active" : ""}`}
                >
                  <TabIcon size={14} aria-hidden="true" />
                  <span>{tab.label}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Locations Cards Grid */}
      <section className="locations-grid-section">
        {filteredLocations.length > 0 ? (
          <div className="locations-rich-grid">
            {filteredLocations.map((item) => (
              <Link
                key={item._id || item.slug}
                href={`/locations/${item.slug}`}
                className="location-rich-card"
              >
                {/* Visual Header Banner */}
                <div
                  className={`card-visual-banner ${
                    item.coverImageUrl ? "has-cover-image" : ""
                  } theme-${item.colorTheme}`}
                >
                  {item.coverImageUrl && (
                    <>
                      <img
                        src={item.coverImageUrl}
                        alt={item.coverImage?.alt || item.displayName}
                        loading="lazy"
                        className="card-banner-cover-photo"
                      />
                      <div className="card-banner-overlay" aria-hidden="true" />
                    </>
                  )}
                  <div className="banner-top-row">
                    <span className="type-badge">
                      {renderLocationIcon(item.slug, item.type, 13)}
                      <span>{item.typeBadge}</span>
                    </span>
                    {item.pincode && <span className="pincode-pill">PIN {item.pincode}</span>}
                  </div>
                  <div className="banner-landscape-icon">
                    {renderLocationIcon(item.slug, item.type, 22)}
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="card-body">
                  <div className="card-title-row">
                    <div className="name-block">
                      <h2 className="location-name">{item.displayName}</h2>
                      <span className="location-marathi">{item.marathiName}</span>
                    </div>
                    <span className="card-arrow-circle" aria-hidden="true">
                      <ArrowUpRight size={15} />
                    </span>
                  </div>

                  <p className="location-tagline">{item.tagline}</p>
                  <p className="location-desc">{item.displayDesc}</p>

                  {/* Highlights / Tags */}
                  <div className="location-tags-wrap">
                    {item.tags.slice(0, 4).map((tag, idx) => (
                      <span key={idx} className="loc-tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Meta & Action */}
                  <div className="card-footer-strip">
                    <span className="taluka-badge">
                      <MapPin size={13} className="geo-pin-icon" aria-hidden="true" />
                      <span>{item.taluka}</span>
                    </span>
                    <span className="explore-action-text">
                      <span>Browse Places</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="locations-empty-state">
            <Search className="empty-search-icon" size={36} aria-hidden="true" />
            <h3>No locations found</h3>
            <p>
              We couldn&apos;t find any local areas matching <strong>&ldquo;{searchQuery}&rdquo;</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="btn-clear-search"
            >
              Reset Filters &amp; View All Locations
            </button>
          </div>
        )}
      </section>

      {/* Bottom Conversion & Founder Helpline Banner */}
      <section className="locations-founder-cta">
        <div className="founder-cta-container">
          <div className="founder-cta-text">
            <div className="cta-kicker">
              <Sparkles size={14} className="kicker-spark-icon" aria-hidden="true" />
              <span>EXPANDING ACROSS MAHARASHTRA</span>
            </div>
            <h2>Missing your village or want your business listed?</h2>
            <p>
              Are you running a highway dhaba, stay, clinic, garage, or kirana store in another village or town?
              List your business for free or reach out directly to founder <strong>Om Shinde</strong> on WhatsApp or Call.
            </p>
          </div>

          <div className="founder-cta-buttons">
            <Link href="/add-business" className="cta-btn-primary">
              <span>+ List Your Business Free</span>
              <ArrowUpRight size={15} />
            </Link>
            <a
              href="https://wa.me/919373545169"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn-wa"
            >
              <MessageCircle size={15} />
              <span>WhatsApp (+91 9373545169)</span>
            </a>
            <a href="tel:+919373545169" className="cta-btn-call">
              <Phone size={15} />
              <span>Call (+91 9373545169)</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
