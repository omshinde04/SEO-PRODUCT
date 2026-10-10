"use client";

import Link from "next/link";
import { useState } from "react";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

const PROMOTION_PLANS = [
  {
    id: "starter_7",
    name: "7-Day Starter",
    duration: "7 Days Active",
    badge: "WEEKEND DRIVE",
    estReach: "3,500+ local views",
    tagline: "Ideal for weekend family crowds, festival specials, or short-term promos.",
    features: [
      "Guaranteed top-tier category placement",
      "✦ Sponsored golden badge on all searches",
      "Special promotional offer highlight banner",
      "Direct 1-tap Call & WhatsApp action buttons",
      "Homepage category rotation spot",
    ],
    popular: false,
  },
  {
    id: "growth_14",
    name: "14-Day Growth",
    duration: "14 Days Active",
    badge: "MOST POPULAR · BEST VALUE",
    estReach: "12,000+ targeted views",
    tagline: "The #1 choice for steady highway footfall, inquiries, and customer repeat orders.",
    features: [
      "Priority #1 placement across category & city",
      "✦ Sponsored badge with custom offer callout",
      "Direct Call & WhatsApp customer lead buttons",
      "Appears first on highway (NH-160) search results",
      "Homepage featured spotlight rotation",
      "Cross-featured on official Instagram @gaavconnect.in",
      "Free weekly update to your offer headline",
    ],
    popular: true,
  },
  {
    id: "spotlight_30",
    name: "30-Day Prime",
    duration: "30 Days Active",
    badge: "MAXIMUM DOMINANCE",
    estReach: "30,000+ verified views",
    tagline: "Total brand visibility across the Nashik, Ghoti & Igatpuri commercial belt.",
    features: [
      "Guaranteed #1 pinned spot in primary category",
      "Highest priority ranking across all search queries",
      "Permanent Homepage Sponsored Showcase banner",
      "Direct Call & WhatsApp leads with zero commission",
      "Dedicated GaavConnect campaign manager support",
      "Reels & story shoutout on Instagram @gaavconnect.in",
      "Unlimited offer & photo refreshes anytime",
    ],
    popular: false,
  },
];

const CATEGORY_OPTIONS = [
  "Highway Family Dhabas & Restaurants",
  "Hotels, Resorts & Agro Tourism",
  "Retail, Kirana & Local Shopping",
  "Healthcare, Doctors & Clinics",
  "Automotive, Repair & Garage Services",
  "Tours, Treks & Local Experiences",
  "Wedding Halls & Event Venues",
  "Professional & Home Services",
];

const LOCATION_OPTIONS = [
  "Igatpuri & Ghoti",
  "Nashik City",
  "Mumbai-Nashik Highway (NH-160)",
  "Trimbakeshwar",
  "Sinnar & Surrounding Villages",
  "Bhandardara & Kalsubai Region",
  "Entire Nashik District",
];

const OFFER_INSPIRATIONS = [
  "🔥 Flat 20% Off Weekend Family Meals & Thalis",
  "🍛 Special Pure Veg & Kathiyawadi Family Thali Deal",
  "🏨 Monsoon Weekend Camping & Room Stay Packages",
  "🚗 Free 20-Point Highway Car & Tyre Checkup",
  "🛍️ Buy 2 Get 1 Free on All Fresh Local Produce",
  "⚡ Free Home Delivery on Orders Above ₹300",
];

const FAQS = [
  {
    q: "How soon does my sponsored ad go live after submitting?",
    a: "Our local team verifies your submission within 2 to 4 hours. You can also reach founder Om Vilas Shinde directly on WhatsApp or Call (+91 9373545169) for same-day instant launch.",
  },
  {
    q: "Will my business also be featured on Instagram?",
    a: "Yes! All verified active promotions are featured on our official Instagram channel (@gaavconnect.in) with stories and reels to maximize tourist footfall from Mumbai, Thane, and Nashik.",
  },
  {
    q: "Do I need to pay or enter a credit card right now?",
    a: "No! Submitting this request is 100% free with zero upfront payment. We review your requirements first, confirm with you directly, and activate your campaign seamlessly.",
  },
  {
    q: "How do customers contact my business from the ad?",
    a: "Your sponsored ad includes high-visibility direct buttons for Phone Call and WhatsApp. When interested visitors tap them, they connect directly to your mobile number with zero middlemen or booking commission.",
  },
  {
    q: "Can I change my promotional offer headline during the campaign?",
    a: "Yes! If you run out of stock or want to promote a new weekend special or festival discount, simply message our team and we will update your live offer headline within minutes.",
  },
  {
    q: "What if my business is not yet listed on GaavConnect?",
    a: "No problem at all! When you submit this promotion form, our team will create and verify your complete business profile for free as part of your sponsored launch.",
  },
];

function CheckIcon({ className = "w-4 h-4 text-emerald-600" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PromoteBusinessClient() {
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    whatsapp: "",
    sameAsPhone: true,
    plan: "growth_14",
    targetCategory: "Highway Family Dhabas & Restaurants",
    targetLocation: "Igatpuri & Ghoti",
    promotionalHeadline: "Flat 20% Off Weekend Family Specials & Thalis",
    preferredCta: "call_now",
    budget: "",
    message: "",
  });

  const [activeMobileTab, setActiveMobileTab] = useState("form"); // "form" | "preview"
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "phone" && prev.sameAsPhone) {
        next.whatsapp = value;
      }
      if (name === "sameAsPhone" && checked) {
        next.whatsapp = prev.phone;
      }
      return next;
    });
  };

  const selectPlan = (planId) => {
    setForm((prev) => ({ ...prev, plan: planId }));
  };

  const applyInspiration = (headline) => {
    setForm((prev) => ({ ...prev, promotionalHeadline: headline }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const payload = {
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        whatsapp: (form.sameAsPhone ? form.phone : form.whatsapp).trim(),
        plan: form.plan,
        targetCategory: form.targetCategory,
        targetLocation: form.targetLocation,
        promotionalHeadline: form.promotionalHeadline.trim(),
        preferredCta: form.preferredCta,
        budget: form.budget.trim(),
        message: form.message.trim(),
      };

      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit promotion request");
      }

      setStatus("success");
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const currentPlan = PROMOTION_PLANS.find((p) => p.id === form.plan) || PROMOTION_PLANS[1];

  return (
    <main className="promote-page-wrapper">
      <PublicNavbar activePath="/promote" />

      {/* Hero Section */}
      <section className="promote-hero-saas">
        <div className="hero-glow-blob-1" aria-hidden="true" />
        <div className="hero-glow-blob-2" aria-hidden="true" />

        <div className="promote-hero-container">
          <div className="promote-hero-badge-pill">
            <span className="badge-sparkle">✦</span>
            <span>GAAVCONNECT SPONSORED ADS PLATFORM</span>
            <span className="badge-accent-tag">PRIORITY SPOTS</span>
          </div>

          <h1 className="promote-hero-title">
            Put Your Business at the Top of Every Local Search.
          </h1>

          <p className="promote-hero-subtitle">
            Promote your highway dhaba, hotel, clinic, garage, or store across Ghoti, Igatpuri &amp; Nashik.
            Gain guaranteed #1 placement, custom offer callouts, and direct zero-commission phone calls &amp; WhatsApp inquiries.
          </p>

          {/* Social Proof / ROI Metric Ribbon */}
          <div className="promote-metric-ribbon">
            <div className="metric-box">
              <span className="metric-number">3.8×</span>
              <span className="metric-label">More Direct Leads</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-box">
              <span className="metric-number">#1 Rank</span>
              <span className="metric-label">Category Spotlight</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-box">
              <span className="metric-number">0% Fee</span>
              <span className="metric-label">Direct Calls &amp; WhatsApp</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-box">
              <span className="metric-number">&lt; 4 Hours</span>
              <span className="metric-label">Same-Day Review</span>
            </div>
          </div>

          <div className="hero-cta-row">
            <a href="#campaign-studio" className="hero-btn-primary">
              Build Your Sponsored Ad <span>↓</span>
            </a>
            <a href="#how-it-works" className="hero-btn-secondary">
              See How It Works <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* Campaign Studio Section */}
      <section className="promote-studio-section" id="campaign-studio">
        <div className="promote-studio-container">
          {status === "success" ? (
            <div className="promote-success-card">
              <div className="success-icon-badge">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2>Promotion Request Received!</h2>
              <p className="success-subtext">
                Thank you, <strong>{form.contactName || "partner"}</strong>! Your sponsored campaign request for{" "}
                <strong>&ldquo;{form.businessName || "Your Business"}&rdquo;</strong> is now in our priority review queue.
              </p>

              <div className="success-timeline-box">
                <div className="timeline-item">
                  <div className="timeline-num">1</div>
                  <div className="timeline-text">
                    <strong>Admin Verification:</strong> Our team checks your listing, target category (
                    {form.targetCategory}), and promotional headline within 2–4 hours.
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-num">2</div>
                  <div className="timeline-text">
                    <strong>WhatsApp Confirmation:</strong> We will reach out to{" "}
                    <strong>{form.phone}</strong> to confirm your schedule and launch.
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-num">3</div>
                  <div className="timeline-text">
                    <strong>Guaranteed Top Placement:</strong> Your ad immediately receives the{" "}
                    <strong>✦ Sponsored</strong> badge and top rank across GaavConnect.
                  </div>
                </div>
              </div>

              <div className="success-founder-direct-box">
                <p className="founder-direct-title">
                  ⚡ <strong>Need urgent same-day activation?</strong> Reach founder Om Shinde directly:
                </p>
                <div className="founder-direct-actions">
                  <a href="https://wa.me/919373545169" target="_blank" rel="noopener noreferrer" className="founder-wa-pill">
                    💬 WhatsApp +91 9373545169
                  </a>
                  <a href="tel:+919373545169" className="founder-call-pill">
                    📞 Call +91 9373545169
                  </a>
                </div>
              </div>

              <div className="success-button-group">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setForm((p) => ({ ...p, businessName: "", promotionalHeadline: "" }));
                  }}
                  className="btn-outline-soft"
                >
                  Create Another Ad
                </button>
                <Link href="/businesses" className="btn-emerald-solid">
                  Explore Live Listings →
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Studio Intro Header */}
              <div className="studio-intro-header">
                <div className="studio-intro-left">
                  <span className="studio-kicker">INTERACTIVE AD STUDIO</span>
                  <h2>Customize Your Sponsored Campaign</h2>
                  <p>Choose your duration, input your offer, and watch your social-style ad update in real time.</p>
                </div>

                {/* Mobile View Switcher Tab (Only on small screens) */}
                <div className="mobile-view-tabs" role="tablist">
                  <button
                    type="button"
                    className={`mobile-tab-btn ${activeMobileTab === "form" ? "active" : ""}`}
                    onClick={() => setActiveMobileTab("form")}
                  >
                    <span>✍️ Campaign Form</span>
                  </button>
                  <button
                    type="button"
                    className={`mobile-tab-btn ${activeMobileTab === "preview" ? "active" : ""}`}
                    onClick={() => setActiveMobileTab("preview")}
                  >
                    <span>📱 Live Ad Simulator</span>
                  </button>
                </div>
              </div>

              {/* Step 1: Promotion Packages Grid */}
              <div className="plan-showcase-wrapper">
                <div className="plan-showcase-heading">
                  <span className="step-count-pill">Step 1</span>
                  <h3>Select Your Promotion Package</h3>
                </div>

                <div className="plan-cards-grid">
                  {PROMOTION_PLANS.map((plan) => {
                    const isSelected = form.plan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => selectPlan(plan.id)}
                        className={`saas-plan-card ${isSelected ? "selected" : ""} ${plan.popular ? "is-popular" : ""}`}
                      >
                        {plan.badge && (
                          <div className={`plan-badge-ribbon ${plan.popular ? "ribbon-highlight" : ""}`}>
                            {plan.badge}
                          </div>
                        )}

                        <div className="plan-card-top">
                          <div className="plan-title-row">
                            <h4>{plan.name}</h4>
                            <span className="plan-reach-pill">{plan.estReach}</span>
                          </div>
                          <span className="plan-duration-tag">{plan.duration}</span>
                          <p className="plan-tagline">{plan.tagline}</p>
                        </div>

                        <div className="plan-features-block">
                          <span className="features-label">Included in this plan:</span>
                          <ul className="features-list">
                            {plan.features.map((feat, idx) => (
                              <li key={idx}>
                                <CheckIcon className="check-svg" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="plan-selection-btn">
                          <span className={`select-indicator ${isSelected ? "is-active" : ""}`}>
                            {isSelected ? "✓ Plan Selected" : "Choose This Plan"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Form + Real-time Simulator Layout */}
              <div className="studio-split-grid">
                {/* Left Column: Form Builder */}
                <div className={`studio-form-column ${activeMobileTab === "form" ? "mobile-show" : "mobile-hide"}`}>
                  <div className="studio-card-panel">
                    <div className="panel-section-header">
                      <span className="step-count-pill">Step 2</span>
                      <h3>Your Business &amp; Contact Information</h3>
                      <p>Details will be verified with you before launching.</p>
                    </div>

                    {status === "error" && (
                      <div className="studio-alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="saas-studio-form">
                      {/* Business & Manager */}
                      <div className="form-fields-row">
                        <label className="saas-input-group">
                          <span className="input-label">Business Name *</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">🏪</span>
                            <input
                              type="text"
                              name="businessName"
                              value={form.businessName}
                              onChange={update}
                              placeholder="e.g. Hotel Shivneri Family Dhaba"
                              required
                              maxLength="150"
                            />
                          </div>
                        </label>

                        <label className="saas-input-group">
                          <span className="input-label">Owner / Contact Name *</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">👤</span>
                            <input
                              type="text"
                              name="contactName"
                              value={form.contactName}
                              onChange={update}
                              placeholder="e.g. Nilesh Patil"
                              required
                              maxLength="100"
                            />
                          </div>
                        </label>
                      </div>

                      {/* Phone & WhatsApp */}
                      <div className="form-fields-row">
                        <label className="saas-input-group">
                          <span className="input-label">Phone Number (For Customer Calls) *</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">📞</span>
                            <input
                              type="tel"
                              name="phone"
                              value={form.phone}
                              onChange={update}
                              placeholder="+91 98220 12345"
                              required
                              maxLength="30"
                            />
                          </div>
                        </label>

                        <label className="saas-input-group">
                          <div className="label-with-toggle">
                            <span className="input-label">WhatsApp Number</span>
                            <label className="toggle-switch-label">
                              <input
                                type="checkbox"
                                name="sameAsPhone"
                                checked={form.sameAsPhone}
                                onChange={update}
                              />
                              <span className="toggle-text">Same as phone</span>
                            </label>
                          </div>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">💬</span>
                            <input
                              type="tel"
                              name="whatsapp"
                              value={form.sameAsPhone ? form.phone : form.whatsapp}
                              onChange={update}
                              disabled={form.sameAsPhone}
                              placeholder="+91 98220 12345"
                              maxLength="30"
                            />
                          </div>
                        </label>
                      </div>

                      {/* Email */}
                      <div className="form-fields-row single-col">
                        <label className="saas-input-group">
                          <span className="input-label">Email Address *</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">✉️</span>
                            <input
                              type="email"
                              name="email"
                              value={form.email}
                              onChange={update}
                              placeholder="contact@yourbusiness.com"
                              required
                              maxLength="150"
                            />
                          </div>
                        </label>
                      </div>

                      {/* Category & Location Targeting */}
                      <div className="panel-divider" />
                      <div className="panel-section-header">
                        <span className="step-count-pill">Step 3</span>
                        <h3>Target Category &amp; Location</h3>
                        <p>Where your sponsored card will hold #1 guaranteed rank.</p>
                      </div>

                      <div className="form-fields-row">
                        <label className="saas-input-group">
                          <span className="input-label">Target Category *</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">🏷️</span>
                            <select name="targetCategory" value={form.targetCategory} onChange={update}>
                              {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </label>

                        <label className="saas-input-group">
                          <span className="input-label">Primary Target Area *</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">📍</span>
                            <select name="targetLocation" value={form.targetLocation} onChange={update}>
                              {LOCATION_OPTIONS.map((loc) => (
                                <option key={loc} value={loc}>
                                  {loc}
                                </option>
                              ))}
                            </select>
                          </div>
                        </label>
                      </div>

                      {/* Promotional Headline & Offer */}
                      <div className="panel-divider" />
                      <div className="panel-section-header">
                        <span className="step-count-pill">Step 4</span>
                        <h3>Promotional Offer &amp; Ad Hook</h3>
                        <p>This headline appears highlighted in gold/emerald on your card.</p>
                      </div>

                      <div className="form-fields-row single-col">
                        <label className="saas-input-group">
                          <span className="input-label">Special Offer Headline *</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">📣</span>
                            <input
                              type="text"
                              name="promotionalHeadline"
                              value={form.promotionalHeadline}
                              onChange={update}
                              placeholder="e.g. 🔥 Flat 20% Off Weekend Family Meals & Pure Veg Thalis!"
                              required
                              maxLength="200"
                            />
                          </div>
                        </label>

                        {/* Quick Inspiration Chips */}
                        <div className="headline-inspirations-wrap">
                          <span className="inspirations-title">💡 Quick ideas (tap to use):</span>
                          <div className="inspiration-chips-grid">
                            {OFFER_INSPIRATIONS.map((text, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => applyInspiration(text)}
                                className="inspiration-chip-btn"
                              >
                                {text}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Primary CTA and Budget */}
                      <div className="form-fields-row">
                        <label className="saas-input-group">
                          <span className="input-label">Preferred Customer Action</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">🎯</span>
                            <select name="preferredCta" value={form.preferredCta} onChange={update}>
                              <option value="call_now">📞 Direct Phone Call</option>
                              <option value="whatsapp">💬 WhatsApp Message</option>
                              <option value="visit_us">📍 Visit &amp; Directions</option>
                              <option value="order_online">🛍️ Order / Inquire Online</option>
                            </select>
                          </div>
                        </label>

                        <label className="saas-input-group">
                          <span className="input-label">Approximate Ad Budget (Optional)</span>
                          <div className="input-with-icon">
                            <span className="input-prefix-icon">₹</span>
                            <input
                              type="text"
                              name="budget"
                              value={form.budget}
                              onChange={update}
                              placeholder="e.g. ₹1,500 - ₹3,000"
                            />
                          </div>
                        </label>
                      </div>

                      {/* Additional Message */}
                      <div className="form-fields-row single-col">
                        <label className="saas-input-group">
                          <span className="input-label">Special Instructions or Start Date Preference</span>
                          <textarea
                            name="message"
                            value={form.message}
                            onChange={update}
                            rows="2"
                            placeholder="e.g. Want to start this Friday evening for the weekend rush..."
                          />
                        </label>
                      </div>

                      {/* Submit Bar */}
                      <div className="studio-submit-bar">
                        <button
                          type="submit"
                          disabled={status === "sending"}
                          className="saas-launch-btn"
                        >
                          {status === "sending" ? (
                            <span className="btn-loading-state">
                              <span className="spinner-dot" /> Submitting Campaign...
                            </span>
                          ) : (
                            <span className="btn-normal-state">
                              🚀 Submit Campaign for Priority Activation ↗
                            </span>
                          )}
                        </button>

                        <div className="trust-reassurance-row">
                          <span className="shield-icon">🛡️</span>
                          <span>Zero upfront payment required · Verified within 2–4 hours</span>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column: Live Interactive Ad Simulator */}
                <div className={`studio-preview-column ${activeMobileTab === "preview" ? "mobile-show" : "mobile-hide"}`}>
                  <div className="simulator-sticky-box">
                    <div className="simulator-top-bar">
                      <div className="simulator-status-indicator">
                        <span className="live-pulsing-dot" />
                        <span className="simulator-label">LIVE AD PREVIEW</span>
                      </div>
                      <span className="simulator-device-pill">GaavConnect Sponsored Feed</span>
                    </div>

                    <div className="simulator-card-wrapper">
                      {/* Realistic Sponsored Ad Card */}
                      <article className="sponsored-mockup-card">
                        {/* Media Header */}
                        <div className="mockup-card-media">
                          <div className="mockup-art-canvas">
                            <div className="mockup-mesh-pattern" aria-hidden="true" />
                            <div className="mockup-brand-monogram">
                              <span>{(form.businessName || "G").charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="mockup-badge-strip">
                              <span className="mockup-cat-badge">
                                {form.targetCategory.split("&")[0].trim()}
                              </span>
                              <span className="mockup-sponsored-badge">
                                <span className="sparkle-gold">✦</span> Sponsored
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="mockup-card-content">
                          <div className="mockup-subline-row">
                            <span className="mockup-plan-badge">{currentPlan.name}</span>
                            <span className="mockup-location-badge">📍 {form.targetLocation}</span>
                          </div>

                          <h3 className="mockup-business-title">
                            {form.businessName || "Your Business Name Here"}
                          </h3>

                          {/* Glowing Offer Callout Banner */}
                          <div className="mockup-offer-banner">
                            <div className="offer-tag-pill">
                              <span className="fire-icon">🔥</span>
                              <span>SPECIAL OFFER</span>
                            </div>
                            <p className="offer-headline-text">
                              {form.promotionalHeadline || "Special promotional discount or offer for visitors!"}
                            </p>
                          </div>

                          <p className="mockup-description">
                            {form.message ||
                              "Verified local services, quality products, friendly regional hospitality and direct contact."}
                          </p>

                          {/* Action Button Row */}
                          <div className="mockup-action-buttons-row">
                            <button type="button" className="mockup-btn btn-call" tabIndex="-1">
                              <span>📞 Call</span>
                            </button>
                            <button type="button" className="mockup-btn btn-wa" tabIndex="-1">
                              <span>💬 WhatsApp</span>
                            </button>
                            <button type="button" className="mockup-btn btn-view" tabIndex="-1">
                              <span>View Offer →</span>
                            </button>
                          </div>

                          {/* Card Footer Metric */}
                          <div className="mockup-card-footer">
                            <span className="footer-metric-note">
                              ⚡ Est. <strong>{currentPlan.estReach}</strong> on Highway &amp; City searches
                            </span>
                          </div>
                        </div>
                      </article>
                    </div>

                    {/* Benefit Highlight Pills */}
                    <div className="simulator-perks-card">
                      <h4>Why this ad format converts:</h4>
                      <div className="perks-list">
                        <div className="perk-row">
                          <span className="perk-icon">📌</span>
                          <div>
                            <strong>Pinned Above Competitors:</strong> Appears first when travelers and locals search in your area.
                          </div>
                        </div>
                        <div className="perk-row">
                          <span className="perk-icon">✨</span>
                          <div>
                            <strong>Golden Sponsored Badge:</strong> Distinct visual style builds immediate trust and attracts 3.8× more clicks.
                          </div>
                        </div>
                        <div className="perk-row">
                          <span className="perk-icon">⚡</span>
                          <div>
                            <strong>1-Tap Calls &amp; WhatsApp:</strong> Converts casual visitors into paying customers on the spot.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="promote-how-it-works-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-kicker">SIMPLE &amp; TRANSPARENT</span>
            <h2>How Sponsored Ads Work on GaavConnect</h2>
            <p>From submission to guaranteed top ranking in 3 effortless steps.</p>
          </div>

          <div className="steps-cards-grid">
            <div className="step-card">
              <div className="step-card-num">01</div>
              <h4>Customize Your Offer</h4>
              <p>
                Select your package (7, 14, or 30 days) and write your promotional offer headline. Takes under 2 minutes.
              </p>
            </div>

            <div className="step-card">
              <div className="step-card-num">02</div>
              <h4>Rapid Admin Review</h4>
              <p>
                Our local verification team checks your listing within 2–4 hours and confirms your launch details via WhatsApp.
              </p>
            </div>

            <div className="step-card">
              <div className="step-card-num">03</div>
              <h4>Instant Top Placement</h4>
              <p>
                Your business is pinned to #1 in its category and featured on the GaavConnect homepage, driving direct customer leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="promote-comparison-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-kicker">THE VALUE DIFFERENCE</span>
            <h2>Free Standard Listing vs. Sponsored Ad</h2>
            <p>See why high-growth local businesses choose sponsored placement.</p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-col">Feature</th>
                  <th className="free-col">Free Standard Listing</th>
                  <th className="sponsored-col">
                    <span className="sponsored-col-pill">✦ Sponsored Ad</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Search &amp; Category Placement</td>
                  <td>Standard alphabetical / date order</td>
                  <td className="highlight-cell">
                    <strong>Guaranteed #1 Top Pin</strong>
                  </td>
                </tr>
                <tr>
                  <td>Visual Badging &amp; Styling</td>
                  <td>Standard regular card</td>
                  <td className="highlight-cell">
                    <strong>✦ Sponsored Golden Badge &amp; Glow</strong>
                  </td>
                </tr>
                <tr>
                  <td>Promotional Offer Banner</td>
                  <td>Not available</td>
                  <td className="highlight-cell">
                    <strong>Highlighted Custom Offer Banner</strong>
                  </td>
                </tr>
                <tr>
                  <td>Direct WhatsApp &amp; Call Action Buttons</td>
                  <td>Hidden inside profile page</td>
                  <td className="highlight-cell">
                    <strong>Instant 1-Tap Buttons on Feed Card</strong>
                  </td>
                </tr>
                <tr>
                  <td>Homepage Spotlight Rotation</td>
                  <td>No</td>
                  <td className="highlight-cell">
                    <strong>Featured on GaavConnect Homepage</strong>
                  </td>
                </tr>
                <tr>
                  <td>Inquiry &amp; Call Volume</td>
                  <td>Baseline traffic</td>
                  <td className="highlight-cell">
                    <strong>Up to 3.8× Higher Customer Leads</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="promote-faq-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-kicker">QUESTIONS &amp; ANSWERS</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about promoting your business on GaavConnect.</p>
          </div>

          <div className="faq-accordion-wrapper">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`faq-item-card ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="faq-question-btn"
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support & Assistance Strip */}
      <section className="promote-support-banner">
        <div className="section-container support-banner-content">
          <div className="support-copy">
            <div className="support-founder-tag">
              <span className="founder-tag-dot" />
              <span>FOUNDER DIRECT ASSISTANCE</span>
            </div>
            <h3>Need help choosing the right plan?</h3>
            <p>Connect directly with founder Om Shinde on WhatsApp or phone call for fast custom campaign setups, immediate reviews, or plan questions.</p>
          </div>
          <div className="support-actions">
            <a href="https://wa.me/919373545169" target="_blank" rel="noopener noreferrer" className="support-wa-btn">
              <span>💬 WhatsApp Founder (+91 9373545169)</span>
            </a>
            <a href="tel:+919373545169" className="support-call-btn">
              <span>📞 Call +91 9373545169</span>
            </a>
            <Link href="/contact" className="support-contact-btn">
              <span>Contact Page ↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Reusable Public Footer */}
      <PublicFooter />
    </main>
  );
}
