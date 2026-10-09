# Secure image uploads

## Flow

1. An authenticated admin requests `POST /api/admin/uploads/signature` with a supported `purpose`.
2. The server verifies the admin session and same-origin `Origin` header, validates the request, generates the asset ID/folder, and signs the upload parameters.
3. The browser uploads image bytes directly to Cloudinary using the returned upload parameters.
4. After upload success, the browser stores Cloudinary `secure_url` and `public_id` in the corresponding business/location record through the existing admin API.

The API secret is server-only. This endpoint does not accept arbitrary public IDs/folders or proxy file bytes through Next.js.

## Environment variables

Add these to `.env.local` and never commit real credentials:

```dotenv
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=seo_product_signed
```

## Cloudinary preset requirements

Create a **signed** upload preset matching `CLOUDINARY_UPLOAD_PRESET`. Configure it to allow only `jpg`, `jpeg`, `png`, `webp`, and `avif`, enforce a 5 MB maximum, and accept image assets only. Avoid settings that override the signed folder/public ID or allow arbitrary remote URL fetching.

The API reports the same limits to clients, but the Cloudinary preset must enforce them because the bytes go directly to Cloudinary.

## Endpoint

`POST /api/admin/uploads/signature`

Send `Content-Type: application/json` and a same-origin `Origin` header. Request body:

```json
{ "purpose": "business-logo" }
```

Allowed purposes: `business-logo`, `business-cover`, `business-gallery`, `location-cover`, `place-cover`, `place-gallery`.

Do not persist image references until Cloudinary confirms upload success. Asset deletion is intentionally not included yet; implement it only after checking every database reference to prevent deleting shared assets.