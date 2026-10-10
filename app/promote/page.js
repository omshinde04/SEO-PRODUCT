import PromoteBusinessClient from "@/components/promote-business-client";
import StructuredData from "@/components/structured-data";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";

export const generateMetadata = () => getStaticPageMetadata("/promote");

export default function PromotePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gaavconnect.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/promote#page`,
        name: "Promote Your Business with Sponsored Ads | GaavConnect",
        description: "Feature your business as a #1 Top Sponsored Ad on GaavConnect across Nashik District, Ghoti, and Igatpuri.",
        url: `${siteUrl}/promote`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Promote Business", item: `${siteUrl}/promote` },
        ],
      },
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <PromoteBusinessClient />
    </>
  );
}
