export default function Loading() {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-7 w-64 rounded-lg bg-black/10" />
          <div className="h-10 w-full max-w-md rounded-lg bg-black/10" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border bg-black/5" />
            ))}
          </div>
        </div>
      </main>
    );
  }
  