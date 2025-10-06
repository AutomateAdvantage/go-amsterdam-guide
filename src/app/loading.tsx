export default function RootLoading() {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded-lg bg-black/10" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border bg-black/5" />
            ))}
          </div>
        </div>
      </main>
    );
  }
  