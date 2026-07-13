"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { cancelReservation, lookupReservation } from "../actions";

const input = "ha-input mt-2";
const labels: Record<string, string> = {
  PENDING_PAYMENT: "입금 확인 대기",
  CONFIRMED: "예매 확정",
  CHECKED_IN: "입장 완료",
  CANCELLED: "취소",
  WAITLISTED: "대기 신청",
};

type TicketView = {
  number: number;
  seat: string | null;
  qrImageData: string | null;
  qrStatus: string;
  checkedInAt: string | null;
};

function TicketQrCarousel({ tickets }: { tickets: TicketView[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const ticket = tickets[index];
  const move = (next: number) =>
    setIndex(Math.max(0, Math.min(tickets.length - 1, next)));

  return (
    <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f8f9ff] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          aria-label="이전 티켓"
          className="ha-button-secondary px-4 py-2 disabled:opacity-30"
          disabled={index === 0}
          onClick={() => move(index - 1)}
          type="button"
        >
          ←
        </button>
        <p className="text-sm font-medium">
          {index + 1} / {tickets.length}
        </p>
        <button
          aria-label="다음 티켓"
          className="ha-button-secondary px-4 py-2 disabled:opacity-30"
          disabled={index === tickets.length - 1}
          onClick={() => move(index + 1)}
          type="button"
        >
          →
        </button>
      </div>
      <article
        className="relative mx-auto mt-4 max-w-sm overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-xl before:absolute before:-left-2 before:top-8 before:h-4 before:w-4 before:rounded-full before:bg-[#f8f9ff] after:absolute after:-right-2 after:top-8 after:h-4 after:w-4 after:rounded-full after:bg-[#f8f9ff]"
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const distance =
            event.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(distance) > 45) move(index + (distance < 0 ? 1 : -1));
          touchStartX.current = null;
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
      >
        <p className="text-center font-semibold">
          티켓 {ticket.number}
          {ticket.seat ? ` · ${ticket.seat}` : ""}
        </p>
        {ticket.checkedInAt ? (
          <p className="mt-3 rounded-lg bg-[#eff3ff] p-3 text-center text-sm text-[#60687a]">
            입장 완료 · {new Date(ticket.checkedInAt).toLocaleString("ko-KR")}
          </p>
        ) : ticket.qrImageData ? (
          <Image
            alt={`티켓 ${ticket.number} 입장 QR 코드`}
            className="mx-auto mt-3 h-56 w-56"
            height={224}
            src={ticket.qrImageData}
            unoptimized
            width={224}
          />
        ) : (
          <p className="mt-3 rounded-lg bg-[#fff4d7] p-3 text-sm text-[#7a4f00]">
            QR 생성 중이거나 재시도가 필요합니다.
          </p>
        )}
      </article>
      <div className="mt-4 flex justify-center gap-2" aria-label="티켓 선택">
        {tickets.map((item, itemIndex) => (
          <button
            aria-label={`티켓 ${item.number} 보기`}
            className={`h-2.5 w-2.5 rounded-full ${itemIndex === index ? "bg-[#712ae2]" : "bg-[#d9e3f7]"}`}
            key={item.number}
            onClick={() => move(itemIndex)}
            type="button"
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        화면을 좌우로 밀거나 화살표를 눌러 티켓을 한 장씩 확인하세요.
      </p>
    </section>
  );
}

export function LookupForm({
  mode = "detail",
}: {
  mode?: "status" | "detail";
}) {
  const [lookup, lookupAction, lookupPending] = useActionState(
    lookupReservation,
    {},
  );
  const [cancel, cancelAction, cancelPending] = useActionState(
    cancelReservation,
    {},
  );
  const [values, setValues] = useState({
    name: "",
    phone: "",
    lookupPassword: "",
  });
  const [openedAt] = useState(() => Date.now());
  const reservation = cancel.reservation ?? lookup.reservation;
  const fields = (
    <>
      {Object.entries(values).map(([key, value]) => (
        <input key={key} name={key} type="hidden" value={value} />
      ))}
    </>
  );
  return (
    <div className="mt-8 space-y-6">
      <form
        action={lookupAction}
        autoComplete="on"
        className="ha-card grid gap-5 p-5 sm:grid-cols-2 sm:p-7"
      >
        <label className="font-semibold">
          이름
          <input
            autoComplete="name"
            className={input}
            name="name"
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            required
            value={values.name}
          />
        </label>
        <label className="font-semibold">
          연락처
          <input
            autoComplete="tel"
            className={input}
            inputMode="tel"
            name="phone"
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            required
            placeholder="010-1234-5678 또는 01012345678"
            type="tel"
            value={values.phone}
          />
        </label>
        <label className="font-semibold sm:col-span-2">
          조회 패스워드
          <input
            className={input}
            inputMode="numeric"
            name="lookupPassword"
            onChange={(e) =>
              setValues({ ...values, lookupPassword: e.target.value })
            }
            pattern="[0-9]{4,6}"
            required
            type="password"
            value={values.lookupPassword}
          />
        </label>
        {lookup.error ? (
          <div
            className="rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-700 sm:col-span-2"
            role="alert"
          >
            <p className="font-medium">예매 정보를 확인하지 못했습니다.</p>
            <p className="mt-1">{lookup.error}</p>
          </div>
        ) : null}
        <button
          className="ha-button-primary px-5 py-3 sm:col-span-2"
          disabled={lookupPending}
        >
          {lookupPending ? "조회 중..." : "예매 조회"}
        </button>
      </form>
      {lookup.candidates ? (
        <section className="ha-card scroll-mt-6 p-5" id="reservation-list">
          <h2 className="font-semibold">조회할 예매를 선택해주세요</h2>
          <p className="mt-1 text-sm text-zinc-500">
            같은 정보로 예매한 공연이 여러 건 있습니다.
          </p>
          <div className="mt-3 space-y-2">
            {lookup.candidates.map((candidate) => (
              <form
                action={lookupAction}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                key={candidate.id}
              >
                {fields}
                <input
                  name="reservationId"
                  type="hidden"
                  value={candidate.id}
                />
                <span className="text-sm">
                  <b className="block text-base">{candidate.eventTitle}</b>
                  <span className="mt-1 block text-zinc-600">
                    공연{" "}
                    {new Date(candidate.eventStartAt).toLocaleString("ko-KR")} ·{" "}
                    {candidate.quantity}매 · {labels[candidate.status]}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-400">
                    예매 {new Date(candidate.createdAt).toLocaleString("ko-KR")}
                  </span>
                </span>
                <button className="rounded border px-3 py-2 text-sm">
                  선택
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : null}
      {reservation ? (
        <section className="ha-card overflow-hidden p-6 sm:p-8">
          {lookup.candidates ? (
            <a
              className="mb-5 inline-flex rounded-lg border px-3 py-2 text-sm text-emerald-700"
              href="#reservation-list"
            >
              ← 예매 목록으로 돌아가기
            </a>
          ) : null}
          <span className="ha-status">
            {labels[reservation.status] ?? reservation.status}
          </span>
          <h2 className="ha-title mt-3 text-2xl">{reservation.eventTitle}</h2>
          <dl className="mt-5 space-y-2 border-y border-dashed border-[#ccc3d6] py-5 text-sm">
            <div>예매자 {reservation.name}</div>
            <div>
              {reservation.quantity}매 ·{" "}
              {reservation.totalPrice.toLocaleString("ko-KR")}원
            </div>
            {reservation.seats.length ? (
              <div>좌석 {reservation.seats.join(", ")}</div>
            ) : null}
            {reservation.reservationCode ? (
              <div className="font-semibold">
                예매번호 {reservation.reservationCode}
              </div>
            ) : null}
          </dl>
          {reservation.checkedInAt ? (
            <p className="mt-5 rounded-lg bg-[#e8fff5] p-3 text-sm text-[#006c4c]">
              입장 완료 ·{" "}
              {new Date(reservation.checkedInAt).toLocaleString("ko-KR")}
            </p>
          ) : null}
          {reservation.tickets.length ? (
            <TicketQrCarousel
              key={reservation.id}
              tickets={reservation.tickets}
            />
          ) : null}
          {mode === "detail" &&
          ["PENDING_PAYMENT", "CONFIRMED"].includes(reservation.status) &&
          new Date(reservation.cancelDeadline).getTime() > openedAt ? (
            <form action={cancelAction} className="mt-6">
              {fields}
              <input
                name="reservationId"
                type="hidden"
                value={reservation.id}
              />
              <button
                className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700"
                disabled={cancelPending}
              >
                {cancelPending ? "취소 중..." : "예매 취소"}
              </button>
            </form>
          ) : null}
          {cancel.error ? (
            <p className="mt-3 text-sm text-red-700">{cancel.error}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
