import mongoose from "mongoose";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import PromotionRequest from "@/models/PromotionRequest";

const hexIdRegex = /^[a-f\d]{24}$/i;

function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value) {
    return String(value || "local-business")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 150) || "local-business";
}

async function uniqueSlug(name) {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;
    while (await Business.exists({ slug: candidate })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}

/**
 * Resolve Category ObjectId from ID, slug, or name.
 */
export async function resolveCategory(input) {
    if (!input) {
        return Category.findOne({ status: "active" }).select("_id name slug").lean();
    }
    if (typeof input === "object" && input._id) {
        return input;
    }
    const str = String(input).trim();
    if (hexIdRegex.test(str)) {
        const found = await Category.findById(str).select("_id name slug").lean();
        if (found) return found;
    }
    const found = await Category.findOne({
        status: "active",
        $or: [
            { slug: str.toLowerCase() },
            { name: new RegExp(`^${escapeRegex(str)}$`, "i") },
        ],
    }).select("_id name slug").lean();

    if (found) return found;
    return Category.findOne({ status: "active" }).select("_id name slug").lean();
}

/**
 * Resolve Location ObjectId from ID, slug, or name.
 */
export async function resolveLocation(input) {
    if (!input) {
        return Location.findOne({ status: "active" }).select("_id name slug type").lean();
    }
    if (typeof input === "object" && input._id) {
        return input;
    }
    const str = String(input).trim();
    if (hexIdRegex.test(str)) {
        const found = await Location.findById(str).select("_id name slug type").lean();
        if (found) return found;
    }
    const found = await Location.findOne({
        status: "active",
        $or: [
            { slug: str.toLowerCase() },
            { name: new RegExp(`^${escapeRegex(str)}$`, "i") },
        ],
    }).select("_id name slug type").lean();

    if (found) return found;
    return Location.findOne({ status: "active" }).select("_id name slug type").lean();
}

/**
 * Guarantees synchronization between PromotionRequest and Business record.
 * If status is 'active':
 *   - Auto-finds or auto-creates a published Business record if not linked.
 *   - Sets isSponsored: true, sponsoredUntil, sponsoredTagline, sponsoredBadge, sponsoredPriority.
 *   - Unsets isSponsored on any previously linked business if changed.
 * If status is not 'active' (paused, reviewing, rejected, completed, pending):
 *   - Immediately resets isSponsored: false on the linked business.
 */
export async function syncPromotionToBusiness(promo, options = {}) {
    if (!promo) return null;

    const previousBusinessId = options.previousBusinessId
        ? String(options.previousBusinessId)
        : null;

    const now = new Date();
    const effectiveStatus = promo.status;

    if (effectiveStatus === "active") {
        let businessId = promo.business ? String(promo.business._id || promo.business) : null;
        let businessDoc = null;

        if (businessId) {
            businessDoc = await Business.findById(businessId);
        }

        // If not found or not linked, auto-find or auto-create a published business
        if (!businessDoc) {
            // 1. Try to find existing business by exact/case-insensitive name
            businessDoc = await Business.findOne({
                name: new RegExp(`^${escapeRegex(promo.businessName)}$`, "i"),
            });

            // 2. Try to match by phone
            if (!businessDoc && promo.phone) {
                const cleanPhone = promo.phone.replace(/[^0-9]/g, "");
                if (cleanPhone.length >= 8) {
                    businessDoc = await Business.findOne({
                        $or: [
                            { "contact.phone": promo.phone },
                            { "contact.whatsapp": promo.whatsapp || promo.phone },
                        ],
                    });
                }
            }

            // 3. If still not found, auto-create a published business
            if (!businessDoc) {
                const categoryDoc = await resolveCategory(promo.targetCategory || promo.targetCategoryName);
                const locationDoc = await resolveLocation(promo.targetLocation || promo.targetLocationName);

                if (!categoryDoc || !locationDoc) {
                    throw new Error("Cannot auto-provision business: active category or location not available.");
                }

                const generatedSlug = await uniqueSlug(promo.businessName);
                const phone = promo.phone || "9373545169";
                const whatsapp = promo.whatsapp || phone;
                const locationCity = locationDoc.name || "Nashik";

                // Infer businessType
                const catSlug = (categoryDoc.slug || "").toLowerCase();
                let bType = "business";
                if (catSlug.includes("dhaba") || catSlug.includes("restaurant") || catSlug.includes("food") || catSlug.includes("misal")) {
                    bType = "restaurant";
                } else if (catSlug.includes("hotel") || catSlug.includes("stay") || catSlug.includes("resort") || catSlug.includes("lodge")) {
                    bType = "hotel";
                } else if (catSlug.includes("retail") || catSlug.includes("shop") || catSlug.includes("kirana")) {
                    bType = "retail";
                } else if (catSlug.includes("auto") || catSlug.includes("mechanic") || catSlug.includes("garage")) {
                    bType = "professional_service";
                }

                businessDoc = await Business.create({
                    name: promo.businessName.trim(),
                    slug: generatedSlug,
                    tagline: promo.promotionalHeadline || `${promo.businessName} — Top Choice in ${locationCity}`,
                    description: promo.message || `${promo.businessName} is a premier verified establishment in ${locationCity}, Nashik district. Known for exceptional local service, verified contact options, and customer satisfaction.`,
                    businessType: bType,
                    category: categoryDoc._id,
                    location: locationDoc._id,
                    contact: {
                        phone,
                        whatsapp,
                        email: promo.email || "",
                        website: "",
                        preferredMethod: promo.preferredCta === "whatsapp" ? "whatsapp" : "phone",
                    },
                    address: {
                        line1: `${promo.businessName}`,
                        city: locationCity,
                        district: "Nashik",
                        state: "Maharashtra",
                        country: "India",
                        postalCode: "422403",
                        formatted: `${promo.businessName}, ${locationCity}, Nashik District, Maharashtra`,
                    },
                    status: "published",
                    publishedAt: now,
                    verificationStatus: "verified",
                    isFeatured: true,
                    isSponsored: true,
                    sponsoredTagline: promo.promotionalHeadline || "",
                    sponsoredBadge: promo.sponsoredBadge || "✦ Sponsored",
                    sponsoredPriority: promo.priority || 15,
                    sponsoredUntil: promo.endDate || new Date(now.getTime() + 14 * 86400000),
                });
            }
        }

        if (businessDoc) {
            promo.business = businessDoc._id;
            // Also keep businessName aligned
            if (!promo.businessName) {
                promo.businessName = businessDoc.name;
            }

            // Update Business record with latest active promotion sponsorship
            await Business.findByIdAndUpdate(businessDoc._id, {
                $set: {
                    status: "published",
                    isSponsored: true,
                    isFeatured: true,
                    sponsoredUntil: promo.endDate,
                    sponsoredTagline: promo.promotionalHeadline || businessDoc.sponsoredTagline || "",
                    sponsoredBadge: promo.sponsoredBadge || "✦ Sponsored",
                    sponsoredPriority: promo.priority || 15,
                },
            });

            // If the business was changed from another business, un-sponsor the old one
            if (previousBusinessId && previousBusinessId !== String(businessDoc._id)) {
                await Business.findByIdAndUpdate(previousBusinessId, {
                    $set: {
                        isSponsored: false,
                        sponsoredUntil: null,
                    },
                });
            }

            return businessDoc;
        }
    } else {
        // Status is paused, reviewing, rejected, completed, or pending
        // Demote the linked business from being sponsored
        const currentBizId = promo.business ? String(promo.business._id || promo.business) : null;
        if (currentBizId) {
            await Business.findByIdAndUpdate(currentBizId, {
                $set: {
                    isSponsored: false,
                    sponsoredUntil: null,
                },
            });
        }
        if (previousBusinessId && previousBusinessId !== currentBizId) {
            await Business.findByIdAndUpdate(previousBusinessId, {
                $set: {
                    isSponsored: false,
                    sponsoredUntil: null,
                },
            });
        }
    }

    return null;
}

/**
 * Sweeps the database to cleanly deactivate expired promotions and ensure
 * public listings never display expired ads as sponsored.
 */
export async function expireOutdatedPromotions() {
    try {
        const now = new Date();

        // 1. Unset isSponsored on any business whose sponsoredUntil has passed
        await Business.updateMany(
            {
                isSponsored: true,
                sponsoredUntil: { $ne: null, $lt: now },
            },
            {
                $set: {
                    isSponsored: false,
                    sponsoredUntil: null,
                },
            }
        );

        // 2. Mark active promotion requests whose endDate has passed as 'completed'
        await PromotionRequest.updateMany(
            {
                status: "active",
                endDate: { $ne: null, $lt: now },
            },
            {
                $set: {
                    status: "completed",
                },
            }
        );
    } catch (err) {
        console.error("[PROMOTIONS SYNC] Error expiring outdated promotions:", err.message);
    }
}
