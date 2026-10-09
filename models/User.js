
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must contain at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            maxlength: [254, "Email cannot exceed 254 characters"],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
            unique: true,
            immutable: true,
        },

        password: {
            type: String,
            required: [true, "Password hash is required"],
            select: false,
        },

        role: {
            type: String,
            enum: ["admin"],
            default: "admin",
            required: true,
            immutable: true,
        },

        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },

        tokenVersion: {
            type: Number,
            default: 0,
            min: 0,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "Users",
        strict: "throw",
    }
);

// Enforce one admin account at the database level.
userSchema.index(
    { role: 1 },
    {
        unique: true,
        partialFilterExpression: {
            role: "admin",
        },
        name: "one_admin_only",
    }
);


const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema, "Users");

export default User;
