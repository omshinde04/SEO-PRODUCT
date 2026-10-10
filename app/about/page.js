import Link from "next/link";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";
import StructuredData from "@/components/structured-data";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
import {
  BadgeCheck,
  MapPin,
  Sparkles,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Compass,
  Store,
  Users,
  Heart,
  ChevronRight,
  Globe,
} from "lucide-react";

export const generateMetadata = () => getStaticPageMetadata("/about");

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

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://gaavconnect.in/about#page",
        name: "About GaavConnect — Founded by Om Vilas Shinde",
        description:
          "GaavConnect is the dedicated local discovery platform for Nashik District, founded by Om Vilas Shinde to empower local businesses, dhabas, farmstays, and rural shops across Ghoti, Igatpuri, and Nashik.",
        url: "https://gaavconnect.in/about",
        mainEntity: {
          "@type": "Person",
          "@id": "https://gaavconnect.in/about#founder",
          name: "Om Vilas Shinde",
          jobTitle: "Founder & CEO",
          worksFor: {
            "@type": "Organization",
            name: "GaavConnect",
            url: "https://gaavconnect.in",
          },
          sameAs: [
            "https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3",
            "https://www.instagram.com/gaavconnect.in/",
          ],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://gaavconnect.in" },
          { "@type": "ListItem", position: 2, name: "About", item: "https://gaavconnect.in/about" },
        ],
      },
    ],
  };

  return (
    <div className="about-page-root">
      <StructuredData data={structuredData} />
      <PublicNavbar activePath="/about" />

      <main className="about-main-wrapper">
        {/* 1. BREADCRUMB */}
        <div className="about-container">
          <nav className="about-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="about-crumb-link">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="about-crumb-current">About GaavConnect</span>
          </nav>
        </div>

        {/* 2. HERO SECTION */}
        <section className="about-hero-section">
          <div className="about-container">
            <div className="about-hero-content">
              <div className="about-badge-wrap">
                <span className="about-hero-pill">
                  <span className="about-pulse-dot" />
                  OUR STORY & REGIONAL MISSION · GAAVCONNECT.IN
                </span>
                <span className="about-geo-pill">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Nashik District · Maharashtra
                </span>
              </div>

              <h1 className="about-hero-title">
                Good Places in Nashik Deserve to Be{" "}
                <span className="about-title-highlight">Discovered.</span>
              </h1>

              <p className="about-hero-lead">
                Founded by <strong>Om Vilas Shinde</strong>, GaavConnect is the dedicated local discovery platform built to connect rural businesses, highway dhabas, scenic farmstays, and community services across <strong>Ghoti</strong>, <strong>Igatpuri</strong>, and rural Maharashtra directly with customers.
              </p>

              {/* Action Buttons */}
              <div className="about-hero-actions">
                <a
                  href="https://wa.me/919373545169"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-btn-primary"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Chat with Founder (+91 9373545169)</span>
                </a>

                <a
                  href="https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-btn-secondary"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-500" />
                  <span>Follow @gaavconnect.in</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <Link href="/businesses" className="about-btn-tertiary">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span>Explore 100+ Businesses</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. IMPACT STATS RIBBON */}
        <section className="about-stats-section">
          <div className="about-container">
            <div className="about-stats-grid">
              <div className="about-stat-card">
                <span className="about-stat-num">50+</span>
                <span className="about-stat-label">Towns & Villages Covered</span>
                <span className="about-stat-sub">Ghoti, Igatpuri, Trimbak, Sinnar & rural belts</span>
              </div>
              <div className="about-stat-card">
                <span className="about-stat-num">0%</span>
                <span className="about-stat-label">Listing Commission</span>
                <span className="about-stat-sub">100% direct customer phone calls & WhatsApp</span>
              </div>
              <div className="about-stat-card">
                <span className="about-stat-num">NH-160</span>
                <span className="about-stat-label">Highway Corridor Reach</span>
                <span className="about-stat-sub">Daily discovery for Mumbai-Nashik commuters</span>
              </div>
              <div className="about-stat-card">
                <span className="about-stat-num">100%</span>
                <span className="about-stat-label">Direct Founder Access</span>
                <span className="about-stat-sub">Talk directly to founder Om Vilas Shinde</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FOUNDER SPOTLIGHT FEATURE */}
        <section className="about-founder-section">
          <div className="about-container">
            <div className="about-founder-card">
              <div className="about-founder-grid">
                {/* Left Profile Avatar & Contact */}
                <div className="about-founder-profile-col">
                  <div className="about-founder-avatar-wrap">
                    <div className="about-founder-avatar-ring">
                      <span className="about-founder-initials">OS</span>
                    </div>
                    <div className="about-founder-verified-badge">
                      <BadgeCheck className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    </div>
                  </div>

                  <h3 className="about-founder-name">Om Vilas Shinde</h3>
                  <p className="about-founder-role">Founder & Chief Executive</p>
                  <span className="about-founder-loc">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
                    Igatpuri / Ghoti, Nashik District
                  </span>

                  <div className="about-founder-touchpoints">
                    <a
                      href="https://wa.me/919373545169"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-founder-link about-link-wa"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>WhatsApp: 9373545169</span>
                    </a>
                    <a href="tel:+919373545169" className="about-founder-link about-link-phone">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Call: +91 9373545169</span>
                    </a>
                    <a
                      href="https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-founder-link about-link-insta"
                    >
                      <InstagramIcon className="w-4 h-4 text-pink-600" />
                      <span>@gaavconnect.in</span>
                    </a>
                  </div>
                </div>

                {/* Right Vision Narrative */}
                <div className="about-founder-narrative-col">
                  <span className="about-section-eyebrow">FOUNDER&apos;S MISSION & VISION</span>
                  <h2 className="about-founder-heading">
                    &ldquo;Rural & Highway Businesses Deserve World-Class Tech Without Predatory Middlemen.&rdquo;
                  </h2>

                  <div className="about-founder-body">
                    <p>
                      Growing up in Nashik District, I watched corporate aggregator apps take 20% to 30% cuts from hardworking restaurant owners while completely ignoring our vibrant local markets in <strong>Ghoti</strong> and the scenic family dhabas of <strong>Igatpuri</strong>.
                    </p>
                    <p>
                      The most authentic misal pav house, the most dependable automotive garage on the Mumbai-Nashik highway, or a serene agro-tourism farmstay near Bhavali Dam shouldn&apos;t remain hidden simply because they are outside metro corporate boundaries.
                    </p>
                    <p>
                      I built <strong>GaavConnect</strong> with a transparent principle: give every shop owner, doctor, hotelier, and rural artisan a clean, verified digital home with <strong>0% commission</strong> and <strong>100% direct customer access</strong>.
                    </p>
                  </div>

                  <div className="about-founder-signature-box">
                    <div>
                      <span className="about-sig-name">Om Vilas Shinde</span>
                      <span className="about-sig-title">Founder, GaavConnect (gaavconnect.in)</span>
                    </div>
                    <span className="about-sig-tag">Proudly built in Maharashtra ♥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. COMPARISON: THE AGGREGATOR TRAP VS GAAVCONNECT */}
        <section className="about-comparison-section">
          <div className="about-container">
            <div className="about-section-header text-center">
              <span className="about-section-eyebrow">THE LOCAL COMMERCE GAP</span>
              <h2 className="about-section-title">Why Traditional Aggregator Apps Fail Rural Towns</h2>
              <p className="about-section-subtitle">
                How GaavConnect provides a fair, direct alternative for businesses in Nashik District.
              </p>
            </div>

            <div className="about-comparison-grid">
              {/* Card 1: Aggregator Model */}
              <div className="about-comparison-card about-card-aggregator">
                <div className="about-comp-header">
                  <div className="about-comp-icon-wrap text-rose-600 bg-rose-50 border border-rose-200">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="about-comp-title">Corporate Aggregator Apps</h3>
                    <span className="about-comp-badge text-rose-700 bg-rose-100">The Middleman Trap</span>
                  </div>
                </div>

                <ul className="about-comp-list">
                  <li>
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>20% to 30% commission</strong> sliced from thin business profits.</span>
                  </li>
                  <li>
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Customer phone numbers hidden</strong> — businesses cannot build long-term relationships.</span>
                  </li>
                  <li>
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Ghoti & Igatpuri neglected</strong> as &ldquo;out of service area&rdquo; or unviable.</span>
                  </li>
                  <li>
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>High recurring fees</strong> with zero personalized regional support.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: GaavConnect Model */}
              <div className="about-comparison-card about-card-gaavconnect">
                <div className="about-comp-header">
                  <div className="about-comp-icon-wrap text-emerald-600 bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="about-comp-title">The GaavConnect Regional Model</h3>
                    <span className="about-comp-badge text-emerald-700 bg-emerald-100">Zero Commission · 100% Direct</span>
                  </div>
                </div>

                <ul className="about-comp-list">
                  <li>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>0% Commission</strong> — business owners keep every rupee customers pay.</span>
                  </li>
                  <li>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Direct phone calls & WhatsApp</strong> with one tap from any smartphone.</span>
                  </li>
                  <li>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Hyper-targeted</strong> to Ghoti, Igatpuri, NH-160 highway commuters & Nashik.</span>
                  </li>
                  <li>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Daily social features</strong> on official Instagram <strong>@gaavconnect.in</strong>.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. OUR FOUR CORE PILLARS */}
        <section className="about-pillars-section">
          <div className="about-container">
            <div className="about-section-header text-center">
              <span className="about-section-eyebrow">WHAT WE STAND FOR</span>
              <h2 className="about-section-title">The Four Pillars of GaavConnect</h2>
              <p className="about-section-subtitle">
                Everything we build is designed to protect local pride and drive direct business revenue.
              </p>
            </div>

            <div className="about-pillars-grid">
              <div className="about-pillar-card">
                <div className="about-pillar-icon-box">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="about-pillar-title">Direct Contact First</h3>
                <p className="about-pillar-desc">
                  No forms, no intermediary call centres. Customers tap once to call the owner or start a WhatsApp chat to check menu prices, hotel room availability, or store timings.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-icon-box">
                  <Compass className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="about-pillar-title">NH-160 Highway Corridor</h3>
                <p className="about-pillar-desc">
                  Thousands of travelers commute between Mumbai and Nashik daily. We guide them directly to authentic highway family dhabas, 24/7 puncture and mechanical services, and farmstays in Ghoti & Igatpuri.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-icon-box">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="about-pillar-title">Zero-Commission Policy</h3>
                <p className="about-pillar-desc">
                  We believe charging 25% from a local family business is unsustainable. Free business submissions are free forever. Only optional top sponsored ads are paid.
                </p>
              </div>

              <div className="about-pillar-card">
                <div className="about-pillar-icon-box">
                  <InstagramIcon className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="about-pillar-title">Community & Social Reach</h3>
                <p className="about-pillar-desc">
                  Through our official Instagram community <strong>@gaavconnect.in</strong>, we spotlight regional hidden gems, local jatra festivals, and authentic culinary spots.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. REGIONS WE COVER */}
        <section className="about-regions-section">
          <div className="about-container">
            <div className="about-section-header">
              <span className="about-section-eyebrow">REGIONAL REACH</span>
              <h2 className="about-section-title">Towns & Corridors Covered in Nashik District</h2>
              <p className="about-section-subtitle">
                We are actively listing and promoting local establishments across these vibrant regional hubs:
              </p>
            </div>

            <div className="about-regions-grid">
              <div className="about-region-card">
                <div className="about-region-top">
                  <span className="about-region-name">Ghoti</span>
                  <span className="about-region-marathi">घोटी</span>
                </div>
                <span className="about-region-tag">🌾 Highway & Mandi Hub</span>
                <p className="about-region-desc">
                  NH-160 highway junction, weekly agricultural mandi, heavy vehicle repair, hardware stores, and highway family dhabas.
                </p>
                <Link href="/locations/ghoti" className="about-region-link">
                  <span>Explore Ghoti Listings</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="about-region-card">
                <div className="about-region-top">
                  <span className="about-region-name">Igatpuri</span>
                  <span className="about-region-marathi">इगतपुरी</span>
                </div>
                <span className="about-region-tag">⛰️ Hill Station & Tourism</span>
                <p className="about-region-desc">
                  Western Ghats retreat, monsoon waterfalls, Vipassana meditation center, luxury valley villas, lake camping & resorts.
                </p>
                <Link href="/locations/igatpuri" className="about-region-link">
                  <span>Explore Igatpuri Listings</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="about-region-card">
                <div className="about-region-top">
                  <span className="about-region-name">Nashik City</span>
                  <span className="about-region-marathi">नाशिक शहर</span>
                </div>
                <span className="about-region-tag">🏙️ District Capital & Metro</span>
                <p className="about-region-desc">
                  District capital, multispecialty hospitals, commercial retail avenues, wineries, fine dining & industrial belts.
                </p>
                <Link href="/locations/nashik-city" className="about-region-link">
                  <span>Explore Nashik City</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="about-region-card">
                <div className="about-region-top">
                  <span className="about-region-name">Trimbakeshwar</span>
                  <span className="about-region-marathi">त्र्यंबकेश्वर</span>
                </div>
                <span className="about-region-tag">🛕 Holy Jyotirlinga</span>
                <p className="about-region-desc">
                  Sacred Jyotirlinga temple, Brahmagiri foothills, pilgrim dharmashalas, religious bookshops & traditional dining.
                </p>
                <Link href="/locations/trimbakeshwar" className="about-region-link">
                  <span>Explore Trimbakeshwar</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="about-region-card">
                <div className="about-region-top">
                  <span className="about-region-name">Sinnar</span>
                  <span className="about-region-marathi">सिन्नर</span>
                </div>
                <span className="about-region-tag">🏛️ MIDC & Heritage</span>
                <p className="about-region-desc">
                  11th-century Gondeshwar Temple, bustling MIDC industrial manufacturing belt, auto spares & local retail bazaars.
                </p>
                <Link href="/locations/sinnar" className="about-region-link">
                  <span>Explore Sinnar Listings</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="about-region-card">
                <div className="about-region-top">
                  <span className="about-region-name">Rural Highway Belts</span>
                  <span className="about-region-marathi">ग्रामीण पट्टा</span>
                </div>
                <span className="about-region-tag">🚗 NH-160 Corridor</span>
                <p className="about-region-desc">
                  Bhavali Dam, Bhagur, Kavathe, Vaitarna backwaters, agricultural clinics, roadside coconut vendors & camping farms.
                </p>
                <Link href="/locations" className="about-region-link">
                  <span>Explore All Locations</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 8. INSTAGRAM COMMUNITY SPOTLIGHT CARD */}
        <section className="about-instagram-section">
          <div className="about-container">
            <div className="about-instagram-card">
              <div className="about-insta-glow" aria-hidden="true" />
              <div className="about-insta-inner">
                <div className="about-insta-copy">
                  <span className="about-insta-badge">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    OFFICIAL COMMUNITY · @GAAVCONNECT.IN
                  </span>
                  <h3 className="about-insta-title">
                    Follow Our Journey Across Nashik District on Instagram
                  </h3>
                  <p className="about-insta-desc">
                    We regularly feature authentic highway dhabas, misty viewpoints in Igatpuri, hidden rural campsites, and hardworking entrepreneurs. Join over 1,000+ local explorers and help us champion local Maharashtra businesses.
                  </p>
                </div>
                <div className="about-insta-cta-wrap">
                  <a
                    href="https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-insta-btn group"
                  >
                    <InstagramIcon className="w-4 h-4 text-pink-300 group-hover:scale-110 transition-transform" />
                    <span>Follow @gaavconnect.in</span>
                    <ArrowUpRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. BOTTOM CONVERSION CTA CARD */}
        <section className="about-cta-section">
          <div className="about-container">
            <div className="about-cta-card">
              <div className="about-cta-header">
                <span className="about-cta-badge">GET LISTED TODAY</span>
                <h2 className="about-cta-title">
                  Ready to Put Your Business on the Nashik District Map?
                </h2>
                <p className="about-cta-desc">
                  List your shop, dhaba, clinic, or service in under 2 minutes. Free forever, or feature your business at the very top with a Sponsored Ad.
                </p>
              </div>

              <div className="about-cta-actions">
                <Link href="/add-business" className="about-cta-btn-primary">
                  <span>+ List Your Business Free</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>

                <Link href="/promote" className="about-cta-btn-secondary">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Promote with Sponsored Ads</span>
                </Link>

                <a
                  href="https://wa.me/919373545169"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-cta-btn-wa"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>WhatsApp Om (+91 9373545169)</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
