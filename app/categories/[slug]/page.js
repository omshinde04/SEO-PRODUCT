import PublicDetail from "@/components/public-detail";
import StructuredData from "@/components/structured-data";
import { buildEntityMetadata, getEntityStructuredData } from "@/lib/seo/public-metadata";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Business from "@/models/Business";
import Location from "@/models/Location";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildEntityMetadata({ type: "category", slug, path: "categories" });
}

export default async function PublicEntityPage({ params }) {
  const { slug } = await params;
  const structuredData = await getEntityStructuredData({ type: "category", slug });

  let initialData = null;
  try {
    await connectDB();
    const item = await Category.findOne({ slug, status: "active" })
      .select("name slug description icon parent sortOrder seo createdAt updatedAt")
      .lean()
      .exec();

    if (item) {
      let parent = null;
      if (item.parent) {
        parent = await Category.findOne({ _id: item.parent, status: "active" })
          .select("name slug description icon parent seo")
          .lean()
          .exec();
      }

      const [activeLocationIds, children, totalChildren] = await Promise.all([
        Location.find({ status: "active" }).distinct("_id").exec(),
        Category.find({ parent: item._id, status: "active" })
          .select("name slug description icon parent sortOrder seo")
          .sort({ sortOrder: 1, name: 1 })
          .limit(50)
          .lean()
          .exec(),
        Category.countDocuments({ parent: item._id, status: "active" }),
      ]);

      const businessFilter = {
        category: item._id,
        status: "published",
        "seo.noIndex": { $ne: true },
        location: { $in: activeLocationIds },
      };

      const [businesses, totalBusinesses] = await Promise.all([
        Business.find(businessFilter)
          .select("-internalNotes -createdBy -updatedBy")
          .populate({
            path: "category",
            select: "name slug description icon",
            match: { status: "active" },
          })
          .populate({
            path: "location",
            select: "name slug type address coverImage",
            match: { status: "active" },
          })
          .sort({ isSponsored: -1, sponsoredPriority: -1, isFeatured: -1, publishedAt: -1, name: 1 })
          .limit(12)
          .lean()
          .exec(),
        Business.countDocuments(businessFilter),
      ]);

      const now = new Date();
      const visibleBusinesses = businesses
        .filter((b) => b.category && b.location)
        .map((b) => {
          if (b.isSponsored && b.sponsoredUntil && new Date(b.sponsoredUntil) < now) {
            return { ...b, isSponsored: false };
          }
          return b;
        });

      initialData = JSON.parse(
        JSON.stringify({
          success: true,
          item,
          parent,
          children,
          childrenPagination: {
            page: 1,
            limit: 50,
            total: totalChildren,
            totalPages: Math.ceil(totalChildren / 50),
          },
          businesses: visibleBusinesses,
          businessPagination: {
            page: 1,
            limit: 12,
            total: totalBusinesses,
            totalPages: Math.ceil(totalBusinesses / 12),
          },
        })
      );
    }
  } catch (err) {
    console.error("[CATEGORY SSR FETCH]", err.message);
  }

  return (
    <>
      <StructuredData data={structuredData} />
      <PublicDetail kind="categories" slug={slug} initialData={initialData} />
    </>
  );
}

