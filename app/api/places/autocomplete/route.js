import { apiError, apiSuccess } from "@/lib/api/response";
import { connectDB } from "@/lib/db";
import { enforceGeocoderRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PHOTON_URL = "https://photon.komoot.io/api/";
const MAX_QUERY_LENGTH = 120;
const RESULT_LIMIT = 6;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFeature(feature) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates;
  const longitude = Number(coordinates?.[0]);
  const latitude = Number(coordinates?.[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const name = clean(properties.name);
  const city = clean(properties.city || properties.town || properties.village || properties.municipality);
  const area = clean(properties.suburb || properties.neighbourhood || properties.locality);
  const district = clean(properties.district || properties.county);
  const state = clean(properties.state);
  const country = clean(properties.country) || "India";
  const postalCode = clean(properties.postcode);
  const description = [name || city || area || district || state, city, district, state, country]
    .filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", ");
  if (!description) return null;

  const placeId = properties.osm_id ? String(properties.osm_type || "osm") + "-" + properties.osm_id : description;
  return {
    placeId, description,
    mainText: name || city || area || district || state || description,
    secondaryText: [area, city, district, state, country].filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index && value !== (name || city)).join(", "),
    place: {
      placeId, name: name || city || area || district || description, description,
      formattedAddress: description, latitude, longitude,
      address: { area, city, district, state, country, postalCode },
      source: "openstreetmap", osmType: clean(properties.osm_type), osmId: properties.osm_id ?? null,
      searchText: city || area || district || name || description,
    },
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = clean(searchParams.get("q")).replace(/\s+/g, " ");
  if (query.length < 3) return apiSuccess({ suggestions: [] });
  if (query.length > MAX_QUERY_LENGTH) return apiError("Location search must be 120 characters or fewer.", 400);

  try {
    await connectDB();
    const rateLimit = await enforceGeocoderRateLimit(request);
    if (rateLimit.limited) return apiError("Too many location searches. Please wait a few minutes and try again.", 429);

    const url = new URL(PHOTON_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(RESULT_LIMIT));
    url.searchParams.set("lang", "en");
    url.searchParams.set("countrycode", "IN");
    // Bias ranking toward GaavConnect's initial Nashik-region audience without restricting searches elsewhere in India.
    url.searchParams.set("lat", "19.9975");
    url.searchParams.set("lon", "73.7898");

    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "GaavConnect/1.0 (local business discovery)" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error("[OPENSTREETMAP PHOTON] Provider returned HTTP", response.status);
      return apiError("Location suggestions are temporarily unavailable. Please try again.", 502);
    }

    const body = await response.json();
    const suggestions = (Array.isArray(body.features) ? body.features : []).map(normalizeFeature).filter(Boolean).slice(0, RESULT_LIMIT);
    return apiSuccess({ suggestions, attribution: "© OpenStreetMap contributors" });
  } catch (error) {
    console.error("[OPENSTREETMAP PHOTON] Request failed:", error.name || "unknown error");
    return apiError("Location suggestions are temporarily unavailable. Please try again.", 502);
  }
}
