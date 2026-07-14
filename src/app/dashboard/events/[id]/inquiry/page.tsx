import { notFound } from "next/navigation";

import { updateEventInquiry } from "@/features/events/actions";
import { EventTabs } from "@/features/events/components/event-tabs";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function EventInquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    requireOrganizer(),
  ]);
  const rows = await getSql()`
    SELECT title, inquiry_contact
    FROM events
    WHERE id=${id} AND organizer_id=${session.organizerId}
    LIMIT 1
  `;
  const event = rows[0];
  if (!event) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="ha-kicker">Refund & contact</p>
      <h1 className="ha-title mt-1 text-3xl">{String(event.title)}</h1>
      <EventTabs current="inquiry" eventId={id} />

      {query.saved ? (
        <p className="mt-6 rounded-lg bg-[#e8fff5] p-3 text-sm text-[#006c4c]">
          환불 및 공연 문의 정보를 저장했습니다.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          환불 및 공연 문의 정보를 1,000자 이내로 입력해주세요.
        </p>
      ) : null}

      <form action={updateEventInquiry} className="ha-card mt-6 p-6 sm:p-8">
        <input name="eventId" type="hidden" value={id} />
        <label className="block font-medium">
          환불 및 공연 문의
          <textarea
            className="ha-input mt-2"
            defaultValue={String(event.inquiry_contact ?? "")}
            maxLength={1000}
            name="inquiryContact"
            placeholder={
              "환불 절차와 문의 가능한 연락처 또는 오픈채팅 링크를 입력해주세요.\n예: 취소 후 환불은 카카오톡 오픈채팅 https://open.kakao.com/... 로 문의해주세요."
            }
            required
            rows={7}
          />
        </label>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          이 내용은 관객의 예매 화면과 예매 조회·상세 화면에 표시됩니다.
          전화번호, 이메일, 카카오톡 오픈채팅 링크와 환불 절차를 함께 안내할 수
          있습니다.
        </p>
        <button className="ha-button-primary mt-6 px-5 py-3" type="submit">
          환불 및 문의 정보 저장
        </button>
      </form>
    </main>
  );
}
