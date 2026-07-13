/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { PublicHeader } from "@/components/public-header";
import { CopyLinkButton } from "@/features/events/components/copy-link-button";
import { getEventFeed, getPublicEvent } from "@/features/events/queries";

export default async function Page({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getPublicEvent(eventSlug);
  const posts = await getEventFeed(String(event.id));
  const remaining = Number(event.remaining_count);
  const cta =
    remaining > 0
      ? event.reservation_type === "SEAT_SELECTION"
        ? "좌석 선택하고 예매하기"
        : "매수 선택하고 예매하기"
      : "대기 신청하기";
  const start = new Date(String(event.event_start_at));

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <PublicHeader />
      <main>
        <div className="public-shell py-6">
          <div className="flex items-center justify-between gap-4">
            <Link className="text-sm font-bold text-[#420093]" href="/feed">
              ← 공연 목록
            </Link>
            <CopyLinkButton />
          </div>
        </div>

        <section className="border-y border-[#e5e7eb] bg-gradient-to-br from-[#f2edff] via-[#f8f9ff] to-[#eaf1ff]">
          <div className="public-shell grid gap-10 py-10 md:grid-cols-[minmax(260px,390px)_1fr] md:items-center md:py-16">
            <div
              className={`mx-auto w-full max-w-sm overflow-hidden rounded-xl bg-cover bg-center shadow-2xl ${event.poster_image_url ? "" : "poster-fallback"}`}
              style={
                event.poster_image_url
                  ? {
                      backgroundImage: `url(${String(event.poster_image_url)})`,
                    }
                  : undefined
              }
            >
              <div className="aspect-[1/1.414]" />
            </div>
            <div className="ha-card p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ha-status">예매 가능</span>
                <span className="ha-kicker">
                  {String(event.genre ?? "Performance")}
                </span>
              </div>
              <p className="mt-6 text-sm font-bold text-[#712ae2]">
                {String(event.organization_name)}
              </p>
              <h1 className="ha-title mt-2 text-4xl leading-tight sm:text-5xl">
                {String(event.title)}
              </h1>
              <dl className="mt-8 divide-y divide-[#e5e7eb] text-sm">
                <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
                  <dt className="text-[#60687a]">일시</dt>
                  <dd className="font-semibold">
                    {start.toLocaleString("ko-KR")}
                    {event.event_end_at
                      ? ` ~ ${new Date(String(event.event_end_at)).toLocaleString("ko-KR")}`
                      : ""}
                  </dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
                  <dt className="text-[#60687a]">장소</dt>
                  <dd className="font-semibold">{String(event.venue)}</dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
                  <dt className="text-[#60687a]">관람 시간</dt>
                  <dd className="font-semibold">
                    {event.runtime_minutes
                      ? `${Number(event.runtime_minutes)}분`
                      : "별도 안내"}
                  </dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr] gap-4 py-3">
                  <dt className="text-[#60687a]">잔여</dt>
                  <dd className="font-semibold text-[#420093]">
                    {remaining}석/매
                  </dd>
                </div>
              </dl>
              <div className="mt-8 flex items-end justify-between gap-4 border-t border-dashed border-[#ccc3d6] pt-6">
                <div>
                  <p className="text-xs text-[#60687a]">기본 티켓 가격</p>
                  <p className="mt-1 text-3xl font-black text-[#420093]">
                    {Number(event.ticket_price).toLocaleString("ko-KR")}원
                  </p>
                </div>
                <Link
                  className="ha-button-primary px-5 py-3.5"
                  href={`/events/${eventSlug}/reserve`}
                >
                  {cta} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="public-shell py-14 sm:py-20">
          <section className="mx-auto max-w-4xl">
            <p className="ha-kicker">01. About the show</p>
            <h2 className="ha-title mt-2 text-3xl">공연 소개</h2>
            <p className="mt-7 whitespace-pre-wrap text-base leading-8 text-[#4a4453]">
              {String(event.description)}
            </p>
            {event.detail_image_url ? (
              <img
                alt="공연 상세 이미지"
                className="mt-10 w-full rounded-xl shadow-sm"
                src={String(event.detail_image_url)}
              />
            ) : null}
          </section>

          {posts.length ? (
            <section className="mx-auto mt-20 max-w-4xl">
              <p className="ha-kicker">02. News & scenes</p>
              <h2 className="ha-title mt-2 text-3xl">공연 피드</h2>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {posts.map((post) => (
                  <article
                    className="ha-card overflow-hidden"
                    key={String(post.id)}
                  >
                    <div
                      className={`aspect-[4/3] bg-cover bg-center ${post.image_url ? "" : "poster-fallback"}`}
                      style={
                        post.image_url
                          ? {
                              backgroundImage: `url(${String(post.image_url)})`,
                            }
                          : undefined
                      }
                    />
                    <p className="whitespace-pre-wrap p-5 text-sm leading-6 text-[#4a4453]">
                      {String(post.content)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mx-auto mt-20 max-w-4xl rounded-2xl bg-[#e6eeff] p-6 sm:p-8">
            <p className="ha-kicker">03. Ticket policy</p>
            <h2 className="ha-title mt-2 text-2xl">예매 및 판매 정책</h2>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-[#60687a]">예매 방식</span>
                <b className="mt-1 block">
                  {event.reservation_type === "SEAT_SELECTION"
                    ? "좌석 지정"
                    : "선착순"}{" "}
                  · 최대 {Number(event.max_tickets_per_person)}매
                </b>
              </p>
              <p>
                <span className="text-[#60687a]">취소 마감</span>
                <b className="mt-1 block">
                  {new Date(String(event.cancel_deadline_at)).toLocaleString(
                    "ko-KR",
                  )}
                </b>
              </p>
              <p className="sm:col-span-2">
                <span className="text-[#60687a]">무통장 입금</span>
                <b className="mt-1 block">
                  {String(event.bank_name)} {String(event.account_number)} ·{" "}
                  {String(event.account_holder)}
                </b>
              </p>
            </div>
          </section>
        </div>
        <div className="sticky bottom-0 z-30 border-t border-[#e5e7eb] bg-white/90 p-3 backdrop-blur-xl md:hidden">
          <Link
            className="ha-button-primary w-full px-5 py-3.5"
            href={`/events/${eventSlug}/reserve`}
          >
            {cta}
          </Link>
        </div>
      </main>
    </div>
  );
}
