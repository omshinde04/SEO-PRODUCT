"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || "Unable to sign in.");
                return;
            }

            router.replace("/admin/dashboard");
            router.refresh();
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                        S
                    </div>
                    <p className="text-sm font-semibold text-blue-600">
                        SEO-PRODUCT
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        Admin sign in
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Sign in to manage the local discovery platform.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            maxLength={254}
                            disabled={loading}
                            className="min-h-12 w-full rounded-lg border border-slate-300 px-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            maxLength={128}
                            disabled={loading}
                            className="min-h-12 w-full rounded-lg border border-slate-300 px-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email.trim() || !password}
                        className="min-h-12 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign in to dashboard"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Authorized administrators only.
                </p>
            </section>
        </main>
    );
}