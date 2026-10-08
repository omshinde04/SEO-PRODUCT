
---

# 2. `docs/DATABASE-SCHEMA.md`

```md
# Database Schema

## 1. Overview

The platform uses MongoDB with Mongoose.

The database is the source of truth for all dynamic platform content.

The schema is designed for:

- Local businesses
- Locations
- Categories
- Tourist places
- Guides
- Events
- Business submissions
- Media
- Homepage configuration
- SEO configuration
- Admin users

---

## 2. Collections

Initial collections:

```text
users
categories
locations
businesses
places
guides
events
businessSubmissions
media
homepageSections
seoSettings
seoTemplates