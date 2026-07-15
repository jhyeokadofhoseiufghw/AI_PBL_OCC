import { notFound } from "next/navigation";

import { deleteFeedPost } from "@/features/events/actions";
import { ConfirmSubmitButton } from "@/features/events/components/confirm-submit-button";
import { EventTabs } from "@/features/events/components/event-tabs";
import { UnifiedFeedManager } from "@/features/events/components/unified-feed-manager";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

function formatSchedule(start: unknown, end: unknown) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
  const startText = formatter.format(new Date(String(start)));
  return end ? `${startText} ~ ${formatter.format(new Date(String(end)))}` : startText;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, query, session] = await Promise.all([
    params,
    searchParams,
    requireOrganizer(),
  ]);
  const sql = getSql();
  const events = await sql`
    SELECT id,title,genre,description,event_start_at,event_end_at,venue,status
    FROM events WHERE id=${id} AND organizer_id=${session.organizerId}
  `;
  const event = events[0];
  if (!event) notFound();
  const posts = await sql`
    SELECT id,image_url,content FROM feed_posts
    WHERE event_id=${id} ORDER BY created_at DESC LIMIT 1
  `;
  const post = posts[0];
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="ha-kicker">Home promotion feed</p>
      <h1 className="ha-title mt-1 text-3xl">{String(event.title)}</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        공개된 공연을 홈 화면에서 알리는 대표 홍보 피드를 관리합니다.
      </p>
      <EventTabs current="feed" eventId={id} />
      {event.status === "HIDDEN" ? (
        <p className="mt-5 rounded-lg bg-[#fff4d7] p-3 text-sm text-[#7a4f00]">
          비공개 공연의 피드는 저장할 수 있지만 홈에는 공연 공개 후 노출됩니다.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {query.error === "limit"
            ? "공연당 홈 피드는 하나만 만들 수 있습니다. 기존 피드를 수정해주세요."
            : query.error === "image-file"
              ? "4MB 이하의 이미지 파일만 업로드할 수 있습니다."
              : query.error === "content"
                ? "피드 본문을 3,000자 이내로 입력해주세요."
                : "이미지 URL을 입력하거나 이미지 파일을 업로드해주세요."}
        </p>
      ) : null}
      <UnifiedFeedManager
        event={{
          eventId: id,
          title: String(event.title),
          genre: String(event.genre ?? ""),
          description: String(event.description),
          schedule: formatSchedule(event.event_start_at, event.event_end_at),
          venue: String(event.venue),
        }}
        existing={
          post
            ? {
                id: String(post.id),
                imageUrl: String(post.image_url ?? ""),
                content: String(post.content),
              }
            : null
        }
      />
      {post ? (
        <form action={deleteFeedPost} className="mt-4 text-right">
          <input name="eventId" type="hidden" value={id} />
          <input name="postId" type="hidden" value={String(post.id)} />
          <ConfirmSubmitButton
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700"
            confirmMessage="홈 홍보 피드를 삭제할까요?"
          >
            피드 삭제
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </main>
  );
}
