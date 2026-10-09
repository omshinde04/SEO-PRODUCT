import PublicDetail from "@/components/public-detail";
import { buildEntityMetadata } from "@/lib/seo/public-metadata";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildEntityMetadata({ type: "location", slug, path: "locations" });
}

export default async function LocationPage({ params }) {
  const { slug } = await params;
  return <PublicDetail kind="locations" slug={slug} />;
}
