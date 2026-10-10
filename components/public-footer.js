import Link from "next/link";
import {
  Phone,
  MapPin,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  BadgeCheck,
  Globe,
  Heart,
} from "lucide-react";

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

export default function PublicFooter({ className = "" }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className={`saas-footer-root ${className}`.trim()}>
      {/* 1. TOP SAAS FOUNDER CONNECT HERO BAR */}
      <section className="saas-footer-founder-section" aria-label="Founder direct connect">
        <div className="saas-footer-founder-card">
          {/* Subtle ambient lighting */}
          <div className="saas-footer-founder-glow" aria-hidden="true" />
          <div className="saas-footer-founder-glow-secondary" aria-hidden="true" />

          <div className="saas-footer-founder-inner">
            {/* Left Info */}
            <div className="saas-footer-founder-text-block">
              <div className="saas-footer-founder-meta-row">
                <span className="saas-founder-live-pill">
                  <span className="saas-founder-pulse-dot" />
                  FOUNDER DIRECT HELPLINE
                </span>
                <span className="saas-founder-name-pill">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Om Vilas Shinde · Founder</span>
                </span>
              </div>

              <h3 className="saas-founder-title">
                Have questions, need help, or want to promote your business?
              </h3>

              <p className="saas-founder-desc">
                Connect directly with the founder. 0% commission, no call centres, and direct local support for shop owners, highway dhabas, farmstays & services across <strong>Ghoti</strong>, <strong>Igatpuri</strong> & <strong>Nashik District</strong>.
              </p>
            </div>

            {/* Right Action Buttons */}
            <div className="saas-footer-founder-btn-group">
              <a
                href="https://wa.me/919373545169"
                target="_blank"
                rel="noopener noreferrer"
                className="saas-btn-whatsapp group"
                title="Direct WhatsApp with Founder Om Vilas Shinde"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>WhatsApp (+91 9373545169)</span>
              </a>

              <a
                href="https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3"
                target="_blank"
                rel="noopener noreferrer"
                className="saas-btn-instagram group"
                title="Official Instagram @gaavconnect.in"
              >
                <InstagramIcon className="w-4 h-4 text-pink-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span>@gaavconnect.in</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>

              <a
                href="tel:+919373545169"
                className="saas-btn-call group"
                title="Call Founder directly"
              >
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Call Helpline</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN FOOTER CONTENT GRID */}
      <footer className="saas-footer-body">
        <div className="saas-footer-grid">
          {/* Brand & Mission Column */}
          <div className="saas-footer-brand-col">
            <Link href="/" className="saas-footer-brand-logo" aria-label="GaavConnect Home">
              <img
                src="/gaavconnect-logo.svg"
                alt="GaavConnect — Local Discovery in Nashik District"
                width="240"
                height="65"
                className="saas-footer-logo-img"
                loading="lazy"
              />
            </Link>

            <p className="saas-footer-brand-copy">
              GaavConnect (<strong>gaavconnect.in</strong>) is the dedicated local discovery platform for Nashik District — connecting people to verified businesses, highway dhabas, farmstays, and essential services across Ghoti, Igatpuri, and rural Maharashtra.
            </p>

            {/* Region & Verification Badges */}
            <div className="saas-footer-pill-row">
              <span className="saas-footer-pill">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Nashik District · MH</span>
              </span>
              <span className="saas-footer-pill">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified Listings</span>
              </span>
            </div>

            {/* Social Icons Bar */}
            <div className="saas-footer-social-row">
              <a
                href="https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3"
                target="_blank"
                rel="noopener noreferrer"
                className="saas-social-icon-btn saas-social-insta"
                title="Follow @gaavconnect.in on Instagram"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/919373545169"
                target="_blank"
                rel="noopener noreferrer"
                className="saas-social-icon-btn saas-social-wa"
                title="Chat on WhatsApp (+91 9373545169)"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
              <a
                href="tel:+919373545169"
                className="saas-social-icon-btn saas-social-call"
                title="Call Founder Helpline"
                aria-label="Call"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="https://gaavconnect.in"
                className="saas-social-icon-btn saas-social-globe"
                title="Official Website gaavconnect.in"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Column 1: Discover */}
          <div className="saas-footer-nav-col">
            <h4 className="saas-footer-heading">Discover Nashik</h4>
            <ul className="saas-footer-link-list">
              <li>
                <Link href="/businesses" className="saas-footer-link">
                  All Verified Businesses
                </Link>
              </li>
              <li>
                <Link href="/locations" className="saas-footer-link">
                  Ghoti, Igatpuri & Towns
                </Link>
              </li>
              <li>
                <Link href="/categories" className="saas-footer-link">
                  Business Categories
                </Link>
              </li>
              <li>
                <Link href="/places" className="saas-footer-link">
                  Attractions & Dhabas
                </Link>
              </li>
              <li>
                <Link href="/guides" className="saas-footer-link">
                  Local Highway Guides
                </Link>
              </li>
              <li>
                <Link href="/events" className="saas-footer-link">
                  Community Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: For Businesses */}
          <div className="saas-footer-nav-col">
            <h4 className="saas-footer-heading">For Businesses</h4>
            <ul className="saas-footer-link-list">
              <li>
                <Link href="/add-business" className="saas-footer-link">
                  List Business Free
                </Link>
              </li>
              <li>
                <Link href="/promote" className="saas-footer-promote-link group">
                  <span className="saas-promote-label">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Promote with Ads</span>
                  </span>
                  <span className="saas-promote-badge">TOP RANK</span>
                </Link>
              </li>
              <li>
                <Link href="/for-businesses" className="saas-footer-link">
                  Business Growth Hub
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="saas-footer-link">
                  How Discovery Works
                </Link>
              </li>
              <li>
                <Link href="/safety" className="saas-footer-link">
                  Verified Trust Badge
                </Link>
              </li>
              <li>
                <Link href="/contact" className="saas-footer-link">
                  Partner Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Trust & Company */}
          <div className="saas-footer-nav-col">
            <h4 className="saas-footer-heading">Trust & Company</h4>
            <ul className="saas-footer-link-list">
              <li>
                <Link href="/about" className="saas-footer-link">
                  About Founder & Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="saas-footer-link">
                  Contact Helpline
                </Link>
              </li>
              <li>
                <Link href="/help" className="saas-footer-link">
                  Help Centre & FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="saas-footer-link">
                  Privacy Notice
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="saas-footer-link">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="saas-footer-cookie-btn"
                  data-open-cookie-settings
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>

          {/* SaaS Mini Spotlight Card (5th Column) */}
          <div className="saas-footer-spotlight-col">
            <div className="saas-footer-spotlight-card">
              <div className="saas-spotlight-header">
                <span className="saas-spotlight-badge">LOCAL SPOTLIGHT</span>
                <span className="saas-spotlight-spark">✳</span>
              </div>
              <h5 className="saas-spotlight-title">Grow Your Reach in Nashik</h5>
              <p className="saas-spotlight-copy">
                Reach thousands of daily travelers, Mumbai-Nashik highway commuters, and local shoppers looking for spots in Ghoti and Igatpuri.
              </p>
              <Link href="/promote" className="saas-spotlight-cta group">
                <span>Feature Your Business</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM LEGAL & ATTRIBUTION STRIP */}
        <div className="saas-footer-bottom-bar">
          <div className="saas-footer-bottom-left">
            <span>© {currentYear} GaavConnect (<strong>gaavconnect.in</strong>).</span>
            <span className="saas-bottom-dot">·</span>
            <span>Founded by <strong>Om Vilas Shinde</strong>.</span>
          </div>

          <div className="saas-footer-bottom-right">
            <span className="saas-footer-system-status">
              <span className="saas-status-active-dot" />
              <span>All Systems Operational</span>
            </span>
            <span className="saas-bottom-dot">·</span>
            <span className="saas-footer-geo-text">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Nashik · Ghoti · Igatpuri · MH</span>
            </span>
            <span className="saas-bottom-heart" aria-label="made with love in Maharashtra">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
