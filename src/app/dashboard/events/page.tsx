import Link from "next/link";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
const labels: Record<string, string> = {
  HIDDEN: "비공개",
  SCHEDULED: "예정",
  IN_PROGRESS: "진행 중",
  COMPLETED: "종료",
  CANCELLED: "취소",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [session, { status = "" }] = await Promise.all([
    requireOrganizer(),
    searchParams,
  ]);
  const events =
    await getSql()`SELECT e.id,e.title,e.event_start_at,e.status,e.reservation_type,COUNT(r.id) FILTER(WHERE r.status NOT IN('CANCELLED','WAITLISTED'))::int reservations,COUNT(r.id) FILTER(WHERE r.status='PENDING_PAYMENT')::int pending,COUNT(r.id) FILTER(WHERE r.status='CHECKED_IN')::int checked_in FROM events e LEFT JOIN reservations r ON r.event_id=e.id WHERE e.organizer_id=${session.organizerId} AND (${status}='' OR e.status=${status}) GROUP BY e.id ORDER BY e.created_at DESC`;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="ha-kicker">Shows</p>
          <h1 className="ha-title mt-1 text-3xl">공연 목록</h1>
        </div>
        <Link
          className="ha-button-primary px-5 py-3 text-sm"
          href="/dashboard/events/new"
        >
          공연 생성
        </Link>
      </div>
      <form className="ha-panel mt-7 flex gap-2 p-3">
        <select
          className="ha-input max-w-xs"
          defaultValue={status}
          name="status"
        >
          <option value="">전체 상태</option>
          {Object.entries(labels).map(([v, l]) => (
            <option value={v} key={v}>
              {l}
            </option>
          ))}
        </select>
        <button className="ha-button-secondary px-4 py-2">필터</button>
      </form>
      {events.length ? (
        <div className="ha-panel mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dfe3ec] bg-[#eff3ff] text-xs uppercase tracking-wider text-[#60687a]">
                <th className="p-4">공연명</th>
                <th className="p-4">날짜</th>
                <th className="p-4">상태</th>
                <th className="p-4">예매</th>
                <th className="p-4">입금 대기</th>
                <th className="p-4">체크인</th>
                <th className="p-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  className="border-b border-[#e5e7eb] transition hover:bg-[#f8f9ff]"
                  key={String(event.id)}
                >
                  <td className="p-4">
                    <Link
                      className="font-bold hover:text-[#420093]"
                      href={`/dashboard/events/${String(event.id)}/overview`}
                    >
                      {String(event.title)}
                    </Link>
                    <span className="block text-xs text-zinc-500">
                      {event.reservation_type === "FIRST_COME"
                        ? "선착순"
                        : "좌석 지정"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-4">
                    {new Date(String(event.event_start_at)).toLocaleString(
                      "ko-KR",
                    )}
                  </td>
                  <td className="p-4">{labels[String(event.status)]}</td>
                  <td className="p-4">{Number(event.reservations)}건</td>
                  <td className="p-4">{Number(event.pending)}건</td>
                  <td className="p-4">{Number(event.checked_in)}건</td>
                  <td className="p-4">
                    <Link
                      className="ha-button-secondary px-3 py-2 text-[#420093]"
                      href={`/dashboard/events/${String(event.id)}/reservations`}
                    >
                      예매 운영
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed p-10 text-center text-zinc-500">
          조건에 맞는 공연이 없습니다.{" "}
          <Link className="text-emerald-700" href="/dashboard/events/new">
            새 공연 만들기
          </Link>
        </p>
      )}
    </main>
  );
}
