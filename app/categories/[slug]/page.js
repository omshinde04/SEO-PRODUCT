import PublicDetail from "@/components/public-detail";
import StructuredData from "@/components/structured-data";
import { buildEntityMetadata, getEntityStructuredData } from "@/lib/seo/public-metadata";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildEntityMetadata({ type: "category", slug, path: "categories" });
}

export default async function PublicEntityPage({ params }) {
  const { slug } = await params;
  const structuredData = await getEntityStructuredData({ type: "category", slug });
  return (
    <>
      <StructuredData data={structuredData} />
      <PublicDetail kind="categories" slug={slug} />
    </>
  );
}
