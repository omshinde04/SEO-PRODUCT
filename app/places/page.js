import Link from "next/link";
import { connectDB } from "@/lib/db";
import ContentItem from "@/models/ContentItem";
import Location from "@/models/Location";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

import { getStaticPageMetadata } from "@/lib/seo/static-pages";

export const dynamic = "force-dynamic";

export const generateMetadata = () => getStaticPageMetadata("/places");

async function getPublishedPlaces() {
  try {
    await connectDB();
    return await ContentItem.find({ kind: "place", status: "published" })
      .populate("location", "name slug")
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    console.error("[PLACES PAGE] Error fetching places:", error.message);
    return [];
  }
}

export default async function PlacesPage() {
  const places = await getPublishedPlaces();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Places & Attractions</span>
        </nav>

        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/30">
              ⌖ Landmark & Heritage Registry
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Places worth visiting in <span className="text-emerald-400">Nashik District</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore mountain lookouts, historical forts, scenic waterfalls, dams and sacred sites across Ghoti, Igatpuri and the Western Ghats.
            </p>
          </div>
        </section>

        {/* Places Grid */}
        {places.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {places.map((place) => (
              <article
                key={place._id.toString()}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex flex-col overflow-hidden group"
              >
                {/* Media Image or Fallback Header */}
                <div className="h-48 bg-slate-800 relative overflow-hidden">
                  {place.coverImage?.url ? (
                    <img
                      src={place.coverImage.url}
                      alt={place.coverImage.alt || place.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-emerald-950 flex items-center justify-center text-4xl">
                      🏞️
                    </div>
                  )}
                  {place.location?.name && (
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      ⌖ {place.location.name}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      <Link href={`/places/${place.slug}`}>{place.title}</Link>
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {place.summary || "Scenic attraction and notable regional point of interest in Nashik District."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Scenic Point
                    </span>
                    <Link
                      href={`/places/${place.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition"
                    >
                      Explore place ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
            <span className="text-4xl mb-4 block">🏞️</span>
            <h3 className="text-lg font-bold text-slate-900">Curating regional landmarks</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              New nature trails, forts, and scenic viewpoints are added regularly through the admin panel.
            </p>
            <div className="mt-6">
              <Link
                href="/businesses"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Browse local businesses
              </Link>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
