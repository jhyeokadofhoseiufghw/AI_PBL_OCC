"use client";

import { useActionState, useMemo, useState } from "react";

import { createReservation } from "../actions";

type Option = {
  id: string;
  name?: string;
  label?: string;
  occupied?: boolean;
  layoutRow?: number | null;
  layoutColumn?: number | null;
};
type Props = {
  event: {
    id: string;
    slug: string;
    reservationType: string;
    ticketPrice: number;
    maxTickets: number;
    remaining: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  ticketTypes: Option[];
  seats: Option[];
};

const input =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600";

export function ReservationForm({ event, ticketTypes, seats }: Props) {
  const [state, action, pending] = useActionState(createReservation, {});
  const [quantity, setQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [accountConfirmed, setAccountConfirmed] = useState(false);
  const isSeatSelection = event.reservationType === "SEAT_SELECTION";
  const actualQuantity = isSeatSelection ? selectedSeats.length : quantity;
  const total = useMemo(
    () => event.ticketPrice * actualQuantity,
    [actualQuantity, event.ticketPrice],
  );

  return (
    <form action={action} className="space-y-6">
      <input name="eventId" type="hidden" value={event.id} />
      <input name="eventSlug" type="hidden" value={event.slug} />
      <input name="quantity" type="hidden" value={actualQuantity} />
      {isSeatSelection ? (
        <section>
          <h2 className="font-semibold">좌석 선택</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border bg-zinc-50 p-4">
            <div className="mb-4 rounded bg-zinc-800 py-2 text-center text-xs text-white">
              STAGE
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.max(4, ...seats.map((seat) => seat.layoutColumn ?? 0))}, minmax(3rem, 1fr))`,
              }}
            >
              {seats.map((seat) => {
                const selected = selectedSeats.includes(seat.id);
                return (
                  <label
                    className={`rounded-lg border p-2 text-center text-sm ${seat.occupied ? "cursor-not-allowed bg-zinc-100 text-zinc-400" : selected ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "bg-white"}`}
                    key={seat.id}
                    style={
                      seat.layoutColumn
                        ? {
                            gridColumn: seat.layoutColumn,
                            gridRow: seat.layoutRow ?? undefined,
                          }
                        : undefined
                    }
                  >
                    <input
                      className="sr-only"
                      disabled={seat.occupied}
                      name="seatIds"
                      onChange={() =>
                        setSelectedSeats((current) =>
                          selected
                            ? current.filter((id) => id !== seat.id)
                            : current.length < event.maxTickets
                              ? [...current, seat.id]
                              : current,
                        )
                      }
                      type="checkbox"
                      value={seat.id}
                    />
                    {seat.label}
                  </label>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            최대 {event.maxTickets}석까지 선택할 수 있습니다.
          </p>
        </section>
      ) : (
        <label className="block font-medium">
          예매 매수
          <select
            className={input}
            name="quantityDisplay"
            onChange={(e) => setQuantity(Number(e.target.value))}
            value={quantity}
          >
            {Array.from(
              { length: Math.min(event.maxTickets, event.remaining) },
              (_, i) => i + 1,
            ).map((count) => (
              <option key={count} value={count}>
                {count}매
              </option>
            ))}
          </select>
        </label>
      )}
      {ticketTypes.length ? (
        <label className="block font-medium">
          티켓 타입
          <select className={input} name="ticketTypeId" required>
            <option value="">선택해주세요</option>
            {ticketTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input name="ticketTypeId" type="hidden" value="" />
      )}
      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
        <label className="font-medium">
          이름
          <input className={input} name="name" required />
        </label>
        <label className="font-medium">
          연락처
          <input className={input} name="phone" required />
        </label>
        <label className="font-medium">
          입금자명
          <input className={input} name="depositorName" required />
        </label>
        <label className="font-medium">
          조회 패스워드
          <input
            className={input}
            inputMode="numeric"
            name="lookupPassword"
            pattern="[0-9]{4,6}"
            placeholder="숫자 4~6자리"
            required
          />
        </label>
        <label className="font-medium sm:col-span-2">
          요청사항
          <textarea className={input} name="requestNote" rows={3} />
        </label>
      </section>
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm text-emerald-900">최종 입금 금액</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-950">
          {total.toLocaleString("ko-KR")}원
        </p>
        {accountConfirmed ? (
          <dl className="mt-4 grid gap-1 text-sm">
            <div>
              <dt className="inline text-zinc-500">은행 </dt>
              <dd className="inline">{event.bankName}</dd>
            </div>
            <div>
              <dt className="inline text-zinc-500">계좌 </dt>
              <dd className="inline">{event.accountNumber}</dd>
            </div>
            <div>
              <dt className="inline text-zinc-500">예금주 </dt>
              <dd className="inline">{event.accountHolder}</dd>
            </div>
          </dl>
        ) : null}
      </section>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {!accountConfirmed ? (
        <button
          className="w-full rounded-lg border border-emerald-700 px-5 py-3 font-medium text-emerald-800"
          disabled={actualQuantity < 1}
          onClick={() => setAccountConfirmed(true)}
          type="button"
        >
          계좌 정보 확인
        </button>
      ) : (
        <button
          className="w-full rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white disabled:opacity-50"
          disabled={pending || actualQuantity < 1}
          type="submit"
        >
          {pending ? "신청 중..." : "최종 예매 신청"}
        </button>
      )}
    </form>
  );
}
