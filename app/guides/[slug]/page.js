import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import ContentItem from "@/models/ContentItem";
import PublicInfoPage from "@/components/public-info-page";

export const dynamic = "force-dynamic";

const staticGuides = {
  "choosing-a-local-service": {
    title: "How to choose a local service",
    description: "A practical checklist for comparing local service providers and asking the right questions before you book.",
    sections: [
      { title: "Be clear about the job", body: "Describe what you need, where the work is required and any important constraints. Clear expectations make it easier to compare responses." },
      { title: "Ask about scope and cost", body: "Before agreeing to work, ask what is included, what may cost extra, how changes are handled and when payment is due. Get important terms in writing where appropriate." },
      { title: "Check relevant experience", body: "For specialist or regulated work, ask about relevant experience, licences, qualifications or insurance where applicable. Verify credentials with the appropriate source when the stakes are high." },
      { title: "Confirm availability and contact details", body: "Confirm timing, address, service area and the best contact method directly. Directory details may not reflect last-minute changes." },
      { title: "Make a considered decision", body: "Compare the information you receive, ask follow-up questions and avoid pressure to pay before you understand the service and terms." },
    ],
  },
  "useful-business-listing": {
    title: "What makes a useful business listing?",
    description: "A checklist of the business details that help people understand an offering and take the next step.",
    sections: [
      { title: "Use the real business name", body: "Choose the name customers recognise. Avoid adding repeated location or service keywords that make the name confusing." },
      { title: "Choose the closest category", body: "A relevant category helps people understand what the business does and helps directory navigation stay useful." },
      { title: "Write for customers first", body: "Explain the main products or services, who they are for and what makes the offering clear. Specific, honest information is more useful than generic superlatives." },
      { title: "Keep location and contact details current", body: "Check address, service area, phone, website and other contact details before submitting. Only share contact details intended for public business use." },
      { title: "Use genuine images and update changes", body: "Use images you own or have permission to publish. Update important changes such as a move, new services or changed contact details." },
    ],
  },
  "before-you-visit": {
    title: "A checklist before visiting a business",
    description: "Simple checks that can save a wasted trip and help you arrive prepared.",
    sections: [
      { title: "Confirm opening hours", body: "Hours may change for holidays, staffing or special events. Contact the business if your visit depends on a particular time." },
      { title: "Check the location", body: "Confirm the address, entrance, landmark or service area. Use a map service for directions and allow for local travel conditions." },
      { title: "Ask about availability", body: "For appointments, products, tables or specialist services, check availability before travelling." },
      { title: "Understand prices and requirements", body: "Ask about current pricing, documents to bring, accepted payment methods and any booking or cancellation terms that matter to you." },
      { title: "Keep sensitive information private", body: "Share only information necessary for the service. Never disclose passwords, one-time codes or banking credentials to prove your identity." },
    ],
  },
  "business-discovery-basics": {
    title: "Help your local business get discovered",
    description: "Practical ways to keep your business information clear, consistent and useful to customers online.",
    sections: [
      { title: "Keep the basics consistent", body: "Use the same real business name, address and public contact details across the places where customers find you. Correct inconsistencies when details change." },
      { title: "Explain your service in plain language", body: "Write a concise description of what you offer, the area you serve and the customers you help. Avoid stuffing the same search terms into every sentence." },
      { title: "Choose useful categories", body: "Select the category that most accurately describes the business. Add details that distinguish your service rather than choosing unrelated categories for reach." },
      { title: "Maintain trust", body: "Use genuine photos, answer customer enquiries professionally and update outdated information. Do not publish fake reviews or claims you cannot substantiate." },
      { title: "Treat SEO as a long-term practice", body: "A complete listing can help people understand your business, but no single listing guarantees rankings, leads or sales. Keep improving the real customer experience." },
    ],
  },
};

function parseBodyToSections(body = "") {
  if (!body) return [];
  const parts = body.split(/^##\s+/m).filter(Boolean);
  if (!parts.length) {
    return [{ title: "Overview", body }];
  }
  return parts.map((part) => {
    const lines = part.split("\n");
    const title = lines[0].replace(/^#+\s*/, "").trim();
    const sectionBody = lines.slice(1).join("\n").trim();
    return { title: title || "Overview", body: sectionBody || title };
  });
}

async function getGuide(slug) {
  try {
    await connectDB();
    const item = await ContentItem.findOne({ slug, kind: "guide", status: "published" })
      .populate("location", "name slug")
      .lean();
    if (item) {
      return {
        title: item.title,
        description: item.summary || item.title,
        location: item.location?.name || null,
        coverImage: item.coverImage?.url ? item.coverImage : null,
        sections: parseBodyToSections(item.body),
      };
    }
  } catch (error) {
    console.error("[GUIDE DETAIL] Error loading guide:", error.message);
  }

  if (staticGuides[slug]) return staticGuides[slug];
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "Guide not found | GaavConnect", robots: { index: false, follow: true } };
  const title = `${guide.title} | GaavConnect Guides`;
  return {
    title: { absolute: title },
    description: guide.description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      type: "article",
      siteName: "GaavConnect",
      title,
      description: guide.description,
      url: `/guides/${slug}`,
      locale: "en_IN",
      ...(guide.coverImage?.url ? { images: [{ url: guide.coverImage.url, alt: guide.title }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description: guide.description },
  };
}

export default async function GuideDetailPage({ params }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();
  return (
    <PublicInfoPage
      eyebrow={guide.location ? `FIELD GUIDE · ${guide.location.toUpperCase()}` : "GAAVCONNECT FIELD NOTES"}
      title={guide.title}
      description={guide.description}
      heroImage={guide.coverImage}
      breadcrumbs={[{ label: "Local guides", href: "/guides" }, { label: guide.title }]}
      sections={guide.sections}
      cta={{
        title: "Turn useful information into a local discovery.",
        description: "Browse the businesses, categories and locations currently available in the directory.",
        href: "/businesses",
        label: "Explore businesses",
      }}
    />
  );
}
