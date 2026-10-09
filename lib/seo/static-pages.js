const pages = {
  "/about": { title: "About GaavConnect | Your Local Connection", description: "Learn about GaavConnect, a local discovery platform helping people find businesses, services and places while helping local businesses get discovered." },
  "/how-it-works": { title: "How GaavConnect Works | Discover Local", description: "Learn how to discover local businesses, explore categories and locations, and share a business listing on GaavConnect." },
  "/for-businesses": { title: "Get Your Local Business Discovered | GaavConnect", description: "Help customers find your shop, service or local business. Learn how GaavConnect business listings work and submit your listing." },
  "/contact": { title: "Contact GaavConnect | Get in Touch", description: "Find the right way to contact GaavConnect about business listings, corrections, support and platform questions." },
  "/help": { title: "GaavConnect Help Centre | Listing and Discovery Help", description: "Get help finding local businesses, submitting a listing, requesting a correction and using GaavConnect." },
  "/safety": { title: "Trust and Safety | GaavConnect", description: "Learn practical ways to evaluate local listings, report incorrect information and use GaavConnect thoughtfully." },
  "/privacy": { title: "Privacy Notice | GaavConnect", description: "Read how GaavConnect aims to handle information submitted through listings, support requests and website preferences." },
  "/cookies": { title: "Cookie Policy and Preferences | GaavConnect", description: "Understand essential browser storage and optional cookie preferences on GaavConnect, and update your choices at any time." },
  "/accessibility": { title: "Accessibility | GaavConnect", description: "Learn about GaavConnect accessibility goals and how to report barriers while using the local discovery website." },
  "/guides": { title: "Local Discovery Guides | GaavConnect", description: "Practical guides to finding local services, choosing businesses, exploring nearby places and helping your business get discovered." },
  "/explore": { title: "Explore Local Businesses and Places | GaavConnect", description: "Explore local businesses, services, categories and locations through GaavConnect's local discovery directory." },
};

export function getStaticPageMetadata(path) {
  const page = pages[path] || pages["/about"];
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "GaavConnect", title: page.title, description: page.description, url: path, locale: "en_IN" },
    twitter: { card: "summary", title: page.title, description: page.description },
  };
}
