"use client";

import { useActionState, useRef, useState } from "react";

import { generateEventDescriptionDraft } from "@/features/promotion/actions";
import { updateEventOverview } from "../actions";

const input = "ha-input mt-2";
type EventData = Record<string, string | number | null>;

function dateTime(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventOverviewForm({ event }: { event: EventData }) {
  const [state, action, pending] = useActionState(updateEventOverview, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [descriptionAiPending, setDescriptionAiPending] = useState(false);
  const [descriptionAiError, setDescriptionAiError] = useState<string>();
  async function generateDescription() {
    if (!formRef.current) return;
    setDescriptionAiPending(true);
    setDescriptionAiError(undefined);
    try {
      const formData = new FormData();
      for (const name of ["title", "genre", "venue", "description"]) {
        const field = formRef.current.elements.namedItem(name);
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement
        )
          formData.set(name, field.value);
      }
      const result = await generateEventDescriptionDraft(formData);
      if (result.error) return setDescriptionAiError(result.error);
      const field = formRef.current.elements.namedItem("description");
      if (field instanceof HTMLTextAreaElement && result.description)
        field.value = result.description;
    } finally {
      setDescriptionAiPending(false);
    }
  }
  return (
    <form
      action={action}
      className="ha-card mt-6 grid gap-5 p-6 sm:grid-cols-2 sm:p-8"
      ref={formRef}
    >
      <input name="eventId" type="hidden" value={String(event.id)} />
      <label className="font-medium sm:col-span-2">
        공연명
        <input
          className={input}
          defaultValue={String(event.title)}
          name="title"
          required
        />
      </label>
      <label className="font-medium">
        장르
        <select
          className={input}
          defaultValue={String(event.genre ?? "")}
          name="genre"
        >
          <option value="연극">연극</option>
          <option value="뮤지컬">뮤지컬</option>
          <option value="음악">음악</option>
          <option value="무용/댄스">무용/댄스</option>
          <option value="전시">전시</option>
          <option value="강연/토크">강연/토크</option>
          <option value="영화/영상">영화/영상</option>
          <option value="기타">기타</option>
        </select>
      </label>
      <label className="font-medium">
        러닝타임
        <input
          className={input}
          defaultValue={String(event.runtime_minutes ?? "")}
          min={1}
          name="runtimeMinutes"
          type="number"
        />
      </label>
      <label className="font-medium sm:col-span-2">
        장소
        <input
          className={input}
          defaultValue={String(event.venue)}
          name="venue"
          required
        />
      </label>
      <label className="font-medium sm:col-span-2">
        <span className="flex flex-wrap items-center justify-between gap-2">
          상세 설명
          <button
            className="rounded-lg border border-[#d3bbff] bg-[#f5efff] px-3 py-2 text-xs font-bold text-[#420093] transition hover:bg-[#ebddff] disabled:opacity-60"
            disabled={descriptionAiPending}
            onClick={generateDescription}
            type="button"
          >
            {descriptionAiPending ? "AI 작성 중..." : "✨ AI 상세 설명"}
          </button>
        </span>
        <textarea
          className={input}
          defaultValue={String(event.description)}
          name="description"
          required
          rows={5}
        />
        {descriptionAiError ? (
          <span className="mt-2 block text-sm font-normal text-red-700" role="alert">
            {descriptionAiError}
          </span>
        ) : (
          <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">
            기존 설명을 바탕으로 AI가 공연 상세 소개를 다시 작성합니다.
          </span>
        )}
      </label>
      <label className="font-medium">
        포스터 URL
        <input
          className={input}
          defaultValue={String(event.poster_image_url ?? "")}
          name="posterImageUrl"
          type="url"
        />
        <span className="mt-2 block text-xs text-zinc-500">새 파일로 교체</span>
        <input
          accept="image/*"
          className={input}
          name="posterImage"
          type="file"
        />
      </label>
      <label className="font-medium">
        상세 이미지 URL
        <input
          className={input}
          defaultValue={String(event.detail_image_url ?? "")}
          name="detailImageUrl"
          type="url"
        />
        <span className="mt-2 block text-xs text-zinc-500">새 파일로 교체</span>
        <input
          accept="image/*"
          className={input}
          name="detailImage"
          type="file"
        />
      </label>
      <label className="font-medium">
        티켓 가격
        <input
          className={input}
          defaultValue={Number(event.ticket_price)}
          min={0}
          name="ticketPrice"
          type="number"
        />
      </label>
      <label className="font-medium">
        최대 예매 매수
        <input
          className={input}
          defaultValue={Number(event.max_tickets_per_person)}
          min={1}
          name="maxTicketsPerPerson"
          type="number"
        />
      </label>
      <label className="font-medium">
        공연 시작
        <input
          className={input}
          defaultValue={dateTime(event.event_start_at)}
          name="eventStartAt"
          required
          type="datetime-local"
        />
      </label>
      <label className="font-medium">
        공연 종료
        <input
          className={input}
          defaultValue={dateTime(event.event_end_at)}
          name="eventEndAt"
          type="datetime-local"
        />
      </label>
      <label className="font-medium">
        취소 마감
        <input
          className={input}
          defaultValue={dateTime(event.cancel_deadline_at)}
          name="cancelDeadlineAt"
          required
          type="datetime-local"
        />
      </label>
      <span />
      <label className="font-medium">
        은행명
        <input
          className={input}
          defaultValue={String(event.bank_name)}
          name="bankName"
          required
        />
      </label>
      <label className="font-medium">
        계좌번호
        <input
          className={input}
          defaultValue={String(event.account_number)}
          name="accountNumber"
          required
        />
      </label>
      <label className="font-medium">
        예금주
        <input
          className={input}
          defaultValue={String(event.account_holder)}
          name="accountHolder"
          required
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700 sm:col-span-2">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 sm:col-span-2">
          {state.success}
        </p>
      ) : null}
      <button
        className="ha-button-primary px-5 py-3 disabled:opacity-50 sm:col-span-2"
        disabled={pending}
        type="submit"
      >
        {pending ? "저장 중..." : "변경사항 저장"}
      </button>
    </form>
  );
}
