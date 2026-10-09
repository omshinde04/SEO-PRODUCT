import { redirect } from "next/navigation";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/explore");
export default function ExplorePage(){redirect("/businesses");}
