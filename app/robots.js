import { connectDB } from "@/lib/db";
import { SEOSettings } from "@/models/SEOConfig";

export const dynamic = "force-dynamic";

export default async function robots() {
  let base = (process.env.NEXT_PUBLIC_SITE_URL || "https://gaavconnect.in").replace(/\/$/, "");

  try {
    await connectDB();
    const settings = await SEOSettings.findOne({ key: "global" }).select("siteUrl robotsIndex").lean().exec();
    base = (settings?.siteUrl || base).replace(/\/$/, "");

    if (settings?.robotsIndex === false) {
      return {
        rules: { userAgent: "*", disallow: "/" },
        ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
      };
    }
  } catch (error) {
    console.error("[ROBOTS]", error.message);
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
