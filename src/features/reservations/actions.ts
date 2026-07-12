"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { generateQrDataUrl } from "./qr";

export type ReservationActionState = { error?: string };
export type LookupActionState = {
  error?: string;
  reservation?: ReservationView;
  candidates?: {
    id: string;
    createdAt: string;
    quantity: number;
    status: string;
  }[];
};
type ReservationView = {
  id: string;
  eventSlug: string;
  eventTitle: string;
  name: string;
  phone: string;
  quantity: number;
  totalPrice: number;
  status: string;
  reservationCode: string | null;
  qrImageData: string | null;
  qrStatus: string;
  seats: string[];
  cancelDeadline: string;
  checkedInAt: string | null;
};

const schema = z.object({
  eventId: z.string().uuid(),
  eventSlug: z.string().min(1),
  ticketTypeId: z.union([z.literal(""), z.string().uuid()]),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(8).max(30),
  depositorName: z.string().trim().min(1).max(80),
  lookupPassword: z
    .string()
    .regex(/^\d{4,6}$/, "조회 패스워드는 숫자 4~6자리여야 합니다."),
  quantity: z.coerce.number().int().positive(),
  requestNote: z.string().trim().max(500),
});

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createReservation(
  _: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  const parsed = schema.safeParse({
    eventId: text(formData, "eventId"),
    eventSlug: text(formData, "eventSlug"),
    ticketTypeId: text(formData, "ticketTypeId"),
    name: text(formData, "name"),
    phone: text(formData, "phone"),
    depositorName: text(formData, "depositorName"),
    lookupPassword: text(formData, "lookupPassword"),
    quantity: text(formData, "quantity"),
    requestNote: text(formData, "requestNote"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };

  const data = parsed.data;
  const seatIds = [...new Set(formData.getAll("seatIds").map(String))];
  const sql = getSql();
  const eventRows = await sql`
    SELECT id, slug, reservation_type, max_tickets_per_person
    FROM events WHERE id = ${data.eventId} AND slug = ${data.eventSlug} AND status IN ('SCHEDULED', 'IN_PROGRESS') LIMIT 1
  `;
  const event = eventRows[0];
  if (!event) return { error: "예매할 수 없는 공연입니다." };
  if (data.quantity > Number(event.max_tickets_per_person))
    return { error: "공연의 1인 최대 예매 매수를 초과했습니다." };
  if (
    event.reservation_type === "SEAT_SELECTION" &&
    seatIds.length !== data.quantity
  )
    return { error: "선택 좌석 수와 예매 매수가 일치하지 않습니다." };
  if (event.reservation_type === "FIRST_COME" && seatIds.length > 0)
    return { error: "선착순 공연에는 좌석을 선택할 수 없습니다." };

  const reservationId = randomUUID();
  const passwordHash = await hashPassword(data.lookupPassword);
  const ticketTypeId = data.ticketTypeId || null;
  try {
    if (event.reservation_type === "FIRST_COME") {
      const [, rows] = await sql.transaction((tx) => [
        tx`UPDATE events SET updated_at=updated_at WHERE id=${data.eventId} RETURNING id`,
        tx`
          INSERT INTO reservations (
            id, event_id, ticket_type_id, reserver_name, reserver_phone, depositor_name, lookup_password_hash,
            quantity, unit_price, total_price, request_note, status
          )
          SELECT ${reservationId}, e.id, ${ticketTypeId}, ${data.name}, ${data.phone}, ${data.depositorName}, ${passwordHash},
            ${data.quantity}, e.ticket_price, e.ticket_price * ${data.quantity}, ${data.requestNote || null}, 'PENDING_PAYMENT'
          FROM events e
          WHERE e.id = ${data.eventId} AND e.status IN ('SCHEDULED', 'IN_PROGRESS')
            AND e.reservation_type = 'FIRST_COME'
            AND (
              (${ticketTypeId}::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.id = ${ticketTypeId} AND tt.event_id = e.id))
              OR (${ticketTypeId}::uuid IS NULL AND NOT EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id))
            )
            AND e.total_capacity >= ${data.quantity} + COALESCE((
              SELECT SUM(r.quantity) FROM reservations r
              WHERE r.event_id = e.id AND r.status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN')
            ), 0)
          RETURNING id
        `,
      ]);
      if (rows.length === 0)
        return {
          error: "잔여 수량이 부족하거나 티켓 타입이 올바르지 않습니다.",
        };
    } else {
      const [reservationRows] = await sql.transaction(
        (tx) => [
          tx`
          INSERT INTO reservations (
            id, event_id, ticket_type_id, reserver_name, reserver_phone, depositor_name, lookup_password_hash,
            quantity, unit_price, total_price, request_note, status
          )
          SELECT ${reservationId}, e.id, ${ticketTypeId}, ${data.name}, ${data.phone}, ${data.depositorName}, ${passwordHash},
            ${data.quantity}, e.ticket_price, e.ticket_price * ${data.quantity}, ${data.requestNote || null}, 'PENDING_PAYMENT'
          FROM events e
          WHERE e.id = ${data.eventId} AND e.status IN ('SCHEDULED', 'IN_PROGRESS')
            AND e.reservation_type = 'SEAT_SELECTION'
            AND (
              (${ticketTypeId}::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.id = ${ticketTypeId} AND tt.event_id = e.id))
              OR (${ticketTypeId}::uuid IS NULL AND NOT EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id))
            )
            AND (SELECT COUNT(*) FROM seats s WHERE s.event_id = e.id AND s.is_active AND s.id = ANY(${seatIds}::uuid[])
              AND NOT EXISTS (SELECT 1 FROM reservation_seats rs WHERE rs.seat_id = s.id AND rs.released_at IS NULL)) = ${data.quantity}
          RETURNING id
        `,
          tx`
          INSERT INTO reservation_seats (reservation_id, seat_id)
          SELECT ${reservationId}, s.id FROM seats s
          WHERE s.event_id = ${data.eventId} AND s.is_active AND s.id = ANY(${seatIds}::uuid[])
        `,
        ],
        { isolationLevel: "Serializable" },
      );
      if (reservationRows.length === 0)
        return {
          error:
            "선택한 좌석을 사용할 수 없거나 티켓 타입이 올바르지 않습니다.",
        };
    }
  } catch {
    return {
      error: "다른 관객이 먼저 좌석을 선택했습니다. 좌석을 다시 선택해주세요.",
    };
  }

  redirect(
    `/reservation/status?event=${encodeURIComponent(data.eventSlug)}&created=1`,
  );
}

export async function createWaitlist(
  _: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  const parsed = schema
    .omit({ ticketTypeId: true, requestNote: true })
    .safeParse({
      eventId: text(formData, "eventId"),
      eventSlug: text(formData, "eventSlug"),
      name: text(formData, "name"),
      phone: text(formData, "phone"),
      depositorName: text(formData, "depositorName"),
      lookupPassword: text(formData, "lookupPassword"),
      quantity: text(formData, "quantity"),
    });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  const data = parsed.data;
  const sql = getSql();
  const passwordHash = await hashPassword(data.lookupPassword);
  const rows =
    await sql`INSERT INTO reservations (event_id,reserver_name,reserver_phone,depositor_name,lookup_password_hash,quantity,unit_price,total_price,status) SELECT e.id,${data.name},${data.phone},${data.depositorName},${passwordHash},${data.quantity},e.ticket_price,e.ticket_price*${data.quantity},'WAITLISTED' FROM events e WHERE e.id=${data.eventId} AND e.slug=${data.eventSlug} AND e.status IN ('SCHEDULED','IN_PROGRESS') AND e.reservation_type='FIRST_COME' RETURNING id`;
  if (!rows.length) return { error: "대기 신청할 수 없는 공연입니다." };
  redirect(
    `/reservation/status?event=${encodeURIComponent(data.eventSlug)}&waitlisted=1`,
  );
}

function reservationCode() {
  return `OCC-${new Date().getFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function confirmReservation(formData: FormData) {
  const session = await requireOrganizer();
  const reservationId = text(formData, "reservationId");
  const eventId = text(formData, "eventId");
  const token = randomBytes(32).toString("base64url");
  const code = reservationCode();
  const sql = getSql();
  const rows = await sql`
    UPDATE reservations r SET status='CONFIRMED', reservation_code=${code}, qr_token=${token},
      qr_image_data=NULL, qr_generation_status='PENDING', qr_generation_error=NULL
    FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id
      AND e.organizer_id=${session.organizerId} AND r.status IN ('PENDING_PAYMENT', 'WAITLISTED')
      AND (r.status <> 'WAITLISTED' OR (e.reservation_type='FIRST_COME' AND e.total_capacity >= r.quantity + COALESCE((SELECT SUM(active.quantity) FROM reservations active WHERE active.event_id=e.id AND active.status IN ('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')),0)))
    RETURNING r.id
  `;
  if (rows.length) {
    try {
      const image = await generateQrDataUrl(token);
      await sql`UPDATE reservations SET qr_image_data=${image}, qr_generation_status='READY', qr_generation_error=NULL WHERE id=${reservationId} AND qr_token=${token}`;
    } catch (error) {
      await sql`UPDATE reservations SET qr_generation_status='FAILED', qr_generation_error=${error instanceof Error ? error.message.slice(0, 500) : "QR 생성 실패"} WHERE id=${reservationId} AND qr_token=${token}`;
    }
  }
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function retryQrGeneration(formData: FormData) {
  const session = await requireOrganizer();
  const reservationId = text(formData, "reservationId");
  const eventId = text(formData, "eventId");
  const sql = getSql();
  const rows = await sql`
    UPDATE reservations r SET qr_generation_status='PENDING', qr_generation_error=NULL
    FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id
      AND e.organizer_id=${session.organizerId} AND r.status='CONFIRMED' AND r.qr_token IS NOT NULL
    RETURNING r.qr_token
  `;
  if (rows[0]) {
    try {
      const image = await generateQrDataUrl(String(rows[0].qr_token));
      await sql`UPDATE reservations SET qr_image_data=${image}, qr_generation_status='READY' WHERE id=${reservationId}`;
    } catch (error) {
      await sql`UPDATE reservations SET qr_generation_status='FAILED', qr_generation_error=${error instanceof Error ? error.message.slice(0, 500) : "QR 생성 실패"} WHERE id=${reservationId}`;
    }
  }
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function revokeConfirmation(formData: FormData) {
  const session = await requireOrganizer();
  const reservationId = text(formData, "reservationId");
  const eventId = text(formData, "eventId");
  await getSql()`UPDATE reservations r SET status='PENDING_PAYMENT', reservation_code=NULL, qr_token=NULL, qr_image_data=NULL, qr_generation_status='NOT_REQUESTED', qr_generation_error=NULL FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND r.status='CONFIRMED'`;
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function organizerCancelReservation(formData: FormData) {
  const session = await requireOrganizer();
  const eventId = text(formData, "eventId"),
    reservationId = text(formData, "reservationId");
  const sql = getSql();
  const rows =
    await sql`UPDATE reservations r SET status='CANCELLED',reservation_code=NULL,qr_token=NULL,qr_image_data=NULL,qr_generation_status='NOT_REQUESTED',qr_generation_error=NULL FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND r.status IN('PENDING_PAYMENT','CONFIRMED','WAITLISTED') RETURNING r.id`;
  if (rows[0])
    await sql`UPDATE reservation_seats SET released_at=NOW() WHERE reservation_id=${reservationId} AND released_at IS NULL`;
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function convertWaitlistReservation(formData: FormData) {
  const session = await requireOrganizer();
  const eventId = text(formData, "eventId"),
    reservationId = text(formData, "reservationId");
  const sql = getSql();
  await sql`UPDATE reservations r SET status='PENDING_PAYMENT' FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND r.status='WAITLISTED' AND e.reservation_type='FIRST_COME' AND e.total_capacity >= r.quantity+COALESCE((SELECT SUM(a.quantity) FROM reservations a WHERE a.event_id=e.id AND a.status IN('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')),0)`;
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function bulkCancelReservations(formData: FormData) {
  const session = await requireOrganizer();
  const eventId = text(formData, "eventId"),
    ids = [...new Set(formData.getAll("reservationIds").map(String))];
  if (!ids.length) return;
  const sql = getSql();
  const rows =
    await sql`UPDATE reservations r SET status='CANCELLED',reservation_code=NULL,qr_token=NULL,qr_image_data=NULL,qr_generation_status='NOT_REQUESTED',qr_generation_error=NULL FROM events e WHERE r.id=ANY(${ids}::uuid[]) AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND r.status IN('PENDING_PAYMENT','CONFIRMED','WAITLISTED') RETURNING r.id`;
  const cancelled = rows.map((row) => String(row.id));
  if (cancelled.length)
    await sql`UPDATE reservation_seats SET released_at=NOW() WHERE reservation_id=ANY(${cancelled}::uuid[]) AND released_at IS NULL`;
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function bulkApproveReservations(formData: FormData) {
  const session = await requireOrganizer();
  const ids = [...new Set(formData.getAll("reservationIds").map(String))];
  const eventId = text(formData, "eventId");
  const rows = ids.length
    ? await getSql()`SELECT r.id FROM reservations r JOIN events e ON e.id=r.event_id WHERE r.id=ANY(${ids}::uuid[]) AND r.event_id=${eventId} AND r.status='PENDING_PAYMENT' AND e.organizer_id=${session.organizerId}`
    : [];
  for (const row of rows) {
    const item = new FormData();
    item.set("eventId", eventId);
    item.set("reservationId", String(row.id));
    await confirmReservation(item);
  }
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

async function findReservation(formData: FormData, enforceRateLimit = true) {
  const slug = text(formData, "eventSlug").trim();
  const name = text(formData, "name").trim();
  const phone = text(formData, "phone").trim();
  const reservationId = text(formData, "reservationId");
  if (
    enforceRateLimit &&
    !(await consumeRateLimit("reservation-lookup", `${slug}:${phone}`, 10))
  )
    return "RATE_LIMITED" as const;
  const rows =
    await getSql()`SELECT r.*, e.slug event_slug, e.title event_title, e.event_start_at,e.cancel_deadline_at, COALESCE(array_agg(s.label ORDER BY s.label) FILTER (WHERE rs.released_at IS NULL), '{}') seats FROM reservations r JOIN events e ON e.id=r.event_id LEFT JOIN reservation_seats rs ON rs.reservation_id=r.id LEFT JOIN seats s ON s.id=rs.seat_id WHERE e.slug=${slug} AND r.reserver_name=${name} AND r.reserver_phone=${phone} AND (${reservationId}='' OR r.id=${reservationId}::uuid) GROUP BY r.id,e.slug,e.title,e.event_start_at,e.cancel_deadline_at ORDER BY r.created_at DESC LIMIT 20`;
  const password = text(formData, "lookupPassword");
  for (const row of rows) {
    if (await verifyPassword(password, String(row.lookup_password_hash)))
      return row;
  }
  return null;
}

export async function lookupReservation(
  _: LookupActionState,
  formData: FormData,
): Promise<LookupActionState> {
  if (!text(formData, "reservationId")) {
    const slug = text(formData, "eventSlug").trim(),
      name = text(formData, "name").trim(),
      phone = text(formData, "phone").trim();
    if (!(await consumeRateLimit("reservation-lookup", `${slug}:${phone}`, 10)))
      return { error: "조회 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };
    const rows =
      await getSql()`SELECT r.id,r.created_at,r.quantity,r.status,r.lookup_password_hash FROM reservations r JOIN events e ON e.id=r.event_id WHERE e.slug=${slug} AND r.reserver_name=${name} AND r.reserver_phone=${phone} ORDER BY r.created_at DESC LIMIT 20`;
    const password = text(formData, "lookupPassword"),
      matched = [];
    for (const row of rows)
      if (await verifyPassword(password, String(row.lookup_password_hash)))
        matched.push(row);
    if (matched.length > 1)
      return {
        candidates: matched.map((row) => ({
          id: String(row.id),
          createdAt: String(row.created_at),
          quantity: Number(row.quantity),
          status: String(row.status),
        })),
      };
  }
  const row = await findReservation(formData, false);
  if (row === "RATE_LIMITED")
    return { error: "조회 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };
  if (!row) return { error: "공연 정보 또는 예매 조회 정보를 확인해주세요." };
  return {
    reservation: {
      id: String(row.id),
      eventSlug: String(row.event_slug),
      eventTitle: String(row.event_title),
      name: String(row.reserver_name),
      phone: String(row.reserver_phone),
      quantity: Number(row.quantity),
      totalPrice: Number(row.total_price),
      status: String(row.status),
      reservationCode: row.reservation_code
        ? String(row.reservation_code)
        : null,
      qrImageData:
        row.status === "CONFIRMED" || row.status === "CHECKED_IN"
          ? row.qr_image_data
            ? String(row.qr_image_data)
            : null
          : null,
      qrStatus: String(row.qr_generation_status),
      seats: (row.seats as string[]) ?? [],
      cancelDeadline: String(row.cancel_deadline_at),
      checkedInAt: row.checked_in_at ? String(row.checked_in_at) : null,
    },
  };
}

export async function cancelReservation(
  _: LookupActionState,
  formData: FormData,
): Promise<LookupActionState> {
  const row = await findReservation(formData);
  if (row === "RATE_LIMITED")
    return { error: "조회 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };
  if (!row) return { error: "예매 조회 정보를 다시 확인해주세요." };
  if (row.status === "CHECKED_IN")
    return { error: "입장 완료된 예매는 취소할 수 없습니다." };
  if (new Date(String(row.cancel_deadline_at)).getTime() <= Date.now())
    return { error: "취소 마감 시간이 지났습니다." };
  if (!["PENDING_PAYMENT", "CONFIRMED"].includes(String(row.status)))
    return { error: "취소할 수 없는 예매 상태입니다." };
  const sql = getSql();
  await sql.transaction((tx) => [
    tx`UPDATE reservations SET status='CANCELLED', reservation_code=NULL, qr_token=NULL, qr_image_data=NULL, qr_generation_status='NOT_REQUESTED', qr_generation_error=NULL WHERE id=${row.id} AND status IN ('PENDING_PAYMENT','CONFIRMED')`,
    tx`UPDATE reservation_seats SET released_at=NOW() WHERE reservation_id=${row.id} AND released_at IS NULL`,
  ]);
  return {
    reservation: {
      id: String(row.id),
      eventSlug: String(row.event_slug),
      eventTitle: String(row.event_title),
      name: String(row.reserver_name),
      phone: String(row.reserver_phone),
      quantity: Number(row.quantity),
      totalPrice: Number(row.total_price),
      status: "CANCELLED",
      reservationCode: null,
      qrImageData: null,
      qrStatus: "NOT_REQUESTED",
      seats: [],
      cancelDeadline: String(row.cancel_deadline_at),
      checkedInAt: null,
    },
  };
}
