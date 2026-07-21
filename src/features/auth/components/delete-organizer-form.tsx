"use client";

import { useActionState } from "react";

import {
  deleteOrganizerAccount,
  type DeleteOrganizerState,
} from "../actions";

const input = "ha-input mt-2";

export function DeleteOrganizerForm() {
  const [state, action, pending] = useActionState<
    DeleteOrganizerState,
    FormData
  >(deleteOrganizerAccount, {});

  return (
    <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-red-800">계정 탈퇴</h2>
      <p className="mt-2 text-sm leading-6 text-red-700">
        탈퇴하면 등록한 모든 공연, 좌석, 예매자 정보와 QR 데이터가 함께
        삭제되며 복구할 수 없습니다.
      </p>
      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-red-900">
          현재 비밀번호
          <input
            autoComplete="current-password"
            className={input}
            name="password"
            required
            type="password"
          />
        </label>
        <label className="text-sm font-semibold text-red-900">
          확인 문구
          <input
            className={input}
            name="confirmation"
            placeholder="탈퇴합니다"
            required
          />
        </label>
        {state.error ? (
          <p className="text-sm text-red-700 sm:col-span-2" role="alert">
            {state.error}
          </p>
        ) : null}
        <button
          className="rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800 disabled:opacity-50 sm:col-span-2"
          disabled={pending}
          type="submit"
        >
          {pending ? "탈퇴 처리 중..." : "계정과 모든 데이터 삭제"}
        </button>
      </form>
    </section>
  );
}
