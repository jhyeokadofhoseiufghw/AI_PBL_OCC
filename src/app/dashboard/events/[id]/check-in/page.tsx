import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckInScanner } from "@/features/checkin/components/check-in-scanner";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, requireOrganizer()]);
  const sql = getSql();
  const events =
    await sql`SELECT title,event_start_at FROM events WHERE id=${id} AND organizer_id=${session.organizerId} LIMIT 1`;
  if (!events[0]) notFound();
  const [stats, logs] = await Promise.all([
    sql`SELECT COUNT(*) FILTER(WHERE rt.checked_in_at IS NULL)::int remaining,COUNT(*) FILTER(WHERE rt.checked_in_at IS NOT NULL)::int checked_in FROM reservation_tickets rt JOIN reservations r ON r.id=rt.reservation_id WHERE r.event_id=${id} AND r.status IN('CONFIRMED','CHECKED_IN')`,
    sql`SELECT r.reserver_name,rt.ticket_number,rt.checked_in_at,s.label seat_label FROM reservation_tickets rt JOIN reservations r ON r.id=rt.reservation_id LEFT JOIN seats s ON s.id=rt.seat_id WHERE r.event_id=${id} AND rt.checked_in_at IS NOT NULL ORDER BY rt.checked_in_at DESC LIMIT 10`,
  ]);
  const summary = stats[0];
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            className="text-sm text-emerald-700"
            href={`/dashboard/events/${id}/reservations`}
          >
            ← 예매자 관리
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">
            {String(events[0].title)} QR 체크인
          </h1>
        </div>
        <p className="text-sm text-zinc-500">
          {new Date(String(events[0].event_start_at)).toLocaleString("ko-KR")}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-white p-4">
          <p className="text-2xl font-semibold">{Number(summary.checked_in)}</p>
          <p className="text-xs text-zinc-500">체크인 건</p>
        </div>
        <div className="rounded-xl bg-white p-4">
          <p className="text-2xl font-semibold">{Number(summary.checked_in)}</p>
          <p className="text-xs text-zinc-500">입장 인원</p>
        </div>
        <div className="rounded-xl bg-white p-4">
          <p className="text-2xl font-semibold">{Number(summary.remaining)}</p>
          <p className="text-xs text-zinc-500">입장 대기</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <CheckInScanner eventId={id} />
        <section>
          <h2 className="font-semibold">최근 체크인</h2>
          <div className="mt-3 space-y-2">
            {logs.map((row, index) => (
              <div
                className="rounded-lg border bg-white p-3 text-sm"
                key={`${String(row.checked_in_at)}-${index}`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    {String(row.reserver_name)} · 티켓{" "}
                    {Number(row.ticket_number)}
                    {row.seat_label ? ` · ${String(row.seat_label)}` : ""}
                  </span>
                  <time className="text-zinc-500">
                    {new Date(String(row.checked_in_at)).toLocaleTimeString(
                      "ko-KR",
                    )}
                  </time>
                </div>
              </div>
            ))}
            {!logs.length ? (
              <p className="rounded-lg border border-dashed p-5 text-sm text-zinc-500">
                아직 체크인 기록이 없습니다.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
