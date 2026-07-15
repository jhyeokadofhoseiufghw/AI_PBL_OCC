"use client";

import { useActionState, useState } from "react";
import { generatePromotionCopy } from "../actions";

type PromotionInput = {
  eventId: string;
  title: string;
  genre: string;
  description: string;
  schedule: string;
  venue: string;
};

export function PromotionGenerator({
  initial,
  onUse,
}: {
  initial: PromotionInput;
  onUse?: (content: string) => void;
}) {
  const [state, action, pending] = useActionState(generatePromotionCopy, {});
  const [copied, setCopied] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>();
  const selected = state.result?.find((option) => option.text === selectedOption)
    ? selectedOption
    : state.result?.[0]?.text;
  const input = "ha-input mt-2";
  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form action={action} className="ha-card space-y-5 p-5 sm:p-7">
        <input name="eventId" type="hidden" value={initial.eventId} />
        <div>
          <p className="ha-kicker">Feed brief</p>
          <h2 className="ha-title mt-1 text-2xl">피드에 담을 공연 정보</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            저장된 정보를 불러왔습니다. 피드에 맞게 내용을 보완해주세요.
          </p>
        </div>
        <label className="block text-sm font-medium">공연명<input className={input} defaultValue={initial.title} name="title" required /></label>
        <label className="block text-sm font-medium">장르<input className={input} defaultValue={initial.genre} name="genre" required /></label>
        <label className="block text-sm font-medium">공연 소개<textarea className={input} defaultValue={initial.description} name="description" required rows={5} /></label>
        <label className="block text-sm font-medium">출연진<textarea className={input} name="cast" placeholder="배우, 연주자, 팀 이름 등을 입력해주세요." required rows={3} /></label>
        <label className="block text-sm font-medium">공연 일정<textarea className={input} defaultValue={initial.schedule} name="schedule" required rows={2} /></label>
        <label className="block text-sm font-medium">공연 장소<input className={input} defaultValue={initial.venue} name="venue" required /></label>
        {state.error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p> : null}
        <button className="ha-button-primary w-full px-5 py-3 disabled:opacity-60" disabled={pending} type="submit">
          {pending
            ? "AI가 피드 글 5개를 작성하고 있어요..."
            : state.result
              ? "피드 문구 다시 생성"
              : "AI 피드 5개 생성"}
        </button>
      </form>

      <section aria-live="polite" className="space-y-4">
        <div><p className="ha-kicker">Generated feed</p><h2 className="ha-title mt-1 text-2xl">피드 글</h2></div>
        {state.result ? (
          <div className="space-y-3">
            {state.result.map((option) => (
              <button
                aria-pressed={selected === option.text}
                className={`ha-card w-full p-5 text-left transition ${selected === option.text ? "border-[#712ae2] ring-2 ring-[#d3bbff]" : "hover:border-[#bca7dd]"}`}
                key={option.tone}
                onClick={() => setSelectedOption(option.text)}
                type="button"
              >
                <span className="flex items-center gap-2 text-xs font-bold text-[#420093]">
                  <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected === option.text ? "border-[#420093] bg-[#420093] text-white" : "border-[#b9afc7]"}`}>
                    {selected === option.text ? "✓" : ""}
                  </span>
                  {option.tone}
                </span>
                <span className="mt-3 block whitespace-pre-wrap text-sm leading-7 text-zinc-700">{option.text}</span>
              </button>
            ))}
            <button
              className="ha-button-primary w-full px-5 py-3"
              onClick={async () => {
                if (!selected) return;
                if (onUse) onUse(selected);
                else await navigator.clipboard.writeText(selected);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
              type="button"
            >
              {copied
                ? onUse
                  ? "피드 본문에 적용했습니다"
                  : "선택한 문구를 복사했습니다"
                : onUse
                  ? "선택한 문구를 피드에 적용"
                  : "선택한 피드 문구 복사"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#c9bddb] bg-white/70 px-6 py-16 text-center">
            <p className="text-3xl">✨</p><p className="mt-4 font-semibold text-[#250059]">생성된 피드 글이 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">공연 정보를 확인하고 AI 피드 생성 버튼을 눌러주세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
