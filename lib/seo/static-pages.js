const DEFAULT_SITE_URL = "https://gaavconnect.in";

const pages = {
  "/about": {
    title: "About GaavConnect | Founded by Om Vilas Shinde | Nashik District Platform",
    description: "Learn about GaavConnect, founded by Om Vilas Shinde to empower local businesses, highway dhabas, farmstays, and rural shops across Ghoti, Igatpuri, and Nashik district.",
    keywords: ["About GaavConnect", "Om Vilas Shinde", "Nashik district local directory", "Igatpuri businesses", "Ghoti Maharashtra local platform", "rural business empowerment"],
  },
  "/contact": {
    title: "Contact GaavConnect | Founder Helpline: 9373545169 | Nashik, Ghoti & Igatpuri",
    description: "Connect directly with GaavConnect founder Om Vilas Shinde via Call or WhatsApp at +91 9373545169. Business listings, advertising, and support across Nashik district.",
    keywords: ["Contact GaavConnect", "GaavConnect helpline", "Om Vilas Shinde phone", "WhatsApp 9373545169", "Nashik business support", "Igatpuri directory contact"],
  },
  "/how-it-works": {
    title: "How GaavConnect Works | Discovering Local Businesses in Nashik District",
    description: "Learn how to find verified shops, dhabas, and services, browse categories and locations across Ghoti & Igatpuri, and list your business free on GaavConnect.",
    keywords: ["How GaavConnect works", "local discovery guide Nashik", "browse Igatpuri shops", "Ghoti business finder"],
  },
  "/for-businesses": {
    title: "For Business Owners | Grow Your Business in Nashik, Ghoti & Igatpuri | GaavConnect",
    description: "Get direct phone and WhatsApp customer inquiries with 0% commission. List your shop, hotel, dhaba, clinic, or service in Nashik district on GaavConnect.",
    keywords: ["GaavConnect for businesses", "list business in Nashik", "Igatpuri local business promotion", "Ghoti shop owners"],
  },
  "/promote": {
    title: "Promote Your Business with Sponsored Ads | Top Rank on GaavConnect",
    description: "Feature your business as a #1 Top Sponsored Ad on GaavConnect. Reach thousands of daily tourists, highway commuters, and local customers in Nashik, Ghoti & Igatpuri.",
    keywords: ["Promote business Nashik", "sponsored ads GaavConnect", "Igatpuri highway advertisements", "NH-160 dhaba marketing"],
  },
  "/add-business": {
    title: "List Your Business Free | Reach Customers in Nashik, Ghoti & Igatpuri | GaavConnect",
    description: "Add your shop, restaurant, farmstay, medical store, or service to GaavConnect free. Connect directly with local buyers and travelers in Nashik district.",
    keywords: ["Free business listing Nashik", "add business Igatpuri", "register shop Ghoti", "GaavConnect business registration"],
  },
  "/help": {
    title: "Help Centre & Support | GaavConnect Local Platform Nashik",
    description: "Frequently asked questions and guides on finding local businesses, claiming listings, updating phone numbers, and advertising on GaavConnect.",
    keywords: ["GaavConnect help centre", "business directory FAQs", "Igatpuri local support"],
  },
  "/safety": {
    title: "Trust & Safety Guidelines | Verified Local Listings | GaavConnect",
    description: "Learn how GaavConnect verifies businesses, guards customer trust, and maintains safe, authentic local commerce across Nashik district.",
    keywords: ["GaavConnect trust and safety", "verified businesses Nashik", "safe local discovery"],
  },
  "/privacy": {
    title: "Privacy Policy | GaavConnect",
    description: "Read how GaavConnect handles listing information, contact privacy, and user preferences with transparency.",
    keywords: ["GaavConnect privacy policy", "data protection"],
  },
  "/cookies": {
    title: "Cookie Policy & Preferences | GaavConnect",
    description: "Understand browser storage and cookie preferences on GaavConnect.",
    keywords: ["GaavConnect cookie policy"],
  },
  "/accessibility": {
    title: "Accessibility Commitment | GaavConnect",
    description: "Our commitment to ensuring the GaavConnect local discovery platform is usable and accessible for all community members.",
    keywords: ["GaavConnect accessibility"],
  },
  "/guides": {
    title: "Local Discovery Guides | Best Food, Stays & Places in Nashik & Igatpuri",
    description: "Curated local guides for discovering highway dhabas, scenic camping spots, misal pav houses, and essential services across Nashik district.",
    keywords: ["Nashik local guides", "Igatpuri travel guide", "Ghoti food guide", "Bhavali dam spots", "NH-160 highway tips"],
  },
  "/places": {
    title: "Explore Attractions, Scenic Places & Stays in Nashik & Igatpuri | GaavConnect",
    description: "Discover picturesque viewpoints, historical temples, farmstays, and scenic tourist spots across Igatpuri, Ghoti, Trimbakeshwar, and Nashik district.",
    keywords: ["Places to visit in Igatpuri", "Ghoti attractions", "Nashik tourist spots", "Trimbakeshwar places"],
  },
  "/events": {
    title: "Community Events & Local Happenings in Nashik District | GaavConnect",
    description: "Stay updated with local festivals, village jatra, farmer markets, and cultural events across Ghoti, Igatpuri, and Nashik district.",
    keywords: ["Nashik district events", "Igatpuri community happenings", "Ghoti festivals"],
  },
  "/explore": {
    title: "Explore Local Businesses & Places Across Nashik District | GaavConnect",
    description: "Comprehensive local directory of verified shops, dhabas, resorts, and services across Ghoti, Igatpuri, Nashik City, and rural Maharashtra.",
    keywords: ["Explore Nashik district", "Igatpuri businesses", "Ghoti local directory"],
  },
};

export function getStaticPageMetadata(path) {
  const page = pages[path] || pages["/about"];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const canonicalUrl = `${siteUrl}${path}`;
  const logoUrl = `${siteUrl}/gaavconnect-logo.svg`;

  return {
    title: { absolute: page.title },
    description: page.description,
    keywords: page.keywords || [
      "Nashik district",
      "Ghoti",
      "Igatpuri",
      "local businesses",
      "GaavConnect",
      "Maharashtra",
    ],
    alternates: { canonical: canonicalUrl },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: "GaavConnect",
      title: page.title,
      description: page.description,
      url: canonicalUrl,
      locale: "en_IN",
      images: [{ url: logoUrl, alt: "GaavConnect — Local Discovery in Nashik District" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      site: "@gaavconnect.in",
      creator: "@gaavconnect.in",
      images: [logoUrl],
    },
  };
}
