import Link from "next/link";
import { notFound } from "next/navigation";

import { changeEventStatus, publishEvent } from "@/features/events/actions";
import { CopyLinkButton } from "@/features/events/components/copy-link-button";
import { EventOverviewForm } from "@/features/events/components/event-overview-form";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function EventOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ published?: string; error?: string }> }) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, requireOrganizer()]);
  const sql = getSql();
  const rows = await sql`SELECT * FROM events WHERE id=${id} AND organizer_id=${session.organizerId} LIMIT 1`;
  const event = rows[0]; if (!event) notFound();
  return <main className="mx-auto min-h-screen max-w-4xl px-6 py-10"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-zinc-500">{event.status === "HIDDEN" ? "비공개" : String(event.status)}</p><h1 className="text-2xl font-semibold">공연 개요</h1></div><nav className="flex gap-2"><Link className="rounded-lg border px-3 py-2 text-sm" href={`/dashboard/events/${id}/preview`}>미리보기</Link><Link className="rounded-lg border px-3 py-2 text-sm" href={`/dashboard/events/${id}/feed`}>피드 관리</Link>{event.status !== "HIDDEN" && event.status !== "CANCELLED" ? <CopyLinkButton path={`/events/${String(event.slug)}`} /> : null}</nav></div>{query.published ? <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">공연을 공개했습니다. 공개 URL: /events/{String(event.slug)}</p> : null}{query.error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">필수 정보와 활성 좌석을 확인해주세요.</p> : null}<EventOverviewForm event={event as Record<string, string | number | null>} />{event.status === "HIDDEN" ? <form action={publishEvent} className="mt-5"><input name="eventId" type="hidden" value={id} /><button className="w-full rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white" type="submit">공연 공개</button></form> : event.status !== "CANCELLED" ? <div className="mt-5 flex flex-wrap gap-3"><Link className="rounded-lg border px-4 py-2 text-emerald-700" href={`/events/${String(event.slug)}`}>공개 페이지 보기</Link><form action={changeEventStatus}><input name="eventId" type="hidden" value={id} /><input name="status" type="hidden" value="HIDDEN" /><button className="rounded-lg border px-4 py-2">비공개 전환</button></form><form action={changeEventStatus}><input name="eventId" type="hidden" value={id} /><input name="status" type="hidden" value="CANCELLED" /><button className="rounded-lg border border-red-300 px-4 py-2 text-red-700">공연 취소</button></form></div> : <p className="mt-5 text-sm text-red-700">취소된 공연입니다.</p>}</main>;
}
