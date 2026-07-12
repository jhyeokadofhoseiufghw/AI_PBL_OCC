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
const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, requireOrganizer()]);
  const sql = getSql(),
    events =
      await sql`SELECT title FROM events WHERE id=${id} AND organizer_id=${session.organizerId}`;
  if (!events[0]) notFound();
  const posts =
    await sql`SELECT id,image_url,content FROM feed_posts WHERE event_id=${id} ORDER BY created_at DESC`;
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{String(events[0].title)}</h1>
      <EventTabs current="feed" eventId={id} />
      <form
        action={createFeedPost}
        className="mt-8 space-y-4 rounded-xl border bg-white p-5"
      >
        <input name="eventId" type="hidden" value={id} />
        <label className="block font-medium">
          이미지 URL
          <input className={input} name="imageUrl" type="url" />
          <span className="mt-2 block text-xs text-zinc-500">
            또는 이미지 파일 업로드
          </span>
          <input accept="image/*" className={input} name="image" type="file" />
        </label>
        <label className="block font-medium">
          본문
          <textarea className={input} name="content" required rows={4} />
        </label>
        <button className="rounded-lg bg-emerald-700 px-4 py-2 text-white">
          게시글 작성
        </button>
      </form>
      <div className="mt-8 space-y-4">
        {posts.map((post) => (
          <article
            className="rounded-xl border bg-white p-5"
            key={String(post.id)}
          >
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
