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
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">공연 목록</h1>
        <Link
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white"
          href="/dashboard/events/new"
        >
          공연 생성
        </Link>
      </div>
      <form className="mt-6">
        <select
          className="rounded-lg border px-3 py-2"
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
        <button className="ml-2 rounded-lg border px-3 py-2">필터</button>
      </form>
      {events.length ? (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50">
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
                <tr className="border-b" key={String(event.id)}>
                  <td className="p-4">
                    <Link
                      className="font-medium hover:text-emerald-700"
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
                      className="rounded border px-3 py-2 text-emerald-700"
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
