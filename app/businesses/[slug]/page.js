import PublicDetail from "@/components/public-detail";
import StructuredData from "@/components/structured-data";
import { buildEntityMetadata, getEntityStructuredData } from "@/lib/seo/public-metadata";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildEntityMetadata({ type: "business", slug, path: "businesses" });
}

export default async function PublicEntityPage({ params }) {
  const { slug } = await params;
  
  let initialItem = null;
  try {
    await connectDB();
    const item = await Business.findOne({ slug, status: "published" })
      .select("-internalNotes -createdBy -updatedBy")
      .populate({
        path: "category",
        select: "name slug description icon seo",
        match: { status: "active" },
      })
      .populate({
        path: "location",
        select: "name slug type address coordinates description coverImage seo",
        match: { status: "active" },
      })
      .lean()
      .exec();

    if (item && item.category && item.location) {
      initialItem = JSON.parse(JSON.stringify(item));
    }
  } catch (error) {
    console.error("[PUBLIC BUSINESS SSR] Could not load initial item for slug:", slug, error.message);
  }

  const structuredData = await getEntityStructuredData({ type: "business", slug });

  return (
    <>
      <StructuredData data={structuredData} />
      <PublicDetail kind="businesses" slug={slug} initialItem={initialItem} />
    </>
  );
}
