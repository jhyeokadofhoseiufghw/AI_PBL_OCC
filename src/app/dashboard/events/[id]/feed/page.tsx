import { notFound } from "next/navigation";
import {
  createFeedPost,
  deleteFeedPost,
  updateFeedPost,
} from "@/features/events/actions";
import { ConfirmSubmitButton } from "@/features/events/components/confirm-submit-button";
import { EventTabs } from "@/features/events/components/event-tabs";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
const input = "ha-input mt-2";
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
  const sql = getSql(),
    events =
      await sql`SELECT title FROM events WHERE id=${id} AND organizer_id=${session.organizerId}`;
  if (!events[0]) notFound();
  const posts =
    await sql`SELECT id,image_url,content FROM feed_posts WHERE event_id=${id} ORDER BY created_at DESC`;
  const limitReached = posts.length >= 3;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="ha-kicker">Feed manager</p>
      <h1 className="ha-title mt-1 text-3xl">{String(events[0].title)}</h1>
      <EventTabs current="feed" eventId={id} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#60687a]">
          홈 공연 피드에 노출되는 게시글 · {posts.length}/3개
        </p>
        {limitReached ? (
          <span className="rounded-full bg-[#fff4d7] px-3 py-1.5 text-xs font-bold text-[#7a4f00]">
            최대 3개 등록 완료
          </span>
        ) : null}
      </div>
      {query.error === "limit" ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          공연 피드는 공연당 최대 3개까지 등록할 수 있습니다.
        </p>
      ) : null}
      {query.error === "image" ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          이미지 URL을 입력하거나 이미지 파일을 업로드해주세요. URL을 입력한
          경우 형식도 확인해주세요.
        </p>
      ) : null}
      {query.error === "image-file" ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          4MB 이하의 이미지 파일만 업로드할 수 있습니다.
        </p>
      ) : null}
      {query.error === "content" ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          피드 본문을 3,000자 이내로 입력해주세요.
        </p>
      ) : null}
      <form
        action={createFeedPost}
        className="ha-card mt-4 space-y-4 p-5 sm:p-7"
      >
        <input name="eventId" type="hidden" value={id} />
        <fieldset
          className="space-y-4 disabled:opacity-50"
          disabled={limitReached}
        >
          <label className="block font-medium">
            이미지 URL
            <input className={input} name="imageUrl" type="url" />
            <span className="mt-2 block text-xs text-zinc-500">
              이미지 URL을 입력하거나 이미지 파일을 업로드해주세요.
            </span>
            <input
              accept="image/*"
              className={input}
              name="image"
              type="file"
            />
          </label>
          <label className="block font-medium">
            본문
            <textarea className={input} name="content" required rows={4} />
          </label>
          <button className="ha-button-primary px-4 py-2">
            {limitReached ? "최대 3개까지 등록 가능" : "게시글 작성"}
          </button>
        </fieldset>
      </form>
      <div className="mt-8 space-y-4">
        {posts.map((post) => (
          <article className="ha-card p-5" key={String(post.id)}>
            <form action={updateFeedPost} className="space-y-3">
              <input name="eventId" type="hidden" value={id} />
              <input name="postId" type="hidden" value={String(post.id)} />
              <input
                className={input}
                defaultValue={String(post.image_url ?? "")}
                name="imageUrl"
                required
                type="url"
              />
              <input
                accept="image/*"
                className={input}
                name="image"
                type="file"
              />
              <textarea
                className={input}
                defaultValue={String(post.content)}
                name="content"
                required
                rows={3}
              />
              <button className="rounded-lg border px-3 py-2">수정 저장</button>
            </form>
            <form action={deleteFeedPost} className="mt-3">
              <input name="eventId" type="hidden" value={id} />
              <input name="postId" type="hidden" value={String(post.id)} />
              <ConfirmSubmitButton
                className="text-sm text-red-700"
                confirmMessage="이 피드 게시글을 삭제할까요?"
              >
                삭제
              </ConfirmSubmitButton>
            </form>
          </article>
        ))}
        {!posts.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-zinc-500">
            피드 게시글이 없습니다. 첫 게시글을 작성해주세요.
          </p>
        ) : null}
      </div>
    </main>
  );
}
