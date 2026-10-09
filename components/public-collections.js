"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicNavbar from "@/components/public-navbar";

export default function PublicCollections({ kind }) {
  const isCategory = kind === "categories";
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (query.trim()) params.set("q", query.trim());
        if (isCategory) params.set("parent", "root");
        else params.set("parent", "root");
        const response = await fetch(`/api/${kind}?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Could not load this directory.");
        setItems(result.items || []);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 160);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, isCategory, query]);
  return <main className="directory-page">
    <PublicNavbar activePath={`/${kind}`} />
    <section className="directory-intro"><span className="eyebrow">{isCategory ? "FIND YOUR KIND OF PLACE" : "EXPLORE THE NEIGHBOURHOOD"}</span><h1>{isCategory ? <>A little of <em>everything.</em></> : <>Places make <em>the place.</em></>}</h1><p>{isCategory ? "Browse local categories and discover the people, places and services that make every area special." : "Choose a city or town to discover local businesses, experiences and useful places around you."}</p>
      <label className="collection-search"><span className="sr-only">{isCategory ? "Search categories" : "Search locations"}</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={isCategory ? "Search categories…" : "Search cities and towns…"} /><span aria-hidden="true">⌕</span></label>
    </section>
    <section className="collection-wrap"><div className="collection-heading"><span className="eyebrow">{isCategory ? "BROWSE BY INTEREST" : "BROWSE BY PLACE"}</span><strong>{loading ? "Finding your next favourite…" : `${items.length} ${isCategory ? "categories" : "places"} to explore`}</strong></div>
      {error ? <div className="directory-empty"><h3>We couldn’t load this just yet</h3><p>{error}</p><button type="button" onClick={()=>setQuery(v=>v)}>Try again</button></div> : !loading && items.length===0 ? <div className="directory-empty"><h3>Nothing here just yet</h3><p>Try a different search, or come back as more local listings are added.</p><button type="button" onClick={()=>setQuery("")}>Clear search</button></div> : <div className="collection-grid">{(loading ? Array.from({length:6},(_,i)=>({_id:i,name:"Loading…",slug:""})) : items).map((item,i)=><Link key={item._id || i} href={item.slug ? `/${kind}/${item.slug}` : "#"} className="collection-card"><span className={`collection-symbol collection-symbol-${i%6}`}>{isCategory ? (item.icon || ["✳","⌂","◈","✦","⌘","◎"][i%6]) : "⌖"}</span><span className="collection-card-copy"><strong>{item.name}</strong><small>{item.description || (isCategory ? "Explore local listings in this category" : item.type ? item.type.charAt(0).toUpperCase()+item.type.slice(1) : "Explore this local area")}</small></span><span className="collection-arrow">↗</span></Link>)}</div>}
    </section>
    <footer className="directory-footer"><Link href="/">GaavConnect</Link><span>Find good things, closer to home.</span><Link href="/businesses">Explore all listings →</Link></footer>
  </main>;
}
