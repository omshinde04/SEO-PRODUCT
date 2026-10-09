import mongoose from "mongoose";

const { Schema } = mongoose;

const schema = new Schema(
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
        strict: "throw",
    }
);

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.LoginAttempt ||
    mongoose.model("LoginAttempt", schema);
