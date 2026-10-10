import Link from "next/link";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

export const metadata = {
  title: "Page Not Found | GaavConnect",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 text-2xl font-bold mb-6 shadow-sm">
            404
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Sorry, the page you are looking for doesn’t exist or has been moved to a new address.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
            >
              Return to homepage
            </Link>
            <Link
              href="/businesses"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Browse businesses
            </Link>
          </div>
          <div className="mt-10 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500">
              Looking for something specific? Explore our{" "}
              <Link href="/categories" className="text-blue-600 hover:underline">
                categories
              </Link>{" "}
              or{" "}
              <Link href="/locations" className="text-blue-600 hover:underline">
                locations
              </Link>.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
