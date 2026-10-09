
import mongoose from "mongoose";

const { Schema } = mongoose;

const imageSchema = new Schema(
    {
        url: {
            type: String,
            required: true,
            maxlength: 2048,
        },
        publicId: {
            type: String,
            required: true,
            maxlength: 300,
        },
        alt: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
    },
    { _id: false }
);

const openingPeriodSchema = new Schema(
    {
        open: {
            type: String,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
            required: true,
        },
        close: {
            type: String,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
            required: true,
        },
    },
    { _id: false }
);

const weeklyHoursSchema = new Schema(
    {
        monday: { type: [openingPeriodSchema], default: [] },
        tuesday: { type: [openingPeriodSchema], default: [] },
        wednesday: { type: [openingPeriodSchema], default: [] },
        thursday: { type: [openingPeriodSchema], default: [] },
        friday: { type: [openingPeriodSchema], default: [] },
        saturday: { type: [openingPeriodSchema], default: [] },
        sunday: { type: [openingPeriodSchema], default: [] },
    },
    { _id: false }
);

const businessSchema = new Schema(
    {
        // 1. Identity
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 160,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 180,
            match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },
        tagline: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
        description: {
            type: String,
            trim: true,
            maxlength: 10000,
            default: "",
        },
        businessType: {
            type: String,
            enum: [
                "business",
                "restaurant",
                "hotel",
                "professional_service",
                "healthcare",
                "retail",
                "tourism",
                "attraction",
                "guide",
                "event_venue",
                "other",
            ],
            default: "business",
            required: true,
            index: true,
        },
        establishedYear: {
            type: Number,
            min: 1800,
            max: new Date().getFullYear(),
            default: null,
        },

        // 2. Classification
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },
        location: {
            type: Schema.Types.ObjectId,
            ref: "Location",
            required: true,
            index: true,
        },

        // 3. Contact details
        contact: {
            phone: { type: String, trim: true, maxlength: 30, default: "" },
            alternatePhone: {
                type: String,
                trim: true,
                maxlength: 30,
                default: "",
            },
            whatsapp: { type: String, trim: true, maxlength: 30, default: "" },
            email: {
                type: String,
                trim: true,
                lowercase: true,
                maxlength: 254,
                default: "",
            },
            website: { type: String, trim: true, maxlength: 2048, default: "" },
            preferredMethod: {
                type: String,
                enum: ["phone", "whatsapp", "email", "website", "any"],
                default: "any",
            },
        },

        // 4. Social profiles
        socialLinks: {
            instagram: { type: String, trim: true, maxlength: 2048, default: "" },
            facebook: { type: String, trim: true, maxlength: 2048, default: "" },
            youtube: { type: String, trim: true, maxlength: 2048, default: "" },
            linkedin: { type: String, trim: true, maxlength: 2048, default: "" },
            x: { type: String, trim: true, maxlength: 2048, default: "" },
            tiktok: { type: String, trim: true, maxlength: 2048, default: "" },
            other: {
                type: [
                    {
                        platform: {
                            type: String,
                            trim: true,
                            maxlength: 50,
                            required: true,
                        },
                        url: {
                            type: String,
                            trim: true,
                            maxlength: 2048,
                            required: true,
                        },
                    },
                ],
                default: [],
            },
        },

        // 5. Physical address and map position
        address: {
            line1: { type: String, trim: true, maxlength: 200, default: "" },
            line2: { type: String, trim: true, maxlength: 200, default: "" },
            area: { type: String, trim: true, maxlength: 120, default: "" },
            city: { type: String, trim: true, maxlength: 120, default: "" },
            district: { type: String, trim: true, maxlength: 120, default: "" },
            state: { type: String, trim: true, maxlength: 120, default: "" },
            country: { type: String, trim: true, maxlength: 80, default: "India" },
            postalCode: { type: String, trim: true, maxlength: 12, default: "" },
            formatted: { type: String, trim: true, maxlength: 500, default: "" },
        },
        coordinates: {
            latitude: { type: Number, min: -90, max: 90, default: null },
            longitude: { type: Number, min: -180, max: 180, default: null },
        },
        serviceAreas: {
            type: [{ type: String, trim: true, maxlength: 120 }],
            default: [],
            validate: (items) => items.length <= 50,
        },

        // 6. Opening hours (24-hour local time)
        openingHours: {
            timezone: { type: String, default: "Asia/Kolkata", maxlength: 100 },
            weekly: { type: weeklyHoursSchema, default: () => ({}) },
            notes: { type: String, trim: true, maxlength: 500, default: "" },
        },

        // 7. Services and facilities
        services: {
            type: [{ type: String, trim: true, maxlength: 120 }],
            default: [],
            validate: (items) => items.length <= 100,
        },
        amenities: {
            type: [{ type: String, trim: true, maxlength: 80 }],
            default: [],
            validate: (items) => items.length <= 100,
        },
        paymentMethods: {
            type: [{ type: String, trim: true, maxlength: 50 }],
            default: [],
            validate: (items) => items.length <= 30,
        },
        languages: {
            type: [{ type: String, trim: true, maxlength: 50 }],
            default: [],
            validate: (items) => items.length <= 30,
        },
        priceRange: {
            type: String,
            enum: ["budget", "moderate", "premium", "luxury", "not_applicable"],
            default: "not_applicable",
        },

        // 8. Branding and gallery
        logo: { type: imageSchema, default: null },
        coverImage: { type: imageSchema, default: null },
        images: {
            type: [imageSchema],
            default: [],
            validate: (items) => items.length <= 20,
        },

        // 9. Search engine settings
        seo: {
            title: { type: String, trim: true, maxlength: 70, default: "" },
            description: { type: String, trim: true, maxlength: 170, default: "" },
            canonicalUrl: {
                type: String,
                trim: true,
                maxlength: 2048,
                default: "",
            },
            noIndex: { type: Boolean, default: false },
        },

        // 10. Publication and moderation
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
            required: true,
            index: true,
        },
        publishedAt: { type: Date, default: null },
        verificationStatus: {
            type: String,
            enum: ["unverified", "pending", "verified", "rejected"],
            default: "unverified",
            index: true,
        },
        internalNotes: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: "",
            select: false,
        },

        // 11. Audit fields
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "businesses",
        strict: "throw",
    }
);

// Slug uniqueness applies to drafts, published and archived records.
businessSchema.index(
    { slug: 1 },
    { unique: true, name: "business_slug_unique" }
);

businessSchema.index(
    { status: 1, createdAt: -1 },
    { name: "business_status_created_at" }
);

businessSchema.index(
    { createdAt: -1, _id: -1 },
    { name: "business_recent_created" }
);

businessSchema.index(
    { category: 1, location: 1, status: 1 },
    { name: "business_category_location_status" }
);

businessSchema.index(
    { "address.city": 1, status: 1 },
    { name: "business_city_status" }
);
businessSchema.index(
    { createdAt: -1, _id: -1 },
    { name: "business_recent_created" }
);

const Business =
    mongoose.models.Business ||
    mongoose.model("Business", businessSchema);

export default Business;
