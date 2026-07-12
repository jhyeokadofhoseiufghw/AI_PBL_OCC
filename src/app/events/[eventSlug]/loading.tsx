export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl animate-pulse px-5 py-8">
      <div className="h-6 w-28 rounded bg-zinc-200" />
      <div className="mt-8 grid gap-8 md:grid-cols-[320px_1fr]">
        <div className="aspect-[1/1.414] rounded-2xl bg-zinc-200" />
        <div>
          <div className="h-10 rounded bg-zinc-200" />
          <div className="mt-6 h-48 rounded bg-zinc-100" />
        </div>
      </div>
    </main>
  );
}
