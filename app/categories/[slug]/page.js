import PublicDetail from "@/components/public-detail";
import { buildEntityMetadata } from "@/lib/seo/public-metadata";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildEntityMetadata({ type: "category", slug, path: "categories" });
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  return <PublicDetail kind="categories" slug={slug} />;
}
