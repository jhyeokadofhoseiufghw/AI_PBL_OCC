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
  price?: number;
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
    inquiryContact: string;
  };
  ticketTypes: Option[];
  seats: Option[];
};

const input = "ha-input mt-2";

export function ReservationForm({ event, ticketTypes, seats }: Props) {
  const [state, action, pending] = useActionState(createReservation, {});
  const [quantity, setQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [ticketTypeId, setTicketTypeId] = useState("");
  const isSeatSelection = event.reservationType === "SEAT_SELECTION";
  const actualQuantity = isSeatSelection ? selectedSeats.length : quantity;
  const unitPrice =
    ticketTypes.find((type) => type.id === ticketTypeId)?.price ??
    event.ticketPrice;
  const total = useMemo(
    () => unitPrice * actualQuantity,
    [actualQuantity, unitPrice],
  );

  return (
    <form action={action}>
      <input name="eventId" type="hidden" value={event.id} />
      <input name="eventSlug" type="hidden" value={event.slug} />
      <input name="quantity" type="hidden" value={actualQuantity} />
      {isSeatSelection ? (
        <section className="ha-card p-4 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="ha-kicker">Step 1</p>
              <h2 className="ha-title mt-1 text-xl">좌석 선택</h2>
            </div>
            <div className="flex gap-4 text-xs text-[#60687a]">
              <span>□ 선택 가능</span>
              <span className="font-bold text-[#712ae2]">■ 선택</span>
              <span>■ 예매 완료</span>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl bg-[#f7f5ff] p-4 sm:p-6">
            <div className="mb-8 border-t-4 border-[#d3bbff] pt-2 text-center text-xs font-black tracking-[0.35em] text-[#7b7485]">
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
                    className={`cursor-pointer rounded-lg border p-2 text-center text-sm font-semibold transition ${seat.occupied ? "cursor-not-allowed border-[#d9e3f7] bg-[#d9e3f7] text-[#9ba3b1]" : selected ? "border-[#712ae2] bg-[#712ae2] text-white shadow-md" : "border-[#ccc3d6] bg-white hover:border-[#712ae2] hover:text-[#420093]"}`}
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
          <p className="mt-3 text-xs text-[#60687a]">
            최대 {event.maxTickets}석까지 선택할 수 있습니다.
          </p>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="ha-card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <div className="sm:col-span-2">
            <p className="ha-kicker">Step {isSeatSelection ? "2" : "1"}</p>
            <h2 className="ha-title mt-1 text-xl">예매자 정보 입력</h2>
          </div>
          {!isSeatSelection ? (
            <label className="block font-semibold">
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
          ) : null}
          {ticketTypes.length ? (
            <label className="block font-semibold">
              티켓 타입
              <select
                className={input}
                name="ticketTypeId"
                onChange={(changeEvent) =>
                  setTicketTypeId(changeEvent.target.value)
                }
                required
                value={ticketTypeId}
              >
                <option value="">선택해주세요</option>
                {ticketTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} · {Number(type.price).toLocaleString("ko-KR")}원
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input name="ticketTypeId" type="hidden" value="" />
          )}
          <label className="font-semibold">
            이름
            <input autoComplete="name" className={input} name="name" required />
          </label>
          <label className="font-semibold">
            연락처
            <input
              autoComplete="tel"
              className={input}
              name="phone"
              placeholder="010-1234-5678"
              required
            />
          </label>
          <label className="font-semibold">
            입금자명
            <input className={input} name="depositorName" required />
          </label>
          <label className="font-semibold">
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
          <label className="font-semibold sm:col-span-2">
            요청사항 <span className="font-normal text-[#60687a]">(선택)</span>
            <textarea className={input} name="requestNote" rows={3} />
          </label>
        </section>
        <aside className="ha-card h-fit overflow-hidden lg:sticky lg:top-24">
          <div className="bg-gradient-to-r from-[#420093] to-[#712ae2] p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d3bbff]">
              Order Summary
            </p>
            <h2 className="mt-1 text-xl font-bold">결제 정보</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-[#60687a]">최종 입금 금액</p>
            <p className="mt-1 text-xs text-[#60687a]">
              1매 {unitPrice.toLocaleString("ko-KR")}원 × {actualQuantity}매
            </p>
            <p className="mt-2 text-3xl font-black text-[#420093]">
              {total.toLocaleString("ko-KR")}원
            </p>
            {isSeatSelection ? (
              <p className="mt-4 rounded-lg bg-[#ebddff] p-3 text-sm font-semibold text-[#420093]">
                선택 좌석:{" "}
                {seats
                  .filter((seat) => selectedSeats.includes(seat.id))
                  .map((seat) => seat.label)
                  .join(", ") || "좌석을 선택해주세요"}
              </p>
            ) : null}
            <dl className="mt-5 grid gap-2 border-t border-[#e5e7eb] pt-5 text-sm">
              <div>
                <dt className="inline text-zinc-500">은행 </dt>
                <dd className="inline font-medium">{event.bankName}</dd>
              </div>
              <div>
                <dt className="inline text-zinc-500">계좌 </dt>
                <dd className="inline font-medium">{event.accountNumber}</dd>
              </div>
              <div>
                <dt className="inline text-zinc-500">예금주 </dt>
                <dd className="inline font-medium">{event.accountHolder}</dd>
              </div>
            </dl>
            {event.inquiryContact ? (
              <div className="mt-5 rounded-xl bg-[#f7f5ff] p-4 text-sm">
                <p className="font-bold text-[#420093]">환불 및 공연 문의</p>
                <p className="mt-2 whitespace-pre-wrap break-words leading-6 text-[#4a4453]">
                  {event.inquiryContact}
                </p>
                {/https?:\/\/\S+/.test(event.inquiryContact) ? (
                  <a
                    className="mt-3 inline-flex font-bold text-[#420093] underline"
                    href={event.inquiryContact.match(/https?:\/\/\S+/)?.[0]}
                    rel="noreferrer"
                    target="_blank"
                  >
                    문의 링크 열기 ↗
                  </a>
                ) : null}
              </div>
            ) : null}
            {state.error ? (
              <p
                className="mt-4 rounded-lg bg-[#ffdad6] p-3 text-sm text-[#93000a]"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}
            <button
              className="ha-button-primary mt-6 w-full px-5 py-3.5 disabled:opacity-50"
              disabled={pending || actualQuantity < 1}
              type="submit"
            >
              {pending ? "예매 중..." : "입금 안내 확인 및 예매 완료 →"}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}
