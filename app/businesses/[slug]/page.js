import PublicDetail from "@/components/public-detail";
import { buildEntityMetadata } from "@/lib/seo/public-metadata";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildEntityMetadata({ type: "business", slug, path: "businesses" });
}

export default async function BusinessPage({ params }) {
  const { slug } = await params;
  return <PublicDetail kind="businesses" slug={slug} />;
}
