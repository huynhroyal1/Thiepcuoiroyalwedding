export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero skeleton */}
        <div className="mb-12 rounded-2xl bg-neutral-100 p-8" />
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-neutral-100 p-4">
              <div className="mb-3 h-48 rounded-xl bg-neutral-200" />
              <div className="mb-2 h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-3 w-1/2 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
