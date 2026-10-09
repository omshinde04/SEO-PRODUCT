"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicNavbar from "@/components/public-navbar";

const BUSINESS_TYPES = [
  ["business", "General Local Business"],
  ["restaurant", "Restaurant, Dhaba & Eatery"],
  ["hotel", "Hotel, Resort & Farmstay"],
  ["retail", "Shop, Retail & Kirana"],
  ["healthcare", "Healthcare, Clinic & Medical Store"],
  ["professional_service", "Garage, Repair & Professional Service"],
  ["tourism", "Tourism, Camping & Experiences"],
  ["attraction", "Local Attraction & Place of Interest"],
  ["guide", "Local Guide & Assistance"],
  ["event_venue", "Banquet Hall & Event Venue"],
  ["other", "Other Local Service"],
];

const initial = {
  businessName: "",
  tagline: "",
  businessType: "restaurant",
  category: "",
  categoryName: "",
  location: "",
  locationName: "",
  area: "",
  addressLine: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  sameAsPhone: true,
  email: "",
  website: "",
  services: "",
  message: "",
};

export default function BusinessSubmissionForm() {
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchTaxonomies() {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/locations", { cache: "no-store" }),
        ]);
        const [catData, locData] = await Promise.all([
          catRes.json().catch(() => ({})),
          locRes.json().catch(() => ({})),
        ]);
        if (active) {
          const cats = catData.items || catData.categories || (Array.isArray(catData) ? catData : []);
          const locs = locData.items || locData.locations || (Array.isArray(locData) ? locData : []);
          setCategories(cats);
          setLocations(locs);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (active) setLoadingOptions(false);
      }
    }
    fetchTaxonomies();
    return () => {
      active = false;
    };
  }, []);

  function update(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => {
        const next = { ...prev, [name]: checked };
        if (name === "sameAsPhone" && checked) {
          next.whatsapp = prev.phone;
        }
        return next;
      });
      return;
    }

    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "phone" && prev.sameAsPhone) {
        next.whatsapp = value;
      }
      if (name === "category") {
        const found = categories.find((c) => c._id === value);
        next.categoryName = found ? found.name : "";
      }
      if (name === "location") {
        const found = locations.find((l) => l._id === value);
        next.locationName = found ? found.name : "";
      }
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const servicesList = form.services
      ? form.services
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const payload = {
      businessName: form.businessName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      whatsapp: (form.sameAsPhone ? form.phone : form.whatsapp || "").trim(),
      businessType: form.businessType,
      tagline: form.tagline.trim(),
      category: form.category || null,
      categoryName: form.categoryName || "",
      location: form.location || null,
      locationName: form.locationName || form.area || "",
      address: {
        line1: form.addressLine.trim(),
        area: form.area.trim(),
        city: form.locationName || form.area.trim(),
        formatted: [form.addressLine.trim(), form.area.trim(), form.locationName].filter(Boolean).join(", "),
      },
      services: servicesList,
      website: form.website.trim(),
      message: form.message.trim(),
    };

    try {
      const response = await fetch("/api/business-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "We couldn't submit your listing. Please verify your details.");
      }
      setStatus("success");
      setForm(initial);
      window.scrollTo({ top: 120, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setError(err.message || "Please check your details and try again.");
    }
  }

  return (
    <main className="directory-page">
      <PublicNavbar activePath="/add-business" />

      <section className="submission-layout">
        {/* Left Side: Brand Story & Trust Signals */}
        <div className="submission-intro">
          <span className="eyebrow">YOUR BUSINESS BELONGS HERE</span>
          <h1>
            Let the right people <em>find you.</em>
          </h1>
          <p>
            Connect directly with travelers, local families, and daily customers across Ghoti, Igatpuri, Nashik City,
            Trimbakeshwar, Sinnar and Maharashtra rural townships.
          </p>

          <div className="submission-benefit">
            <span>✳</span>
            <div>
              <strong>High Intent Local Discovery</strong>
              <p>Showcase your authentic specialties, authentic village food, stays, repairs, and contact numbers.</p>
            </div>
          </div>

          <div className="submission-benefit">
            <span>⌖</span>
            <div>
              <strong>Verified Town & Highway Presence</strong>
              <p>Be prominently featured in our curated regional directory and dedicated category collections.</p>
            </div>
          </div>

          <div className="submission-benefit">
            <span>✓</span>
            <div>
              <strong>Zero Listing Fees</strong>
              <p>Free listing verification by our editorial team. No hidden charges or commissions.</p>
            </div>
          </div>

          <p className="submission-note">
            Submitting this form submits your listing for quick editorial review. You can provide as many details as
            possible to get published faster.
          </p>
        </div>

        {/* Right Side: Comprehensive Form */}
        <form className="submission-form" onSubmit={submit}>
          <div className="submission-form-head">
            <span className="eyebrow">LIST YOUR BUSINESS</span>
            <h2>Complete Business Details</h2>
            <p>Tell us about your setup. Fields marked * are required.</p>
          </div>

          {status === "success" && (
            <div className="form-feedback success" role="status">
              <strong>🎉 Application Received Successfully!</strong>
              <span>
                Your business details are now in our admin review queue. Our verification team will review your contact
                details and publish your live directory profile shortly.
              </span>
            </div>
          )}

          {status === "error" && (
            <div className="form-feedback error" role="alert">
              {error}
            </div>
          )}

          <div className="form-fields">
            {/* 1. Basic Info */}
            <label className="form-full">
              Business Name *
              <input
                name="businessName"
                value={form.businessName}
                onChange={update}
                minLength="2"
                maxLength="160"
                required
                placeholder="e.g. Hotel Kalinga Family Dhaba, Sai Auto Works, Om Kirana"
              />
            </label>

            <label className="form-full">
              Tagline / Catchphrase (Optional)
              <input
                name="tagline"
                value={form.tagline}
                onChange={update}
                maxLength="200"
                placeholder="e.g. Authentic Chulivarch Jevan, 24x7 Breakdown Service, Pure Yeola Paithani"
              />
            </label>

            <label>
              Business Type *
              <select name="businessType" value={form.businessType} onChange={update} required>
                {BUSINESS_TYPES.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Category *
              <select name="category" value={form.category} onChange={update}>
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.parent ? `— ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Town / Region *
              <select name="location" value={form.location} onChange={update}>
                <option value="">Select Nearest Town...</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name} {l.type ? `(${l.type})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Locality / Area / Landmark
              <input
                name="area"
                value={form.area}
                onChange={update}
                maxLength="120"
                placeholder="e.g. Ghoti Bypass Road, Samruddhi Toll, Old Agra Road"
              />
            </label>

            <label className="form-full">
              Full Physical Address / Landmark
              <input
                name="addressLine"
                value={form.addressLine}
                onChange={update}
                maxLength="200"
                placeholder="e.g. Shop No. 3, Near Old Bus Stand, Opp. Petrol Pump"
              />
            </label>

            {/* 2. Contact Information */}
            <label>
              Owner / Contact Person *
              <input
                name="contactName"
                value={form.contactName}
                onChange={update}
                minLength="2"
                maxLength="120"
                required
                placeholder="Your full name"
              />
            </label>

            <label>
              Email Address *
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                maxLength="254"
                required
                placeholder="contact@yourbusiness.com"
              />
            </label>

            <label>
              Phone / Mobile Number *
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={update}
                minLength="7"
                maxLength="30"
                pattern="[+()0-9 .-]+"
                required
                placeholder="+91 98220 12345"
              />
            </label>

            <label>
              WhatsApp Number
              <input
                type="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={update}
                disabled={form.sameAsPhone}
                maxLength="30"
                placeholder={form.sameAsPhone ? "Same as phone number" : "+91 98220 12345"}
              />
              <span style={{ fontSize: "10px", marginTop: "4px", color: "#6a796b", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="checkbox"
                  name="sameAsPhone"
                  checked={form.sameAsPhone}
                  onChange={update}
                  id="sameAsPhoneCheck"
                  style={{ width: "auto", minHeight: "auto", margin: 0 }}
                />
                <label htmlFor="sameAsPhoneCheck" style={{ fontWeight: 400, cursor: "pointer", fontSize: "10px" }}>
                  WhatsApp same as phone
                </label>
              </span>
            </label>

            <label className="form-full">
              Website or Social Page (Optional)
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={update}
                maxLength="2048"
                placeholder="https://yourwebsite.com or Instagram/Google Maps link"
              />
            </label>

            <label className="form-full">
              Key Services & Facilities (Comma separated)
              <input
                name="services"
                value={form.services}
                onChange={update}
                placeholder="e.g. Family Seating, AC Hall, Home Delivery, Parking, Card Payment"
              />
            </label>

            <label className="form-full">
              Business Description & Operating Hours *
              <textarea
                name="message"
                value={form.message}
                onChange={update}
                maxLength="5000"
                rows="4"
                required
                placeholder="Describe your specialties, opening hours (e.g. Mon-Sun 8 AM to 11 PM), signature items, history, or what makes you trusted..."
              />
            </label>
          </div>

          <button className="submission-submit" disabled={status === "sending"} type="submit">
            {status === "sending" ? "Submitting Business Details…" : "Send Listing Request ↗"}
          </button>

          <p className="submission-privacy">
            Your contact details will only be used to verify and publish your business profile on GaavConnect.
          </p>
        </form>
      </section>

      <footer className="directory-footer">
        <Link href="/">GaavConnect</Link>
        <span>Discover trusted places and rural services closer to home.</span>
        <Link href="/businesses">Explore all listings →</Link>
      </footer>
    </main>
  );
}
