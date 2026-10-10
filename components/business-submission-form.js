"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

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

const PRICE_RANGES = [
  ["not_applicable", "Not Applicable / General"],
  ["budget", "Budget friendly (₹)"],
  ["moderate", "Moderate (₹₹)"],
  ["premium", "Premium (₹₹₹)"],
  ["luxury", "Luxury (₹₹₹₹)"],
];

const COMMON_AMENITIES = [
  "Car & Bike Parking",
  "Free Wi-Fi",
  "Air Conditioned (AC)",
  "Family Dining Seating",
  "UPI / Digital Payments (GPay/PhonePe)",
  "Card Payment Accepted",
  "Pure Veg Options",
  "Parcel / Takeaway Available",
  "Restrooms / Washroom",
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
  instagram: "",
  priceRange: "not_applicable",
  openingHours: "",
  coverImageUrl: "",
  description: "",
  services: "",
  amenities: [],
  message: "",
};

export default function BusinessSubmissionForm() {
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

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

  function toggleAmenity(amenity) {
    setForm((prev) => {
      const current = prev.amenities || [];
      const next = current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity];
      return { ...prev, amenities: next };
    });
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      setPhotoError("Choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be 5 MB or smaller.");
      return;
    }

    setUploadingPhoto(true);
    setPhotoError("");

    try {
      const sigRes = await fetch("/api/business-submissions/upload-signature", {
        method: "POST",
      });
      const sigData = await sigRes.json();
      if (!sigRes.ok || !sigData.success) {
        throw new Error(sigData.message || "Could not prepare photo upload.");
      }

      const config = sigData.upload;
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", config.apiKey);
      body.append("timestamp", String(config.timestamp));
      body.append("signature", config.signature);
      body.append("folder", config.folder);
      body.append("public_id", config.publicId);
      body.append("upload_preset", config.uploadPreset);

      const upRes = await fetch(config.uploadUrl, {
        method: "POST",
        body,
      });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.secure_url) {
        throw new Error(upData.error?.message || "Cloudinary image upload failed.");
      }

      setForm((prev) => ({ ...prev, coverImageUrl: upData.secure_url }));
    } catch (err) {
      setPhotoError(err.message || "Upload failed. You can also paste an image URL directly.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
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

    const finalDescription = (form.description || form.message || "").trim();

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
      amenities: form.amenities,
      website: form.website.trim(),
      instagram: form.instagram.trim(),
      priceRange: form.priceRange,
      openingHours: form.openingHours.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
      description: finalDescription,
      message: form.message.trim() || finalDescription,
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
                Your business details are now in our admin review queue. Our verification team will review your details
                and publish your live directory profile shortly.
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

            {/* 3. Online Profiles & Timings */}
            <label>
              Instagram Profile / Handle
              <input
                name="instagram"
                value={form.instagram}
                onChange={update}
                maxLength="2048"
                placeholder="e.g. @hotelkalinga or instagram.com/hotelkalinga"
              />
            </label>

            <label>
              Website or Maps Link (Optional)
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={update}
                maxLength="2048"
                placeholder="https://yourwebsite.com or Google Maps link"
              />
            </label>

            <label>
              Price Range
              <select name="priceRange" value={form.priceRange} onChange={update}>
                {PRICE_RANGES.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Operating Hours & Days Open
              <input
                name="openingHours"
                value={form.openingHours}
                onChange={update}
                maxLength="500"
                placeholder="e.g. Mon-Sun: 8:00 AM - 11:00 PM, or Closed on Tuesdays"
              />
            </label>

            {/* 4. Business Photo / Cover Image */}
            <div className="form-full" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ color: "#516250", fontSize: "10px", fontWeight: 700 }}>
                Storefront Photo / Cover Image (Optional)
              </span>
              
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingPhoto}
                  onChange={handlePhotoUpload}
                  style={{ maxWidth: "260px", padding: "8px" }}
                />
                <span style={{ fontSize: "11px", color: "#858d83" }}>or paste photo link:</span>
                <input
                  type="url"
                  name="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={update}
                  placeholder="https://images.unsplash.com/... or image URL"
                  style={{ flex: 1, minWidth: "200px" }}
                />
              </div>

              {uploadingPhoto && (
                <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 500 }}>
                  Uploading your photo to directory storage…
                </span>
              )}
              {photoError && (
                <span style={{ fontSize: "11px", color: "#e11d48", fontWeight: 500 }}>
                  {photoError}
                </span>
              )}
              {form.coverImageUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                  <img
                    src={form.coverImageUrl}
                    alt="Uploaded storefront preview"
                    style={{ height: "48px", width: "72px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e2e7dd" }}
                  />
                  <span style={{ fontSize: "11px", color: "#294432", fontWeight: 500 }}>
                    ✓ Photo attached successfully
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, coverImageUrl: "" }))}
                    style={{ background: "none", border: "none", color: "#e11d48", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* 5. Amenities / Highlights */}
            <div className="form-full" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ color: "#516250", fontSize: "10px", fontWeight: 700 }}>
                Key Amenities & Facilities (Select all that apply)
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {COMMON_AMENITIES.map((amenity) => {
                  const isChecked = form.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        border: isChecked ? "1px solid #33593b" : "1px solid #dcdfd8",
                        background: isChecked ? "#e8efe6" : "#fdfdfa",
                        color: isChecked ? "#244229" : "#637162",
                        fontSize: "11px",
                        fontWeight: isChecked ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="form-full">
              Key Services, Dishes or Specialties (Comma separated)
              <input
                name="services"
                value={form.services}
                onChange={update}
                placeholder="e.g. Authentic Chulivarch Mutton & Chicken Thali, Maharashtrian Bhakri, 24x7 Breakdown Towing, Emergency Pharmacy"
              />
            </label>

            <label className="form-full">
              Business Description & Overview *
              <textarea
                name="description"
                value={form.description}
                onChange={update}
                maxLength="5000"
                rows="4"
                required
                placeholder="Describe your specialties, history, unique offerings, signature dishes, why local customers and highway travelers trust you..."
              />
            </label>

            <label className="form-full">
              Additional Notes for Editorial Team (Optional)
              <textarea
                name="message"
                value={form.message}
                onChange={update}
                maxLength="2000"
                rows="2"
                placeholder="Any special notes, preferred verification time, or landmark directions..."
              />
            </label>
          </div>

          <button className="submission-submit" disabled={status === "sending" || uploadingPhoto} type="submit">
            {status === "sending" ? "Submitting Business Details…" : "Send Listing Request ↗"}
          </button>

          <p className="submission-privacy">
            Your contact details will only be used to verify and publish your business profile on GaavConnect.
          </p>
        </form>
      </section>

      <PublicFooter />
    </main>
  );
}
