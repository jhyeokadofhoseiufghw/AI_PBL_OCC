"use server";

import { z } from "zod";

import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const feedInputSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
  genre: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(3000),
  cast: z.string().trim().min(1).max(1000),
  schedule: z.string().trim().min(1).max(500),
  venue: z.string().trim().min(1).max(200),
});

export type FeedOption = { tone: string; text: string };
export type PromotionState = { error?: string; result?: FeedOption[] };
export type DescriptionDraftState = { error?: string; description?: string };

function formText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requestTimelyText(
  system: string,
  prompt: string,
  maxTokens?: number,
) {
  if (!env.TIMELY_AI_API_KEY)
    throw new Error("Timely AI API 키가 설정되지 않았습니다.");
  const response = await fetch(
    "https://hello.timelygpt.co.kr/api/v2/chat/bridge/openai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TIMELY_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      }),
      signal: AbortSignal.timeout(45_000),
    },
  );
  if (!response.ok) {
    if (response.status === 401) throw new Error("Timely AI 인증에 실패했습니다.");
    if (response.status === 402) throw new Error("Timely AI 크레딧이 부족합니다.");
    if (response.status === 429) throw new Error("AI 요청이 많습니다. 잠시 후 다시 시도해주세요.");
    throw new Error(`Timely AI 요청에 실패했습니다. (${response.status})`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Timely AI가 빈 응답을 반환했습니다.");
  return content;
}

function aiError(error: unknown, fallback: string) {
  console.error(fallback, error);
  if (error instanceof Error && error.name === "TimeoutError")
    return "AI 응답 시간이 초과됐습니다. 다시 시도해주세요.";
  return error instanceof Error && error.message.startsWith("Timely AI")
    ? error.message
    : fallback;
}

function parseFeedOptions(content: string) {
  const tones = [
    "재미있는 톤",
    "감성적인 톤",
    "합리적인 톤",
    "설레는 톤",
    "진정성 있는 톤",
  ];
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  try {
    const parsed = JSON.parse(fenced ?? content) as unknown;
    const options = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? (parsed as { options?: unknown }).options
        : null;
    if (Array.isArray(options)) {
      const normalized = options
        .map((item, index) => {
          if (typeof item === "string")
            return { tone: tones[index] ?? `톤 ${index + 1}`, text: item.trim() };
          if (item && typeof item === "object") {
            const option = item as { tone?: unknown; text?: unknown };
            return {
              tone:
                typeof option.tone === "string"
                  ? option.tone.trim()
                  : (tones[index] ?? `톤 ${index + 1}`),
              text: typeof option.text === "string" ? option.text.trim() : "",
            };
          }
          return { tone: tones[index] ?? `톤 ${index + 1}`, text: "" };
        })
        .filter((item) => item.text)
        .slice(0, 5);
      if (normalized.length === 5) return normalized;
    }
  } catch {}
  const lines = content
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  if (lines.length === 5)
    return lines.map((text, index) => ({ tone: tones[index], text }));
  throw new Error("Timely AI가 5개의 피드 문구를 반환하지 않았습니다.");
}

export async function generateEventDescriptionDraft(
  formData: FormData,
): Promise<DescriptionDraftState> {
  const session = await requireOrganizer();
  const title = formText(formData, "title");
  const genre = formText(formData, "genre");
  const venue = formText(formData, "venue");
  const draft = formText(formData, "description");
  if (!title || !genre)
    return { error: "공연명과 장르를 먼저 입력해주세요." };
  const allowed = await consumeRateLimit(
    "ai-event-description",
    String(session.organizerId),
    10,
  );
  if (!allowed)
    return { error: "AI 글 생성은 15분에 최대 10회 사용할 수 있습니다." };
  try {
    const description = await requestTimelyText(
      "당신은 대학 공연 상세 페이지 전문 에디터입니다. 결과 본문만 반환합니다.",
      `아래 정보를 바탕으로 관객의 흥미를 끄는 공연 상세 설명을 한국어 3~5문단으로 작성하세요.
공연명: ${title}
장르: ${genre}
장소: ${venue || "미정"}
기획자가 적은 초안 또는 핵심 이야기: ${draft || "없음"}

주어진 사실만 사용하고 일정, 출연진, 가격, 단체명은 추측하지 마세요. 줄거리가 부족하면 장르와 공연명이 주는 분위기를 중심으로 소개하되 새로운 사실을 만들지 마세요.`,
    );
    return { description };
  } catch (error) {
    return { error: aiError(error, "상세 설명 생성에 실패했습니다.") };
  }
}

export async function generatePromotionCopy(
  _: PromotionState,
  formData: FormData,
): Promise<PromotionState> {
  const session = await requireOrganizer();
  const parsed = feedInputSchema.safeParse({
    eventId: formText(formData, "eventId"),
    title: formText(formData, "title"),
    genre: formText(formData, "genre"),
    description: formText(formData, "description"),
    cast: formText(formData, "cast"),
    schedule: formText(formData, "schedule"),
    venue: formText(formData, "venue"),
  });
  if (!parsed.success)
    return { error: "모든 공연 정보를 입력한 뒤 다시 시도해주세요." };
  const owned = await getSql()`SELECT id FROM events WHERE id=${parsed.data.eventId} AND organizer_id=${session.organizerId}`;
  if (!owned[0]) return { error: "공연 정보를 확인할 수 없습니다." };
  const allowed = await consumeRateLimit(
    "ai-feed",
    String(session.organizerId),
    10,
  );
  if (!allowed)
    return { error: "AI 피드는 15분에 최대 10회 생성할 수 있습니다." };

  try {
    const content = await requestTimelyText(
      "당신은 대학 공연의 핵심 매력을 짧게 전달하는 피드 카피라이터입니다. 지정된 다섯 가지 톤의 피드 문구를 JSON으로 반환합니다.",
      `다음 공연을 홍보하는 피드 문구를 지정된 톤별로 한 개씩 한국어로 작성하세요.
공연명: ${parsed.data.title}
장르: ${parsed.data.genre}
공연 소개: ${parsed.data.description}
출연진: ${parsed.data.cast}
공연 일정: ${parsed.data.schedule}
공연 장소: ${parsed.data.venue}

작성 기준:
- 공연의 분위기와 핵심 메시지만 담아 정확히 두 문장으로 작성하세요.
- 전체 길이는 공백 포함 140자 이내로 제한하세요.
- 일정, 장소, 출연진을 항목처럼 나열하지 마세요.
- 해시태그, 제목, 불릿, 과도한 이모지는 사용하지 마세요.
- 특정 SNS나 커뮤니티를 언급하지 마세요.
- 주어지지 않은 사실은 추측하지 마세요.
- 재미있는 톤: 재치 있고 가볍게 관심을 끄세요.
- 감성적인 톤: 공연의 정서와 여운을 중심으로 표현하세요.
- 합리적인 톤: 관람할 이유와 핵심 정보를 명확하게 전달하세요.
- 설레는 톤: 공연을 기다리는 기대감을 생생하게 표현하세요.
- 진정성 있는 톤: 작품이 전하려는 마음을 담백하게 전달하세요.
- 반드시 {"options":[{"tone":"재미있는 톤","text":"..."},{"tone":"감성적인 톤","text":"..."},{"tone":"합리적인 톤","text":"..."},{"tone":"설레는 톤","text":"..."},{"tone":"진정성 있는 톤","text":"..."}]} 형식의 유효한 JSON만 반환하세요.`,
      700,
    );
    return { result: parseFeedOptions(content) };
  } catch (error) {
    return { error: aiError(error, "피드 글 생성에 실패했습니다.") };
  }
}
