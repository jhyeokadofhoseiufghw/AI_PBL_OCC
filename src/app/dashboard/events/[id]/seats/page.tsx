import { notFound } from "next/navigation";
import { EventTabs } from "@/features/events/components/event-tabs";
import { replaceSeatLayout } from "@/features/events/actions";
import { SeatGridManager } from "@/features/events/components/seat-grid-manager";
import { SeatLayoutBuilder } from "@/features/events/components/seat-layout-builder";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    requireOrganizer(),
  ]);
  const sql = getSql();
  const events =
    await sql`SELECT title,reservation_type,published_at FROM events WHERE id=${id} AND organizer_id=${session.organizerId}`;
  if (!events[0]) notFound();
  const seats =
    await sql`SELECT s.*,EXISTS(SELECT 1 FROM reservation_seats rs WHERE rs.seat_id=s.id AND rs.released_at IS NULL) occupied FROM seats s WHERE event_id=${id} ORDER BY label`;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="ha-kicker">Seat builder</p>
      <h1 className="ha-title mt-1 text-3xl">{String(events[0].title)}</h1>
      <EventTabs current="seats" eventId={id} />
      {events[0].reservation_type !== "SEAT_SELECTION" ? (
        <p className="mt-8 rounded-xl bg-zinc-100 p-6">
          선착순 공연은 좌석 목록을 사용하지 않습니다.
        </p>
      ) : (
        <>
          {!events[0].published_at ? (
            <form action={replaceSeatLayout} className="mt-8">
              <input name="eventId" type="hidden" value={id} />
              <SeatLayoutBuilder />
              <button className="ha-button-primary mt-4 w-full px-4 py-3">
                이 배치로 좌석 전체 다시 만들기
              </button>
              <p className="mt-2 text-xs text-zinc-500">
                저장하면 아래 기존 좌석이 새 배치로 교체됩니다.
              </p>
            </form>
          ) : (
            <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              최초 공개가 완료된 공연은 예매 안정성을 위해 좌석 배치를 변경할 수
              없습니다.
            </p>
          )}
          {query.error ? (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {query.error === "published"
                ? "최초 공개 후에는 좌석 배치를 변경할 수 없습니다."
                : query.error === "history"
                  ? "예매 이력이 있는 공연은 좌석 전체를 다시 만들 수 없습니다."
                  : "예매 중인 좌석은 비활성화할 수 없습니다."}
            </p>
          ) : null}
          <SeatGridManager
            editable={!events[0].published_at}
            eventId={id}
            seats={seats.map((seat) => ({
              id: String(seat.id),
              label: String(seat.label),
              isActive: Boolean(seat.is_active),
              occupied: Boolean(seat.occupied),
              layoutRow: seat.layout_row ? Number(seat.layout_row) : null,
              layoutColumn: seat.layout_column
                ? Number(seat.layout_column)
                : null,
            }))}
          />
        </>
      )}
    </main>
  );
}
