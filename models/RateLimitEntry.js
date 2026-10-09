import mongoose from "mongoose";

const { Schema } = mongoose;

const rateLimitEntrySchema = new Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            maxlength: 64,
        },
        count: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        windowStartedAt: {
            type: Date,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        versionKey: false,
        timestamps: false,
        collection: "rate_limit_entries",
        strict: "throw",
    }
);

rateLimitEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimitEntry ||
    mongoose.model("RateLimitEntry", rateLimitEntrySchema);
