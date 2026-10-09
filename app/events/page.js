import Link from "next/link";
import { connectDB } from "@/lib/db";
import ContentItem from "@/models/ContentItem";
import Location from "@/models/Location";
import PublicNavbar from "@/components/public-navbar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Local Events & Festivals in Nashik District | GaavConnect",
  description:
    "Explore upcoming village fairs, weekly farmer markets, cultural festivals and weekend treks across Ghoti, Igatpuri and Nashik.",
  alternates: { canonical: "/events" },
};

function formatEventDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    full: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
  };
}

async function getPublishedEvents() {
  try {
    await connectDB();
    return await ContentItem.find({ kind: "event", status: "published" })
      .populate("location", "name slug")
      .sort({ "event.startsAt": 1, createdAt: -1 })
      .lean();
  } catch (error) {
    console.error("[EVENTS PAGE] Error fetching events:", error.message);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Local Events</span>
        </nav>

        {/* Hero Banner */}
        <section className="bg-gradient-to-br from-amber-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-500/30">
              📅 Community Calendar
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Community Events & Fairs in <span className="text-amber-400">Nashik District</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Find upcoming weekly farmers’ markets, seasonal celebrations, monsoon treks, and cultural gatherings across Ghoti, Igatpuri, and neighboring villages.
            </p>
          </div>
        </section>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {events.map((item) => {
              const startObj = formatEventDate(item.event?.startsAt);
              return (
                <article
                  key={item._id.toString()}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition flex flex-col overflow-hidden group"
                >
                  {/* Media Header */}
                  <div className="h-48 bg-slate-800 relative overflow-hidden">
                    {item.coverImage?.url ? (
                      <img
                        src={item.coverImage.url}
                        alt={item.coverImage.alt || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-amber-950 flex items-center justify-center text-4xl">
                        🎪
                      </div>
                    )}
                    {startObj && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 text-center shadow-md border border-slate-200">
                        <span className="block text-[10px] font-bold text-amber-700 uppercase leading-none">
                          {startObj.month}
                        </span>
                        <span className="block text-lg font-black text-slate-900 leading-tight">
                          {startObj.day}
                        </span>
                      </div>
                    )}
                    {item.location?.name && (
                      <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                        ⌖ {item.location.name}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition">
                        <Link href={`/events/${item.slug}`}>{item.title}</Link>
                      </h2>

                      {item.event?.venue && (
                        <p className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-1">
                          📍 {item.event.venue}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {item.summary || "Community gathering and local event in Nashik District."}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        {startObj ? `${startObj.full} · ${startObj.time}` : "Date TBA"}
                      </span>
                      <Link
                        href={`/events/${item.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 hover:text-amber-800 transition"
                      >
                        Event details ↗
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
            <span className="text-4xl mb-4 block">🎪</span>
            <h3 className="text-lg font-bold text-slate-900">No events scheduled right now</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Check back soon for upcoming village bazaars, cultural celebrations and gatherings.
            </p>
            <div className="mt-6">
              <Link
                href="/businesses"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Explore local businesses
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} GaavConnect · Discover Local Businesses & Events
      </footer>
    </div>
  );
}
