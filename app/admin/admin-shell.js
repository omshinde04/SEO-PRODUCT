"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./components/admin-sidebar";
import AdminHeader from "./components/admin-header";

export default function AdminShell({ children, user }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // The sign-in page is intentionally outside the authenticated workspace chrome.
    if (pathname === "/admin/login") {
        return children;
    }

    return (
        <div className="min-h-screen bg-[#f7f8fc]">
            <AdminSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="min-h-screen lg:pl-[264px]">
                <AdminHeader
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                {children}
            </div>
        </div>
    );
}
