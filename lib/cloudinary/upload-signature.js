import { createHash, randomUUID } from "node:crypto";

export const UPLOAD_PURPOSES = Object.freeze({
    "business-logo": "seo-product/businesses/logos",
    "business-cover": "seo-product/businesses/covers",
    "business-gallery": "seo-product/businesses/gallery",
    "location-cover": "seo-product/locations/covers",
    "place-cover": "seo-product/places/covers",
    "place-gallery": "seo-product/places/gallery",
    "guide-cover": "seo-product/guides/covers",
    "event-cover": "seo-product/events/covers",
    "media-library": "seo-product/media",
    "seo-image": "seo-product/seo",
});

export const IMAGE_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
export const IMAGE_UPLOAD_ALLOWED_FORMATS = Object.freeze(["jpg", "jpeg", "png", "webp", "avif"]);

export function getCloudinaryConfig(env = process.env) {
    const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = env.CLOUDINARY_API_SECRET;
    const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET?.trim();
    if (!cloudName || !/^[a-z0-9-]+$/i.test(cloudName)) throw new Error("CLOUDINARY_CLOUD_NAME is missing or invalid.");
    if (!apiKey || !/^\d+$/.test(apiKey)) throw new Error("CLOUDINARY_API_KEY is missing or invalid.");
    if (!apiSecret || apiSecret.length < 16) throw new Error("CLOUDINARY_API_SECRET is missing or invalid.");
    if (!uploadPreset || !/^[a-zA-Z0-9_-]+$/.test(uploadPreset)) throw new Error("CLOUDINARY_UPLOAD_PRESET is missing or invalid.");
    return { cloudName, apiKey, apiSecret, uploadPreset };
}

export function createCloudinarySignature(params, apiSecret) {
    if (!apiSecret || typeof apiSecret !== "string") throw new TypeError("A Cloudinary API secret is required.");
    const serialized = Object.entries(params)
        .filter(([key, value]) => !["file", "api_key", "signature"].includes(key) && value !== undefined && value !== null && value !== "")
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
    return createHash("sha1").update(`${serialized}${apiSecret}`, "utf8").digest("hex");
}

export function createSignedImageUpload({ purpose, config, now = Date.now() }) {
    const folder = UPLOAD_PURPOSES[purpose];
    if (!folder) throw new TypeError("Unsupported image upload purpose.");
    const timestamp = Math.floor(now / 1000);
    const publicId = randomUUID();
    const signedParams = { folder, public_id: publicId, timestamp, upload_preset: config.uploadPreset };
    return {
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        uploadPreset: config.uploadPreset,
        folder,
        publicId,
        timestamp,
        signature: createCloudinarySignature(signedParams, config.apiSecret),
        maxFileSizeBytes: IMAGE_UPLOAD_LIMIT_BYTES,
        allowedFormats: [...IMAGE_UPLOAD_ALLOWED_FORMATS],
    };
}

/**
 * Delete a previously uploaded image using Cloudinary's signed destroy API.
 * Callers must load the public ID from a trusted server-side media record.
 */
export async function deleteCloudinaryImage({
    publicId,
    config,
    fetchImpl = fetch,
    now = Date.now(),
}) {
    if (typeof publicId !== "string" || !publicId.trim() || publicId.length > 300) {
        throw new TypeError("A valid Cloudinary public ID is required.");
    }
    if (!config?.cloudName || !config?.apiKey || !config?.apiSecret) {
        throw new TypeError("Cloudinary credentials are required to delete an image.");
    }

    const timestamp = Math.floor(now / 1000);
    const signature = createCloudinarySignature(
        { public_id: publicId, timestamp, invalidate: true },
        config.apiSecret
    );
    const body = new URLSearchParams({
        public_id: publicId,
        timestamp: String(timestamp),
        invalidate: "true",
        api_key: config.apiKey,
        signature,
    });

    const response = await fetchImpl(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
            cache: "no-store",
        }
    );
    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error("Cloudinary image deletion request failed.");
    }
    if (!result || !["ok", "not found"].includes(result.result)) {
        throw new Error("Cloudinary did not confirm image deletion.");
    }

    return result.result;
}
