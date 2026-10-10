import Link from "next/link";
import PublicNavbar from "@/components/public-navbar";
import PublicFooter from "@/components/public-footer";

export default function PublicInfoPage({ eyebrow = "GAAVCONNECT", title, highlight, description, heroImage, sections = [], cta, breadcrumbs = [] }) {
  return (
    <main className="info-page">
      <div className="info-topline"><span className="info-dot" /> EVERY BUSINESS. EVERY LOCATION. CONNECTED.</div>
      <PublicNavbar />
      <div className="info-breadcrumb"><Link href="/">Home</Link>{breadcrumbs.map((item) => <span key={item.label}> / {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</span>)}</div>
      <section className="info-hero">
        <div className="info-hero-copy"><span className="info-eyebrow">{eyebrow}</span><h1>{title} {highlight && <em>{highlight}</em>}</h1><p>{description}</p></div>
        {heroImage?.url ? (
          <div className="info-hero-image-wrap" style={{ position: "relative", borderRadius: "20px", overflow: "hidden", minHeight: "220px", maxHeight: "340px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <img src={heroImage.url} alt={heroImage.alt || title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div className="info-hero-art" aria-hidden="true"><div className="info-art-sun" /><div className="info-art-hill info-art-hill-a" /><div className="info-art-hill info-art-hill-b" /><div className="info-art-road" /><span className="info-art-stamp">MADE FOR<br />LOCAL LIFE</span><span className="info-art-leaf">✳</span></div>
        )}
      </section>
      <div className="info-content">
        {sections.map((section, index) => (
          <section className="info-section" key={section.title}>
            <div className="info-section-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="info-section-copy"><h2>{section.title}</h2>{section.body && <p>{section.body}</p>}{section.points?.length > 0 && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}{section.link && <Link className="info-inline-link" href={section.link.href}>{section.link.label} <span aria-hidden="true">↗</span></Link>}</div>
          </section>
        ))}
        {cta && <section className="info-cta"><div><span className="info-eyebrow">{cta.eyebrow || "TAKE THE NEXT STEP"}</span><h2>{cta.title}</h2><p>{cta.description}</p></div><Link href={cta.href} className="info-cta-button">{cta.label} <span aria-hidden="true">↗</span></Link></section>}
      </div>
      <PublicFooter />
    </main>
  );
}
