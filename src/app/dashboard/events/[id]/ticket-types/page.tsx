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
    await sql`SELECT id,name FROM ticket_types WHERE event_id=${id} ORDER BY created_at`;
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{String(events[0].title)}</h1>
      <EventTabs current="ticket-types" eventId={id} />
      <form
        action={addTicketType}
        className="mt-8 flex gap-2 rounded-xl border bg-white p-5"
      >
        <input name="eventId" type="hidden" value={id} />
        <input
          className="flex-1 rounded-lg border px-3 py-2"
          name="name"
          placeholder="일반, 학생 등"
          required
        />
        <button className="rounded-lg bg-emerald-700 px-4 py-2 text-white">
          추가
        </button>
      </form>
      <div className="mt-5 space-y-2">
        {types.map((type) => (
          <div
            className="flex gap-2 rounded-lg border bg-white p-3"
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
