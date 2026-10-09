"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/businesses", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/locations", label: "Locations" },
  { href: "/guides", label: "Guides" },
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
                className={`navbar-link ${activePath === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions: CTA & Hamburger */}
          <div className="navbar-actions">
            <Link href="/add-business" className="navbar-cta-btn">
              <span>List your business</span>
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
              href="/add-business"
              onClick={() => setMenuOpen(false)}
              className="mobile-add-btn"
            >
              + List your business for free ↗
            </Link>
            <p className="mobile-cta-note">Help customers in your town or village find you easily.</p>
          </div>
        </div>

        <div className="mobile-drawer-footer">
          <span>Every business. Every location. Connected.</span>
        </div>
      </aside>
    </>
  );
}
