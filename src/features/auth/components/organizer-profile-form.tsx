"use client";

import { useActionState } from "react";

import { updateOrganizerProfile, type OrganizerProfileState } from "../actions";

type Organizer = {
  email: string;
  name: string;
  phone: string;
  organizationName: string;
};

const input = "ha-input mt-2";

export function OrganizerProfileForm({ organizer }: { organizer: Organizer }) {
  const [state, action, pending] = useActionState<
    OrganizerProfileState,
    FormData
  >(updateOrganizerProfile, {});

  return (
    <form
      action={action}
      className="ha-card mt-8 grid gap-5 p-6 sm:grid-cols-2 sm:p-8"
    >
      <label className="font-medium sm:col-span-2">
        로그인 이메일
        <input
          autoComplete="email"
          className={input}
          defaultValue={organizer.email}
          name="email"
          required
          type="email"
        />
      </label>
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
