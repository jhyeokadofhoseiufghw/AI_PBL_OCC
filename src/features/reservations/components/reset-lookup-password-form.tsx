"use client";

import { useActionState } from "react";

import {
  resetReservationLookupPassword,
  type ResetLookupPasswordState,
} from "../actions";

function maskedPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export function ResetLookupPasswordForm({
  eventId,
  reservationId,
  phone,
}: {
  eventId: string;
  reservationId: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState<
    ResetLookupPasswordState,
    FormData
  >(resetReservationLookupPassword, {});

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded border px-2 py-1 text-xs">
        조회 PW 초기화
      </summary>
      <form
        action={action}
        className="absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-white p-4 shadow-xl"
      >
        <input name="eventId" type="hidden" value={eventId} />
        <input name="reservationId" type="hidden" value={reservationId} />
        <p className="text-sm font-bold text-[#250059]">역전화 확인 후 초기화</p>
        <p className="mt-2 text-xs leading-5 text-[#60687a]">
          예매에 저장된 {maskedPhone(phone)} 번호로 직접 전화해 본인 확인을
          완료한 경우에만 진행하세요.
        </p>
        <label className="mt-3 flex items-start gap-2 text-xs leading-5">
          <input className="mt-1" name="callbackConfirmed" type="checkbox" />
          저장된 연락처로 역전화 확인을 완료했습니다.
        </label>
        {state.error ? (
          <p className="mt-3 text-xs text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.temporaryPassword ? (
          <div className="mt-3 rounded-lg bg-[#ebddff] p-3 text-center">
            <p className="text-xs text-[#60687a]">한 번만 표시되는 임시 번호</p>
            <p className="mt-1 text-2xl font-black tracking-[0.25em] text-[#420093]">
              {state.temporaryPassword}
            </p>
            <p className="mt-2 text-xs text-[#60687a]">
              통화 중 예매자에게 전달해주세요.
            </p>
          </div>
        ) : (
          <button
            className="mt-4 w-full rounded-lg bg-[#420093] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? "초기화 중..." : "임시 패스워드 발급"}
          </button>
        )}
      </form>
    </details>
  );
}
