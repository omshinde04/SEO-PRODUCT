
const themes = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
};

const icons = {
    businesses: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" /></>,
    published: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    drafts: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    categories: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    locations: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    pending: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

export default function StatCard({
    title,
    value,
    description,
    icon = "businesses",
    tone = "blue",
    loading = false,
}) {
    return (
        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-500">
                        {title}
                    </p>
                    {loading ? (
                        <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
                    ) : (
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                            {Number(value ?? 0).toLocaleString("en-IN")}
                        </p>
                    )}
                </div>

                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${themes[tone] || themes.blue}`}>
                    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {icons[icon] || icons.businesses}
                    </svg>
                </div>
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                {description}
            </p>
        </article>
    );
}
