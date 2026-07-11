import Link from "next/link";

import { getSql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const sql = getSql();
  const posts = await sql`SELECT fp.id, fp.image_url, fp.content, e.slug, e.title, e.event_start_at, e.ticket_price, o.organization_name FROM feed_posts fp JOIN events e ON e.id=fp.event_id JOIN organizers o ON o.id=e.organizer_id WHERE e.status IN ('SCHEDULED','IN_PROGRESS') ORDER BY fp.created_at DESC`;
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between"><div><p className="text-sm font-medium text-emerald-700">OCC</p><h1 className="text-2xl font-semibold text-zinc-950">공연 피드</h1></div><div className="flex gap-3 text-sm"><Link href="/reservation/status">예매 조회</Link><Link href="/login">기획자 로그인</Link></div></header>
      {posts.length === 0 ? <p className="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600">현재 공개된 공연 피드가 없습니다.</p> : <div className="mt-8 grid gap-6 sm:grid-cols-2">{posts.map((post) => <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" key={String(post.id)}><div className="aspect-square bg-zinc-100 bg-cover bg-center" style={{ backgroundImage: `url(${String(post.image_url)})` }} /><div className="p-5"><p className="text-xs font-medium text-emerald-700">{String(post.organization_name)}</p><h2 className="mt-1 font-semibold">{String(post.title)}</h2><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{String(post.content)}</p><div className="mt-4 flex items-center justify-between text-sm"><span>{Number(post.ticket_price).toLocaleString("ko-KR")}원</span><Link className="font-medium text-emerald-700" href={`/events/${String(post.slug)}`}>상세보기 및 예매 →</Link></div></div></article>)}</div>}
    </main>
  );
}
