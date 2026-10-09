
import mongoose from "mongoose";

const { Schema } = mongoose;

const categorySchema = new Schema(
    {
        // Human-readable category name.
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        // Stable URL identifier, e.g. restaurants.
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 120,
            match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        // Optional hierarchy: e.g. Restaurants → Cafes.
        parent: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
            index: true,
        },

        // Optional icon identifier for the future UI.
        icon: {
            type: String,
            trim: true,
            maxlength: 80,
            default: "",
        },

        // Controls whether the category can be selected for new listings.
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            required: true,
            index: true,
        },

        // Controls category ordering in navigation and filters.
        sortOrder: {
            type: Number,
            min: 0,
            max: 100000,
            default: 0,
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
        collection: "categories",
        strict: "throw",
    }
);

// Slugs are unique across all categories.
categorySchema.index(
    { slug: 1 },
    { unique: true, name: "category_slug_unique" }
);

// Prevent duplicate category names within the same parent.
// MongoDB permits multiple null values for this index, so use a
// partial index for top-level categories separately.
categorySchema.index(
    { name: 1, parent: 1 },
    {
        unique: true,
        partialFilterExpression: { parent: { $type: "objectId" } },
        name: "category_name_parent_unique",
    }
);

categorySchema.index(
    { status: 1, sortOrder: 1, name: 1 },
    { name: "category_navigation_order" }
);

const Category =
    mongoose.models.Category ||
    mongoose.model("Category", categorySchema);

export default Category;
