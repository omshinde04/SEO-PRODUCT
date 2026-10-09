/**
 * A geocoder label may contain a locality followed by subdistrict, state and country.
 * Public business search should use the most specific leading place name, not the
 * entire display label (or a broader district that appears later in the label).
 */
export function getPrimaryLocationTerm(value) {
    if (typeof value !== "string") return "";

    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return "";

    const [primary = ""] = normalized.split(",");
    return primary.trim() || normalized;
}
