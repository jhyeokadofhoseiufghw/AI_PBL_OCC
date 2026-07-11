import Link from "next/link";
import { notFound } from "next/navigation";

import { createFeedPost, deleteFeedPost, updateFeedPost } from "@/features/events/actions";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

const input = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2";
export default async function EventFeedPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireOrganizer()]); const sql = getSql();
  const events = await sql`SELECT id, title FROM events WHERE id=${id} AND organizer_id=${session.organizerId} LIMIT 1`; if (!events[0]) notFound();
  const posts = await sql`SELECT id, image_url, content FROM feed_posts WHERE event_id=${id} ORDER BY created_at DESC`;
  return <main className="mx-auto min-h-screen max-w-4xl px-6 py-10"><Link className="text-sm text-emerald-700" href={`/dashboard/events/${id}/overview`}>← 공연 개요</Link><h1 className="mt-5 text-2xl font-semibold">{String(events[0].title)} 피드 관리</h1><form action={createFeedPost} className="mt-6 space-y-4 rounded-xl border bg-white p-5"><input name="eventId" type="hidden" value={id} /><label className="block font-medium">이미지 URL<input className={input} name="imageUrl" required type="url" /></label><label className="block font-medium">본문<textarea className={input} name="content" required rows={4} /></label><button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white">게시글 작성</button></form><div className="mt-8 space-y-4">{posts.map((post) => <article className="rounded-xl border bg-white p-5" key={String(post.id)}><form action={updateFeedPost} className="space-y-3"><input name="eventId" type="hidden" value={id} /><input name="postId" type="hidden" value={String(post.id)} /><input className={input} defaultValue={String(post.image_url)} name="imageUrl" required type="url" /><textarea className={input} defaultValue={String(post.content)} name="content" required rows={3} /><button className="rounded-lg border px-3 py-2 text-sm">수정 저장</button></form><form action={deleteFeedPost} className="mt-2"><input name="eventId" type="hidden" value={id} /><input name="postId" type="hidden" value={String(post.id)} /><button className="text-sm text-red-700">삭제</button></form></article>)}</div></main>;
}
