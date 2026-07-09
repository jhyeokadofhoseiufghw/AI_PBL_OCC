import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950">기획자 대시보드</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900" href="/dashboard/events">
          공연 목록
        </Link>
        <Link className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900" href="/dashboard/events/demo/check-in">
          QR 체크인
        </Link>
      </div>
    </main>
  );
}
