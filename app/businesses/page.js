import BusinessDirectory from "@/components/business-directory";

export const metadata = {
  title: "Explore Local Businesses in Nashik District",
  description: "Find local shops, restaurants, hotels, healthcare providers and trusted services across Ghoti, Igatpuri and Nashik, Maharashtra with GaavConnect.",
  alternates: { canonical: "/businesses" },
  openGraph: {
    title: "Explore Local Businesses in Nashik District | GaavConnect",
    description: "Search local businesses, shops, restaurants, stays and services across Nashik district.",
    type: "website",
    locale: "en_IN",
  },
};

export default function BusinessesPage() {
  return <BusinessDirectory />;
}
