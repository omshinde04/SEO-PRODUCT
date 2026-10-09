import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import SubmissionsClient from "./submissions-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
    title: "Business Submissions | SEO-PRODUCT",
    robots: { index: false, follow: false },
};

export default async function SubmissionsPage() {
    const user = await getAuthenticatedUser();
    if (!user) redirect("/admin/login");
    return <SubmissionsClient user={{ name: user.name || "Administrator", email: user.email || "" }} />;
}
