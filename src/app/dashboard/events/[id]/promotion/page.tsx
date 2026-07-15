import { notFound } from "next/navigation";

import { EventTabs } from "@/features/events/components/event-tabs";
import { PromotionGenerator } from "@/features/promotion/components/promotion-generator";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

function formatSchedule(start: unknown, end: unknown) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
  const startText = formatter.format(new Date(String(start)));
  return end
    ? `${startText} ~ ${formatter.format(new Date(String(end)))}`
    : startText;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, requireOrganizer()]);
  const rows = await getSql()`
    SELECT id,title,genre,description,event_start_at,event_end_at,venue
    FROM events WHERE id=${id} AND organizer_id=${session.organizerId}
  `;
  const event = rows[0];
  if (!event) notFound();
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="ha-kicker">AI feed studio</p>
      <h1 className="ha-title mt-1 text-3xl">{String(event.title)}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Timely AI가 공연 정보에 맞는 피드 전용 코멘트를 작성합니다.
      </p>
      <EventTabs current="promotion" eventId={id} />
      <PromotionGenerator
        initial={{
          eventId: id,
          title: String(event.title),
          genre: String(event.genre ?? ""),
          description: String(event.description),
          schedule: formatSchedule(event.event_start_at, event.event_end_at),
          venue: String(event.venue),
        }}
      />
    </main>
  );
}
