"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { createEvent } from "../actions";
import { validateEventImage } from "../image-upload";
import { calculateReservationTotal, formatKrw } from "../pricing";
import { generateEventDescriptionDraft } from "@/features/promotion/actions";
import { SeatLayoutBuilder } from "./seat-layout-builder";

const inputClassName = "ha-input mt-2";

export function NewEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, {});
  const [reservationType, setReservationType] = useState<
    "FIRST_COME" | "SEAT_SELECTION"
  >("FIRST_COME");
  const [ticketPrice, setTicketPrice] = useState<number | "">(0);
  const [previewQuantity, setPreviewQuantity] = useState(1);
  const [imageErrors, setImageErrors] = useState<
    Partial<Record<"posterImage" | "detailImage", string>>
  >({});
  const [imageFileNames, setImageFileNames] = useState<
    Partial<Record<"posterImage" | "detailImage", string>>
  >({});
  const [descriptionAiPending, setDescriptionAiPending] = useState(false);
  const [descriptionAiError, setDescriptionAiError] = useState<string>();
  const previewTotal = useMemo(
    () =>
      calculateReservationTotal(
        ticketPrice === "" ? 0 : ticketPrice,
        previewQuantity,
      ),
    [previewQuantity, ticketPrice],
  );
  const formRef = useRef<HTMLFormElement>(null);
  const draftRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!state.error || !formRef.current) return;
    for (const [name, value] of Object.entries(draftRef.current)) {
      const field = formRef.current.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement
      ) {
        if (field.type !== "file") field.value = value;
      }
    }
  }, [state.error]);
  function rememberDraft() {
    if (!formRef.current) return;
    const draft: Record<string, string> = {};
    for (const [name, value] of new FormData(formRef.current).entries())
      if (typeof value === "string") draft[name] = value;
    draftRef.current = draft;
  }
  function validateSelectedImage(
    event: React.ChangeEvent<HTMLInputElement>,
    field: "posterImage" | "detailImage",
  ) {
    const file = event.target.files?.[0];
    const error = file ? validateEventImage(file) : null;
    setImageErrors((current) => ({ ...current, [field]: error ?? undefined }));
    setImageFileNames((current) => ({
      ...current,
      [field]: file && !error ? file.name : undefined,
    }));
    if (error) event.target.value = "";
  }
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
          field instanceof HTMLTextAreaElement ||
          field instanceof HTMLSelectElement
        )
          formData.set(name, field.value);
      }
      const result = await generateEventDescriptionDraft(formData);
      if (result.error) {
        setDescriptionAiError(result.error);
        return;
      }
      const field = formRef.current.elements.namedItem("description");
      if (field instanceof HTMLTextAreaElement && result.description)
        field.value = result.description;
    } finally {
      setDescriptionAiPending(false);
    }
  }

  return (
    <form
      action={formAction}
      className="mt-8 space-y-6"
      onSubmit={rememberDraft}
      ref={formRef}
    >
      <section className="ha-card grid gap-5 p-5 sm:grid-cols-2 sm:p-8 lg:p-10">
        <div className="border-b border-[#e5e7eb] pb-5 sm:col-span-2">
          <p className="ha-kicker">Show information</p>
          <h2 className="ha-title mt-1 text-2xl">
            공연 기본 정보 및 예매 정책
          </h2>
        </div>
        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">공연명</span>
          <input className={inputClassName} name="title" required />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">장르</span>
          <select
            className={inputClassName}
            defaultValue=""
            name="genre"
            required
          >
            <option disabled value="">
              카테고리를 선택해주세요
            </option>
            <option value="연극">연극</option>
            <option value="뮤지컬">뮤지컬</option>
            <option value="밴드/라이브">밴드/라이브</option>
            <option value="무용/댄스">무용/댄스</option>
            <option value="기타">기타</option>
          </select>
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">러닝타임</span>
          <input
            className={inputClassName}
            min={1}
            name="runtimeMinutes"
            placeholder="분"
            type="number"
          />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">예매 방식</span>
          <select
            className={inputClassName}
            name="reservationType"
            onChange={(event) =>
              setReservationType(
                event.target.value as "FIRST_COME" | "SEAT_SELECTION",
              )
            }
            value={reservationType}
          >
            <option value="FIRST_COME">선착순</option>
            <option value="SEAT_SELECTION">좌석 지정</option>
          </select>
        </label>

        {reservationType === "FIRST_COME" ? (
          <label>
            <span className="text-sm font-medium text-zinc-800">
              총 수용 인원
            </span>
            <input
              className={inputClassName}
              min={1}
              name="totalCapacity"
              required
              type="number"
            />
            <span className="mt-2 block text-xs leading-5 text-zinc-500">
              좌석 지정 공연은 활성 좌석 수로 수용 인원을 계산합니다.
            </span>
          </label>
        ) : null}

        <label>
          <span className="text-sm font-medium text-zinc-800">
            기본 티켓 가격
          </span>
          <div className="relative">
            <input
              className={`${inputClassName} pr-12`}
              min={0}
              name="ticketPrice"
              onBlur={() => {
                if (ticketPrice === "") setTicketPrice(0);
              }}
              onChange={(event) =>
                setTicketPrice(
                  event.target.value === ""
                    ? ""
                    : Math.max(0, Number(event.target.value)),
                )
              }
              onFocus={() => {
                if (ticketPrice === 0) setTicketPrice("");
              }}
              required
              step={100}
              type="number"
              value={ticketPrice}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-sm text-zinc-500">
              원
            </span>
          </div>
          <span className="mt-2 block text-xs leading-5 text-zinc-500">
            티켓 타입을 만들지 않거나 타입 가격을 생략했을 때 적용됩니다.
          </span>
        </label>

        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">장소</span>
          <input className={inputClassName} name="venue" required />
        </label>

        <label className="sm:col-span-2">
          <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-zinc-800">
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
            className={inputClassName}
            name="description"
            placeholder="핵심 줄거리나 전달하고 싶은 내용을 간단히 적은 뒤 AI 상세 설명을 눌러보세요."
            required
            rows={5}
          />
          {descriptionAiError ? (
            <span className="mt-2 block text-sm text-red-700" role="alert">
              {descriptionAiError}
            </span>
          ) : (
            <span className="mt-2 block text-xs leading-5 text-zinc-500">
              공연명과 장르를 입력하면 AI가 초안을 작성합니다. 작성한 핵심
              이야기가 있으면 해당 내용을 살려 다듬습니다.
            </span>
          )}
        </label>

        <div>
          <span className="text-sm font-medium text-zinc-800">
            대표 포스터 URL
          </span>
          <input className={inputClassName} name="posterImageUrl" type="url" />
          <span className="mt-2 block text-xs text-zinc-500">
            또는 이미지 파일 업로드 (최대 4MB)
          </span>
          <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-[#ccc3d6] bg-white p-1.5">
            <label
              className="shrink-0 cursor-pointer rounded-lg bg-[#420093] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#712ae2]"
              htmlFor="poster-image"
            >
              파일 선택
            </label>
            <span className="min-w-0 truncate text-sm text-zinc-500">
              {imageFileNames.posterImage ?? "선택된 파일 없음"}
            </span>
            <input
              accept="image/*"
              aria-describedby={
                imageErrors.posterImage ? "poster-image-error" : undefined
              }
              aria-invalid={Boolean(imageErrors.posterImage)}
              className="sr-only"
              id="poster-image"
              name="posterImage"
              onChange={(event) =>
                validateSelectedImage(event, "posterImage")
              }
              type="file"
            />
          </div>
          {imageErrors.posterImage ? (
            <span
              className="mt-2 block text-sm text-red-700"
              id="poster-image-error"
              role="alert"
            >
              {imageErrors.posterImage}
            </span>
          ) : null}
        </div>

        <div>
          <span className="text-sm font-medium text-zinc-800">
            상세 이미지 URL
          </span>
          <input className={inputClassName} name="detailImageUrl" type="url" />
          <span className="mt-2 block text-xs text-zinc-500">
            또는 이미지 파일 업로드 (최대 4MB)
          </span>
          <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-[#ccc3d6] bg-white p-1.5">
            <label
              className="shrink-0 cursor-pointer rounded-lg bg-[#420093] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#712ae2]"
              htmlFor="detail-image"
            >
              파일 선택
            </label>
            <span className="min-w-0 truncate text-sm text-zinc-500">
              {imageFileNames.detailImage ?? "선택된 파일 없음"}
            </span>
            <input
              accept="image/*"
              aria-describedby={
                imageErrors.detailImage ? "detail-image-error" : undefined
              }
              aria-invalid={Boolean(imageErrors.detailImage)}
              className="sr-only"
              id="detail-image"
              name="detailImage"
              onChange={(event) =>
                validateSelectedImage(event, "detailImage")
              }
              type="file"
            />
          </div>
          {imageErrors.detailImage ? (
            <span
              className="mt-2 block text-sm text-red-700"
              id="detail-image-error"
              role="alert"
            >
              {imageErrors.detailImage}
            </span>
          ) : null}
        </div>

        <label>
          <span className="text-sm font-medium text-zinc-800">공연 시작</span>
          <input
            className={inputClassName}
            name="eventStartAt"
            required
            type="datetime-local"
          />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">공연 종료</span>
          <input
            className={inputClassName}
            name="eventEndAt"
            type="datetime-local"
          />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">
            취소 가능 마감
          </span>
          <input
            className={inputClassName}
            name="cancelDeadlineAt"
            required
            type="datetime-local"
          />
        </label>

        <label>
          <span className="text-sm font-medium text-zinc-800">
            1인 최대 예매 매수
          </span>
          <input
            className={inputClassName}
            defaultValue={4}
            min={1}
            name="maxTicketsPerPerson"
            required
            type="number"
          />
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

        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">
            환불 및 공연 문의
          </span>
          <textarea
            className={inputClassName}
            maxLength={1000}
            name="inquiryContact"
            placeholder={
              "환불 절차와 문의 가능한 연락처 또는 오픈채팅 링크를 입력해주세요.\n예: 취소 후 환불은 카카오톡 오픈채팅 https://open.kakao.com/... 로 문의해주세요."
            }
            required
            rows={4}
          />
          <span className="mt-2 block text-xs leading-5 text-zinc-500">
            예매 화면과 예매 조회 화면에 안내됩니다.
          </span>
        </label>

        <label className="sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">
            티켓 등급별 가격
          </span>
          <textarea
            className={inputClassName}
            name="ticketTypes"
            placeholder={"일반: 30000\n학생: 20000"}
            rows={2}
          />
        </label>

        {reservationType === "SEAT_SELECTION" ? (
          <SeatLayoutBuilder />
        ) : (
          <>
            <input name="seats" type="hidden" value="" />
            <input name="seatLayout" type="hidden" value="[]" />
          </>
        )}
      </section>

      <section className="rounded-xl border border-[#d3bbff] bg-[#ebddff] p-6">
        <h2 className="font-semibold text-[#250059]">금액 계산 미리보기</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label>
            <span className="block text-sm text-[#420093]">예매 매수</span>
            <input
              className="ha-input mt-2 w-24"
              max={99}
              min={1}
              onChange={(event) =>
                setPreviewQuantity(Math.max(1, Number(event.target.value) || 1))
              }
              type="number"
              value={previewQuantity}
            />
          </label>
          <p className="pb-2 text-lg font-semibold text-[#250059]">
            {formatKrw(ticketPrice === "" ? 0 : ticketPrice)} ×{" "}
            {previewQuantity}매 = {formatKrw(previewTotal)}
          </p>
        </div>
      </section>

      <p className="text-sm text-zinc-500">
        티켓 등급은 `등급명: 가격` 형식으로 입력합니다. 가격을 생략하면 공연
        기본 가격이 적용됩니다.
      </p>

      {state.error ? (
        <div
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          <p>{state.error}</p>
          <p className="mt-1 text-xs">
            입력 내용은 유지했습니다. 보안상 이미지 파일 선택만 다시 필요할 수
            있습니다.
          </p>
        </div>
      ) : null}
      <button
        className="ha-button-primary ml-auto flex px-6 py-3 text-sm disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "저장 중..." : "다음 단계 준비 · 비공개 저장 →"}
      </button>
    </form>
  );
}
