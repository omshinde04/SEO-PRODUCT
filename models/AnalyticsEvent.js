import mongoose from "mongoose";

const { Schema } = mongoose;

const analyticsEventSchema = new Schema(
    {
        eventType: {
            type: String,
            required: true,
            enum: [
                "page_view",
                "session_start",
                "business_view",
                "category_view",
                "location_view",
                "guide_view",
                "place_view",
                "event_view",
                "search",
                "phone_click",
                "whatsapp_click",
                "website_click",
                "directions_click",
                "cta_click",
            ],
            index: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
            index: true,
        },
        pagePath: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1024,
            index: true,
        },
        pageTitle: {
            type: String,
            trim: true,
            maxlength: 250,
            default: "",
        },
        pageType: {
            type: String,
            enum: [
                "home",
                "business",
                "category",
                "location",
                "guide",
                "place",
                "event",
                "info",
                "other",
            ],
            default: "other",
            index: true,
        },
        visitorHash: {
            type: String,
            required: true,
            maxlength: 64,
            index: true,
        },
        sessionId: {
            type: String,
            required: true,
            maxlength: 64,
            index: true,
        },
        isNewVisitor: {
            type: Boolean,
            default: false,
        },
        durationSeconds: {
            type: Number,
            min: 0,
            max: 86400,
            default: 0,
        },
        referrerHostname: {
            type: String,
            trim: true,
            maxlength: 255,
            default: "direct",
            index: true,
        },
        referrerSource: {
            type: String,
            enum: ["direct", "search", "social", "referral", "internal", "unknown"],
            default: "direct",
            index: true,
        },
        deviceType: {
            type: String,
            enum: ["desktop", "mobile", "tablet", "unknown"],
            default: "unknown",
            index: true,
        },
        browserFamily: {
            type: String,
            trim: true,
            maxlength: 50,
            default: "Other",
            index: true,
        },
        osFamily: {
            type: String,
            trim: true,
            maxlength: 50,
            default: "Other",
            index: true,
        },
        country: {
            type: String,
            trim: true,
            maxlength: 10,
            default: "",
        },
        region: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },
        entityId: {
            type: Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        entitySlug: {
            type: String,
            trim: true,
            maxlength: 250,
            default: "",
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: () => ({}),
        },
    },
    {
        versionKey: false,
        timestamps: false,
        collection: "analytics_events",
        strict: "throw",
    }
);

// High efficiency compound indexes for aggregation pipelines
analyticsEventSchema.index({ timestamp: -1, eventType: 1 });
analyticsEventSchema.index({ eventType: 1, pagePath: 1, timestamp: -1 });
analyticsEventSchema.index({ eventType: 1, entitySlug: 1, timestamp: -1 });
analyticsEventSchema.index({ visitorHash: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

// Automatic 180-day TTL data retention cleanup (180 days in seconds)
analyticsEventSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 180 * 24 * 60 * 60, name: "analytics_ttl_180d" }
);

export default mongoose.models.AnalyticsEvent ||
    mongoose.model("AnalyticsEvent", analyticsEventSchema);
