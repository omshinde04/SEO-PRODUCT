import { getAuthenticatedUser } from "@/lib/auth/session";
import AdminShell from "./admin-shell";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
    title: {
        default: "Admin Workspace | SEO-PRODUCT",
        template: "%s | SEO-PRODUCT",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default async function AdminLayout({ children }) {
    const user = await getAuthenticatedUser();

    // Keep login public; every other admin route requires a valid admin session.
    // The pathname-aware shell hides workspace navigation on /admin/login.
    return <AdminShell user={user ? { name: user.name, email: user.email } : null}>{children}</AdminShell>;
}
