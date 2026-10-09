import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
    title: "Admin Dashboard | SEO-PRODUCT",
    robots: {
        index: false,
        follow: false,
    },
};

const cards = [
    {
        title: "Business listings",
        description: "Manage businesses and their public profiles.",
        value: "Coming next",
    },
    {
        title: "Categories",
        description: "Organize businesses by category and location.",
        value: "Coming next",
    },
    {
        title: "SEO management",
        description: "Manage metadata and search visibility.",
        value: "Coming next",
    },
];

export default async function AdminDashboardPage() {
    const user = await getAuthenticatedUser();

    if (!user) {
        redirect("/admin/login");
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div>
                        <p className="text-sm font-semibold text-blue-600">
                            SEO-PRODUCT
                        </p>
                        <h1 className="mt-1 text-xl font-bold text-slate-900">
                            Admin Dashboard
                        </h1>
                    </div>

                    <LogoutButton />
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <section className="rounded-2xl bg-blue-600 p-6 text-white sm:p-8">
                    <p className="text-sm font-medium text-blue-100">
                        Administration
                    </p>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                        Welcome, {user.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-blue-100">
                        Your admin authentication is connected. This dashboard will become
                        the control center for the local discovery platform.
                    </p>
                </section>

                <section className="mt-8">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">
                            Platform management
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            The next modules will be implemented and connected to MongoDB.
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {cards.map((card) => (
                            <article
                                key={card.title}
                                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <h3 className="font-semibold text-slate-900">
                                    {card.title}
                                </h3>
                                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                                    {card.description}
                                </p>
                                <p className="mt-5 text-sm font-semibold text-blue-600">
                                    {card.value}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <p className="mt-8 text-xs text-slate-400">
                    Signed in as {user.email}
                </p>
            </div>
        </main>
    );
}