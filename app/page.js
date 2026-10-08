export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center text-center">
        {/* Status Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          Foundation Test
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Tailwind CSS is{" "}
          <span className="text-blue-600">Working</span>
        </h1>

        {/* Description */}
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Clean Next.js 16 + Tailwind CSS 4 foundation for our local discovery
          platform.
        </p>

        {/* Test Cards */}
        <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Framework</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Next.js 16
            </h2>
            <p className="mt-1 text-sm text-green-600">✓ Working</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Styling</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Tailwind CSS 4
            </h2>
            <p className="mt-1 text-sm text-green-600">✓ Working</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Build</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Production
            </h2>
            <p className="mt-1 text-green-600">✓ Ready</p>
          </div>
        </div>

        {/* Button Tests */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Primary Button
          </button>

          <button
            type="button"
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Secondary Button
          </button>
        </div>

        {/* Test Footer */}
        <p className="mt-10 text-sm text-slate-500">
          Next step: build the actual platform foundation.
        </p>
      </div>
    </main>
  );
}