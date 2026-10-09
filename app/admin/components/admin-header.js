
"use client";

import LogoutButton from "../dashboard/logout-button";

export default function AdminHeader({ user, onMenuClick }) {
    const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "A";

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        aria-label="Open navigation"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    </button>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            Admin workspace
                        </p>
                        <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                            Manage your platform and content
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden items-center gap-3 border-r border-slate-200 pr-4 sm:flex">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
                            {initial}
                        </div>
                        <div className="max-w-44">
                            <p className="truncate text-xs font-semibold text-slate-800">
                                {user?.name || "Administrator"}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                {user?.email || ""}
                            </p>
                        </div>
                    </div>

                    <LogoutButton />
                </div>
            </div>
        </header>
    );
}
