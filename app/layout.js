import "./globals.css";
import CookieConsent from "@/components/cookie-consent";
import { getGlobalSeoSettings } from "@/lib/seo/public-metadata";

export async function generateMetadata() {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const title = settings.defaultTitle || "Discover Local Businesses in Nashik District";
  const description = settings.defaultDescription || "Discover local businesses, shops, restaurants, services, stays and places across Ghoti, Igatpuri and Nashik, Maharashtra with GaavConnect.";
  const image = settings.defaultImage || undefined;
  const allowIndex = settings.robotsIndex !== false;

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: settings.titleTemplate || "%s | GaavConnect" },
    description,
    applicationName: settings.siteName || "GaavConnect",
    creator: settings.organizationName || "GaavConnect",
    publisher: settings.organizationName || "GaavConnect",
    category: "local business directory",
    keywords: [
      "local businesses in Nashik",
      "Ghoti businesses",
      "Igatpuri businesses",
      "Nashik district services",
      "Maharashtra local directory",
      "restaurants near me",
      "local shops and services",
      "GaavConnect",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: settings.siteName || "GaavConnect",
      title,
      description,
      url: siteUrl,
      locale: "en_IN",
      ...(image ? { images: [{ url: image, alt: settings.siteName || "GaavConnect" }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
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
  };
}

export default async function RootLayout({ children }) {
  const settings = await getGlobalSeoSettings();
  const siteUrl = settings.siteUrl || "https://gaavconnect.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteName || "GaavConnect",
    url: siteUrl,
    description: settings.defaultDescription,
    inLanguage: ["en-IN", "mr-IN"],
    publisher: {
      "@type": "Organization",
      name: settings.organizationName || settings.siteName || "GaavConnect",
      url: siteUrl,
      logo: settings.organizationLogo || `${siteUrl}/gaavconnect-logo.svg`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/businesses?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en-IN">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
