import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import PromotionsAdminClient from "./promotions-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
    title: "Promotions & Sponsored Ads | GaavConnect Admin",
    robots: { index: false, follow: false },
};

export default async function PromotionsAdminPage() {
    const user = await getAuthenticatedUser();
    if (!user) redirect("/admin/login");

    return <PromotionsAdminClient user={{ name: user.name || "Administrator", email: user.email || "" }} />;
}
