import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import AnalyticsClient from "./analytics-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
    title: "Website Analytics & Insights | Admin Workspace",
    description: "Monitor authentic website traffic, business discovery metrics, and visitor trends.",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function AdminAnalyticsPage() {
    const user = await getAuthenticatedUser();

    if (!user) {
        redirect("/admin/login");
    }

    return (
        <AnalyticsClient
            user={{
                name: user.name || "Administrator",
                email: user.email || "",
            }}
        />
    );
}
