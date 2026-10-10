import mongoose from "mongoose";

const { Schema } = mongoose;

const schema = new Schema({
    businessName: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    contactName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    whatsapp: { type: String, trim: true, maxlength: 30, default: "" },
    businessType: {
        type: String,
        enum: ["business", "restaurant", "hotel", "professional_service", "healthcare", "retail", "tourism", "attraction", "guide", "event_venue", "other"],
        default: "business",
    },
    tagline: { type: String, trim: true, maxlength: 200, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    categoryName: { type: String, trim: true, maxlength: 120, default: "" },
    location: { type: Schema.Types.ObjectId, ref: "Location", default: null },
    locationName: { type: String, trim: true, maxlength: 120, default: "" },
    address: {
        line1: { type: String, trim: true, maxlength: 200, default: "" },
        area: { type: String, trim: true, maxlength: 120, default: "" },
        city: { type: String, trim: true, maxlength: 120, default: "" },
        postalCode: { type: String, trim: true, maxlength: 12, default: "" },
        formatted: { type: String, trim: true, maxlength: 500, default: "" },
    },
    services: {
        type: [{ type: String, trim: true, maxlength: 120 }],
        default: [],
    },
    amenities: {
        type: [{ type: String, trim: true, maxlength: 80 }],
        default: [],
    },
    website: { type: String, trim: true, maxlength: 2048, default: "" },
    instagram: { type: String, trim: true, maxlength: 2048, default: "" },
    coverImageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    description: { type: String, trim: true, maxlength: 10000, default: "" },
    openingHours: { type: String, trim: true, maxlength: 500, default: "" },
    priceRange: {
        type: String,
        enum: ["budget", "moderate", "premium", "luxury", "not_applicable"],
        default: "not_applicable",
    },
    message: { type: String, trim: true, maxlength: 5000, default: "" },
    status: { type: String, enum: ["pending", "reviewing", "approved", "rejected"], default: "pending", index: true },
    adminNotes: { type: String, trim: true, maxlength: 3000, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    business: { type: Schema.Types.ObjectId, ref: "Business", default: null, index: true },
    convertedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false, strict: "throw" });

schema.index({ status: 1, createdAt: -1 });
schema.index({ email: 1, createdAt: -1 });

if (mongoose.models.BusinessSubmission) {
    delete mongoose.models.BusinessSubmission;
}

export default mongoose.model("BusinessSubmission", schema);
