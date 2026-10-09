
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
    { label: "Overview", href: "/admin/dashboard", icon: "grid", active: true },

    {
        label: "Businesses",
        href: "/admin/businesses",
        icon: "building",
        active: true,
    },

    { label: "Categories", href: "/admin/categories", icon: "layers", active: false },
    { label: "Locations", href: "/admin/locations", icon: "map", active: false },
    { label: "SEO management", href: "/admin/seo", icon: "search", active: false },
];

const secondaryNavigation = [
    { label: "Places", href: "/admin/places", icon: "book" },
    { label: "Guides", href: "/admin/guides", icon: "book" },
    { label: "Events", href: "/admin/events", icon: "calendar" },
    { label: "Media library", href: "/admin/media", icon: "image" },
    { label: "Submissions", href: "/admin/submissions", icon: "inbox" },
    { label: "SEO templates", href: "/admin/seo-templates", icon: "search" },
];

function NavIcon({ name, size = 18 }) {
    const paths = {
        grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
        building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4M8 7h2m4 0h2M8 11h2m4 0h2" /></>,
        layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
        map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
        search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
        book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
        image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
        inbox: <><path d="M4 4h16l2 12h-6l-2 3h-4l-2-3H2L4 4Z" /><path d="M2 16h6m8 0h6" /></>,
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name]}
        </svg>
    );
}

export default function AdminSidebar({ open, onClose }) {
    const pathname = usePathname();

    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black tracking-tight text-white shadow-sm shadow-blue-600/20">
                        SP
                    </div>
                    <div>
                        <p className="text-[15px] font-bold tracking-tight text-slate-900">
                            SEO-PRODUCT
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            Admin workspace
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Workspace
                    </p>

                    <nav aria-label="Main navigation" className="space-y-1">
                        {navigation.map((item) => {
                            const selected = pathname === item.href;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.active ? item.href : "#"}
                                    aria-disabled={!item.active}
                                    onClick={(event) => {
                                        if (!item.active) event.preventDefault();
                                        else onClose();
                                    }}
                                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition ${selected
                                        ? "bg-blue-50 text-blue-700"
                                        : item.active
                                            ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            : "cursor-not-allowed text-slate-400"
                                        }`}
                                >
                                    <NavIcon name={item.icon} />
                                    <span className="flex-1">{item.label}</span>
                                    {!item.active && (
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                                            SOON
                                        </span>
                                    )}
                                    {selected && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Content
                    </p>

                    <div className="space-y-1">
                        {secondaryNavigation.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link key={item.href} href={item.href} onClick={onClose} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                                    <NavIcon name={item.icon} />
                                    <span className="flex-1">{item.label}</span>
                                    {active && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-slate-100 p-4">
                    <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                                Admin workspace
                            </span>
                        </div>
                        <p className="mt-1.5 pl-4 text-[11px] leading-5 text-slate-500">
                            Manage your local discovery platform from one place.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
