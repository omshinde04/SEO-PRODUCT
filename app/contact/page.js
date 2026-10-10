import PublicInfoPage from "@/components/public-info-page";
import StructuredData from "@/components/structured-data";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";

export const generateMetadata = () => getStaticPageMetadata("/contact");

export default function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://gaavconnect.in/contact#page",
        name: "Contact GaavConnect — Founder Helpline & Support",
        description:
          "Contact GaavConnect founder Om Vilas Shinde directly for business listings, advertising, and support in Nashik, Ghoti, and Igatpuri. Call/WA: +91 9373545169.",
        url: "https://gaavconnect.in/contact",
        mainEntity: {
          "@type": "Organization",
          name: "GaavConnect",
          url: "https://gaavconnect.in",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+919373545169",
            contactType: "customer service",
            areaServed: "IN",
            availableLanguage: ["en", "mr", "hi"],
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://gaavconnect.in" },
          { "@type": "ListItem", position: 2, name: "Contact", item: "https://gaavconnect.in/contact" },
        ],
      },
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <PublicInfoPage
        eyebrow="FOUNDER & SUPPORT HELPLINE"
        title="Connect with us"
        highlight="directly."
        description="Whether you are a local business owner looking to get listed, promote your store, or need help navigating GaavConnect, we are always within reach via call, WhatsApp, or Instagram."
        breadcrumbs={[{ label: "Contact" }]}
        sections={[
          {
            title: "Founder Direct Assistance (Call & WhatsApp)",
            body: "For advertising, business verification, partnerships, or immediate support, you can connect directly with GaavConnect founder Om Vilas Shinde. We are dedicated to empowering local businesses across Nashik, Ghoti, Igatpuri, and rural Maharashtra.",
            points: [
              "Direct Phone: +91 9373545169 (Call anytime during business hours)",
              "WhatsApp Helpline: +91 9373545169 (Instant messages & updates)",
              "Fast priority response for local shops, dhabas, resorts & services",
            ],
            link: { href: "https://wa.me/919373545169", label: "💬 Chat on WhatsApp (+91 9373545169)" },
          },
          {
            title: "Follow Us on Instagram @gaavconnect.in",
            body: "Check out our official Instagram account for featured businesses, local discovery reels, and tourist updates across Nashik and Igatpuri.",
            link: {
              href: "https://instagram.com/gaavconnect.in?vrfl=eHM3azVteWFoNml3",
              label: "📸 Follow @gaavconnect.in on Instagram ↗",
            },
          },
          {
            title: "Promote Your Business with Sponsored Ads",
            body: "Looking to appear #1 on top of category searches and get guaranteed customer leads? Explore our flexible 7-day, 14-day, and 30-day sponsored promotion packages.",
            link: { href: "/promote", label: "Explore Sponsored Ad plans ↗" },
          },
          {
            title: "Want to add a business listing for free?",
            body: "The business submission form is the right place to share a new listing for review. Include accurate contact info so local customers can call or WhatsApp you directly.",
            link: { href: "/add-business", label: "Submit business details" },
          },
          {
            title: "Need help using GaavConnect?",
            body: "For general guidance on searching, browsing categories, or finding places in Nashik district, start with the help centre.",
            link: { href: "/help", label: "Visit the help centre" },
          },
          {
            title: "Report a safety or accuracy concern",
            body: "When contacting the team about a listing, provide its name and public page URL plus a concise description of the issue. We review all community reports promptly.",
            link: { href: "/safety", label: "Read trust and safety guidance" },
          },
        ]}
        cta={{
          eyebrow: "FOUNDER DIRECT HOTLINE",
          title: "Speak directly with founder Om Vilas Shinde",
          description: "Call or WhatsApp +91 9373545169 today to discuss listing, promotion, or support.",
          href: "tel:+919373545169",
          label: "📞 Call +91 9373545169",
        }}
      />
    </>
  );
}
