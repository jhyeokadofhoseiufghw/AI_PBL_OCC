import Link from "next/link";
import { notFound } from "next/navigation";
import { changeEventStatus, publishEvent } from "@/features/events/actions";
import { ConfirmSubmitButton } from "@/features/events/components/confirm-submit-button";
import { CopyLinkButton } from "@/features/events/components/copy-link-button";
import { EventOverviewForm } from "@/features/events/components/event-overview-form";
import { EventTabs } from "@/features/events/components/event-tabs";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
const labels: Record<string, string> = {
  HIDDEN: "비공개",
  SCHEDULED: "예정",
  IN_PROGRESS: "진행 중",
  COMPLETED: "종료",
  CANCELLED: "취소",
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    published?: string;
    error?: string;
    status?: string;
  }>;
}) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    requireOrganizer(),
  ]);
  const rows =
    await getSql()`SELECT * FROM events WHERE id=${id} AND organizer_id=${session.organizerId}`;
  const event = rows[0];
  if (!event) notFound();
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            {labels[String(event.status)] ?? String(event.status)}
          </p>
          <h1 className="text-2xl font-semibold">{String(event.title)}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-lg border px-3 py-2 text-sm"
            href={`/dashboard/events/${id}/preview`}
          >
            모바일 미리보기
          </Link>
          {event.status !== "HIDDEN" && event.status !== "CANCELLED" ? (
            <>
              <Link
                className="rounded-lg border px-3 py-2 text-sm text-emerald-700"
                href={`/events/${String(event.slug)}`}
              >
                공개 페이지
              </Link>
              <CopyLinkButton path={`/events/${String(event.slug)}`} />
            </>
          ) : null}
          {event.status === "HIDDEN" ? (
            <form action={publishEvent}>
              <input name="eventId" type="hidden" value={id} />
              <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white">
                공연 공개
              </button>
            </form>
          ) : null}
        </div>
      </div>
      <EventTabs current="overview" eventId={id} />
      {query.published ? (
        <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          공연을 공개했습니다.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          필수 정보와 활성 좌석을 확인해주세요.
        </p>
      ) : null}
      {event.status !== "CANCELLED" ? (
        <section className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border bg-white p-4">
          <span className="mr-2 text-sm font-medium">공연 상태</span>
          {[
            ["SCHEDULED", "예정"],
            ["IN_PROGRESS", "진행 중"],
            ["COMPLETED", "종료"],
            ["HIDDEN", "비공개"],
          ].map(([value, label]) => (
            <form action={changeEventStatus} key={value}>
              <input name="eventId" type="hidden" value={id} />
              <input name="status" type="hidden" value={value} />
              <button
                className={`rounded border px-3 py-2 text-sm ${event.status === value ? "bg-zinc-900 text-white" : ""}`}
              >
                {label}
              </button>
            </form>
          ))}
          <form action={changeEventStatus} className="ml-auto">
            <input name="eventId" type="hidden" value={id} />
            <input name="status" type="hidden" value="CANCELLED" />
            <ConfirmSubmitButton
              className="rounded border border-red-200 px-3 py-2 text-sm text-red-700"
              confirmMessage="공연을 취소하면 공개 페이지에서 숨겨집니다. 계속할까요?"
            >
              공연 취소
            </ConfirmSubmitButton>
          </form>
        </section>
      ) : (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          취소된 공연입니다.
        </p>
      )}
      <EventOverviewForm
        event={event as Record<string, string | number | null>}
      />
      {event.status === "HIDDEN" ? (
        <form action={publishEvent} className="mt-5">
          <input name="eventId" type="hidden" value={id} />
          <button className="w-full rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white">
            저장한 내용으로 공연 공개
          </button>
        </form>
      ) : null}
    </main>
  );
}
