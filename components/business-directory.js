"use client";

import Link from "next/link";
import GooglePlaceAutocomplete from "@/components/google-place-autocomplete";
import { useEffect, useState } from "react";

const TYPES = [
  ["", "All types"], ["restaurant", "Food & dining"], ["hotel", "Hotels & stays"],
  ["retail", "Shopping"], ["healthcare", "Health & wellness"],
  ["professional_service", "Professional services"], ["tourism", "Tours & experiences"],
  ["attraction", "Places to visit"], ["guide", "Local guides"], ["other", "Other"],
];

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
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/categories?limit=100").then((r) => r.json()),
      fetch("/api/locations?limit=100").then((r) => r.json()),
    ]).then(([cats, locs]) => {
      if (!active) return;
      if (cats.success) setCategories(cats.items || []);
      if (locs.success) setLocations(locs.items || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

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
        if (active) setData({ items: result.items || [], pagination: result.pagination || null });
      } catch (err) {
        if (active && err.name !== "AbortError") setError(err.message || "Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, location, selectedPlace, category, type, page]);

  function reset() { setQuery(""); setLocation(""); setSelectedPlace(null); setCategory(""); setType(""); setPage(1); }

  return (
    <main className="directory-page">
      <header className="directory-header"><Link href="/" className="directory-back">← GaavConnect</Link><Link href="/add-business" className="directory-add">List your business ↗</Link></header>
      <section className="directory-intro"><span className="eyebrow">YOUR NEXT FAVOURITE PLACE IS OUT THERE</span><h1>Good places.<br /><em>Closer than ever.</em></h1><p>Explore local businesses and places worth knowing. Search for what you need, then narrow it down to your neighbourhood.</p></section>
      <section className="directory-layout">
        <aside className="filter-panel"><div className="filter-title"><strong>Make it yours</strong><button type="button" onClick={reset}>Reset</button></div>
          <label className="filter-label">SEARCH<input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Business, service, keyword…" /></label>
          <div className="filter-label"><GooglePlaceAutocomplete inputId="directory-location-search" label="LOCATION" value={location} onChange={(value) => { setLocation(value); setSelectedPlace(null); setPage(1); }} onSelect={(place) => { setSelectedPlace(place ? { ...place, searchText: place.address?.city || place.address?.area || place.address?.district || place.name || place.description } : null); setPage(1); }} placeholder="Search a town or village" /></div>
          <label className="filter-label">CATEGORY<select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">Every category</option>{categories.map((item) => <option key={item._id} value={item.slug}>{item.name}</option>)}</select></label>
          <div className="filter-label">KIND OF PLACE<div className="type-options">{TYPES.map(([value, label]) => <button type="button" className={type === value ? "type-option selected" : "type-option"} key={value} onClick={() => { setType(value); setPage(1); }}>{label}</button>)}</div></div>
          <div className="filter-footnote">Showing published listings with active categories and locations.</div>
        </aside>
        <div className="directory-results"><div className="results-heading"><div><span className="eyebrow">THE LOCAL DIRECTORY</span><h2>{loading && !data.pagination ? "Finding your local favourites…" : `${data.pagination?.total ?? data.items.length} places to explore`}</h2></div><span className="results-page">Page {page}{data.pagination?.totalPages ? ` of ${Math.max(1, data.pagination.totalPages)}` : ""}</span></div>
          {error && <div className="directory-empty"><h3>We couldn't load the directory.</h3><p>{error}</p><button onClick={() => setPage((value) => value)} type="button">Try again</button></div>}
          {loading && !data.items.length ? <div className="directory-cards">{[1,2,3,4,5,6].map((n) => <div className="business-skeleton" key={n}><div /><span /><i /><i /></div>)}</div> : data.items.length ? <div className="directory-cards">{data.items.map((item, index) => {
            const image = imageFor(item);
            const place = [item.address?.area, item.address?.city, item.location?.name].filter(Boolean).filter((value, i, all) => all.indexOf(value) === i).join(", ");
            return <article className="business-card" key={item._id}><Link className="business-card-image" href={`/businesses/${item.slug}`}>{image ? <img src={image} alt={item.coverImage?.alt || item.name} loading="lazy" /> : <div className={`business-art art-${["coral","blue","gold","green","lilac","peach"][index % 6]}`}><span>{item.name?.slice(0,1)}</span><small>LOCAL FIND</small></div>}{item.isFeatured && <span className="featured-pill">✳ Featured</span>}</Link><div className="business-card-body"><div className="business-card-meta"><span>{item.category?.name || "Local business"}</span>{item.verificationStatus === "verified" && <span>✓ Verified</span>}</div><h3><Link href={`/businesses/${item.slug}`}>{item.name}</Link></h3><p className="business-tagline">{item.tagline || item.description || "Discover services, details and how to get in touch."}</p><div className="business-card-footer"><span className="location-line">⌖ {place || "Local area"}</span><Link className="card-arrow" href={`/businesses/${item.slug}`} aria-label={`Explore ${item.name}`}>↗</Link></div></div></article>;
          })}</div> : !error && <div className="directory-empty"><span className="empty-state-icon">⌕</span><h3>No exact matches just yet.</h3><p>Try another search, change your filters, or explore the full directory.</p><button className="button-primary" onClick={reset} type="button">Clear filters ↗</button><Link className="button-secondary" href="/add-business">Add a business</Link></div>}
          <div className="pagination-controls"><button type="button" disabled={page <= 1 || loading} onClick={() => { setPage((value) => value - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Previous</button><span>{page}{data.pagination?.totalPages ? ` / ${Math.max(1, data.pagination.totalPages)}` : ""}</span><button type="button" disabled={loading || !data.pagination || page >= data.pagination.totalPages} onClick={() => { setPage((value) => value + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next →</button></div>
        </div>
      </section>
      <footer className="directory-footer"><Link href="/">GaavConnect</Link><span>Good things, close by.</span></footer>
    </main>
  );
}
