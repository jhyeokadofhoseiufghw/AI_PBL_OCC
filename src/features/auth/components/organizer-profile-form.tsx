"use client";

import { useActionState, useState, useTransition } from "react";

import {
  sendEmailVerificationCode,
  updateOrganizerProfile,
  type AuthActionState,
  type OrganizerProfileState,
} from "../actions";

type Organizer = {
  email: string;
  name: string;
  phone: string;
  organizationName: string;
};

const input = "ha-input mt-2";

export function OrganizerProfileForm({ organizer }: { organizer: Organizer }) {
  const [email, setEmail] = useState(organizer.email);
  const [, startVerificationTransition] = useTransition();
  const [state, action, pending] = useActionState<
    OrganizerProfileState,
    FormData
  >(updateOrganizerProfile, {});
  const [verificationState, sendVerificationAction, sendingVerification] =
    useActionState<AuthActionState, FormData>(sendEmailVerificationCode, {});
  const emailChanged = email.trim().toLowerCase() !== organizer.email;

  return (
    <form
      action={action}
      className="ha-card mt-8 grid gap-5 p-6 sm:grid-cols-2 sm:p-8"
    >
      <div className="sm:col-span-2">
        <label className="font-medium" htmlFor="profile-email">
          로그인 이메일
        </label>
        <div className="flex items-start gap-2">
          <input
            autoComplete="email"
            className={input}
            id="profile-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          {emailChanged ? (
            <button
              className="ha-button-secondary mt-2 shrink-0 px-4 py-3 text-sm disabled:opacity-60"
              disabled={pending || sendingVerification || !email}
              onClick={() => {
                const verificationData = new FormData();
                verificationData.set("email", email);
                startVerificationTransition(() => {
                  sendVerificationAction(verificationData);
                });
              }}
              type="button"
            >
              {sendingVerification ? "발송 중..." : "인증번호 보내기"}
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[#60687a]">
          이메일을 변경하려면 새 주소로 받은 인증번호가 필요합니다.
        </p>
      </div>
      {emailChanged ? (
        <label className="font-medium sm:col-span-2">
          새 이메일 인증번호
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
      ) : (
        <input name="verificationCode" type="hidden" value="" />
      )}
      <label className="font-medium">
        기획자 이름
        <input
          autoComplete="name"
          className={input}
          defaultValue={organizer.name}
          name="name"
          required
        />
      </label>
      <label className="font-medium">
        연락처
        <input
          autoComplete="tel"
          className={input}
          defaultValue={organizer.phone}
          name="phone"
          placeholder="010-1234-5678"
          required
          type="tel"
        />
      </label>
      <label className="font-medium sm:col-span-2">
        단체명 / 팀명
        <input
          className={input}
          defaultValue={organizer.organizationName}
          name="organizationName"
          required
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700 sm:col-span-2" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 sm:col-span-2" role="status">
          {state.success}
        </p>
      ) : null}
      {verificationState.error ? (
        <p className="text-sm text-red-700 sm:col-span-2" role="alert">
          {verificationState.error}
        </p>
      ) : null}
      {verificationState.success ? (
        <p className="text-sm text-emerald-700 sm:col-span-2" role="status">
          {verificationState.success}
        </p>
      ) : null}
      <button
        className="ha-button-primary px-5 py-3 disabled:opacity-50 sm:col-span-2"
        disabled={pending}
        type="submit"
      >
        {pending ? "저장 중..." : "기획자 정보 저장"}
      </button>
    </form>
  );
}
