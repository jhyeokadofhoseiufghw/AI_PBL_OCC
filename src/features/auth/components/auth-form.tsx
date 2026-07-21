"use client";

import { useActionState, useState } from "react";

import {
  sendEmailVerificationCode,
  type AuthActionState,
} from "../actions";

const inputClassName = "ha-input mt-2";

type Props = {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  mode: "login" | "signup";
};

export function AuthForm({ action, mode }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [emailState, setEmailState] = useState("");
  const [verificationState, sendVerificationAction, sendingVerification] =
    useActionState(sendEmailVerificationCode, {});
  const isSignUp = mode === "signup";

  return (
    <form action={formAction} className="ha-card mt-8 space-y-5 p-6 sm:p-8">
      {isSignUp ? (
        <>
          <label className="block text-sm font-semibold">
            이름
            <input className={inputClassName} name="name" required />
          </label>
          <label className="block text-sm font-semibold">
            연락처
            <input className={inputClassName} name="phone" required />
          </label>
          <label className="block text-sm font-semibold">
            단체명
            <input
              className={inputClassName}
              name="organizationName"
              required
            />
          </label>
        </>
      ) : null}
      <div>
        <label className="block text-sm font-semibold" htmlFor="auth-email">
          이메일
        </label>
        <div className={isSignUp ? "flex items-start gap-2" : undefined}>
          <input
            autoComplete="email"
            className={inputClassName}
            id="auth-email"
            name="email"
            onChange={(event) => setEmailState(event.target.value)}
            required
            type="email"
            value={emailState}
          />
          {isSignUp ? (
            <button
              className="ha-button-secondary mt-2 shrink-0 px-4 py-3 text-sm disabled:opacity-60"
              disabled={pending || sendingVerification || !emailState}
              formAction={sendVerificationAction}
              formNoValidate
              type="submit"
            >
              {sendingVerification ? "발송 중..." : "인증번호 보내기"}
            </button>
          ) : null}
        </div>
      </div>
      {isSignUp ? (
        <label className="block text-sm font-semibold">
          이메일 인증번호
          <input
            autoComplete="one-time-code"
            className={inputClassName}
            inputMode="numeric"
            maxLength={6}
            name="verificationCode"
            pattern="[0-9]{6}"
            placeholder="6자리 인증번호"
            required
          />
        </label>
      ) : null}
      <label className="block text-sm font-semibold">
        비밀번호
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className={inputClassName}
          minLength={isSignUp ? 8 : undefined}
          name="password"
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
        disabled={pending || sendingVerification}
        type="submit"
      >
        {pending ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
      </button>
    </form>
  );
}
