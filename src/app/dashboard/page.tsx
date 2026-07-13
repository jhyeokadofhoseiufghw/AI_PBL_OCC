import Link from "next/link";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function DashboardPage() {
  const session = await requireOrganizer();
  const sql = getSql();
  const [organizers, eventStats, reservationStats, recent, todayEvents] =
    await Promise.all([
      sql`SELECT name,organization_name FROM organizers WHERE id=${session.organizerId} LIMIT 1`,
      sql`SELECT COUNT(*)::int total,COUNT(*) FILTER(WHERE status='SCHEDULED')::int scheduled,COUNT(*) FILTER(WHERE status='IN_PROGRESS')::int in_progress,COUNT(*) FILTER(WHERE status='COMPLETED')::int completed FROM events WHERE organizer_id=${session.organizerId}`,
      sql`SELECT COUNT(*) FILTER(WHERE r.status NOT IN('CANCELLED','WAITLISTED'))::int total_reservations,COUNT(*) FILTER(WHERE r.status='PENDING_PAYMENT')::int pending,COUNT(*) FILTER(WHERE r.status='CONFIRMED')::int confirmed,COUNT(*) FILTER(WHERE r.status='WAITLISTED')::int waitlisted,COUNT(*) FILTER(WHERE r.status='CHECKED_IN' AND r.checked_in_at >= (date_trunc('day',NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul'))::int today_checkins FROM reservations r JOIN events e ON e.id=r.event_id WHERE e.organizer_id=${session.organizerId}`,
      sql`SELECT e.id,e.title,e.event_start_at,e.status,COUNT(r.id)::int reservations,COUNT(r.id) FILTER(WHERE r.status='CHECKED_IN')::int checked_in FROM events e LEFT JOIN reservations r ON r.event_id=e.id WHERE e.organizer_id=${session.organizerId} GROUP BY e.id ORDER BY e.created_at DESC LIMIT 5`,
      sql`SELECT id,title,event_start_at,venue FROM events WHERE organizer_id=${session.organizerId} AND (event_start_at AT TIME ZONE 'Asia/Seoul')::date=(NOW() AT TIME ZONE 'Asia/Seoul')::date ORDER BY event_start_at`,
    ]);
  const organizer = organizers[0],
    e = eventStats[0],
    r = reservationStats[0];
  const cards = [
    ["전체 공연", e.total],
    ["예정 공연", e.scheduled],
    ["진행 중", e.in_progress],
    ["종료 공연", e.completed],
    ["총 예매", r.total_reservations],
    ["입금 대기", r.pending],
    ["예매 확정", r.confirmed],
    ["대기 신청", r.waitlisted],
    ["오늘 체크인", r.today_checkins],
  ];
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="ha-kicker">Overview</p>
          <h1 className="ha-title mt-1 text-3xl">기획자 대시보드</h1>
          <p className="mt-2 text-[#60687a]">
            {organizer
              ? `${String(organizer.organization_name)} · ${String(organizer.name)}`
              : "운영 현황"}
          </p>
        </div>
        <Link
          className="ha-button-primary px-5 py-3 text-sm"
          href="/dashboard/events/new"
        >
          새 공연
        </Link>
      </div>
      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <article
            className="ha-card border-l-4 border-l-[#712ae2] p-5"
            key={String(label)}
          >
            <p className="text-sm font-semibold text-[#60687a]">{label}</p>
            <p className="mt-2 text-3xl font-black">{Number(value)}</p>
          </article>
        ))}
      </section>
      <section className="mt-10">
        <p className="ha-kicker">Today</p>
        <h2 className="ha-title mt-1 text-xl">오늘 공연</h2>
        <div className="mt-4 space-y-2">
          {todayEvents.map((event) => (
            <Link
              className="ha-card block p-5 transition hover:-translate-y-0.5 hover:border-[#712ae2]"
              href={`/dashboard/events/${String(event.id)}/check-in`}
              key={String(event.id)}
            >
              <b>{String(event.title)}</b>
              <span className="ml-3 text-sm text-zinc-500">
                {new Date(String(event.event_start_at)).toLocaleTimeString(
                  "ko-KR",
                )}{" "}
                · {String(event.venue)}
              </span>
            </Link>
          ))}
          {!todayEvents.length ? (
            <p className="rounded-xl border border-dashed border-[#ccc3d6] p-6 text-sm text-[#60687a]">
              오늘 예정된 공연이 없습니다.
            </p>
          ) : null}
        </div>
      </section>
      <section className="mt-10">
        <div className="flex justify-between">
          <div>
            <p className="ha-kicker">Recent shows</p>
            <h2 className="ha-title mt-1 text-xl">최근 공연</h2>
          </div>
          <Link
            className="text-sm font-bold text-[#420093]"
            href="/dashboard/events"
          >
            전체 보기
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {recent.map((row) => (
            <article
              className="ha-card flex flex-wrap items-center justify-between gap-3 p-5"
              key={String(row.id)}
            >
              <div>
                <Link
                  className="font-medium"
                  href={`/dashboard/events/${String(row.id)}/overview`}
                >
                  {String(row.title)}
                </Link>
                <p className="mt-1 text-sm text-zinc-500">
                  {new Date(String(row.event_start_at)).toLocaleString("ko-KR")}{" "}
                  · 예매 {Number(row.reservations)}건 · 체크인{" "}
                  {Number(row.checked_in)}건
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  className="ha-button-secondary px-3 py-2 text-sm"
                  href={`/dashboard/events/${String(row.id)}/reservations`}
                >
                  예매자
                </Link>
                <Link
                  className="ha-button-primary px-3 py-2 text-sm"
                  href={`/dashboard/events/${String(row.id)}/check-in`}
                >
                  QR 체크인
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
