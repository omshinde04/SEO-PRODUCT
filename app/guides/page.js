import Link from "next/link";
import { connectDB } from "@/lib/db";
import ContentItem from "@/models/ContentItem";
import Location from "@/models/Location";
import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";

export const dynamic = "force-dynamic";

export const generateMetadata = () => getStaticPageMetadata("/guides");

const foundationalGuides = [
  {
    n: "01",
    title: "How to choose a local service",
    desc: "Questions to ask before you book, visit or hire a service provider.",
    href: "/guides/choosing-a-local-service",
  },
  {
    n: "02",
    title: "What makes a useful business listing?",
    desc: "The details that help people understand what a business offers.",
    href: "/guides/useful-business-listing",
  },
  {
    n: "03",
    title: "A checklist before visiting a business",
    desc: "Simple checks for hours, location, availability and contact details.",
    href: "/guides/before-you-visit",
  },
  {
    n: "04",
    title: "Help your local business get discovered",
    desc: "Practical ways to keep your business information clear and consistent.",
    href: "/guides/business-discovery-basics",
  },
];

async function getPublishedGuides() {
  try {
    await connectDB();
    const items = await ContentItem.find({ kind: "guide", status: "published" })
      .populate("location", "name slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    return items;
  } catch (error) {
    console.error("[GUIDES PAGE] Error fetching content items:", error.message);
    return [];
  }
}

export default async function GuidesPage() {
  const dynamicGuides = await getPublishedGuides();

  return (
    <>
      <PublicInfoPage
        eyebrow="THE GAAVCONNECT FIELD NOTES"
        title="A little local knowledge"
        highlight="goes a long way."
        description="Practical, evergreen guidance and curated editorial trail guides for discovering local businesses, heritage spots and countryside stops across Ghoti, Igatpuri and Nashik District."
        breadcrumbs={[{ label: "Local guides" }]}
        sections={[
          {
            title: "Curated local guides & editorial trail notes",
            body: "Explore recommendations written by local community editors. Find the best food trails, highway pitstops, weekend itineraries, and seasonal highlights in Nashik District.",
          },
          {
            title: "Practical answers, not keyword stuffing",
            body: "These guides are designed to answer real questions for travelers, locals, and business owners. Each guide is continuously updated from the admin workspace.",
          },
        ]}
        cta={{
          title: "Ready to explore verified businesses?",
          description: "Move from guides to verified listings, categories, and town centers in the directory.",
          href: "/businesses",
          label: "Explore all businesses",
        }}
      />

      {dynamicGuides.length > 0 && (
        <section className="guide-index" style={{ paddingTop: "0" }}>
          <div className="guide-index-heading">
            <span className="info-eyebrow">EDITORIAL TRAIL GUIDES</span>
            <h2>
              Featured guides. <em>Curated by local editors.</em>
            </h2>
          </div>
          <div className="guide-index-grid" style={{ marginBottom: "40px" }}>
            {dynamicGuides.map((guide, idx) => (
              <article className="guide-index-card" key={guide._id.toString()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#2f5233" }}>
                    GUIDE #{String(idx + 1).padStart(2, "0")}
                  </span>
                  {guide.location?.name && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      ⌖ {guide.location.name}
                    </span>
                  )}
                </div>
                <h3 style={{ marginTop: "12px" }}>{guide.title}</h3>
                <p>{guide.summary || "Explore local advice and recommendations from GaavConnect editors."}</p>
                <div style={{ marginTop: "14px" }}>
                  <Link href={`/guides/${guide.slug}`}>
                    Read guide <b aria-hidden="true">↗</b>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="guide-index">
        <div className="guide-index-heading">
          <span className="info-eyebrow">FIELD NOTES & BASICS</span>
          <h2>
            Small guides. <em>Useful next steps.</em>
          </h2>
        </div>
        <div className="guide-index-grid">
          {foundationalGuides.map((g) => (
            <article className="guide-index-card" key={g.n}>
              <span>{g.n}</span>
              <h3>{g.title}</h3>
              <p>{g.desc}</p>
              <Link href={g.href}>
                Read guide <b aria-hidden="true">↗</b>
              </Link>
            </article>
          ))}
        </div>
        <p className="guide-index-note">
          Each guide contains practical steps you can use now. We will continue reviewing and publishing new resources
          as the local directory grows.
        </p>
      </section>
    </>
  );
}
