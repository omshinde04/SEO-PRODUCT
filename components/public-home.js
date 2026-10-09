"use client";

import Link from "next/link";
import GooglePlaceAutocomplete from "@/components/google-place-autocomplete";
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

const CATEGORY_ART = ["art-coral", "art-blue", "art-gold", "art-green", "art-lilac", "art-peach"];

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z" />,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z" /></>,
  };
  return <svg {...common}>{paths[name] || paths.spark}</svg>;
}

function imageOf(item) {
  return item?.coverImage?.url || item?.images?.[0]?.url || item?.logo?.url || "";
}

function BusinessCard({ item, index }) {
  const image = imageOf(item);
  const location = [item.address?.area, item.address?.city, item.location?.name].filter(Boolean).filter((value, i, all) => all.indexOf(value) === i).join(", ");
  return (
    <article className="business-card">
      <Link href={`/businesses/${item.slug}`} className="business-card-image" aria-label={`View ${item.name}`}>
        {image ? <img src={image} alt={item.coverImage?.alt || item.name} loading={index < 3 ? "eager" : "lazy"} /> : <div className={`business-art ${CATEGORY_ART[index % CATEGORY_ART.length]}`}><span>{(item.name || "L").slice(0, 1).toUpperCase()}</span><small>LOCAL FIND</small></div>}
        {item.isFeatured && <span className="featured-pill"><Icon name="spark" size={13} /> Featured</span>}
        {item.verificationStatus === "verified" && <span className="verified-mark" title="Verified listing"><Icon name="shield" size={17} /></span>}
      </Link>
      <div className="business-card-body">
        <div className="business-card-meta"><span>{item.category?.name || "Local business"}</span><span className="open-label"><i /> Local listing</span></div>
        <h3><Link href={`/businesses/${item.slug}`}>{item.name}</Link></h3>
        <p className="business-tagline">{item.tagline || item.description || "Discover details, services and how to get in touch."}</p>
        <div className="business-card-footer"><span className="location-line"><Icon name="pin" size={15} />{location || "Local area"}</span><Link className="card-arrow" href={`/businesses/${item.slug}`} aria-label={`Explore ${item.name}`}><Icon name="arrow" size={18} /></Link></div>
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, href, linkLabel = "Explore all" }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{href && <Link href={href} className="text-link">{linkLabel}<Icon name="arrow" size={17} /></Link>}</div>;
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

  const loadData = useCallback(async (filters = submitted) => {
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
        businessResponse.json(), categoryResponse.json(),
      ]);
      if (!businessResponse.ok || !businessData.success) throw new Error(businessData.message || "We couldn't load listings right now.");
      setBusinesses(businessData.items || []);
      setPagination(businessData.pagination || null);
      setCategories(categoryData.success ? categoryData.items || [] : []);
    } catch (loadError) {
      setError(loadError.message || "Something went wrong while loading local discoveries.");
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [submitted]);

  const featuredCategories = useMemo(() => categories.slice(0, 6), [categories]);

  function handleSearch(event) {
    event.preventDefault();
    const next = { q: query.trim(), location: selectedPlace?.searchText || location.trim(), businessType };
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
      <div className="announcement-bar"><span className="announcement-dot" /> Your neighbourhood, better discovered <span className="announcement-separator">·</span> Starting in Nashik district <span className="announcement-right">Made for the places we call home <span aria-hidden="true">✳</span></span></div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="GaavConnect home"><img className="brand-logo" src="/gaavconnect-logo.svg" alt="GaavConnect — Your Local Connection" width="270" height="75" fetchPriority="high" /></Link>
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#discover">Discover</a><a href="#categories">Categories</a><a href="#places">Places</a><a href="#about">Our story</a></nav>
        <div className="header-actions"><Link className="header-add" href="/add-business">List your business <Icon name="arrow" size={16} /></Link><button className="mobile-menu" type="button" onClick={() => document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" })} aria-label="Jump to search"><Icon name="search" /></button></div>
      </header>

      <section className="hero" id="discover">
        <div className="hero-grid-pattern" aria-hidden="true" />
        <div className="hero-copy"><div className="hero-kicker"><span className="kicker-icon"><Icon name="spark" size={15} /></span> THE LOCAL WAY TO FIND YOUR WAY <span className="kicker-line" /></div>
          <h1>Find your kind<br />of <span className="hero-highlight">wonder.</span><span className="hero-period">✳</span></h1>
          <p className="hero-description">The little-known gems, trusted local businesses, and places worth the trip. All the good stuff, closer than you think.</p>
          <div className="hero-proof"><div className="proof-avatars"><span>N</span><span>G</span><span>I</span><span>+</span></div><span>Built around <strong>real local places</strong></span><span className="proof-divider" /><span><Icon name="shield" size={15} /> Community-first discovery</span></div>
        </div>
        <div className="hero-art" aria-label="Illustration of a local town and surrounding hills">
          <div className="sun-disc" /><div className="hero-cloud cloud-one" /><div className="hero-cloud cloud-two" />
          <div className="hill hill-back" /><div className="hill hill-mid" /><div className="hill hill-front" />
          <div className="hero-road" /><div className="town-building building-one"><i /><i /><i /></div><div className="town-building building-two"><i /><i /><i /><i /></div><div className="town-building building-three"><i /><i /></div>
          <div className="hero-pin pin-one"><Icon name="pin" size={18} /><span>Local gems</span></div><div className="hero-pin pin-two"><Icon name="spark" size={17} /><span>Worth the trip</span></div>
          <div className="hero-art-caption"><span>20° 08&apos; N · 73° 52&apos; E</span><span>YOUR NEXT FAVOURITE PLACE</span></div>
        </div>
        <div className="search-panel-wrap"><form className="search-panel" onSubmit={handleSearch}>
          <label className="search-field search-keyword"><span className="search-icon"><Icon name="search" size={20} /></span><span className="field-content"><span className="field-label">WHAT ARE YOU LOOKING FOR?</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Coffee, stays, a great mechanic..." aria-label="Search businesses and services" /></span></label>
          <span className="search-divider" />
          <div className="search-field search-location"><span className="search-icon"><Icon name="pin" size={20} /></span><div className="field-content"><GooglePlaceAutocomplete inputId="home-location-search" label="AROUND WHERE?" value={location} onChange={(value) => { setLocation(value); setSelectedPlace(null); }} onSelect={(place) => setSelectedPlace(place ? { ...place, searchText: place.address?.city || place.address?.area || place.address?.district || place.name || place.description } : null)} placeholder="Search a town or village" /></div></div>
          <label className="search-field search-category"><span className="search-icon"><Icon name="compass" size={20} /></span><span className="field-content"><span className="field-label">THE KIND OF THING</span><select value={businessType} onChange={(event) => setBusinessType(event.target.value)} aria-label="Filter by business category">{TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></span></label>
          <button className="search-submit" type="submit"><Icon name="search" size={18} /><span>Find it</span></button>
        </form><div className="popular-searches"><span>TRY SOMETHING LIKE</span><button type="button" onClick={() => { setQuery("coffee"); setSubmitted({ q: "coffee", location: selectedPlace?.searchText || location.trim(), businessType }); loadData({ q: "coffee", location: selectedPlace?.searchText || location.trim(), businessType }); }}>Coffee spots</button><i>·</i><button type="button" onClick={() => { setBusinessType("hotel"); setSubmitted({ q: query, location: selectedPlace?.searchText || location.trim(), businessType: "hotel" }); loadData({ q: query, location: selectedPlace?.searchText || location.trim(), businessType: "hotel" }); }}>Weekend stays</button><i>·</i><button type="button" onClick={() => { setBusinessType("healthcare"); setSubmitted({ q: query, location: selectedPlace?.searchText || location.trim(), businessType: "healthcare" }); loadData({ q: query, location: selectedPlace?.searchText || location.trim(), businessType: "healthcare" }); }}>Health & wellness</button></div></div>
      </section>

      <section className="trust-strip" aria-label="Our values"><div><span className="trust-icon"><Icon name="shield" size={19} /></span><span><strong>Thoughtfully discovered</strong><small>Useful places, not endless noise</small></span></div><div><span className="trust-icon"><Icon name="heart" size={19} /></span><span><strong>Rooted in community</strong><small>Local stories deserve the spotlight</small></span></div><div><span className="trust-icon"><Icon name="spark" size={19} /></span><span><strong>Made for real life</strong><small>Find your next everyday favourite</small></span></div><div className="trust-note">Small places. <em>Big part of life.</em></div></section>

      <section className="content-section category-section" id="categories"><SectionHeading eyebrow="A GOOD PLACE TO START" title={<>What are you <em>in the mood for?</em></>} description="From everyday essentials to the places that make a day feel special." href="/categories" linkLabel="All categories" />
        <div className="category-grid">{featuredCategories.length ? featuredCategories.map((category, index) => <Link className={`category-tile ${CATEGORY_ART[index % CATEGORY_ART.length]}`} href={`/categories/${category.slug}`} key={category._id}><span className="category-symbol">{category.icon || ["✳", "⌂", "◒", "✺", "↗", "❋"][index % 6]}</span><span className="category-tile-copy"><strong>{category.name}</strong><small>{category.description || "Find local favourites"}</small></span><span className="category-tile-arrow"><Icon name="arrow" size={17} /></span></Link>) : ["Food & drink", "Places to stay", "Health & care", "Shopping", "Things to do", "Everyday services"].map((name, index) => <div className={`category-tile ${CATEGORY_ART[index % CATEGORY_ART.length]} category-placeholder`} key={name}><span className="category-symbol">{["✳", "⌂", "◒", "✺", "↗", "❋"][index]}</span><span className="category-tile-copy"><strong>{name}</strong><small>{loading ? "Finding local listings…" : "More local finds coming soon"}</small></span></div>)}</div>
      </section>

      <section className="content-section listings-section" id="places"><SectionHeading eyebrow="GOOD PEOPLE. GOOD PLACES." title={submitted.q || submitted.location || submitted.businessType ? "Your local finds" : <>A few places worth <em>knowing.</em></>} description={submitted.q || submitted.location || submitted.businessType ? "Results from the listings shared with our community." : "Meet the local businesses that make our corner of the world feel like ours."} href="/businesses" linkLabel="Browse all places" />
        {(submitted.q || submitted.location || submitted.businessType) && <div className="active-filters"><span>Showing filtered results</span>{submitted.q && <button type="button" onClick={() => { const next = { ...submitted, q: "" }; setQuery(""); setSubmitted(next); loadData(next); }}>“{submitted.q}” ×</button>}{submitted.location && <button type="button" onClick={() => { const next = { ...submitted, location: "" }; setLocation(""); setSubmitted(next); loadData(next); }}>Location ×</button>}{submitted.businessType && <button type="button" onClick={() => { const next = { ...submitted, businessType: "" }; setBusinessType(""); setSubmitted(next); loadData(next); }}>Category ×</button>}<button className="clear-filters" type="button" onClick={clearFilters}>Clear all</button></div>}
        {error && <div className="load-message load-error"><strong>We hit a small bump.</strong><span>{error}</span><button type="button" onClick={() => loadData()}>Try again</button></div>}
        {loading && !businesses.length ? <div className="business-grid">{[1, 2, 3, 4].map((item) => <div className="business-skeleton" key={item}><div /><span /><i /><i /></div>)}</div> : businesses.length ? <div className="business-grid">{businesses.slice(0, 8).map((item, index) => <BusinessCard key={item._id} item={item} index={index} />)}</div> : !error ? <div className="empty-state"><span className="empty-state-icon"><Icon name="compass" size={28} /></span><h3>{submitted.q || submitted.location || submitted.businessType ? "No exact matches just yet." : "The local story is just getting started."}</h3><p>{submitted.q || submitted.location || submitted.businessType ? "Try a different search or remove a filter to see more of what’s nearby." : "We&apos;re getting the first local favourites ready. Check back soon, or help us grow the directory."}</p><div><button className="button-primary" onClick={clearFilters} type="button">Explore all listings <Icon name="arrow" size={16} /></button><Link className="button-secondary" href="/add-business">Add a business</Link></div></div> : null}
        {!loading && pagination?.total > 8 && <div className="section-bottom-note"><span>Showing 8 of {pagination.total} local places</span><Link className="button-secondary" href="/businesses">See every result <Icon name="arrow" size={16} /></Link></div>}
      </section>

      <section className="local-story" id="about"><div className="story-decoration">✳</div><div className="story-copy"><span className="eyebrow">A LITTLE MORE LOCAL</span><h2>There&apos;s more to a place than <em>its pin on a map.</em></h2><p>It&apos;s the chai spot that remembers your order. The shop that has exactly what you need. The hidden viewpoint you can&apos;t stop telling people about.</p><p>We&apos;re here to help you find those places — and help the people behind them get found.</p><Link href="/add-business" className="story-link">Know a place we should know? <Icon name="arrow" size={17} /></Link></div><div className="story-art"><div className="story-sun" /><div className="story-hill story-hill-one" /><div className="story-hill story-hill-two" /><div className="story-house"><span /><i /><i /><b /></div><div className="story-stamp"><Icon name="heart" size={22} /><span>MADE WITH<br />LOCAL LOVE</span></div><span className="story-caption">A GOOD PLACE TO BEGIN</span></div></section>

      <section className="add-cta"><div className="cta-icon"><Icon name="spark" size={25} /></div><div><span className="eyebrow">FOR THE PEOPLE WHO MAKE A PLACE</span><h2>Your business belongs <em>in the picture.</em></h2><p>Help your neighbours find you. Share what you do, where you are, and what makes you special.</p></div><Link href="/add-business" className="cta-button">Get your business discovered <Icon name="arrow" size={18} /></Link><span className="cta-doodle">↗</span></section>

      <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><Link href="/" className="brand footer-brand-logo-link" aria-label="GaavConnect home"><img className="brand-logo footer-brand-logo" src="/gaavconnect-logo.svg" alt="GaavConnect — Your Local Connection" width="270" height="75" loading="lazy" /></Link><p>A more thoughtful way to find the businesses, people and places that make a place feel like home.</p></div><div className="footer-links"><strong>Discover</strong><Link href="/businesses">All businesses</Link><Link href="/categories">Categories</Link><Link href="/locations">Places & locations</Link></div><div className="footer-links"><strong>For business owners</strong><Link href="/add-business">List your business</Link><Link href="/for-businesses">Business resources</Link><a href="#about">Why GaavConnect?</a></div><div className="footer-links"><strong>Trust & privacy</strong><Link href="/about">About GaavConnect</Link><Link href="/help">Help centre</Link><Link href="/privacy">Privacy notice</Link><Link href="/cookies">Cookie policy</Link><button type="button" className="footer-cookie-settings" data-open-cookie-settings>Cookie settings</button></div><div className="footer-note"><span className="footer-spark">✳</span><p>Find good things.<br /><em>Keep them close.</em></p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} GaavConnect. Made for local life.</span><span>Discover kindly. Support locally. <span aria-hidden="true">♥</span></span></div></footer>
    </main>
  );
}
