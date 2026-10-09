"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogout() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || "Unable to log out.");
                return;
            }

            router.replace("/admin/login");
            router.refresh();
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
                {loading ? "Signing out..." : "Log out"}
            </button>

            {error && (
                <p role="alert" className="max-w-48 text-right text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}