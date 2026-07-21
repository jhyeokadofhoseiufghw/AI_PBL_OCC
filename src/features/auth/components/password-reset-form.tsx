"use client";

import { useActionState, useState, useTransition } from "react";

import {
  resetOrganizerPassword,
  sendPasswordResetCode,
} from "../actions";

const input = "ha-input mt-2";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [, startVerificationTransition] = useTransition();
  const [state, action, pending] = useActionState(resetOrganizerPassword, {});
  const [verificationState, sendAction, sending] = useActionState(
    sendPasswordResetCode,
    {},
  );

  return (
    <form action={action} className="ha-card mt-8 space-y-5 p-6 sm:p-8">
      <div>
        <label className="block text-sm font-semibold" htmlFor="reset-email">
          가입 이메일
        </label>
        <div className="flex items-start gap-2">
          <input
            autoComplete="email"
            className={input}
            id="reset-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <button
            className="ha-button-secondary mt-2 shrink-0 px-4 py-3 text-sm disabled:opacity-60"
            disabled={pending || sending || !email}
            onClick={() => {
              const data = new FormData();
              data.set("email", email);
              startVerificationTransition(() => sendAction(data));
            }}
            type="button"
          >
            {sending ? "발송 중..." : "인증번호 보내기"}
          </button>
        </div>
      </div>
      <label className="block text-sm font-semibold">
        이메일 인증번호
        <input
          autoComplete="one-time-code"
          className={input}
          inputMode="numeric"
          maxLength={6}
          name="verificationCode"
          pattern="[0-9]{6}"
          placeholder="6자리 인증번호"
          required
        />
      </label>
      <label className="block text-sm font-semibold">
        새 비밀번호
        <input
          autoComplete="new-password"
          className={input}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="block text-sm font-semibold">
        새 비밀번호 확인
        <input
          autoComplete="new-password"
          className={input}
          minLength={8}
          name="passwordConfirmation"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {verificationState.error ? (
        <p className="text-sm text-red-700" role="alert">
          {verificationState.error}
        </p>
      ) : null}
      {verificationState.success ? (
        <p className="text-sm text-emerald-700" role="status">
          {verificationState.success}
        </p>
      ) : null}
      <button
        className="ha-button-primary w-full px-4 py-3 text-sm disabled:opacity-60"
        disabled={pending || sending}
        type="submit"
      >
        {pending ? "변경 중..." : "새 비밀번호 저장"}
      </button>
    </form>
  );
}
