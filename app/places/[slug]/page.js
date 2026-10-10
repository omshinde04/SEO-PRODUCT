import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import ContentItem from "@/models/ContentItem";
import Business from "@/models/Business";
import Location from "@/models/Location";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";
import StructuredData from "@/components/structured-data";
import { buildEntityMetadata, getEntityStructuredData } from "@/lib/seo/public-metadata";

export const dynamic = "force-dynamic";

async function getPlace(slug) {
  try {
    await connectDB();
    const place = await ContentItem.findOne({ slug, kind: "place", status: "published" })
      .populate("location", "name slug type")
      .lean();
    if (!place) return null;

    // Find businesses nearby in the same location
    let nearbyBusinesses = [];
    if (place.location?._id) {
      nearbyBusinesses = await Business.find({
        status: "published",
        location: place.location._id,
      })
        .select("name slug tagline category contact coverImage")
        .populate("category", "name slug")
        .limit(3)
        .lean();
    }

    return { place, nearbyBusinesses };
  } catch (error) {
    console.error("[PLACE DETAIL] Error loading place:", error.message);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildEntityMetadata({ type: "place", slug, path: "places" });
}

export default async function PlaceDetailPage({ params }) {
  const { slug } = await params;
  const data = await getPlace(slug);
  if (!data?.place) notFound();

  const { place, nearbyBusinesses } = data;
  const structuredData = await getEntityStructuredData({ type: "place", slug });

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <PublicNavbar />

        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <Link href="/places" className="hover:text-slate-900 transition">Places</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{place.title}</span>
        </nav>

        {/* Place Header & Visual */}
        <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          {place.coverImage?.url ? (
            <div className="h-72 sm:h-96 w-full bg-slate-900 relative">
              <img
                src={place.coverImage.url}
                alt={place.coverImage.alt || place.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              {place.location?.name && (
                <span className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                  ⌖ {place.location.name}
                </span>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-8 sm:p-12 text-white">
              {place.location?.name && (
                <span className="inline-block bg-white/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-white/10">
                  ⌖ {place.location.name}
                </span>
              )}
            </div>
          )}

          <div className="p-6 sm:p-10">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {place.title}
            </h1>

            {place.summary && (
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                {place.summary}
              </p>
            )}

            {place.body && (
              <div className="mt-8 pt-8 border-t border-slate-100 prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {place.body}
              </div>
            )}
          </div>
        </article>

        {/* Nearby Verified Businesses Section */}
        {nearbyBusinesses.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Nearby services & stays in {place.location?.name || "this area"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verified local businesses ready to serve travelers and visitors.
                </p>
              </div>
              <Link
                href={`/businesses?location=${place.location?.slug || ""}`}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                View all in {place.location?.name} ↗
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {nearbyBusinesses.map((biz) => (
                <article
                  key={biz._id.toString()}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                      {biz.category?.name || "Local Business"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      <Link href={`/businesses/${biz.slug}`}>{biz.name}</Link>
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {biz.tagline || "Verified local service"}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {biz.contact?.phone ? (
                      <span className="text-[11px] font-medium text-slate-600">
                        📞 {biz.contact.phone}
                      </span>
                    ) : <span />}
                    <Link
                      href={`/businesses/${biz.slug}`}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Details ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
    </>
  );
}
