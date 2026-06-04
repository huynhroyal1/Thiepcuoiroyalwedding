export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-6 w-32 rounded bg-neutral-100" />
          <div className="mx-auto mb-2 h-10 w-80 rounded bg-neutral-100" />
          <div className="mx-auto h-4 w-96 rounded bg-neutral-100" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 bg-white p-6">
              <div className="mb-4 h-6 w-16 rounded bg-neutral-100" />
              <div className="mb-2 h-8 w-24 rounded bg-neutral-100" />
              <div className="mb-6 space-y-2">
                {[0, 1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-3 rounded bg-neutral-100" style={{ width: `${60 + (j * 7) % 30}%` }} />
                ))}
              </div>
              <div className="h-10 rounded-xl bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
