
import mongoose from "mongoose";

const { Schema } = mongoose;

const locationSchema = new Schema(
    {
        // Display name, e.g. Ghoti or Igatpuri.
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },

        // Stable URL identifier, e.g. ghoti.
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 140,
            match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },

        // Supports country → state → district → city → locality.
        type: {
            type: String,
            enum: [
                "country",
                "state",
                "district",
                "city",
                "town",
                "village",
                "locality",
                "region",
            ],
            required: true,
            index: true,
        },

        parent: {
            type: Schema.Types.ObjectId,
            ref: "Location",
            default: null,
            index: true,
        },

        address: {
            district: {
                type: String,
                trim: true,
                maxlength: 120,
                default: "",
            },
            state: {
                type: String,
                trim: true,
                maxlength: 120,
                default: "",
            },
            country: {
                type: String,
                trim: true,
                maxlength: 80,
                default: "India",
            },
            postalCodes: {
                type: [{ type: String, trim: true, maxlength: 12 }],
                default: [],
                validate: (codes) => codes.length <= 100,
            },
        },

        coordinates: {
            latitude: {
                type: Number,
                min: -90,
                max: 90,
                default: null,
            },
            longitude: {
                type: Number,
                min: -180,
                max: 180,
                default: null,
            },
        },

        description: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: "",
        },

        marathiName: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },

        tagline: {
            type: String,
            trim: true,
            maxlength: 160,
            default: "",
        },

        featuredOnAbout: {
            type: Boolean,
            default: false,
            index: true,
        },

        coverImage: {
            url: {
                type: String,
                trim: true,
                maxlength: 2048,
                default: "",
            },
            publicId: {
                type: String,
                trim: true,
                maxlength: 300,
                default: "",
            },
            alt: {
                type: String,
                trim: true,
                maxlength: 200,
                default: "",
            },
        },

        seo: {
            title: {
                type: String,
                trim: true,
                maxlength: 70,
                default: "",
            },
            description: {
                type: String,
                trim: true,
                maxlength: 170,
                default: "",
            },
            noIndex: {
                type: Boolean,
                default: false,
            },
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            required: true,
            index: true,
        },

        sortOrder: {
            type: Number,
            min: 0,
            max: 100000,
            default: 0,
        },

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
        collection: "locations",
        strict: "throw",
    }
);

// A location slug is unique within its parent.
// Top-level locations have a separate uniqueness rule.
locationSchema.index(
    { slug: 1, parent: 1 },
    {
        unique: true,
        partialFilterExpression: { parent: { $type: "objectId" } },
        name: "location_slug_parent_unique",
    }
);

locationSchema.index(
    { slug: 1 },
    {
        unique: true,
        partialFilterExpression: { parent: null },
        name: "location_slug_root_unique",
    }
);

locationSchema.index(
    { parent: 1, status: 1, sortOrder: 1, name: 1 },
    { name: "location_hierarchy_order" }
);

locationSchema.index(
    { type: 1, status: 1, name: 1 },
    { name: "location_type_status_name" }
);

const Location =
    mongoose.models.Location ||
    mongoose.model("Location", locationSchema);

export default Location;
