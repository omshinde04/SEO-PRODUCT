import { apiError, apiSuccess } from "@/lib/api/response";
import { connectDB } from "@/lib/db";
import { enforcePlacesRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const placeId = (searchParams.get("placeId") || "").trim();
  const sessionToken = (searchParams.get("sessionToken") || "").trim();

  if (!placeId || placeId.length > 300 || !/^[a-zA-Z0-9_-]+$/.test(placeId)) {
    return apiError("A valid Google Place ID is required.", 400);
  }
  if (sessionToken && !/^[a-zA-Z0-9_-]{16,80}$/.test(sessionToken)) {
    return apiError("Invalid location search session.", 400);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return apiError("Google location search is not configured yet. Add GOOGLE_MAPS_API_KEY to the server environment.", 503);

  try {
    await connectDB();
    const rateLimit = await enforcePlacesRateLimit(request);
    if (rateLimit.limited) return apiError("Too many location searches. Please wait a few minutes and try again.", 429);

    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error("[GOOGLE PLACES DETAILS]", response.status, body.error?.status || "provider error");
      return apiError("We couldn't retrieve details for that location. Please select another result.", 502);
    }

    const place = await response.json();
    const components = place.addressComponents || [];
    const component = (...types) => components.find((item) => types.some((type) => item.types?.includes(type)))?.longText || "";
    return apiSuccess({
      place: {
        placeId: place.id || placeId,
        name: place.displayName?.text || "",
        formattedAddress: place.formattedAddress || "",
        latitude: Number.isFinite(place.location?.latitude) ? place.location.latitude : null,
        longitude: Number.isFinite(place.location?.longitude) ? place.location.longitude : null,
        address: {
          area: component("sublocality_level_1", "sublocality", "neighborhood", "administrative_area_level_3"),
          city: component("locality") || component("postal_town") || component("administrative_area_level_3") || component("administrative_area_level_2"),
          district: component("administrative_area_level_2"),
          state: component("administrative_area_level_1"),
          country: component("country"),
          postalCode: component("postal_code"),
        },
      },
    });
  } catch (error) {
    console.error("[GOOGLE PLACES DETAILS]", error.name || "request failed");
    return apiError("Location details are temporarily unavailable.", 502);
  }
}
