"use client";
import { useRef } from "react";
import Image from "next/image";
export function OrganizerReservationDetail({
  reservation,
}: {
  reservation: {
    name: string;
    phone: string;
    depositor: string;
    quantity: number;
    totalPrice: number;
    status: string;
    code: string | null;
    note: string | null;
    tickets: {
      number: number;
      seat: string | null;
      qr: string | null;
      checkedInAt: string | null;
    }[];
  };
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="rounded border px-2 py-1"
        onClick={() => ref.current?.showModal()}
        type="button"
      >
        상세
      </button>
      <dialog
        className="m-auto w-[min(92vw,28rem)] rounded-2xl p-0 backdrop:bg-black/40"
        ref={ref}
      >
        <div className="p-6">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">예매 상세</h2>
            <button onClick={() => ref.current?.close()} type="button">
              ✕
            </button>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div>
              예매자 {reservation.name} · {reservation.phone}
            </div>
            <div>입금자 {reservation.depositor}</div>
            <div>
              {reservation.quantity}매 ·{" "}
              {reservation.totalPrice.toLocaleString("ko-KR")}원
            </div>
            <div>상태 {reservation.status}</div>
            {reservation.code ? <div>예매번호 {reservation.code}</div> : null}
            {reservation.note ? (
              <div className="rounded bg-zinc-100 p-3">
                요청사항: {reservation.note}
              </div>
            ) : null}
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {reservation.tickets.map((ticket) => (
              <div
                className="rounded-lg border p-2 text-center"
                key={ticket.number}
              >
                <p className="text-sm font-medium">
                  티켓 {ticket.number}
                  {ticket.seat ? ` · ${ticket.seat}` : ""}
                </p>
                {ticket.checkedInAt ? (
                  <p className="mt-2 text-xs text-emerald-700">입장 완료</p>
                ) : ticket.qr ? (
                  <Image
                    alt={`티켓 ${ticket.number} QR`}
                    className="mx-auto mt-2 max-sm:h-auto max-sm:max-w-full"
                    height={160}
                    src={ticket.qr}
                    unoptimized
                    width={160}
                  />
                ) : (
                  <p className="mt-2 text-xs text-amber-700">QR 생성 대기</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
