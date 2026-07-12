"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { put } from "@vercel/blob";

import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export type CreateEventState = { error?: string };
export type EventActionState = { error?: string; success?: string };

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("이미지 URL 형식을 확인해주세요."),
]);
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

async function resolveImageUrl(
  formData: FormData,
  urlKey: string,
  fileKey: string,
) {
  const file = formData.get(fileKey);
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/"))
      throw new Error("이미지 파일만 업로드할 수 있습니다.");
    if (file.size > 4 * 1024 * 1024)
      throw new Error("이미지는 4MB 이하여야 합니다.");
    const blob = await put(`events/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  }
  return text(formData, urlKey).trim();
}

function lines(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function makeSlug(title: string) {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "event";
  return `${base}-${randomBytes(4).toString("hex")}`;
}

export async function createEvent(
  _: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const session = await requireOrganizer();
  let posterImageUrl: string, detailImageUrl: string;
  try {
    [posterImageUrl, detailImageUrl] = await Promise.all([
      resolveImageUrl(formData, "posterImageUrl", "posterImage"),
      resolveImageUrl(formData, "detailImageUrl", "detailImage"),
    ]);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.",
    };
  }
  if (!posterImageUrl)
    return { error: "대표 포스터 URL 또는 이미지 파일이 필요합니다." };
  const parsed = eventSchema.safeParse(
    Object.fromEntries(
      [
        "title",
        "venue",
        "description",
        "posterImageUrl",
        "detailImageUrl",
        "genre",
        "runtimeMinutes",
        "ticketPrice",
        "bankName",
        "accountNumber",
        "accountHolder",
        "reservationType",
        "totalCapacity",
        "maxTicketsPerPerson",
        "cancelDeadlineAt",
        "eventStartAt",
        "eventEndAt",
        "ticketTypes",
        "seats",
      ].map((key) => [
        key,
        key === "posterImageUrl"
          ? posterImageUrl
          : key === "detailImageUrl"
            ? detailImageUrl
            : text(formData, key),
      ]),
    ),
  );

  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  const data = parsed.data;
  const ticketTypes = lines(data.ticketTypes);
  const seats = lines(data.seats);
  let seatLayout: { label: string; row: number; column: number }[] = [];
  try {
    seatLayout = z
      .array(
        z.object({
          label: z.string().min(1).max(30),
          row: z.number().int().positive(),
          column: z.number().int().positive(),
        }),
      )
      .parse(JSON.parse(text(formData, "seatLayout") || "[]"));
  } catch {
    return { error: "좌석 배치 정보를 확인해주세요." };
  }

  if (data.reservationType === "FIRST_COME" && data.totalCapacity === "")
    return { error: "선착순 공연은 총 수용 인원이 필요합니다." };
  if (data.reservationType === "SEAT_SELECTION" && seats.length === 0)
    return { error: "좌석 지정 공연은 좌석을 한 개 이상 입력해야 합니다." };
  if (data.cancelDeadlineAt >= data.eventStartAt)
    return { error: "취소 마감 시간은 공연 시작 전이어야 합니다." };
  if (data.eventEndAt !== "" && data.eventEndAt <= data.eventStartAt)
    return { error: "공연 종료 시간은 시작 시간 이후여야 합니다." };

  const sql = getSql();
  const eventId = crypto.randomUUID();
  const slug = makeSlug(data.title);
  const totalCapacity =
    data.reservationType === "FIRST_COME" ? data.totalCapacity : null;

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
    ...ticketTypes.map(
      (name) =>
        tx`INSERT INTO ticket_types (event_id, name) VALUES (${eventId}, ${name})`,
    ),
    ...seats.map((label) => {
      const position = seatLayout.find((seat) => seat.label === label);
      return tx`INSERT INTO seats (event_id, label, layout_row, layout_column) VALUES (${eventId}, ${label}, ${position?.row ?? null}, ${position?.column ?? null})`;
    }),
  ]);

  redirect(
    data.reservationType === "SEAT_SELECTION"
      ? `/dashboard/events/${eventId}/seats`
      : `/dashboard/events/${eventId}/preview`,
  );
}

async function requireOwnedEvent(eventId: string) {
  const session = await requireOrganizer();
  const sql = getSql();
  const rows =
    await sql`SELECT * FROM events WHERE id = ${eventId} AND organizer_id = ${session.organizerId} LIMIT 1`;
  if (!rows[0]) notFound();
  return { event: rows[0], sql };
}

export async function updateEventOverview(
  _: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const eventId = text(formData, "eventId");
  const { event, sql } = await requireOwnedEvent(eventId);
  let posterImageUrl: string, detailImageUrl: string;
  try {
    [posterImageUrl, detailImageUrl] = await Promise.all([
      resolveImageUrl(formData, "posterImageUrl", "posterImage"),
      resolveImageUrl(formData, "detailImageUrl", "detailImage"),
    ]);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.",
    };
  }
  const result = z
    .object({
      title: z.string().trim().min(1).max(150),
      venue: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1),
      posterImageUrl: optionalUrl,
      detailImageUrl: optionalUrl,
      runtimeMinutes: z.union([
        z.literal(""),
        z.coerce.number().int().positive(),
      ]),
      genre: z.string().trim().max(80),
      ticketPrice: z.coerce.number().int().nonnegative(),
      bankName: z.string().trim().min(1).max(80),
      accountNumber: z.string().trim().min(1).max(80),
      accountHolder: z.string().trim().min(1).max(80),
      maxTicketsPerPerson: z.coerce.number().int().positive().max(100),
      cancelDeadlineAt: z.coerce.date(),
      eventStartAt: z.coerce.date(),
      eventEndAt: z.union([z.literal(""), z.coerce.date()]),
    })
    .safeParse({
      title: text(formData, "title"),
      venue: text(formData, "venue"),
      description: text(formData, "description"),
      posterImageUrl,
      detailImageUrl,
      runtimeMinutes: text(formData, "runtimeMinutes"),
      genre: text(formData, "genre"),
      ticketPrice: text(formData, "ticketPrice"),
      bankName: text(formData, "bankName"),
      accountNumber: text(formData, "accountNumber"),
      accountHolder: text(formData, "accountHolder"),
      maxTicketsPerPerson: text(formData, "maxTicketsPerPerson"),
      cancelDeadlineAt: text(formData, "cancelDeadlineAt"),
      eventStartAt: text(formData, "eventStartAt"),
      eventEndAt: text(formData, "eventEndAt"),
    });
  if (!result.success)
    return {
      error: result.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  const data = result.data;
  if (data.cancelDeadlineAt >= data.eventStartAt)
    return { error: "취소 마감은 공연 시작 전이어야 합니다." };
  if (data.eventEndAt !== "" && data.eventEndAt <= data.eventStartAt)
    return { error: "종료 시간은 시작 시간 이후여야 합니다." };

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
  const seatRows =
    event.reservation_type === "SEAT_SELECTION"
      ? await sql`SELECT COUNT(*)::int AS count FROM seats WHERE event_id=${eventId} AND is_active`
      : [{ count: 1 }];
  if (
    !event.title ||
    !event.venue ||
    !event.description ||
    !event.bank_name ||
    !event.account_number ||
    !event.account_holder ||
    Number(seatRows[0].count) < 1
  ) {
    redirect(`/dashboard/events/${eventId}/overview?error=publish`);
  }
  await sql.transaction((tx) => [
    tx`UPDATE events SET status='SCHEDULED',published_at=COALESCE(published_at,NOW()) WHERE id=${eventId} AND organizer_id=${event.organizer_id}`,
    tx`
      INSERT INTO feed_posts (event_id, image_url, content)
      SELECT id, poster_image_url, description
      FROM events
      WHERE id=${eventId} AND organizer_id=${event.organizer_id}
        AND NOT EXISTS (SELECT 1 FROM feed_posts WHERE event_id=${eventId})
    `,
  ]);
  revalidatePath("/feed");
  revalidatePath(`/events/${event.slug}`);
  redirect(`/dashboard/events/${eventId}/overview?published=1`);
}

export async function changeEventStatus(formData: FormData) {
  const eventId = text(formData, "eventId");
  const status = z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "HIDDEN", "CANCELLED"])
    .parse(text(formData, "status"));
  const { event, sql } = await requireOwnedEvent(eventId);
  if (event.status === "CANCELLED")
    redirect(`/dashboard/events/${eventId}/overview`);
  await sql`UPDATE events SET status=${status},published_at=CASE WHEN ${status} IN('SCHEDULED','IN_PROGRESS','COMPLETED') THEN COALESCE(published_at,NOW()) ELSE published_at END WHERE id=${eventId} AND organizer_id=${event.organizer_id}`;
  revalidatePath("/feed");
  revalidatePath(`/events/${event.slug}`);
  revalidatePath(`/dashboard/events/${eventId}/overview`);
  redirect(`/dashboard/events/${eventId}/overview?status=${status}`);
}

export async function addSeats(formData: FormData) {
  const eventId = text(formData, "eventId");
  const { event, sql } = await requireOwnedEvent(eventId);
  if (event.reservation_type !== "SEAT_SELECTION")
    redirect(`/dashboard/events/${eventId}/seats?error=type`);
  if (event.published_at)
    redirect(`/dashboard/events/${eventId}/seats?error=published`);
  const labels = lines(text(formData, "labels"));
  if (!labels.length)
    redirect(`/dashboard/events/${eventId}/seats?error=empty`);
  try {
    await sql.transaction((tx) =>
      labels.map(
        (label) =>
          tx`INSERT INTO seats(event_id,label) VALUES(${eventId},${label}) ON CONFLICT(event_id,label) DO UPDATE SET is_active=TRUE`,
      ),
    );
  } catch {
    redirect(`/dashboard/events/${eventId}/seats?error=save`);
  }
  revalidatePath(`/dashboard/events/${eventId}/seats`);
  redirect(`/dashboard/events/${eventId}/seats?added=${labels.length}`);
}

export async function updateSeat(formData: FormData) {
  const eventId = text(formData, "eventId"),
    seatId = text(formData, "seatId"),
    label = z.string().trim().min(1).max(30).parse(text(formData, "label")),
    row = z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .parse(text(formData, "layoutRow") || undefined),
    column = z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .parse(text(formData, "layoutColumn") || undefined);
  const { event, sql } = await requireOwnedEvent(eventId);
  if (event.published_at)
    redirect(`/dashboard/events/${eventId}/seats?error=published`);
  await sql`UPDATE seats SET label=${label},layout_row=COALESCE(${row ?? null},layout_row),layout_column=COALESCE(${column ?? null},layout_column) WHERE id=${seatId} AND event_id=${eventId}`;
  revalidatePath(`/dashboard/events/${eventId}/seats`);
}

export async function toggleSeat(formData: FormData) {
  const eventId = text(formData, "eventId"),
    seatId = text(formData, "seatId"),
    activate = text(formData, "activate") === "1";
  const { event, sql } = await requireOwnedEvent(eventId);
  if (event.published_at)
    redirect(`/dashboard/events/${eventId}/seats?error=published`);
  if (!activate) {
    const active =
      await sql`SELECT 1 FROM reservation_seats rs JOIN reservations r ON r.id=rs.reservation_id WHERE rs.seat_id=${seatId} AND rs.released_at IS NULL AND r.status IN('PENDING_PAYMENT','CONFIRMED','CHECKED_IN') LIMIT 1`;
    if (active[0])
      redirect(`/dashboard/events/${eventId}/seats?error=occupied`);
  }
  await sql`UPDATE seats SET is_active=${activate} WHERE id=${seatId} AND event_id=${eventId}`;
  revalidatePath(`/dashboard/events/${eventId}/seats`);
}

export async function replaceSeatLayout(formData: FormData) {
  const eventId = text(formData, "eventId");
  const { event, sql } = await requireOwnedEvent(eventId);
  if (event.reservation_type !== "SEAT_SELECTION")
    redirect(`/dashboard/events/${eventId}/seats?error=type`);
  if (event.published_at)
    redirect(`/dashboard/events/${eventId}/seats?error=published`);
  const layout = z
    .array(
      z.object({
        label: z.string().min(1).max(30),
        row: z.number().int().positive(),
        column: z.number().int().positive(),
      }),
    )
    .min(1)
    .parse(JSON.parse(text(formData, "seatLayout") || "[]"));
  const reservations =
    await sql`SELECT 1 FROM reservations WHERE event_id=${eventId} LIMIT 1`;
  if (reservations[0])
    redirect(`/dashboard/events/${eventId}/seats?error=history`);
  await sql.transaction((tx) => [
    tx`DELETE FROM seats WHERE event_id=${eventId}`,
    ...layout.map(
      (seat) =>
        tx`INSERT INTO seats(event_id,label,layout_row,layout_column) VALUES(${eventId},${seat.label},${seat.row},${seat.column})`,
    ),
  ]);
  revalidatePath(`/dashboard/events/${eventId}/seats`);
  redirect(`/dashboard/events/${eventId}/seats?replaced=1`);
}

export async function addTicketType(formData: FormData) {
  const eventId = text(formData, "eventId"),
    name = z.string().trim().min(1).max(50).parse(text(formData, "name"));
  const { sql } = await requireOwnedEvent(eventId);
  await sql`INSERT INTO ticket_types(event_id,name) VALUES(${eventId},${name}) ON CONFLICT(event_id,name) DO NOTHING`;
  revalidatePath(`/dashboard/events/${eventId}/ticket-types`);
}

export async function updateTicketType(formData: FormData) {
  const eventId = text(formData, "eventId"),
    typeId = text(formData, "ticketTypeId"),
    name = z.string().trim().min(1).max(50).parse(text(formData, "name"));
  const { sql } = await requireOwnedEvent(eventId);
  await sql`UPDATE ticket_types SET name=${name} WHERE id=${typeId} AND event_id=${eventId}`;
  revalidatePath(`/dashboard/events/${eventId}/ticket-types`);
}

export async function deleteTicketType(formData: FormData) {
  const eventId = text(formData, "eventId"),
    typeId = text(formData, "ticketTypeId");
  const { sql } = await requireOwnedEvent(eventId);
  await sql`DELETE FROM ticket_types WHERE id=${typeId} AND event_id=${eventId}`;
  revalidatePath(`/dashboard/events/${eventId}/ticket-types`);
}

export async function createFeedPost(formData: FormData) {
  const eventId = text(formData, "eventId");
  const { event, sql } = await requireOwnedEvent(eventId);
  const imageUrl = z
    .string()
    .trim()
    .url()
    .parse(await resolveImageUrl(formData, "imageUrl", "image"));
  const content = z
    .string()
    .trim()
    .min(1)
    .max(3000)
    .parse(text(formData, "content"));
  await sql`INSERT INTO feed_posts (event_id, image_url, content) VALUES (${eventId}, ${imageUrl}, ${content})`;
  revalidatePath(`/dashboard/events/${eventId}/feed`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/feed");
}

export async function updateFeedPost(formData: FormData) {
  const eventId = text(formData, "eventId");
  const postId = text(formData, "postId");
  const { event, sql } = await requireOwnedEvent(eventId);
  const imageUrl = z
    .string()
    .trim()
    .url()
    .parse(await resolveImageUrl(formData, "imageUrl", "image"));
  const content = z
    .string()
    .trim()
    .min(1)
    .max(3000)
    .parse(text(formData, "content"));
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
