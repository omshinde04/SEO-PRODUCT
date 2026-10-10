import mongoose from "mongoose";

const { Schema } = mongoose;

const promotionRequestSchema = new Schema(
    {
        business: {
            type: Schema.Types.ObjectId,
            ref: "Business",
            default: null,
            index: true,
        },
        businessName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 160,
        },
        contactName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 254,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30,
        },
        whatsapp: {
            type: String,
            trim: true,
            maxlength: 30,
            default: "",
        },
        plan: {
            type: String,
            enum: ["starter_7", "growth_14", "spotlight_30", "custom"],
            default: "growth_14",
        },
        promotionalHeadline: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
        targetCategory: {
            type: Schema.Types.Mixed,
            default: null,
        },
        targetCategoryName: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        targetLocation: {
            type: Schema.Types.Mixed,
            default: null,
        },
        targetLocationName: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        preferredCta: {
            type: String,
            enum: ["call", "call_now", "whatsapp", "website", "directions", "details", "visit_us", "order_online"],
            default: "call_now",
        },
        budget: {
            type: String,
            trim: true,
            maxlength: 80,
            default: "",
        },
        message: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "reviewing", "active", "rejected", "paused", "completed"],
            default: "pending",
            index: true,
        },
        sponsoredBadge: {
            type: String,
            trim: true,
            maxlength: 50,
            default: "Sponsored",
        },
        priority: {
            type: Number,
            default: 1,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        adminNotes: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: "",
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "promotion_requests",
        strict: "throw",
    }
);

promotionRequestSchema.index({ status: 1, createdAt: -1 });
promotionRequestSchema.index({ status: 1, priority: -1, endDate: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.PromotionRequest) {
    delete mongoose.models.PromotionRequest;
}

const PromotionRequest =
    mongoose.models.PromotionRequest ||
    mongoose.model("PromotionRequest", promotionRequestSchema);

export default PromotionRequest;
