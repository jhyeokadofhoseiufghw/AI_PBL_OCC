"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export type CreateEventState = { error?: string };
export type EventActionState = { error?: string; success?: string };

const optionalUrl = z.union([z.literal(""), z.string().trim().url("이미지 URL 형식을 확인해주세요.")]);
const eventSchema = z.object({
  title: z.string().trim().min(1).max(150),
  venue: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
  posterImageUrl: optionalUrl,
  detailImageUrl: optionalUrl,
  genre: z.string().trim().max(80),
  runtimeMinutes: z.union([z.literal(""), z.coerce.number().int().positive()]),
  ticketPrice: z.coerce.number().int().nonnegative(),
  bankName: z.string().trim().min(1).max(80),
  accountNumber: z.string().trim().min(1).max(80),
  accountHolder: z.string().trim().min(1).max(80),
  reservationType: z.enum(["FIRST_COME", "SEAT_SELECTION"]),
  totalCapacity: z.union([z.literal(""), z.coerce.number().int().positive()]),
  maxTicketsPerPerson: z.coerce.number().int().positive().max(100),
  cancelDeadlineAt: z.coerce.date(),
  eventStartAt: z.coerce.date(),
  eventEndAt: z.union([z.literal(""), z.coerce.date()]),
  ticketTypes: z.string(),
  seats: z.string(),
});

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function lines(value: string) {
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

function makeSlug(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
  return `${base}-${randomBytes(4).toString("hex")}`;
}

export async function createEvent(_: CreateEventState, formData: FormData): Promise<CreateEventState> {
  const session = await requireOrganizer();
  const parsed = eventSchema.safeParse(Object.fromEntries([
    "title", "venue", "description", "posterImageUrl", "detailImageUrl", "genre", "runtimeMinutes", "ticketPrice",
    "bankName", "accountNumber", "accountHolder", "reservationType", "totalCapacity", "maxTicketsPerPerson",
    "cancelDeadlineAt", "eventStartAt", "eventEndAt", "ticketTypes", "seats",
  ].map((key) => [key, text(formData, key)])));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const data = parsed.data;
  const ticketTypes = lines(data.ticketTypes);
  const seats = lines(data.seats);

  if (data.reservationType === "FIRST_COME" && data.totalCapacity === "") return { error: "선착순 공연은 총 수용 인원이 필요합니다." };
  if (data.reservationType === "SEAT_SELECTION" && seats.length === 0) return { error: "좌석 지정 공연은 좌석을 한 개 이상 입력해야 합니다." };
  if (data.cancelDeadlineAt >= data.eventStartAt) return { error: "취소 마감 시간은 공연 시작 전이어야 합니다." };
  if (data.eventEndAt !== "" && data.eventEndAt <= data.eventStartAt) return { error: "공연 종료 시간은 시작 시간 이후여야 합니다." };

  const sql = getSql();
  const eventId = crypto.randomUUID();
  const slug = makeSlug(data.title);
  const totalCapacity = data.reservationType === "FIRST_COME" ? data.totalCapacity : null;

  await sql.transaction((tx) => [
    tx`
      INSERT INTO events (
        id, organizer_id, title, slug, venue, description, poster_image_url, detail_image_url, runtime_minutes,
        genre, ticket_price, bank_name, account_number, account_holder, reservation_type, total_capacity,
        max_tickets_per_person, cancel_deadline_at, event_start_at, event_end_at, status
      ) VALUES (
        ${eventId}, ${session.organizerId}, ${data.title}, ${slug}, ${data.venue}, ${data.description},
        ${data.posterImageUrl || null}, ${data.detailImageUrl || null}, ${data.runtimeMinutes || null}, ${data.genre || null},
        ${data.ticketPrice}, ${data.bankName}, ${data.accountNumber}, ${data.accountHolder}, ${data.reservationType},
        ${totalCapacity}, ${data.maxTicketsPerPerson}, ${data.cancelDeadlineAt.toISOString()}, ${data.eventStartAt.toISOString()},
        ${data.eventEndAt === "" ? null : data.eventEndAt.toISOString()}, 'HIDDEN'
      )
    `,
    ...ticketTypes.map((name) => tx`INSERT INTO ticket_types (event_id, name) VALUES (${eventId}, ${name})`),
    ...seats.map((label) => tx`INSERT INTO seats (event_id, label) VALUES (${eventId}, ${label})`),
  ]);

  redirect(`/dashboard/events?created=${eventId}`);
}

async function requireOwnedEvent(eventId: string) {
  const session = await requireOrganizer();
  const sql = getSql();
  const rows = await sql`SELECT * FROM events WHERE id = ${eventId} AND organizer_id = ${session.organizerId} LIMIT 1`;
  if (!rows[0]) notFound();
  return { event: rows[0], sql };
}

export async function updateEventOverview(_: EventActionState, formData: FormData): Promise<EventActionState> {
  const eventId = text(formData, "eventId");
  const { event, sql } = await requireOwnedEvent(eventId);
  const result = z.object({
    title: z.string().trim().min(1).max(150), venue: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1), posterImageUrl: optionalUrl, detailImageUrl: optionalUrl,
    runtimeMinutes: z.union([z.literal(""), z.coerce.number().int().positive()]), genre: z.string().trim().max(80),
    ticketPrice: z.coerce.number().int().nonnegative(), bankName: z.string().trim().min(1).max(80),
    accountNumber: z.string().trim().min(1).max(80), accountHolder: z.string().trim().min(1).max(80),
    maxTicketsPerPerson: z.coerce.number().int().positive().max(100), cancelDeadlineAt: z.coerce.date(),
    eventStartAt: z.coerce.date(), eventEndAt: z.union([z.literal(""), z.coerce.date()]),
  }).safeParse({
    title: text(formData, "title"), venue: text(formData, "venue"), description: text(formData, "description"),
    posterImageUrl: text(formData, "posterImageUrl"), detailImageUrl: text(formData, "detailImageUrl"),
    runtimeMinutes: text(formData, "runtimeMinutes"), genre: text(formData, "genre"), ticketPrice: text(formData, "ticketPrice"),
    bankName: text(formData, "bankName"), accountNumber: text(formData, "accountNumber"), accountHolder: text(formData, "accountHolder"),
    maxTicketsPerPerson: text(formData, "maxTicketsPerPerson"), cancelDeadlineAt: text(formData, "cancelDeadlineAt"),
    eventStartAt: text(formData, "eventStartAt"), eventEndAt: text(formData, "eventEndAt"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const data = result.data;
  if (data.cancelDeadlineAt >= data.eventStartAt) return { error: "취소 마감은 공연 시작 전이어야 합니다." };
  if (data.eventEndAt !== "" && data.eventEndAt <= data.eventStartAt) return { error: "종료 시간은 시작 시간 이후여야 합니다." };

  await sql`
    UPDATE events SET title=${data.title}, venue=${data.venue}, description=${data.description},
      poster_image_url=${data.posterImageUrl || null}, detail_image_url=${data.detailImageUrl || null},
      runtime_minutes=${data.runtimeMinutes || null}, genre=${data.genre || null}, ticket_price=${data.ticketPrice},
      bank_name=${data.bankName}, account_number=${data.accountNumber}, account_holder=${data.accountHolder},
      max_tickets_per_person=${data.maxTicketsPerPerson}, cancel_deadline_at=${data.cancelDeadlineAt.toISOString()},
      event_start_at=${data.eventStartAt.toISOString()}, event_end_at=${data.eventEndAt === "" ? null : data.eventEndAt.toISOString()}
    WHERE id=${eventId} AND organizer_id=${event.organizer_id}
  `;
  revalidatePath(`/dashboard/events/${eventId}/overview`);
  revalidatePath(`/events/${event.slug}`);
  return { success: "공연 정보를 저장했습니다." };
}

export async function publishEvent(formData: FormData) {
  const eventId = text(formData, "eventId");
  const { event, sql } = await requireOwnedEvent(eventId);
  const seatRows = event.reservation_type === "SEAT_SELECTION"
    ? await sql`SELECT COUNT(*)::int AS count FROM seats WHERE event_id=${eventId} AND is_active`
    : [{ count: 1 }];
  if (!event.title || !event.venue || !event.description || !event.bank_name || !event.account_number || !event.account_holder || Number(seatRows[0].count) < 1) {
    redirect(`/dashboard/events/${eventId}/overview?error=publish`);
  }
  await sql`UPDATE events SET status='SCHEDULED' WHERE id=${eventId} AND organizer_id=${event.organizer_id}`;
  revalidatePath("/feed");
  revalidatePath(`/events/${event.slug}`);
  redirect(`/dashboard/events/${eventId}/overview?published=1`);
}

export async function changeEventStatus(formData: FormData) {
  const eventId = text(formData, "eventId");
  const status = z.enum(["SCHEDULED", "HIDDEN", "CANCELLED"]).parse(text(formData, "status"));
  const { event, sql } = await requireOwnedEvent(eventId);
  if (event.status === "CANCELLED") redirect(`/dashboard/events/${eventId}/overview`);
  await sql`UPDATE events SET status=${status} WHERE id=${eventId} AND organizer_id=${event.organizer_id}`;
  revalidatePath("/feed"); revalidatePath(`/events/${event.slug}`); revalidatePath(`/dashboard/events/${eventId}/overview`);
  redirect(`/dashboard/events/${eventId}/overview?status=${status}`);
}

export async function createFeedPost(formData: FormData) {
  const eventId = text(formData, "eventId");
  const { event, sql } = await requireOwnedEvent(eventId);
  const imageUrl = z.string().trim().url().parse(text(formData, "imageUrl"));
  const content = z.string().trim().min(1).max(3000).parse(text(formData, "content"));
  await sql`INSERT INTO feed_posts (event_id, image_url, content) VALUES (${eventId}, ${imageUrl}, ${content})`;
  revalidatePath(`/dashboard/events/${eventId}/feed`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/feed");
}

export async function updateFeedPost(formData: FormData) {
  const eventId = text(formData, "eventId");
  const postId = text(formData, "postId");
  const { event, sql } = await requireOwnedEvent(eventId);
  const imageUrl = z.string().trim().url().parse(text(formData, "imageUrl"));
  const content = z.string().trim().min(1).max(3000).parse(text(formData, "content"));
  await sql`UPDATE feed_posts SET image_url=${imageUrl}, content=${content} WHERE id=${postId} AND event_id=${eventId}`;
  revalidatePath(`/dashboard/events/${eventId}/feed`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/feed");
}

export async function deleteFeedPost(formData: FormData) {
  const eventId = text(formData, "eventId");
  const postId = text(formData, "postId");
  const { event, sql } = await requireOwnedEvent(eventId);
  await sql`DELETE FROM feed_posts WHERE id=${postId} AND event_id=${eventId}`;
  revalidatePath(`/dashboard/events/${eventId}/feed`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/feed");
}
