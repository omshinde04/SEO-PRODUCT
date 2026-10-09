import Link from "next/link";

export const metadata = {
  title: "Explore Local Areas in Nashik District",
  description: "Discover businesses and useful services around Ghoti, Igatpuri, Nashik and nearby communities in Maharashtra with GaavConnect.",
  alternates: { canonical: "/locations" },
};

export default function LocationsPage() {
  return (
    <main className="directory-page">
      <header className="directory-header"><Link href="/">← GaavConnect</Link><Link href="/businesses">Explore businesses ↗</Link></header>
      <section className="detail-state">
        <span className="eyebrow">DISCOVER NEAR YOU</span>
        <h1>Explore your neighbourhood</h1>
        <p>Find local businesses and services across Ghoti, Igatpuri, Nashik and surrounding villages.</p>
        <Link className="detail-primary" href="/businesses">Browse all businesses ↗</Link>
      </section>
    </main>
  );
}
