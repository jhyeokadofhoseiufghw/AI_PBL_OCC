import Link from "next/link";

import { PublicHeader } from "@/components/public-header";
import { getOrganizerSession } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const money = (value: unknown) => `${Number(value).toLocaleString("ko-KR")}원`;
const date = (value: unknown) =>
  new Date(String(value)).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const [{ genre = "" }, session] = await Promise.all([
    searchParams,
    getOrganizerSession(),
  ]);
  const sql = getSql();
  const [featured, popular, genres, posts] = await Promise.all([
    sql`SELECT e.*,o.organization_name FROM events e JOIN organizers o ON o.id=e.organizer_id WHERE e.status IN('SCHEDULED','IN_PROGRESS') ORDER BY CASE WHEN e.event_start_at>=NOW() THEN 0 ELSE 1 END,e.event_start_at LIMIT 1`,
    sql`SELECT e.id,e.slug,e.title,e.poster_image_url,e.ticket_price,e.event_start_at,o.organization_name,COALESCE(SUM(r.quantity) FILTER(WHERE r.status IN('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')),0)::int booked FROM events e JOIN organizers o ON o.id=e.organizer_id LEFT JOIN reservations r ON r.event_id=e.id WHERE e.status IN('SCHEDULED','IN_PROGRESS') GROUP BY e.id,o.organization_name ORDER BY booked DESC,e.event_start_at LIMIT 4`,
    sql`SELECT DISTINCT genre FROM events WHERE status IN('SCHEDULED','IN_PROGRESS') AND genre IS NOT NULL AND genre<>'' ORDER BY genre`,
    sql`SELECT fp.id,fp.image_url,fp.content,e.slug,e.title,e.poster_image_url,e.event_start_at,e.ticket_price,e.genre,o.organization_name FROM feed_posts fp JOIN events e ON e.id=fp.event_id JOIN organizers o ON o.id=e.organizer_id WHERE e.status IN('SCHEDULED','IN_PROGRESS') AND (${genre}='' OR e.genre=${genre}) ORDER BY fp.created_at DESC`,
  ]);
  const hero = featured[0];

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b border-[#e5e7eb] bg-[#f7f7f8]">
          <div className="rain-texture pointer-events-none absolute inset-0 opacity-80" />
          <div className="public-shell relative py-20 text-center sm:py-28 lg:py-32">
            <p className="ha-kicker">Community Performing Arts</p>
            <h1 className="ha-title mx-auto mt-5 max-w-5xl text-[clamp(3rem,8vw,7.6rem)] leading-[0.96]">
              가장 가까운 곳에서
              <br />
              만나는 오늘의{" "}
              <span className="bg-gradient-to-r from-[#304ffe] to-[#8b2cf5] bg-clip-text text-transparent">
                무대
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-sm leading-6 text-[#4a4453] sm:text-base">
              대학 공연 동아리, 독립 극단, 버스킹 팀을 위한 올인원 피드.
              <br className="hidden sm:block" /> 공연 홍보부터 비회원 예매, 입금
              승인, QR 체크인까지 한 곳에서.
            </p>
            {hero ? (
              <Link
                className="ha-button-primary mt-8 px-6 py-3"
                href={`/events/${String(hero.slug)}`}
              >
                오늘의 추천 공연 보기 <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="public-shell py-12 sm:py-16">
          {popular.length ? (
            <section>
              <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                  <p className="ha-kicker">Trending now</p>
                  <h2 className="ha-title mt-2 text-2xl sm:text-3xl">
                    지금 주목해야 할 인기 공연
                  </h2>
                </div>
                <span className="text-sm text-[#60687a]">예매 수 기준</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {popular.map((event, index) => (
                  <Link
                    className="group min-w-0"
                    href={`/events/${String(event.slug)}`}
                    key={String(event.id)}
                  >
                    <div className="relative overflow-hidden rounded-xl bg-[#e6eeff] shadow-sm transition duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                      <div
                        className={`aspect-[1/1.414] bg-cover bg-center ${event.poster_image_url ? "" : "poster-fallback"}`}
                        style={
                          event.poster_image_url
                            ? {
                                backgroundImage: `url(${String(event.poster_image_url)})`,
                              }
                            : undefined
                        }
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-extrabold text-[#420093] backdrop-blur">
                        #{index + 1} · {Number(event.booked)}매
                      </span>
                    </div>
                    <p className="mt-4 text-xs font-bold text-[#712ae2]">
                      {String(event.organization_name)}
                    </p>
                    <h3 className="mt-1 truncate font-bold transition group-hover:text-[#420093]">
                      {String(event.title)}
                    </h3>
                    <p className="mt-1 text-xs text-[#60687a]">
                      {date(event.event_start_at)} · {money(event.ticket_price)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="ha-card p-12 text-center text-[#60687a]">
              현재 공개된 공연이 없습니다.{" "}
              <Link
                className="font-bold text-[#420093]"
                href={session ? "/dashboard/events/new" : "/signup"}
              >
                {session ? "첫 공연 만들기" : "기획자로 시작하기"}
              </Link>
            </section>
          )}

          <section className="mt-20 rounded-[1.5rem] border border-[#e5e7eb] bg-white p-5 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#e5e7eb] pb-5">
              <div>
                <p className="ha-kicker">Explore</p>
                <h2 className="ha-title mt-2 text-2xl sm:text-3xl">
                  카테고리별 공연 탐색
                </h2>
              </div>
              <nav
                className="flex max-w-full gap-2 overflow-x-auto pb-1"
                aria-label="공연 장르"
              >
                <Link
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold ${!genre ? "border-[#420093] bg-[#420093] !text-white" : "border-[#dfe3ec] bg-white"}`}
                  href="/feed"
                  scroll={false}
                >
                  전체
                </Link>
                {genres.map((row) => (
                  <Link
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold ${genre === row.genre ? "border-[#420093] bg-[#420093] !text-white" : "border-[#dfe3ec] bg-white"}`}
                    href={`/feed?genre=${encodeURIComponent(String(row.genre))}`}
                    key={String(row.genre)}
                    scroll={false}
                  >
                    {String(row.genre)}
                  </Link>
                ))}
              </nav>
            </div>
            {posts.length ? (
              <div className="mt-7 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article className="group min-w-0" key={String(post.id)}>
                    <Link href={`/events/${String(post.slug)}`}>
                      <div
                        className={`aspect-[4/3] overflow-hidden rounded-xl bg-cover bg-center ${post.image_url || post.poster_image_url ? "" : "poster-fallback"}`}
                        style={
                          post.image_url || post.poster_image_url
                            ? {
                                backgroundImage: `url(${String(post.image_url || post.poster_image_url)})`,
                              }
                            : undefined
                        }
                      />
                      <div className="mt-4 flex items-center gap-2">
                        <span className="rounded-full bg-[#ebddff] px-2.5 py-1 text-[11px] font-extrabold text-[#420093]">
                          {String(post.genre ?? "공연")}
                        </span>
                        <span className="text-xs text-[#60687a]">
                          {String(post.organization_name)}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate text-lg font-bold group-hover:text-[#420093]">
                        {String(post.title)}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#60687a]">
                        {String(post.content)}
                      </p>
                      <div className="mt-3 flex justify-between text-sm">
                        <b>{money(post.ticket_price)}</b>
                        <span className="font-bold text-[#420093]">
                          상세보기 →
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-[#60687a]">
                선택한 장르의 피드가 없습니다.
              </p>
            )}
          </section>
        </div>
      </main>
      <footer className="border-t border-[#e5e7eb] bg-white py-8">
        <div className="public-shell flex flex-wrap justify-between gap-3 text-xs text-[#60687a]">
          <b className="text-[#250059]">Our Creative Catalyst</b>
          <span>작은 무대를 위한 가장 가까운 공연 플랫폼</span>
        </div>
      </footer>
    </div>
  );
}
