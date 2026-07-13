import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  bulkApproveReservations,
  bulkCancelReservations,
  confirmReservation,
  convertWaitlistReservation,
  organizerCancelReservation,
  retryQrGeneration,
  revokeConfirmation,
} from "@/features/reservations/actions";
import { ConfirmSubmitButton } from "@/features/events/components/confirm-submit-button";
import { EventTabs } from "@/features/events/components/event-tabs";
import { EventSwitcher } from "@/features/events/components/event-switcher";
import { OrganizerReservationDetail } from "@/features/reservations/components/organizer-reservation-detail";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
const labels: Record<string, string> = {
  PENDING_PAYMENT: "입금 대기",
  CONFIRMED: "확정",
  CHECKED_IN: "입장 완료",
  CANCELLED: "취소",
  WAITLISTED: "대기",
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    requireOrganizer(),
  ]);
  const sql = getSql();
  const events =
    await sql`SELECT id,title,reservation_type,total_capacity FROM events WHERE id=${id} AND organizer_id=${session.organizerId}`;
  if (!events[0]) notFound();
  const q = (query.q ?? "").trim(),
    status = query.status ?? "",
    size = [10, 25, 50].includes(Number(query.size)) ? Number(query.size) : 10,
    page = Math.max(1, Number(query.page) || 1),
    offset = (page - 1) * size;
  const [rows, countRows, summary, allEvents] = await Promise.all([
    sql`SELECT r.*,tt.name ticket_type,COALESCE(array_agg(s.label ORDER BY s.label) FILTER(WHERE rs.released_at IS NULL),'{}') seats,(SELECT COUNT(*)::int FROM reservation_tickets rt WHERE rt.reservation_id=r.id AND rt.checked_in_at IS NOT NULL) checked_ticket_count,(SELECT COUNT(*)::int FROM reservation_tickets rt WHERE rt.reservation_id=r.id AND rt.qr_generation_status<>'READY') pending_qr_count,COALESCE((SELECT jsonb_agg(jsonb_build_object('number',rt.ticket_number,'seat',seat.label,'qr',rt.qr_image_data,'checkedInAt',rt.checked_in_at) ORDER BY rt.ticket_number) FROM reservation_tickets rt LEFT JOIN seats seat ON seat.id=rt.seat_id WHERE rt.reservation_id=r.id),'[]'::jsonb) qr_tickets FROM reservations r LEFT JOIN ticket_types tt ON tt.id=r.ticket_type_id LEFT JOIN reservation_seats rs ON rs.reservation_id=r.id LEFT JOIN seats s ON s.id=rs.seat_id WHERE r.event_id=${id} AND (${q}='' OR r.depositor_name ILIKE ${`%${q}%`} OR r.reserver_phone ILIKE ${`%${q}%`} OR r.reserver_name ILIKE ${`%${q}%`}) AND (${status}='' OR r.status=${status}) GROUP BY r.id,tt.name ORDER BY r.created_at DESC LIMIT ${size} OFFSET ${offset}`,
    sql`SELECT COUNT(*)::int count FROM reservations r WHERE r.event_id=${id} AND (${q}='' OR r.depositor_name ILIKE ${`%${q}%`} OR r.reserver_phone ILIKE ${`%${q}%`} OR r.reserver_name ILIKE ${`%${q}%`}) AND (${status}='' OR r.status=${status})`,
    sql`SELECT COALESCE(SUM(quantity) FILTER(WHERE status IN('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')),0)::int tickets,COALESCE(SUM(total_price) FILTER(WHERE status IN('CONFIRMED','CHECKED_IN')),0)::int revenue,COUNT(*) FILTER(WHERE status='PENDING_PAYMENT')::int pending,COUNT(*) FILTER(WHERE status='CONFIRMED')::int confirmed,COUNT(*) FILTER(WHERE status='WAITLISTED')::int waitlisted FROM reservations WHERE event_id=${id}`,
    sql`SELECT id,title FROM events WHERE organizer_id=${session.organizerId} ORDER BY event_start_at DESC`,
  ]);
  const total = Number(countRows[0].count),
    pages = Math.max(1, Math.ceil(total / size)),
    s = summary[0],
    paramsString = new URLSearchParams({
      q,
      status,
      size: String(size),
    }).toString();
  const capacity =
    events[0].reservation_type === "FIRST_COME"
      ? Number(events[0].total_capacity)
      : Number(
          (
            await sql`SELECT COUNT(*)::int count FROM seats WHERE event_id=${id} AND is_active`
          )[0].count,
        );
  const remaining = Math.max(0, capacity - Number(s.tickets));
  if (page > pages && total)
    redirect(
      `/dashboard/events/${id}/reservations?${paramsString}&page=${pages}`,
    );
  const hidden = (rid: string) => (
    <>
      <input name="eventId" type="hidden" value={id} />
      <input name="reservationId" type="hidden" value={rid} />
    </>
  );
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ha-kicker">Reservations</p>
          <h1 className="ha-title mt-1 text-3xl">예매/입금 관리</h1>
        </div>
        <EventSwitcher
          current={id}
          events={allEvents.map((event) => ({
            id: String(event.id),
            title: String(event.title),
          }))}
        />
      </div>
      <EventTabs current="reservations" eventId={id} />
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["활성 매수", s.tickets],
          ["확정 매출", `${Number(s.revenue).toLocaleString("ko-KR")}원`],
          ["입금 대기", s.pending],
          ["예매 확정", s.confirmed],
          ["대기 신청", s.waitlisted],
          ["잔여 좌석/수량", remaining],
        ].map(([l, v]) => (
          <div
            className="ha-panel border-l-4 border-l-[#712ae2] p-4"
            key={String(l)}
          >
            <p className="text-xs font-semibold text-[#60687a]">{l}</p>
            <p className="mt-2 text-2xl font-black">{String(v)}</p>
          </div>
        ))}
      </section>
      <form className="ha-panel mt-6 flex flex-wrap gap-2 p-3">
        <input
          className="ha-input min-w-60 flex-1"
          defaultValue={q}
          name="q"
          placeholder="이름, 입금자명 또는 연락처"
        />
        <select className="ha-input w-auto" defaultValue={status} name="status">
          <option value="">전체 상태</option>
          {Object.entries(labels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select className="ha-input w-auto" defaultValue={size} name="size">
          <option value="10">10개</option>
          <option value="25">25개</option>
          <option value="50">50개</option>
        </select>
        <button className="ha-button-primary px-5 py-2">검색</button>
        <Link
          className="ha-button-secondary px-4 py-2"
          href={`/dashboard/events/${id}/reservations/export?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`}
        >
          CSV 다운로드
        </Link>
      </form>
      <form
        action={bulkCancelReservations}
        className="mt-4 flex flex-wrap gap-2"
        id="bulk-operations"
      >
        <input name="eventId" type="hidden" value={id} />
        <button
          className="ha-button-primary px-4 py-2 text-sm"
          formAction={bulkApproveReservations}
        >
          선택 일괄 승인
        </button>
        <ConfirmSubmitButton
          className="ha-button-secondary border-red-200 px-4 py-2 text-sm text-red-700"
          confirmMessage="선택한 예매를 취소하고 좌석을 복구할까요?"
        >
          선택 일괄 취소
        </ConfirmSubmitButton>
      </form>
      <div className="ha-panel mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#dfe3ec] bg-[#eff3ff] text-xs uppercase tracking-wider text-[#60687a]">
              <th className="p-3">선택</th>
              <th className="p-3">신청일</th>
              <th className="p-3">예매자</th>
              <th className="p-3">매수 / 좌석 / 타입</th>
              <th className="p-3">입금 / 금액</th>
              <th className="p-3">상태</th>
              <th className="p-3">체크인</th>
              <th className="p-3">처리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-b border-[#e5e7eb] align-top transition hover:bg-[#f8f9ff]"
                key={String(row.id)}
              >
                <td className="p-3">
                  <input
                    form="bulk-operations"
                    name="reservationIds"
                    type="checkbox"
                    value={String(row.id)}
                  />
                </td>
                <td className="whitespace-nowrap p-3">
                  {new Date(String(row.created_at)).toLocaleString("ko-KR")}
                </td>
                <td className="p-3">
                  {String(row.reserver_name)}
                  <br />
                  <span className="text-zinc-500">
                    {String(row.reserver_phone)}
                  </span>
                </td>
                <td className="p-3">
                  {Number(row.quantity)}매<br />
                  <span className="text-zinc-500">
                    {(row.seats as string[]).join(", ") || "-"} ·{" "}
                    {String(row.ticket_type ?? "타입 없음")}
                  </span>
                </td>
                <td className="p-3">
                  {String(row.depositor_name)}
                  <br />
                  {Number(row.total_price).toLocaleString("ko-KR")}원
                </td>
                <td className="p-3">
                  <span className="inline-flex rounded-full bg-[#e6eeff] px-2.5 py-1 text-xs font-bold text-[#420093]">
                    {labels[String(row.status)]}
                  </span>
                  {Number(row.pending_qr_count) > 0 ? (
                    <span className="block text-amber-700">QR 생성 필요</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap p-3">
                  {Number(row.checked_ticket_count) > 0 ? (
                    <>
                      <b className="text-[#00865f]">
                        {Number(row.checked_ticket_count)}/
                        {Number(row.quantity)}명 입장
                      </b>
                    </>
                  ) : (
                    <span className="text-zinc-400">미체크인</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <OrganizerReservationDetail
                      reservation={{
                        name: String(row.reserver_name),
                        phone: String(row.reserver_phone),
                        depositor: String(row.depositor_name),
                        quantity: Number(row.quantity),
                        totalPrice: Number(row.total_price),
                        status:
                          labels[String(row.status)] ?? String(row.status),
                        code: row.reservation_code
                          ? String(row.reservation_code)
                          : null,
                        note: row.request_note
                          ? String(row.request_note)
                          : null,
                        tickets: (
                          row.qr_tickets as Array<{
                            number: number;
                            seat: string | null;
                            qr: string | null;
                            checkedInAt: string | null;
                          }>
                        ).map((ticket) => ({
                          number: Number(ticket.number),
                          seat: ticket.seat ? String(ticket.seat) : null,
                          qr: ticket.qr ? String(ticket.qr) : null,
                          checkedInAt: ticket.checkedInAt
                            ? String(ticket.checkedInAt)
                            : null,
                        })),
                      }}
                    />
                    {row.status === "PENDING_PAYMENT" ? (
                      <form action={confirmReservation}>
                        {hidden(String(row.id))}
                        <button className="rounded border border-[#420093] bg-[#420093] px-2 py-1 text-white">
                          승인
                        </button>
                      </form>
                    ) : null}
                    {row.status === "WAITLISTED" ? (
                      <form action={convertWaitlistReservation}>
                        {hidden(String(row.id))}
                        <button className="rounded border border-[#420093] bg-[#420093] px-2 py-1 text-white">
                          예매 전환
                        </button>
                      </form>
                    ) : null}
                    {row.status === "CONFIRMED" ? (
                      <form action={revokeConfirmation}>
                        {hidden(String(row.id))}
                        <ConfirmSubmitButton
                          className="rounded border px-2 py-1"
                          confirmMessage="승인을 취소하면 기존 QR이 무효화됩니다."
                        >
                          승인 취소
                        </ConfirmSubmitButton>
                      </form>
                    ) : null}
                    {["PENDING_PAYMENT", "CONFIRMED", "WAITLISTED"].includes(
                      String(row.status),
                    ) ? (
                      <form action={organizerCancelReservation}>
                        {hidden(String(row.id))}
                        <ConfirmSubmitButton
                          className="rounded border border-red-200 px-2 py-1 text-red-700"
                          confirmMessage="이 예매를 취소할까요?"
                        >
                          취소
                        </ConfirmSubmitButton>
                      </form>
                    ) : null}
                    {row.status === "CONFIRMED" &&
                    Number(row.pending_qr_count) > 0 ? (
                      <form action={retryQrGeneration}>
                        {hidden(String(row.id))}
                        <button className="rounded border px-2 py-1">
                          QR 재시도
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <p className="p-8 text-center text-zinc-500">
            조건에 맞는 예매가 없습니다.
          </p>
        ) : null}
      </div>
      <nav className="mt-6 flex justify-center gap-2">
        {page > 1 ? (
          <Link
            className="rounded border px-3 py-2"
            href={`?${paramsString}&page=${page - 1}`}
          >
            이전
          </Link>
        ) : null}
        <span className="px-3 py-2">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link
            className="rounded border px-3 py-2"
            href={`?${paramsString}&page=${page + 1}`}
          >
            다음
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
