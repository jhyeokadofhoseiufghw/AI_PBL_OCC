import Link from "next/link";
import {
  getEventReservationOptions,
  getPublicEvent,
} from "@/features/events/queries";
import { ReservationForm } from "@/features/reservations/components/reservation-form";
import { WaitlistForm } from "@/features/reservations/components/waitlist-form";

export default async function ReservePage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getPublicEvent(eventSlug);
  const remaining = Number(event.remaining_count);
  const options =
    remaining > 0
      ? await getEventReservationOptions(String(event.id))
      : { ticketTypes: [], seats: [] };
  const info = {
    id: String(event.id),
    slug: String(event.slug),
    reservationType: String(event.reservation_type),
    ticketPrice: Number(event.ticket_price),
    maxTickets: Number(event.max_tickets_per_person),
    remaining,
    bankName: String(event.bank_name),
    accountNumber: String(event.account_number),
    accountHolder: String(event.account_holder),
  };
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8">
      <Link className="text-sm text-emerald-700" href={`/events/${eventSlug}`}>
        ← 공연 상세
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">
        {String(event.title)} {remaining > 0 ? "예매" : "매진"}
      </h1>
      <p className="mt-2 text-zinc-600">
        잔여 {remaining}석/매 · 1매{" "}
        {Number(event.ticket_price).toLocaleString("ko-KR")}원
      </p>
      {remaining > 0 ? (
        <div className="mt-8">
          <ReservationForm
            event={info}
            ticketTypes={options.ticketTypes.map((row) => ({
              id: String(row.id),
              name: String(row.name),
            }))}
            seats={options.seats.map((row) => ({
              id: String(row.id),
              label: String(row.label),
              occupied: Boolean(row.occupied),
              layoutRow: row.layout_row ? Number(row.layout_row) : null,
              layoutColumn: row.layout_column
                ? Number(row.layout_column)
                : null,
            }))}
          />
        </div>
      ) : info.reservationType === "FIRST_COME" ? (
        <WaitlistForm
          event={{ id: info.id, slug: info.slug, maxTickets: info.maxTickets }}
        />
      ) : (
        <p className="mt-8 rounded-xl bg-zinc-100 p-6 text-zinc-600">
          현재 선택 가능한 좌석이 없습니다.
        </p>
      )}
    </main>
  );
}
