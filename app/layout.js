import { Suspense } from "react";
import "./globals.css";
import CookieConsent from "@/components/cookie-consent";
import AnalyticsTracker from "@/components/analytics-tracker";
import { getGlobalSeoSettings, getOrganizationStructuredData } from "@/lib/seo/public-metadata";

export async function generateMetadata() {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const title = settings.defaultTitle || "GaavConnect — Local Businesses & Places in Nashik District (Ghoti, Igatpuri)";
  const description =
    settings.defaultDescription ||
    "Discover verified local businesses, highway dhabas, farmstays, shops, healthcare, and trusted services across Ghoti, Igatpuri, Nashik City, and rural Maharashtra with GaavConnect.";
  const image = settings.defaultImage || `${siteUrl}/gaavconnect-logo.svg`;
  const allowIndex = settings.robotsIndex !== false;

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: settings.titleTemplate || "%s | GaavConnect" },
    description,
    applicationName: "GaavConnect",
    creator: "Om Vilas Shinde",
    publisher: "GaavConnect",
    category: "local business directory",
    keywords: [
      "local businesses in Nashik",
      "Ghoti business directory",
      "Igatpuri businesses",
      "Nashik district services",
      "highway dhabas NH-160",
      "farmstays in Igatpuri",
      "Maharashtra local directory",
      "restaurants near me",
      "local shops and services",
      "Om Vilas Shinde",
      "GaavConnect",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: "GaavConnect",
      title,
      description,
      url: siteUrl,
      locale: "en_IN",
      images: [{ url: image, alt: "GaavConnect — Local Business Discovery in Nashik District" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@gaavconnect.in",
      creator: "@gaavconnect.in",
      images: [image],
    },
    robots: {
      index: allowIndex,
      follow: true,
      googleBot: {
        index: allowIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "geo.region": "IN-MH",
      "geo.placename": "Nashik, Igatpuri, Ghoti, Maharashtra, India",
      "geo.position": "19.9975;73.7898",
      "ICBM": "19.9975, 73.7898",
    },
  };
}

export default async function RootLayout({ children }) {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const orgData = await getOrganizationStructuredData();

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: settings.siteName || "GaavConnect",
    url: siteUrl,
    description: settings.defaultDescription,
    inLanguage: ["en-IN", "mr-IN"],
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/businesses?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const rootStructuredData = {
    "@context": "https://schema.org",
    "@graph": [orgData, websiteData],
  };

  return (
    <html lang="en-IN">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootStructuredData).replace(/</g, "\\u003c") }}
        />
        {children}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <CookieConsent />
      </body>
    </html>
  );
}
