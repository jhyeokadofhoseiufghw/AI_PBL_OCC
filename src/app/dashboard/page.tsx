import Link from "next/link";

import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function DashboardPage() {
  const session = await requireOrganizer();
  const sql = getSql();
  const rows = await sql`SELECT name, organization_name FROM organizers WHERE id = ${session.organizerId} LIMIT 1`;
  const organizer = rows[0];
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950">기획자 대시보드</h1>
      <p className="mt-2 text-zinc-600">{organizer ? `${String(organizer.organization_name)} · ${String(organizer.name)}` : "운영 현황"}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900" href="/dashboard/events">
          공연 목록
        </Link>
        <Link className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900" href="/dashboard/events/new">
          새 공연 생성
        </Link>
      </div>
    </main>
  );
}
