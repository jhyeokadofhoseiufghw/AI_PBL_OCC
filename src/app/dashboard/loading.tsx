export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl animate-pulse px-6 py-10">
      <div className="h-8 w-56 rounded bg-zinc-200" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="h-28 rounded-xl bg-zinc-200" key={i} />
        ))}
      </div>
      <div className="mt-10 h-64 rounded-xl bg-zinc-200" />
    </main>
  );
}
