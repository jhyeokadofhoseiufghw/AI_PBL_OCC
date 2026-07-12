import Link from "next/link";
import { getSql } from "@/lib/db/client";
export const dynamic = "force-dynamic";
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre = "" } = await searchParams;
  const sql = getSql();
  const [featured, popular, genres, posts] = await Promise.all([
    sql`SELECT e.*,o.organization_name FROM events e JOIN organizers o ON o.id=e.organizer_id WHERE e.status IN('SCHEDULED','IN_PROGRESS') ORDER BY CASE WHEN e.event_start_at>=NOW() THEN 0 ELSE 1 END,e.event_start_at LIMIT 1`,
    sql`SELECT e.id,e.slug,e.title,e.poster_image_url,e.ticket_price,e.event_start_at,o.organization_name,COALESCE(SUM(r.quantity) FILTER(WHERE r.status IN('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')),0)::int booked FROM events e JOIN organizers o ON o.id=e.organizer_id LEFT JOIN reservations r ON r.event_id=e.id WHERE e.status IN('SCHEDULED','IN_PROGRESS') GROUP BY e.id,o.organization_name ORDER BY booked DESC,e.event_start_at LIMIT 4`,
    sql`SELECT DISTINCT genre FROM events WHERE status IN('SCHEDULED','IN_PROGRESS') AND genre IS NOT NULL AND genre<>'' ORDER BY genre`,
    sql`SELECT fp.id,fp.image_url,fp.content,e.slug,e.title,e.event_start_at,e.ticket_price,e.genre,o.organization_name FROM feed_posts fp JOIN events e ON e.id=fp.event_id JOIN organizers o ON o.id=e.organizer_id WHERE e.status IN('SCHEDULED','IN_PROGRESS') AND (${genre}='' OR e.genre=${genre}) ORDER BY fp.created_at DESC`,
  ]);
  const hero = featured[0];
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link className="text-xl font-bold text-emerald-800" href="/feed">
          OCC
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/reservation/status">예매 조회</Link>
          <Link href="/signup">기획자 가입</Link>
          <Link href="/login">로그인</Link>
        </nav>
      </header>
      {hero ? (
        <section className="relative mt-8 overflow-hidden rounded-3xl bg-zinc-900 p-7 text-white sm:p-10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={
              hero.poster_image_url
                ? { backgroundImage: `url(${String(hero.poster_image_url)})` }
                : undefined
            }
          />
          <div className="relative max-w-xl">
            <p className="text-sm text-emerald-300">
              추천 공연 · {String(hero.organization_name)}
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {String(hero.title)}
            </h1>
            <p className="mt-4 text-sm text-zinc-200">
              {new Date(String(hero.event_start_at)).toLocaleString("ko-KR")} ·{" "}
              {String(hero.venue)}
            </p>
            <Link
              className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-3 font-medium text-emerald-950"
              href={`/events/${String(hero.slug)}`}
            >
              지금 바로 예매하기
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed p-10 text-center text-zinc-500">
          현재 공개된 공연이 없습니다.{" "}
          <Link className="text-emerald-700" href="/signup">
            첫 공연 만들기
          </Link>
        </section>
      )}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">인기 공연</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((event) => (
            <Link
              className="overflow-hidden rounded-xl border bg-white"
              href={`/events/${String(event.slug)}`}
              key={String(event.id)}
            >
              <div
                className="aspect-[1/1.414] bg-zinc-100 bg-cover bg-center"
                style={
                  event.poster_image_url
                    ? {
                        backgroundImage: `url(${String(event.poster_image_url)})`,
                      }
                    : undefined
                }
              />
              <div className="p-4">
                <p className="text-xs text-emerald-700">
                  {String(event.organization_name)} · 예매{" "}
                  {Number(event.booked)}매
                </p>
                <h3 className="mt-1 font-semibold">{String(event.title)}</h3>
                <p className="mt-2 text-sm">
                  {Number(event.ticket_price).toLocaleString("ko-KR")}원
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">공연 피드</h2>
          <nav className="flex flex-wrap gap-2">
            <Link
              className={`rounded-full px-3 py-1.5 text-sm ${!genre ? "bg-emerald-700 text-white" : "bg-zinc-100"}`}
              href="/feed"
            >
              전체
            </Link>
            {genres.map((row) => (
              <Link
                className={`rounded-full px-3 py-1.5 text-sm ${genre === row.genre ? "bg-emerald-700 text-white" : "bg-zinc-100"}`}
                href={`/feed?genre=${encodeURIComponent(String(row.genre))}`}
                key={String(row.genre)}
              >
                {String(row.genre)}
              </Link>
            ))}
          </nav>
        </div>
        {posts.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <article
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
                key={String(post.id)}
              >
                <div
                  className="aspect-square bg-zinc-100 bg-cover bg-center"
                  style={
                    post.image_url
                      ? { backgroundImage: `url(${String(post.image_url)})` }
                      : undefined
                  }
                />
                <div className="p-5">
                  <p className="text-xs font-medium text-emerald-700">
                    {String(post.organization_name)} ·{" "}
                    {String(post.genre ?? "공연")}
                  </p>
                  <h3 className="mt-1 font-semibold">{String(post.title)}</h3>
                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                    {String(post.content)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>
                      {Number(post.ticket_price).toLocaleString("ko-KR")}원
                    </span>
                    <Link
                      className="font-medium text-emerald-700"
                      href={`/events/${String(post.slug)}`}
                    >
                      상세보기 및 예매 →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed p-10 text-center text-zinc-500">
            선택한 장르의 피드가 없습니다.
          </p>
        )}
      </section>
    </main>
  );
}
