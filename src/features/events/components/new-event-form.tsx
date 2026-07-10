"use client";

import { useMemo, useState } from "react";

import { calculateReservationTotal, formatKrw } from "../pricing";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function NewEventForm() {
  const [reservationType, setReservationType] = useState<"FIRST_COME" | "SEAT_SELECTION">("FIRST_COME");
  const [ticketPrice, setTicketPrice] = useState(0);
  const [previewQuantity, setPreviewQuantity] = useState(1);
  const previewTotal = useMemo(
    () => calculateReservationTotal(ticketPrice, previewQuantity),
    [previewQuantity, ticketPrice],
  );

  return (
    <form className="mt-8 space-y-8">
      <section className="grid gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">공연명</span>
          <input className={inputClassName} name="title" required />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">장르</span>
          <input className={inputClassName} name="genre" placeholder="연극, 뮤지컬, 밴드/음악" />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">러닝타임</span>
          <input className={inputClassName} min={1} name="runtimeMinutes" placeholder="분" type="number" />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">예매 방식</span>
          <select
            className={inputClassName}
            name="reservationType"
            onChange={(event) => setReservationType(event.target.value as "FIRST_COME" | "SEAT_SELECTION")}
            value={reservationType}
          >
            <option value="FIRST_COME">선착순</option>
            <option value="SEAT_SELECTION">좌석 지정</option>
          </select>
        </label>

        {reservationType === "FIRST_COME" ? (
          <label>
            <span className="text-sm font-medium text-zinc-800">총 수용 인원</span>
            <input className={inputClassName} min={1} name="totalCapacity" required type="number" />
            <span className="mt-2 block text-xs leading-5 text-zinc-500">
              좌석 지정 공연은 활성 좌석 수로 수용 인원을 계산합니다.
            </span>
          </label>
        ) : null}

        <label>
          <span className="text-sm font-medium text-zinc-800">티켓 가격</span>
          <div className="relative">
            <input
              className={`${inputClassName} pr-12`}
              min={0}
              name="ticketPrice"
              onChange={(event) => setTicketPrice(Math.max(0, Number(event.target.value) || 0))}
              required
              step={100}
              type="number"
              value={ticketPrice}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-sm text-zinc-500">원</span>
          </div>
          <span className="mt-2 block text-xs leading-5 text-zinc-500">
            모든 티켓 타입과 좌석에 동일하게 적용됩니다.
          </span>
        </label>

        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">장소</span>
          <input className={inputClassName} name="venue" required />
        </label>

        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">상세 설명</span>
          <textarea className={inputClassName} name="description" required rows={5} />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">대표 포스터 URL</span>
          <input className={inputClassName} name="posterImageUrl" type="url" />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">상세 이미지 URL</span>
          <input className={inputClassName} name="detailImageUrl" type="url" />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">공연 시작</span>
          <input className={inputClassName} name="eventStartAt" required type="datetime-local" />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">1인 최대 예매 매수</span>
          <input className={inputClassName} defaultValue={4} min={1} name="maxTicketsPerPerson" required type="number" />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">은행명</span>
          <input className={inputClassName} name="bankName" required />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">계좌번호</span>
          <input className={inputClassName} name="accountNumber" required />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">예금주</span>
          <input className={inputClassName} name="accountHolder" required />
        </label>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="font-semibold text-emerald-950">금액 계산 미리보기</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label>
            <span className="block text-sm text-emerald-900">예매 매수</span>
            <input
              className="mt-2 w-24 rounded-lg border border-emerald-300 bg-white px-3 py-2"
              max={99}
              min={1}
              onChange={(event) => setPreviewQuantity(Math.max(1, Number(event.target.value) || 1))}
              type="number"
              value={previewQuantity}
            />
          </label>
          <p className="pb-2 text-lg font-semibold text-emerald-950">
            {formatKrw(ticketPrice)} × {previewQuantity}매 = {formatKrw(previewTotal)}
          </p>
        </div>
      </section>

      <p className="text-sm text-zinc-500">
        티켓 타입은 일반·학생 등의 분류로만 사용하고, 좌석 등급별 가격은 사용하지 않습니다.
      </p>

      <button className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-medium text-white" type="submit">
        공연 생성
      </button>
    </form>
  );
}
