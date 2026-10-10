import Link from "next/link";
import { connectDB } from "@/lib/db";
import ContentItem from "@/models/ContentItem";
import Location from "@/models/Location";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Local Guides & Field Notes</span>
        </nav>

        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-teal-500/30">
              📖 Field Notes & Trail Guides
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Curated local guides for <span className="text-teal-400">Nashik District</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore recommendations written by local community editors. Find the best food trails, highway pitstops, weekend itineraries, and seasonal highlights in Ghoti, Igatpuri and the Western Ghats.
            </p>
          </div>
        </section>

        {/* Dynamic Guides Grid */}
        {dynamicGuides.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Featured editorial trail guides
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Continuously updated insider tips and itineraries from local editors.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {dynamicGuides.map((guide) => (
                <article
                  key={guide._id.toString()}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-300 transition flex flex-col overflow-hidden group"
                >
                  {/* Media Header */}
                  <div className="h-48 bg-slate-800 relative overflow-hidden">
                    {guide.coverImage?.url ? (
                      <img
                        src={guide.coverImage.url}
                        alt={guide.coverImage.alt || guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-teal-950 flex items-center justify-center text-4xl">
                        📖
                      </div>
                    )}
                    {guide.location?.name && (
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        ⌖ {guide.location.name}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition">
                        <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {guide.summary || "Practical local advice and editorial recommendations from GaavConnect editors."}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Editorial Guide
                      </span>
                      <Link
                        href={`/guides/${guide.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800 transition"
                      >
                        Read guide ↗
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Foundational Basics Grid */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Essential consumer advice & basics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              General checklists for choosing local services, verifying businesses, and visiting safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {foundationalGuides.map((g) => (
              <article
                key={g.n}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    GUIDE #{g.n}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">
                    <Link href={g.href}>{g.title}</Link>
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    {g.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={g.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                  >
                    Read guide ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
