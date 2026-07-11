import Link from "next/link";

import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function DashboardEventsPage() {
  const session = await requireOrganizer();
  const sql = getSql();
  const events = await sql`
    SELECT id, title, event_start_at, status, reservation_type, ticket_price
    FROM events WHERE organizer_id = ${session.organizerId}
    ORDER BY created_at DESC
  `;
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold text-zinc-950">공연 목록</h1><Link className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white" href="/dashboard/events/new">공연 생성</Link></div>
      {events.length === 0 ? <p className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">아직 만든 공연이 없습니다.</p> : <div className="mt-8 grid gap-3">{events.map((event) => <Link href={`/dashboard/events/${String(event.id)}/overview`} key={String(event.id)}><article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{String(event.title)}</h2><p className="mt-1 text-sm text-zinc-600">{new Date(String(event.event_start_at)).toLocaleString("ko-KR")} · {event.reservation_type === "FIRST_COME" ? "선착순" : "좌석 지정"}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium">{event.status === "HIDDEN" ? "비공개" : String(event.status)}</span></div></article></Link>)}</div>}
    </main>
  );
}
