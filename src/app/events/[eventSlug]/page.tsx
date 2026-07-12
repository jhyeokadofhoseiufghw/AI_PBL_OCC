/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
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
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-8">
      <div className="flex justify-between">
        <Link className="text-sm text-emerald-700" href="/feed">
          ← 홈 피드
        </Link>
        <CopyLinkButton />
      </div>
      <header className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
        <div
          className="aspect-[1/1.414] rounded-2xl bg-zinc-200 bg-cover bg-center"
          style={
            event.poster_image_url
              ? { backgroundImage: `url(${String(event.poster_image_url)})` }
              : undefined
          }
        />
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {String(event.organization_name)} · 공개
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{String(event.title)}</h1>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">일시</dt>
              <dd>
                {new Date(String(event.event_start_at)).toLocaleString("ko-KR")}
                {event.event_end_at
                  ? ` ~ ${new Date(String(event.event_end_at)).toLocaleString("ko-KR")}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">장소</dt>
              <dd>{String(event.venue)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">러닝타임</dt>
              <dd>
                {event.runtime_minutes
                  ? `${Number(event.runtime_minutes)}분`
                  : "별도 안내"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">가격 / 잔여</dt>
              <dd>
                {Number(event.ticket_price).toLocaleString("ko-KR")}원 ·{" "}
                {remaining}석/매
              </dd>
            </div>
          </dl>
          <Link
            className="mt-8 inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white"
            href={`/events/${eventSlug}/reserve`}
          >
            {cta}
          </Link>
        </div>
      </header>
      <section className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold">공연 소개</h2>
        <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-700">
          {String(event.description)}
        </p>
        {event.detail_image_url ? (
          <img
            alt="공연 상세 이미지"
            className="mt-6 w-full rounded-xl"
            src={String(event.detail_image_url)}
          />
        ) : null}
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-semibold">공연 피드</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <article
              className="overflow-hidden rounded-xl border bg-white"
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
              <p className="whitespace-pre-wrap p-4 text-sm leading-6">
                {String(post.content)}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 rounded-xl bg-zinc-100 p-6 text-sm">
        <h2 className="font-semibold">예매 및 판매 정책</h2>
        <p className="mt-2">
          {event.reservation_type === "SEAT_SELECTION" ? "좌석 지정" : "선착순"}{" "}
          · 최대 {Number(event.max_tickets_per_person)}매 · 취소 마감{" "}
          {new Date(String(event.cancel_deadline_at)).toLocaleString("ko-KR")}
        </p>
        <p className="mt-2 text-zinc-600">
          입금 계좌: {String(event.bank_name)} {String(event.account_number)} ·{" "}
          {String(event.account_holder)}
        </p>
      </section>
      <Link
        className="sticky bottom-4 mt-8 flex justify-center rounded-xl bg-emerald-700 px-5 py-4 font-semibold text-white shadow-lg"
        href={`/events/${eventSlug}/reserve`}
      >
        {cta}
      </Link>
    </main>
  );
}
