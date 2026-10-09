
export default function PageHeader({
    eyebrow = "OVERVIEW",
    title,
    description,
    action,
}) {
    return (
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    {eyebrow}
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
