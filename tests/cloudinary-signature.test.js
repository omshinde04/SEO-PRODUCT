import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createCloudinarySignature, createSignedImageUpload, deleteCloudinaryImage, getCloudinaryConfig, UPLOAD_PURPOSES } from "../lib/cloudinary/upload-signature.js";

test("Cloudinary signatures sort parameters and exclude file, api_key and signature", () => {
    const params = { timestamp: 123, api_key: "12345", folder: "seo-product/businesses/logos", signature: "ignored", file: "ignored", public_id: "asset-id", upload_preset: "signed_preset" };
    const expected = createHash("sha1").update("folder=seo-product/businesses/logos&public_id=asset-id&timestamp=123&upload_preset=signed_presetsecret", "utf8").digest("hex");
    assert.equal(createCloudinarySignature(params, "secret"), expected);
});

test("Cloudinary configuration rejects missing credentials", () => {
    assert.throws(() => getCloudinaryConfig({}), /CLOUDINARY_CLOUD_NAME/);
    assert.deepEqual(getCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: "demo-cloud", CLOUDINARY_API_KEY: "123456789012345", CLOUDINARY_API_SECRET: "a-secret-that-is-long-enough", CLOUDINARY_UPLOAD_PRESET: "seo_product_signed" }), { cloudName: "demo-cloud", apiKey: "123456789012345", apiSecret: "a-secret-that-is-long-enough", uploadPreset: "seo_product_signed" });
});

test("signed upload uses a fixed purpose folder and generated ID", () => {
    const config = { cloudName: "demo-cloud", apiKey: "123456789012345", apiSecret: "a-secret-that-is-long-enough", uploadPreset: "seo_product_signed" };
    const upload = createSignedImageUpload({ purpose: "business-logo", config, now: 1_800_000_000_000 });
    assert.equal(upload.folder, UPLOAD_PURPOSES["business-logo"]);
    assert.equal(upload.timestamp, 1_800_000_000);
    assert.match(upload.publicId, /^[0-9a-f-]{36}$/i);
    assert.equal(upload.uploadUrl, "https://api.cloudinary.com/v1_1/demo-cloud/image/upload");
    assert.equal(upload.signature, createCloudinarySignature({ folder: upload.folder, public_id: upload.publicId, timestamp: upload.timestamp, upload_preset: config.uploadPreset }, config.apiSecret));
});

test("unsupported upload purposes are rejected", () => {
    assert.throws(() => createSignedImageUpload({ purpose: "../../admin", config: {} }), /Unsupported image upload purpose/);
});

test("Cloudinary deletion signs the server-side public ID and timestamp", async () => {
    const config = {
        cloudName: "demo-cloud",
        apiKey: "123456789012345",
        apiSecret: "a-secret-that-is-long-enough",
        uploadPreset: "seo_product_signed",
    };
    let capturedUrl;
    let capturedOptions;

    const result = await deleteCloudinaryImage({
        publicId: "seo-product/places/covers/asset-id",
        config,
        now: 1_800_000_000_000,
        fetchImpl: async (url, options) => {
            capturedUrl = url;
            capturedOptions = options;
            return { ok: true, json: async () => ({ result: "ok" }) };
        },
    });

    const body = new URLSearchParams(capturedOptions.body);
    assert.equal(result, "ok");
    assert.equal(capturedUrl, "https://api.cloudinary.com/v1_1/demo-cloud/image/destroy");
    assert.equal(capturedOptions.method, "POST");
    assert.equal(body.get("public_id"), "seo-product/places/covers/asset-id");
    assert.equal(body.get("timestamp"), "1800000000");
    assert.equal(body.get("api_key"), config.apiKey);
    assert.equal(body.get("invalidate"), "true");
    assert.equal(
        body.get("signature"),
        createCloudinarySignature(
            {
                public_id: body.get("public_id"),
                timestamp: Number(body.get("timestamp")),
                invalidate: true,
            },
            config.apiSecret
        )
    );
});

test("Cloudinary deletion rejects an unconfirmed remote deletion", async () => {
    await assert.rejects(
        () => deleteCloudinaryImage({
            publicId: "seo-product/places/covers/asset-id",
            config: {
                cloudName: "demo-cloud",
                apiKey: "123456789012345",
                apiSecret: "a-secret-that-is-long-enough",
            },
            fetchImpl: async () => ({ ok: true, json: async () => ({ result: "error" }) }),
        }),
        /did not confirm image deletion/
    );
});
