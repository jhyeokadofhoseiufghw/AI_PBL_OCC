import { notFound } from "next/navigation";
import { EventTabs } from "@/features/events/components/event-tabs";
import {
  addTicketType,
  deleteTicketType,
  updateTicketType,
} from "@/features/events/actions";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, requireOrganizer()]);
  const sql = getSql();
  const events =
    await sql`SELECT title FROM events WHERE id=${id} AND organizer_id=${session.organizerId}`;
  if (!events[0]) notFound();
  const types =
    await sql`SELECT id,name,price FROM ticket_types WHERE event_id=${id} ORDER BY created_at`;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="ha-kicker">Ticket types</p>
      <h1 className="ha-title mt-1 text-3xl">{String(events[0].title)}</h1>
      <EventTabs current="ticket-types" eventId={id} />
      <form
        action={addTicketType}
        className="ha-card mt-8 flex flex-wrap gap-2 p-5"
      >
        <input name="eventId" type="hidden" value={id} />
        <input
          className="ha-input min-w-48 flex-1"
          name="name"
          placeholder="일반, 학생 등"
          required
        />
        <input
          className="ha-input w-36"
          min={0}
          name="price"
          placeholder="가격(원)"
          required
          step={100}
          type="number"
        />
        <button className="ha-button-primary px-4 py-2">추가</button>
      </form>
      <div className="mt-5 space-y-2">
        {types.map((type) => (
          <div
            className="ha-card flex flex-wrap gap-2 p-3"
            key={String(type.id)}
          >
            <form action={updateTicketType} className="flex flex-1 gap-2">
              <input name="eventId" type="hidden" value={id} />
              <input
                name="ticketTypeId"
                type="hidden"
                value={String(type.id)}
              />
              <input
                className="w-36 rounded border px-3 py-2"
                defaultValue={Number(type.price)}
                min={0}
                name="price"
                required
                step={100}
                type="number"
              />
              <input
                className="flex-1 rounded border px-3 py-2"
                name="name"
                defaultValue={String(type.name)}
              />
              <button className="rounded border px-3 py-2">수정</button>
            </form>
            <form action={deleteTicketType}>
              <input name="eventId" type="hidden" value={id} />
              <input
                name="ticketTypeId"
                type="hidden"
                value={String(type.id)}
              />
              <button className="rounded border border-red-200 px-3 py-2 text-red-700">
                삭제
              </button>
            </form>
          </div>
        ))}
        {!types.length ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-zinc-500">
            티켓 타입이 없습니다. 타입 없이도 예매를 받을 수 있습니다.
          </p>
        ) : null}
      </div>
    </main>
  );
}
