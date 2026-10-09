import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/session";
import CategoriesClient from "./categories-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
    title: "Categories | Admin Workspace",
    robots: { index: false, follow: false },
};

export default async function CategoriesPage() {
    const user = await getAuthenticatedUser();
    if (!user) redirect("/admin/login");

    return <CategoriesClient />;
}
