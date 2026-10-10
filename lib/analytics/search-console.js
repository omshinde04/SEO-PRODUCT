/**
 * Google Search Console (GSC) Integration Module
 *
 * Distinguishes external Google Search performance (organic search impressions,
 * clicks, average ranking position) from internal website analytics (actual page views
 * and visitors).
 */

export function getSearchConsoleStatus() {
    const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "https://gaavconnect.in";

    const isConfigured = Boolean(clientEmail && privateKey);

    return {
        configured: isConfigured,
        siteUrl,
        clientEmail: clientEmail ? `${clientEmail.slice(0, 4)}...${clientEmail.slice(-12)}` : null,
        message: isConfigured
            ? "Google Search Console service account connected."
            : "Google Search Console credentials not configured in environment.",
        setupGuide: {
            steps: [
                "1. Create a Service Account in Google Cloud Platform Console.",
                "2. Enable Google Search Console API for the project.",
                "3. In Google Search Console, add the Service Account email as a User with 'Full' or 'Read' permission to property https://gaavconnect.in.",
                "4. Add GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL and GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY to your server .env.local file.",
            ],
            metricsDistinction: [
                "• Website Page Views: Recorded visits to GaavConnect pages by users.",
                "• Search Impressions: How many times a GaavConnect link appeared in Google search results.",
                "• Search Clicks: How many times a user clicked a GaavConnect result in Google to visit the site.",
                "• Average Position: The average ranking of GaavConnect links on Google SERP.",
            ],
        },
    };
}
