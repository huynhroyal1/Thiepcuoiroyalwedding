export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-2xl bg-neutral-100 p-6" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-neutral-100 p-3">
              <div className="mb-3 h-40 rounded-lg bg-neutral-200" />
              <div className="h-3 w-3/4 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
