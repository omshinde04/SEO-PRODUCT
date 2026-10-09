import { apiError, apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const input = (searchParams.get("q") || "").trim();
  const sessionToken = (searchParams.get("sessionToken") || "").trim();

  if (input.length < 3) return apiSuccess({ suggestions: [] });
  if (input.length > 120) return apiError("Location search must be 120 characters or fewer.", 400);
  if (sessionToken && !/^[a-zA-Z0-9_-]{16,80}$/.test(sessionToken)) {
    return apiError("Invalid location search session.", 400);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return apiError("Google location search is not configured yet. Add GOOGLE_MAPS_API_KEY to the server environment.", 503);

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["in"],
        languageCode: "en",
        ...(sessionToken ? { sessionToken } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error("[GOOGLE PLACES AUTOCOMPLETE]", response.status, body.error?.status || "provider error");
      return apiError("Google could not complete this location search. Please try again.", 502);
    }

    const body = await response.json();
    const suggestions = (body.suggestions || [])
      .map((suggestion) => suggestion.placePrediction)
      .filter((place) => place?.placeId && place?.text?.text)
      .slice(0, 6)
      .map((place) => ({
        placeId: place.placeId,
        description: place.text.text,
        mainText: place.structuredFormat?.mainText?.text || place.text.text,
        secondaryText: place.structuredFormat?.secondaryText?.text || "",
      }));

    return apiSuccess({ suggestions });
  } catch (error) {
    console.error("[GOOGLE PLACES AUTOCOMPLETE]", error.name || "request failed");
    return apiError("Location suggestions are temporarily unavailable.", 502);
  }
}
