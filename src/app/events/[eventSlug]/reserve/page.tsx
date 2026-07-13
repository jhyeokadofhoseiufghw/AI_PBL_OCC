import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
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
    <div className="min-h-screen bg-[#f8f9ff]">
      <PublicHeader />
      <main className="public-shell py-8 sm:py-12">
        <Link
          className="text-sm font-bold text-[#420093]"
          href={`/events/${eventSlug}`}
        >
          ← 공연 상세
        </Link>
        <div className="mt-7 border-b border-[#e5e7eb] pb-7 text-center">
          <p className="ha-kicker">Ticket reservation</p>
          <h1 className="ha-title mt-2 text-3xl sm:text-4xl">
            {String(event.title)}
          </h1>
          <p className="mt-3 text-sm text-[#60687a]">
            잔여 {remaining}석/매 · 기본 가격 1매{" "}
            {Number(event.ticket_price).toLocaleString("ko-KR")}원
          </p>
        </div>
        {remaining > 0 ? (
          <div className="mt-8">
            <ReservationForm
              event={info}
              ticketTypes={options.ticketTypes.map((row) => ({
                id: String(row.id),
                name: String(row.name),
                price: Number(row.price),
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
            event={{
              id: info.id,
              slug: info.slug,
              maxTickets: info.maxTickets,
            }}
          />
        ) : (
          <p className="ha-card mt-8 p-8 text-center text-[#60687a]">
            현재 선택 가능한 좌석이 없습니다.
          </p>
        )}
      </main>
    </div>
  );
}
