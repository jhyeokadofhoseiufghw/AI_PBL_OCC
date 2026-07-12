export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-5 py-8">
      <div className="h-8 w-32 rounded bg-zinc-200" />
      <div className="mt-8 h-72 rounded-3xl bg-zinc-200" />
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="h-72 rounded-xl bg-zinc-200" key={i} />
        ))}
      </div>
    </main>
  );
}
