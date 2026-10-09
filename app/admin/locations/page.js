import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/session";
import LocationsClient from "./locations-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
    title: "Locations | Admin Workspace",
    robots: { index: false, follow: false },
};

export default async function LocationsPage() {
    const user = await getAuthenticatedUser();
    if (!user) redirect("/admin/login");

    return <LocationsClient />;
}
