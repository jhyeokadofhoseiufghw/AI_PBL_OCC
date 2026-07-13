"use client";
import { useActionState } from "react";
import { createWaitlist } from "../actions";
const input = "ha-input mt-2";
export function WaitlistForm({
  event,
}: {
  event: { id: string; slug: string; maxTickets: number };
}) {
  const [state, action, pending] = useActionState(createWaitlist, {});
  return (
    <form
      action={action}
      className="ha-card mt-8 grid gap-5 p-5 sm:grid-cols-2 sm:p-7"
    >
      <input name="eventId" type="hidden" value={event.id} />
      <input name="eventSlug" type="hidden" value={event.slug} />
      <label>
        이름
        <input className={input} name="name" required />
      </label>
      <label>
        연락처
        <input className={input} name="phone" required />
      </label>
      <label>
        입금자명
        <input className={input} name="depositorName" required />
      </label>
      <label>
        희망 매수
        <input
          className={input}
          max={event.maxTickets}
          min="1"
          name="quantity"
          type="number"
          defaultValue="1"
          required
        />
      </label>
      <label className="sm:col-span-2">
        조회 패스워드
        <input
          className={input}
          name="lookupPassword"
          inputMode="numeric"
          pattern="[0-9]{4,6}"
          required
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700 sm:col-span-2">{state.error}</p>
      ) : null}
      <button
        className="ha-button-primary px-5 py-3 sm:col-span-2"
        disabled={pending}
      >
        {pending ? "신청 중..." : "대기 신청"}
      </button>
    </form>
  );
}
