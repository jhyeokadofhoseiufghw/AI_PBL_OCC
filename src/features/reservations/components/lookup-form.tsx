"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cancelReservation, lookupReservation } from "../actions";

const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2";
const labels: Record<string, string> = {
  PENDING_PAYMENT: "입금 확인 대기",
  CONFIRMED: "예매 확정",
  CHECKED_IN: "입장 완료",
  CANCELLED: "취소",
  WAITLISTED: "대기 신청",
};

export function LookupForm({
  initialEvent = "",
  mode = "detail",
}: {
  initialEvent?: string;
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
    eventSlug: initialEvent,
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
        className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2"
      >
        <label className="font-medium sm:col-span-2">
          공연 주소 이름
          <input
            className={input}
            name="eventSlug"
            onChange={(e) =>
              setValues({ ...values, eventSlug: e.target.value })
            }
            placeholder="예: spring-concert"
            required
            value={values.eventSlug}
          />
        </label>
        <label className="font-medium">
          이름
          <input
            className={input}
            name="name"
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            required
            value={values.name}
          />
        </label>
        <label className="font-medium">
          연락처
          <input
            className={input}
            name="phone"
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            required
            value={values.phone}
          />
        </label>
        <label className="font-medium sm:col-span-2">
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
          className="rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white sm:col-span-2"
          disabled={lookupPending}
        >
          {lookupPending ? "조회 중..." : "예매 조회"}
        </button>
      </form>
      {lookup.candidates ? (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">조회할 예매를 선택해주세요</h2>
          <div className="mt-3 space-y-2">
            {lookup.candidates.map((candidate) => (
              <form
                action={lookupAction}
                className="flex items-center justify-between rounded-lg border p-3"
                key={candidate.id}
              >
                {fields}
                <input
                  name="reservationId"
                  type="hidden"
                  value={candidate.id}
                />
                <span className="text-sm">
                  {new Date(candidate.createdAt).toLocaleString("ko-KR")} ·{" "}
                  {candidate.quantity}매 · {labels[candidate.status]}
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
        <section className="rounded-xl border bg-white p-6">
          <p className="text-sm text-emerald-700">
            {labels[reservation.status] ?? reservation.status}
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {reservation.eventTitle}
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
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
          {mode === "detail" && reservation.checkedInAt ? (
            <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              입장 완료 ·{" "}
              {new Date(reservation.checkedInAt).toLocaleString("ko-KR")}
            </p>
          ) : null}
          {mode === "detail" && reservation.tickets.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {reservation.tickets.map((ticket) => (
                <article className="rounded-xl border p-4" key={ticket.number}>
                  <p className="text-center font-semibold">
                    티켓 {ticket.number}
                    {ticket.seat ? ` · ${ticket.seat}` : ""}
                  </p>
                  {ticket.checkedInAt ? (
                    <p className="mt-3 rounded-lg bg-zinc-100 p-3 text-center text-sm text-zinc-600">
                      입장 완료 ·{" "}
                      {new Date(ticket.checkedInAt).toLocaleString("ko-KR")}
                    </p>
                  ) : ticket.qrImageData ? (
                    <Image
                      alt={`티켓 ${ticket.number} 입장 QR 코드`}
                      className="mx-auto mt-3 h-48 w-48"
                      height={192}
                      src={ticket.qrImageData}
                      unoptimized
                      width={192}
                    />
                  ) : (
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      QR 생성 중이거나 재시도가 필요합니다.
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : null}
          {mode === "status" && reservation.status === "CONFIRMED" ? (
            <Link
              className="mt-5 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-white"
              href={`/reservation/detail?event=${encodeURIComponent(reservation.eventSlug)}`}
            >
              예매 상세·QR 확인
            </Link>
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
