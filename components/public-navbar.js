"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Phone, Sparkles } from "lucide-react";

function InstagramIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/businesses", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/locations", label: "Locations" },
  { href: "/places", label: "Places" },
  { href: "/guides", label: "Guides" },
  { href: "/events", label: "Events" },
  { href: "/promote", label: "Promote", isPromote: true },
  { href: "/about", label: "About" },
];

export default function PublicNavbar({ activePath = "" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile drawer on route change or Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="public-navbar">
        <div className="navbar-container">
          {/* Brand Logo */}
          <Link href="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
            <img
              src="/gaavconnect-logo.svg"
              alt="GaavConnect"
              className="navbar-brand-img"
              width="210"
              height="58"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="navbar-desktop-nav" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link ${activePath === link.href ? "active" : ""} ${link.isPromote ? "navbar-link-promote" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions: CTA & Hamburger */}
          <div className="navbar-actions">
            <Link href="/add-business" className="navbar-cta-btn">
              <span className="navbar-cta-full">List your business</span>
              <span className="navbar-cta-short">List business</span>
              <span className="navbar-arrow" aria-hidden="true">↗</span>
            </Link>

            <button
              type="button"
              className={`navbar-hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        id="mobile-nav-drawer"
        className={`mobile-drawer ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-label="Mobile Navigation"
      >
        <div className="mobile-drawer-header">
          <Link href="/" onClick={() => setMenuOpen(false)} className="mobile-drawer-logo">
            <img src="/gaavconnect-logo.svg" alt="GaavConnect" width="180" height="50" />
          </Link>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-drawer-body">
          <div className="mobile-drawer-badge">
            <span className="badge-dot" /> Nashik • Ghoti • Igatpuri
          </div>

          <nav className="mobile-drawer-links" aria-label="Mobile navigation links">
            <Link
              href="/businesses"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item ${activePath === "/businesses" ? "active" : ""}`}
            >
              <span className="item-icon">⌕</span>
              <span className="item-text">
                <strong>Explore Businesses</strong>
                <small>Shops, food, stays & services</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/promote"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item mobile-nav-promote ${activePath === "/promote" ? "active" : ""}`}
            >
              <span className="item-icon">✦</span>
              <span className="item-text">
                <strong>Promote Your Business</strong>
                <small>Sponsored Ads & Top Placements</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/categories"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item ${activePath === "/categories" ? "active" : ""}`}
            >
              <span className="item-icon">◈</span>
              <span className="item-text">
                <strong>Categories</strong>
                <small>Food, healthcare, retail, stays</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/locations"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item ${activePath === "/locations" ? "active" : ""}`}
            >
              <span className="item-icon">⌖</span>
              <span className="item-text">
                <strong>Locations</strong>
                <small>Ghoti, Igatpuri, Nashik & villages</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/places"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item ${activePath === "/places" ? "active" : ""}`}
            >
              <span className="item-icon">🏞️</span>
              <span className="item-text">
                <strong>Places & Attractions</strong>
                <small>Viewpoints, forts, dams & waterfalls</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/guides"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item ${activePath === "/guides" ? "active" : ""}`}
            >
              <span className="item-icon">📖</span>
              <span className="item-text">
                <strong>Local Guides</strong>
                <small>Practical tips before you visit</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/events"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item ${activePath === "/events" ? "active" : ""}`}
            >
              <span className="item-icon">📅</span>
              <span className="item-text">
                <strong>Events & Gatherings</strong>
                <small>Bazaars, festivals & local happenings</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-item ${activePath === "/about" ? "active" : ""}`}
            >
              <span className="item-icon">✳</span>
              <span className="item-text">
                <strong>About GaavConnect</strong>
                <small>Rural-first discovery mission</small>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/how-it-works"
              onClick={() => setMenuOpen(false)}
              className="mobile-nav-item secondary"
            >
              <span className="item-icon">⚙</span>
              <span className="item-text">
                <strong>How It Works</strong>
              </span>
              <span className="item-arrow">→</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="mobile-nav-item secondary"
            >
              <span className="item-icon">✉</span>
              <span className="item-text">
                <strong>Contact & Support</strong>
              </span>
              <span className="item-arrow">→</span>
            </Link>
          </nav>

          <div className="mobile-drawer-cta">
            <Link
              href="/promote"
              onClick={() => setMenuOpen(false)}
              className="mobile-promote-btn"
            >
              <Sparkles className="w-4 h-4 inline mr-1 text-emerald-600" />
              Promote with Sponsored Ads ↗
            </Link>
            <Link
              href="/add-business"
              onClick={() => setMenuOpen(false)}
              className="mobile-add-btn"
            >
              + List your business for free ↗
            </Link>
            <div className="mobile-drawer-founder-contact">
              <span className="mobile-founder-label">Founder: Om Vilas Shinde · Direct Helpline:</span>
              <div className="mobile-founder-actions">
                <a
                  href="https://wa.me/919373545169"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-founder-wa"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 inline mr-1 text-white" /> WhatsApp
                </a>
                <a href="tel:+919373545169" className="mobile-founder-call">
                  <Phone className="w-3.5 h-3.5 inline mr-1 text-slate-700" /> Call
                </a>
                <a
                  href="https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-founder-insta"
                >
                  <InstagramIcon className="w-3.5 h-3.5 inline mr-1 text-pink-300" /> Instagram
                </a>
              </div>
            </div>
            <p className="mobile-cta-note">Empowering local businesses across Ghoti, Igatpuri & Nashik District.</p>
          </div>
        </div>

        <div className="mobile-drawer-footer">
          <span>Every business. Every location. Connected.</span>
        </div>
      </aside>
    </>
  );
}
