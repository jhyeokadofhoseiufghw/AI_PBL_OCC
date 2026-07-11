import Link from "next/link";

import { getEventReservationOptions, getPublicEvent } from "@/features/events/queries";
import { ReservationForm } from "@/features/reservations/components/reservation-form";

export default async function ReservePage({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await params;
  const event = await getPublicEvent(eventSlug);
  const options = await getEventReservationOptions(String(event.id));
  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-8"><Link className="text-sm text-emerald-700" href={`/events/${eventSlug}`}>← 공연 상세</Link><h1 className="mt-6 text-2xl font-semibold">{String(event.title)} 예매</h1><p className="mt-2 text-zinc-600">잔여 {Number(event.remaining_count)}석/매 · 1매 {Number(event.ticket_price).toLocaleString("ko-KR")}원</p><div className="mt-8"><ReservationForm event={{ id: String(event.id), slug: String(event.slug), reservationType: String(event.reservation_type), ticketPrice: Number(event.ticket_price), maxTickets: Number(event.max_tickets_per_person), remaining: Number(event.remaining_count), bankName: String(event.bank_name), accountNumber: String(event.account_number), accountHolder: String(event.account_holder) }} ticketTypes={options.ticketTypes.map((row) => ({ id: String(row.id), name: String(row.name) }))} seats={options.seats.map((row) => ({ id: String(row.id), label: String(row.label), occupied: Boolean(row.occupied) }))} /></div></main>;
}
