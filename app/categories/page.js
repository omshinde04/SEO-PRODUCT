import Link from "next/link";

export const metadata = {
  title: "Browse Local Business Categories in Nashik",
  description: "Explore local business categories on GaavConnect, from food and shopping to healthcare, professional services, stays and tourism in Nashik district.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <main className="directory-page">
      <header className="directory-header"><Link href="/">← GaavConnect</Link><Link href="/businesses">Explore businesses ↗</Link></header>
      <section className="detail-state">
        <span className="eyebrow">DISCOVER BY CATEGORY</span>
        <h1>Find the right local service</h1>
        <p>Browse businesses and services by category across Ghoti, Igatpuri and Nashik.</p>
        <Link className="detail-primary" href="/businesses">Browse all businesses ↗</Link>
      </section>
    </main>
  );
}
