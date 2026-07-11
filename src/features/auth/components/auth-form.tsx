"use client";

import { useActionState } from "react";

import type { AuthActionState } from "../actions";

const inputClassName = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-emerald-600";

type Props = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  mode: "login" | "signup";
};

export function AuthForm({ action, mode }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "signup";

  return (
    <form action={formAction} className="mt-8 space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {isSignUp ? (
        <>
          <label className="block text-sm font-medium">이름<input className={inputClassName} name="name" required /></label>
          <label className="block text-sm font-medium">연락처<input className={inputClassName} name="phone" required /></label>
          <label className="block text-sm font-medium">단체명<input className={inputClassName} name="organizationName" required /></label>
        </>
      ) : null}
      <label className="block text-sm font-medium">이메일<input autoComplete="email" className={inputClassName} name="email" required type="email" /></label>
      <label className="block text-sm font-medium">비밀번호<input autoComplete={isSignUp ? "new-password" : "current-password"} className={inputClassName} minLength={isSignUp ? 8 : undefined} name="password" required type="password" /></label>
      {state.error ? <p className="text-sm text-red-700" role="alert">{state.error}</p> : null}
      <button className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
      </button>
    </form>
  );
}
