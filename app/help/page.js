import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/help");
export default function HelpPage() {
  return (
    <PublicInfoPage
      eyebrow="HELP CENTRE"
      title="A little help for your"
      highlight="local search."
      description="Quick guidance for finding listings, sharing a business and keeping directory information useful."
      breadcrumbs={[{ label: "Help centre" }]}
      sections={[
        {
          title: "How do I find a business?",
          body: "Open the business directory and search by business name or service. You can also browse categories and locations to explore the listings available.",
          link: { href: "/businesses", label: "Browse businesses" },
        },
        {
          title: "How do I promote my business with top ranking?",
          body: "GaavConnect offers Sponsored Ads for highway dhabas, hotels, clinics, and local stores with guaranteed #1 placement and direct call/WhatsApp leads.",
          link: { href: "/promote", label: "Promote your business ↗" },
        },
        {
          title: "How do I add a business?",
          body: "Use the business submission form and provide the requested details. A submission may be reviewed before a public listing is created or published.",
          link: { href: "/add-business", label: "Add a business" },
        },
        {
          title: "Why can’t I find a particular listing?",
          body: "The business may not have been submitted, the listing may use a different name, or it may not currently be published. Try a broader search or browse the relevant category and location.",
        },
        {
          title: "What if information is wrong?",
          body: "Do not rely on potentially outdated information for urgent or important decisions. Confirm details directly with the business or reach out to our team directly.",
          link: { href: "/contact", label: "Contact guidance" },
        },
        {
          title: "Does a listing guarantee quality or ranking?",
          body: "No. A directory listing is not a guarantee of service quality, availability, or verification. Evaluate a business for yourself and confirm important details before engaging.",
        },
      ]}
      cta={{
        eyebrow: "PERSONAL ASSISTANCE",
        title: "Still need help or have questions?",
        description: "Connect directly with founder Om Shinde on WhatsApp or phone call at +91 9373545169.",
        href: "https://wa.me/919373545169",
        label: "💬 WhatsApp Founder (+91 9373545169)",
      }}
    />
  );
}
