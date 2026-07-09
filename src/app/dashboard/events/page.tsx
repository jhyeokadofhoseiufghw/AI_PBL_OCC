import Link from "next/link";

export default function DashboardEventsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950">공연 목록</h1>
      <Link className="mt-6 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white" href="/dashboard/events/new">
        공연 생성
      </Link>
    </main>
  );
}
