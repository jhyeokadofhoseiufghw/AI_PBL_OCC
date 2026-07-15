import Link from "next/link";
import { notFound } from "next/navigation";

import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function EventPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, requireOrganizer()]);
  const sql = getSql();
  const rows =
    await sql`SELECT * FROM events WHERE id=${id} AND organizer_id=${session.organizerId} LIMIT 1`;
  const event = rows[0];
  if (!event) notFound();
  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-5 py-8 shadow-xl">
      <Link
        className="text-sm font-bold text-[#420093]"
        href={`/dashboard/events/${id}/overview`}
      >
        ← 개요로 돌아가기
      </Link>
      <p className="mt-6 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-800">
        관객용 모바일 미리보기
      </p>
      {event.status === "HIDDEN" ? (
        <div className="mt-3 rounded-lg bg-[#f3efff] p-3 text-sm leading-6 text-[#420093]">
          <p className="font-bold">지금은 비공개 상태입니다.</p>
          <p>
            공연을 공개한 후 피드를 추가하면 홈 화면에 노출됩니다.
          </p>
        </div>
      ) : null}
      <div
        className={`mt-5 aspect-[1/1.414] rounded-xl bg-cover bg-center shadow-lg ${event.poster_image_url ? "" : "poster-fallback"}`}
        style={
          event.poster_image_url
            ? { backgroundImage: `url(${String(event.poster_image_url)})` }
            : undefined
        }
      />
      <h1 className="ha-title mt-6 text-3xl">{String(event.title)}</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {new Date(String(event.event_start_at)).toLocaleString("ko-KR")} ·{" "}
        {String(event.venue)}
      </p>
      <p className="mt-4 whitespace-pre-wrap leading-7">
        {String(event.description)}
      </p>
      <button className="ha-button-primary mt-8 w-full px-5 py-3" disabled>
        예매하기 (미리보기)
      </button>
    </main>
  );
}
