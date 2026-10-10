import BusinessSubmissionForm from "@/components/business-submission-form";
import StructuredData from "@/components/structured-data";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";

export const generateMetadata = () => getStaticPageMetadata("/add-business");

export default function AddBusinessPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gaavconnect.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/add-business#page`,
        name: "List Your Business Free | Reach Customers in Nashik, Ghoti & Igatpuri | GaavConnect",
        description: "Add your shop, restaurant, farmstay, medical store, or service to GaavConnect free.",
        url: `${siteUrl}/add-business`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "List Your Business", item: `${siteUrl}/add-business` },
        ],
      },
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <BusinessSubmissionForm />
    </>
  );
}