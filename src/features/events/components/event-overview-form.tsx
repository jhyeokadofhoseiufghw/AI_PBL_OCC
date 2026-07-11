"use client";

import { useActionState } from "react";

import { updateEventOverview } from "../actions";

const input = "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600";
type EventData = Record<string, string | number | null>;

function dateTime(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventOverviewForm({ event }: { event: EventData }) {
  const [state, action, pending] = useActionState(updateEventOverview, {});
  return <form action={action} className="mt-6 grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 sm:grid-cols-2"><input name="eventId" type="hidden" value={String(event.id)} />
    <label className="font-medium sm:col-span-2">공연명<input className={input} defaultValue={String(event.title)} name="title" required /></label>
    <label className="font-medium">장르<input className={input} defaultValue={String(event.genre ?? "")} name="genre" /></label><label className="font-medium">러닝타임<input className={input} defaultValue={String(event.runtime_minutes ?? "")} min={1} name="runtimeMinutes" type="number" /></label>
    <label className="font-medium sm:col-span-2">장소<input className={input} defaultValue={String(event.venue)} name="venue" required /></label>
    <label className="font-medium sm:col-span-2">상세 설명<textarea className={input} defaultValue={String(event.description)} name="description" required rows={5} /></label>
    <label className="font-medium">포스터 URL<input className={input} defaultValue={String(event.poster_image_url ?? "")} name="posterImageUrl" type="url" /></label><label className="font-medium">상세 이미지 URL<input className={input} defaultValue={String(event.detail_image_url ?? "")} name="detailImageUrl" type="url" /></label>
    <label className="font-medium">티켓 가격<input className={input} defaultValue={Number(event.ticket_price)} min={0} name="ticketPrice" type="number" /></label><label className="font-medium">최대 예매 매수<input className={input} defaultValue={Number(event.max_tickets_per_person)} min={1} name="maxTicketsPerPerson" type="number" /></label>
    <label className="font-medium">공연 시작<input className={input} defaultValue={dateTime(event.event_start_at)} name="eventStartAt" required type="datetime-local" /></label><label className="font-medium">공연 종료<input className={input} defaultValue={dateTime(event.event_end_at)} name="eventEndAt" type="datetime-local" /></label>
    <label className="font-medium">취소 마감<input className={input} defaultValue={dateTime(event.cancel_deadline_at)} name="cancelDeadlineAt" required type="datetime-local" /></label><span />
    <label className="font-medium">은행명<input className={input} defaultValue={String(event.bank_name)} name="bankName" required /></label><label className="font-medium">계좌번호<input className={input} defaultValue={String(event.account_number)} name="accountNumber" required /></label><label className="font-medium">예금주<input className={input} defaultValue={String(event.account_holder)} name="accountHolder" required /></label>
    {state.error ? <p className="text-sm text-red-700 sm:col-span-2">{state.error}</p> : null}{state.success ? <p className="text-sm text-emerald-700 sm:col-span-2">{state.success}</p> : null}
    <button className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-50 sm:col-span-2" disabled={pending} type="submit">{pending ? "저장 중..." : "변경사항 저장"}</button>
  </form>;
}
