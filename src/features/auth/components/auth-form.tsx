"use client";

import { useActionState } from "react";

import type { AuthActionState } from "../actions";

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
      <label className="block text-sm font-semibold">
        이메일
        <input
          autoComplete="email"
          className={inputClassName}
          name="email"
          required
          type="email"
        />
      </label>
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
      <button
        className="ha-button-primary w-full px-4 py-3 text-sm disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
      </button>
    </form>
  );
}
