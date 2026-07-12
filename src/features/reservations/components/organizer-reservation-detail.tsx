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
    qr: string | null;
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
          {reservation.qr ? (
            <Image
              alt="예매 QR"
              className="mx-auto mt-5"
              height={200}
              src={reservation.qr}
              unoptimized
              width={200}
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
