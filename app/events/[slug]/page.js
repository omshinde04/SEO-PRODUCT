import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import ContentItem from "@/models/ContentItem";
import Business from "@/models/Business";
import Location from "@/models/Location";
import PublicNavbar from "@/components/public-navbar";

export const dynamic = "force-dynamic";

function formatFullDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getEvent(slug) {
  try {
    await connectDB();
    const eventItem = await ContentItem.findOne({ slug, kind: "event", status: "published" })
      .populate("location", "name slug type")
      .lean();
    if (!eventItem) return null;

    let nearbyBusinesses = [];
    if (eventItem.location?._id) {
      nearbyBusinesses = await Business.find({
        status: "published",
        location: eventItem.location._id,
      })
        .select("name slug tagline category contact")
        .populate("category", "name slug")
        .limit(3)
        .lean();
    }

    return { eventItem, nearbyBusinesses };
  } catch (error) {
    console.error("[EVENT DETAIL] Error loading event:", error.message);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getEvent(slug);
  if (!data?.eventItem) {
    return { title: "Event Not Found | GaavConnect", robots: { index: false, follow: true } };
  }
  const { eventItem } = data;
  const title = `${eventItem.seo?.title || eventItem.title} | GaavConnect Events`;
  const description = eventItem.seo?.description || eventItem.summary || `Join ${eventItem.title} in Nashik District.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/events/${slug}`,
      ...(eventItem.coverImage?.url ? { images: [{ url: eventItem.coverImage.url, alt: eventItem.title }] } : {}),
    },
  };
}

export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const data = await getEvent(slug);
  if (!data?.eventItem) notFound();

  const { eventItem, nearbyBusinesses } = data;
  const startFormatted = formatFullDate(eventItem.event?.startsAt);
  const endFormatted = formatFullDate(eventItem.event?.endsAt);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <Link href="/events" className="hover:text-slate-900 transition">Events</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{eventItem.title}</span>
        </nav>

        {/* Event Header Card */}
        <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          {eventItem.coverImage?.url ? (
            <div className="h-72 sm:h-96 w-full bg-slate-900 relative">
              <img
                src={eventItem.coverImage.url}
                alt={eventItem.coverImage.alt || eventItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              {eventItem.location?.name && (
                <span className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                  ⌖ {eventItem.location.name}
                </span>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-900 to-slate-900 p-8 sm:p-12 text-white">
              {eventItem.location?.name && (
                <span className="inline-block bg-white/20 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-white/10">
                  ⌖ {eventItem.location.name}
                </span>
              )}
            </div>
          )}

          <div className="p-6 sm:p-10">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {eventItem.title}
            </h1>

            {/* Event Key Details Box */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {startFormatted && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Starts At
                  </span>
                  <span className="font-semibold text-slate-800">{startFormatted}</span>
                </div>
              )}
              {endFormatted && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ends At
                  </span>
                  <span className="font-semibold text-slate-800">{endFormatted}</span>
                </div>
              )}
              {eventItem.event?.venue && (
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Location & Venue
                  </span>
                  <span className="font-semibold text-slate-800">{eventItem.event.venue}</span>
                </div>
              )}
            </div>

            {eventItem.event?.registrationUrl && (
              <div className="mt-6">
                <a
                  href={eventItem.event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-800 transition"
                >
                  Register / Learn more ↗
                </a>
              </div>
            )}

            {eventItem.summary && (
              <p className="mt-8 text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                {eventItem.summary}
              </p>
            )}

            {eventItem.body && (
              <div className="mt-8 pt-8 border-t border-slate-100 prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {eventItem.body}
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
                  Nearby businesses in {eventItem.location?.name || "this area"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Food, accommodation, and essential services near this event.
                </p>
              </div>
              <Link
                href={`/businesses?location=${eventItem.location?.slug || ""}`}
                className="text-xs font-bold text-amber-800 hover:underline"
              >
                View all in {eventItem.location?.name} ↗
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {nearbyBusinesses.map((biz) => (
                <article
                  key={biz._id.toString()}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
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
                      className="text-xs font-bold text-amber-800 hover:underline"
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

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} GaavConnect · Discover Local Businesses & Events
      </footer>
    </div>
  );
}
