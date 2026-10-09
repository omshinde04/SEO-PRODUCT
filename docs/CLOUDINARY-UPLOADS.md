# Secure image uploads

## Flow

1. An authenticated admin requests `POST /api/admin/uploads/signature` with a supported `purpose`.
2. The server verifies the admin session and same-origin `Origin` header, validates the request, generates the asset ID/folder, and signs the upload parameters.
3. The browser uploads image bytes directly to Cloudinary using the returned upload parameters.
4. After upload success, the browser stores Cloudinary `secure_url` and `public_id` in the media library. Editors can then select a library asset and assign its URL/public ID to content.

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

Do not persist image references until Cloudinary confirms upload success.

## Media deletion

The admin media delete action:
1. Loads the media record from MongoDB and uses its server-stored `publicId`; it never accepts a public ID from the browser for deletion.
2. Checks business logo, cover image and gallery references, location cover-image references, and content cover-image references.
3. Returns `409 Conflict` while any reference exists.
4. Sends a signed request to Cloudinary's image destroy endpoint.
5. Removes the MongoDB media record only after Cloudinary reports `ok` or `not found`.

If Cloudinary credentials are missing or the remote deletion is not confirmed, the media record is retained and the API returns an error. Configure the Cloudinary credentials on the server before enabling this workflow in production.