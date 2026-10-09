
export default function LoadingState({
    title = "Loading dashboard",
    description = "Fetching the latest information...",
}) {
    return (
        <div
            role="status"
            aria-live="polite"
            className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center"
        >
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-800">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
    );
}
