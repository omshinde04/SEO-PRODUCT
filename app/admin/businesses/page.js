
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import BusinessesClient from "./businesses-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
    title: "Business Management | SEO-PRODUCT",
    robots: { index: false, follow: false },
};

export default async function BusinessesPage() {
    const user = await getAuthenticatedUser();

    if (!user) redirect("/admin/login");

    return (
        <BusinessesClient
            user={{
                name: user.name || "Administrator",
                email: user.email || "",
            }}
        />
    );
}
