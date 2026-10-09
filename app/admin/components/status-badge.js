
const statusStyles = {
    published: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    draft: "bg-amber-50 text-amber-700 ring-amber-600/15",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
    inactive: "bg-slate-100 text-slate-600 ring-slate-500/15",
    archived: "bg-slate-100 text-slate-600 ring-slate-500/15",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/15",
    unverified: "bg-blue-50 text-blue-700 ring-blue-600/15",
};

export default function StatusBadge({ status }) {
    const normalized = String(status || "unknown").toLowerCase();
    const label = normalized.replaceAll("_", " ");

    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusStyles[normalized] || "bg-slate-100 text-slate-600 ring-slate-500/15"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {label}
        </span>
    );
}
