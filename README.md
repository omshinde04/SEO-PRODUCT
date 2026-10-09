# SEO-PRODUCT

SEO-PRODUCT is a location-focused discovery platform foundation for businesses, places, guides, and local events, starting around Ghoti, Igatpuri, and Nashik. The current development priority is a secure, usable admin panel; the public discovery website is a later phase.

## Technology

- Next.js App Router and React (JavaScript, not TypeScript)
- Tailwind CSS
- MongoDB and Mongoose
- Admin sessions signed with JWT and stored in an HTTP-only cookie
- Zod request validation
- Cloudinary signed image uploads

## Requirements

- Node.js 22 or newer
- npm
- A reachable MongoDB database
- A Cloudinary account for image upload and media deletion workflows

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Set real values in `.env.local`:

   | Variable | Purpose |
   | --- | --- |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Private signing secret, at least 32 characters |
   | `AUTH_RATE_LIMIT_SECRET` | Separate private HMAC secret for rate-limit identifiers; falls back to `JWT_SECRET` if omitted |
   | `NEXT_PUBLIC_SITE_URL` | Canonical public origin used by robots and sitemap |
   | `SITE_URL` | Server-side canonical origin for same-origin submission checks behind a reverse proxy |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Server-only Cloudinary API secret |
   | `CLOUDINARY_UPLOAD_PRESET` | Signed upload preset configured in Cloudinary |
   | `GOOGLE_MAPS_API_KEY` | Server-only Google Places API (New) key for public location search and admin address/coordinate lookup |

   Generate strong secrets instead of using the example placeholders. Never expose `JWT_SECRET`, `AUTH_RATE_LIMIT_SECRET`, or `CLOUDINARY_API_SECRET` to client-side code, and never commit `.env.local`.

4. Create the first administrator interactively:

   ```bash
   node scripts/create-admin.mjs
   ```

   The script asks for the admin name, email, and password. Password input is hidden, the password is hashed before storage, and the script refuses to create a second admin.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

## Admin modules

- **Overview:** business, category, location, content, and submission counts.
- **Businesses:** business profile CRUD, publishing state, verification, contact details, location/category assignment, and images.
- **Categories and locations:** hierarchical classification and location management with integrity checks.
- **Places, guides, and events:** content editing, location assignment, cover images, publication status, and per-item SEO fields. Events include date/time, venue, and registration URL fields.
- **Business submissions:** review status and internal notes.
- **Media library:** signed Cloudinary uploads, metadata editing, and reference-aware remote deletion.
- **Global SEO settings and templates:** editable defaults and entity-specific template records.

The admin API requires an authenticated admin session. Admin pages and APIs must not be treated as public endpoints.

## Google Places location search

The public homepage, business directory, and admin business address form use a server-side proxy to Google Places API (New). Set `GOOGLE_MAPS_API_KEY` in `.env.local` and your deployment environment; do not use a `NEXT_PUBLIC_` prefix for this key. In Google Cloud, enable Places API (New), restrict the key to the required API and the server-side environment where supported, set per-API quotas and budget alerts, and monitor usage. Eligible India-based accounts may receive monthly free usage thresholds, but Google Maps Platform is usage-billed beyond applicable thresholds; it is not an unlimited free API. The location search also retains manual address editing so listing management can continue if Google Places is unavailable.

## Security notes

- Admin sessions use an HTTP-only, SameSite=Lax cookie and short-lived JWTs.
- Login attempts use persistent MongoDB-backed rate limits. Public business submissions require a same-origin `Origin` header and are rate-limited by hashed IP/email identifiers.
- Rate limiting uses `x-vercel-forwarded-for`, `x-real-ip`, or `x-forwarded-for` for client address detection. Deploy behind a trusted proxy that overwrites these headers; do not accept untrusted client-supplied forwarding headers directly.
- Image uploads use server-generated IDs, fixed upload purposes/folders, and signed Cloudinary requests. Configure the Cloudinary preset to enforce image-only uploads, the allowed formats (JPG, PNG, WebP, AVIF), and a 5 MB maximum.
- Media deletion checks whether an asset is referenced by business, location, or content records. If Cloudinary does not confirm deletion, the database record is retained.
- Use HTTPS in production, keep environment secrets server-side, and configure MongoDB network access and credentials for the deployed environment.

## Verification commands

```bash
npm test
npm run lint
npm run build
```

GitHub Actions runs automated tests, ESLint, a production build, and authenticated API smoke tests for business CRUD, category/location hierarchy, content publishing, SEO settings, submissions, and sessions on pull requests to `main`. Rate-limit integration tests and admin API smoke tests use an ephemeral MongoDB service in CI; this does not verify connectivity to the production database or Cloudinary account.

## Current scope

The priority is to finish and verify the admin panel and its data/security workflows. The public discovery pages and complete live SEO metadata pipeline are not considered finished just because admin APIs and SEO settings exist. Validate the public routes, sitemap, and metadata integration in a separate phase before launching the platform.
