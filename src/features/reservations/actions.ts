"use server";

import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { normalizePhone } from "./phone";
import { generateQrDataUrl } from "./qr";

export type ReservationActionState = { error?: string };
const OCCUPIED_SEAT_ERROR =
  "선택한 좌석은 이미 예매된 자리입니다. 다른 좌석을 선택해주세요.";
export type LookupActionState = {
  error?: string;
  reservation?: ReservationView;
  candidates?: {
    id: string;
    eventTitle: string;
    eventStartAt: string;
    createdAt: string;
    quantity: number;
    status: string;
  }[];
  passwordChange?: {
    reservationId: string;
    eventTitle: string;
  };
};
export type ResetLookupPasswordState = {
  error?: string;
  temporaryPassword?: string;
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
  tickets: {
    number: number;
    seat: string | null;
    qrImageData: string | null;
    qrStatus: string;
    checkedInAt: string | null;
  }[];
  seats: string[];
  cancelDeadline: string;
  checkedInAt: string | null;
  inquiryContact: string;
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
    phone: normalizePhone(text(formData, "phone")),
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

  const ticketTypeId = data.ticketTypeId || null;
  const ticketTypeRows = await sql`
    SELECT (
      (${ticketTypeId}::uuid IS NOT NULL AND EXISTS (
        SELECT 1 FROM ticket_types tt
        WHERE tt.id = ${ticketTypeId}::uuid AND tt.event_id = ${data.eventId}
      ))
      OR (${ticketTypeId}::uuid IS NULL AND NOT EXISTS (
        SELECT 1 FROM ticket_types tt WHERE tt.event_id = ${data.eventId}
      ))
    ) AS valid
  `;
  if (!ticketTypeRows[0]?.valid)
    return { error: "티켓 타입을 다시 선택해주세요." };

  const reservationId = randomUUID();
  const passwordHash = await hashPassword(data.lookupPassword);
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
            ${data.quantity}, COALESCE(tt.price,e.ticket_price), COALESCE(tt.price,e.ticket_price) * ${data.quantity}, ${data.requestNote || null}, 'PENDING_PAYMENT'
          FROM events e
          LEFT JOIN ticket_types tt ON tt.id=${ticketTypeId}::uuid AND tt.event_id=e.id
          WHERE e.id = ${data.eventId} AND e.status IN ('SCHEDULED', 'IN_PROGRESS')
            AND e.reservation_type = 'FIRST_COME'
            AND (
              (${ticketTypeId}::uuid IS NOT NULL AND tt.id IS NOT NULL)
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
            ${data.quantity}, COALESCE(tt.price,e.ticket_price), COALESCE(tt.price,e.ticket_price) * ${data.quantity}, ${data.requestNote || null}, 'PENDING_PAYMENT'
          FROM events e
          LEFT JOIN ticket_types tt ON tt.id=${ticketTypeId}::uuid AND tt.event_id=e.id
          WHERE e.id = ${data.eventId} AND e.status IN ('SCHEDULED', 'IN_PROGRESS')
            AND e.reservation_type = 'SEAT_SELECTION'
            AND (
              (${ticketTypeId}::uuid IS NOT NULL AND tt.id IS NOT NULL)
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
          error: OCCUPIED_SEAT_ERROR,
        };
    }
  } catch (error) {
    const databaseCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    return {
      error:
        event.reservation_type === "SEAT_SELECTION" &&
        (databaseCode === "23505" || databaseCode === "40001")
          ? OCCUPIED_SEAT_ERROR
          : "예매 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
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
      phone: normalizePhone(text(formData, "phone")),
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
  const code = reservationCode();
  const sql = getSql();
  const rows = await sql`
    UPDATE reservations r SET status='CONFIRMED', reservation_code=${code}, qr_token=NULL,
      qr_image_data=NULL, qr_generation_status='NOT_REQUESTED', qr_generation_error=NULL
    FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id
      AND e.organizer_id=${session.organizerId} AND r.status IN ('PENDING_PAYMENT', 'WAITLISTED')
      AND (r.status <> 'WAITLISTED' OR (e.reservation_type='FIRST_COME' AND e.total_capacity >= r.quantity + COALESCE((SELECT SUM(active.quantity) FROM reservations active WHERE active.event_id=e.id AND active.status IN ('PENDING_PAYMENT','CONFIRMED','CHECKED_IN')),0)))
    RETURNING r.id, r.quantity
  `;
  if (rows.length) {
    const tickets = Array.from(
      { length: Number(rows[0].quantity) },
      (_, i) => ({
        number: i + 1,
        token: randomBytes(32).toString("base64url"),
      }),
    );
    await sql.transaction((tx) =>
      tickets.map(
        (ticket) => tx`
          INSERT INTO reservation_tickets(reservation_id,seat_id,ticket_number,qr_token)
          VALUES(
            ${reservationId},
            (SELECT rs.seat_id FROM reservation_seats rs WHERE rs.reservation_id=${reservationId} AND rs.released_at IS NULL ORDER BY rs.created_at,rs.seat_id OFFSET ${ticket.number - 1} LIMIT 1),
            ${ticket.number},${ticket.token}
          )
          ON CONFLICT(reservation_id,ticket_number) DO NOTHING
        `,
      ),
    );
    for (const ticket of tickets) {
      try {
        const image = await generateQrDataUrl(ticket.token);
        await sql`UPDATE reservation_tickets SET qr_image_data=${image},qr_generation_status='READY',qr_generation_error=NULL WHERE reservation_id=${reservationId} AND ticket_number=${ticket.number}`;
      } catch (error) {
        await sql`UPDATE reservation_tickets SET qr_generation_status='FAILED',qr_generation_error=${error instanceof Error ? error.message.slice(0, 500) : "QR 생성 실패"} WHERE reservation_id=${reservationId} AND ticket_number=${ticket.number}`;
      }
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
    UPDATE reservation_tickets rt SET qr_generation_status='PENDING',qr_generation_error=NULL
    FROM reservations r,events e
    WHERE rt.reservation_id=r.id AND r.id=${reservationId} AND r.event_id=${eventId}
      AND e.id=r.event_id AND e.organizer_id=${session.organizerId}
      AND r.status IN('CONFIRMED','CHECKED_IN') AND rt.qr_generation_status<>'READY'
    RETURNING rt.id,rt.qr_token
  `;
  for (const row of rows) {
    try {
      const image = await generateQrDataUrl(String(row.qr_token));
      await sql`UPDATE reservation_tickets SET qr_image_data=${image},qr_generation_status='READY' WHERE id=${row.id}`;
    } catch (error) {
      await sql`UPDATE reservation_tickets SET qr_generation_status='FAILED',qr_generation_error=${error instanceof Error ? error.message.slice(0, 500) : "QR 생성 실패"} WHERE id=${row.id}`;
    }
  }
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function revokeConfirmation(formData: FormData) {
  const session = await requireOrganizer();
  const reservationId = text(formData, "reservationId");
  const eventId = text(formData, "eventId");
  const sql = getSql();
  await sql.transaction((tx) => [
    tx`DELETE FROM reservation_tickets rt USING reservations r,events e WHERE rt.reservation_id=r.id AND r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND NOT EXISTS(SELECT 1 FROM reservation_tickets used WHERE used.reservation_id=r.id AND used.checked_in_at IS NOT NULL)`,
    tx`UPDATE reservations r SET status='PENDING_PAYMENT',reservation_code=NULL,qr_token=NULL,qr_image_data=NULL,qr_generation_status='NOT_REQUESTED',qr_generation_error=NULL FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND r.status='CONFIRMED' AND NOT EXISTS(SELECT 1 FROM reservation_tickets used WHERE used.reservation_id=r.id AND used.checked_in_at IS NOT NULL)`,
  ]);
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
}

export async function organizerCancelReservation(formData: FormData) {
  const session = await requireOrganizer();
  const eventId = text(formData, "eventId"),
    reservationId = text(formData, "reservationId");
  const sql = getSql();
  const rows =
    await sql`UPDATE reservations r SET status='CANCELLED',reservation_code=NULL,qr_token=NULL,qr_image_data=NULL,qr_generation_status='NOT_REQUESTED',qr_generation_error=NULL FROM events e WHERE r.id=${reservationId} AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND r.status IN('PENDING_PAYMENT','CONFIRMED','WAITLISTED') AND NOT EXISTS(SELECT 1 FROM reservation_tickets rt WHERE rt.reservation_id=r.id AND rt.checked_in_at IS NOT NULL) RETURNING r.id`;
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
    await sql`UPDATE reservations r SET status='CANCELLED',reservation_code=NULL,qr_token=NULL,qr_image_data=NULL,qr_generation_status='NOT_REQUESTED',qr_generation_error=NULL FROM events e WHERE r.id=ANY(${ids}::uuid[]) AND r.event_id=${eventId} AND e.id=r.event_id AND e.organizer_id=${session.organizerId} AND r.status IN('PENDING_PAYMENT','CONFIRMED','WAITLISTED') AND NOT EXISTS(SELECT 1 FROM reservation_tickets rt WHERE rt.reservation_id=r.id AND rt.checked_in_at IS NOT NULL) RETURNING r.id`;
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
  const name = text(formData, "name").trim();
  const phone = normalizePhone(text(formData, "phone"));
  const reservationId = text(formData, "reservationId");
  const reservationUuid = reservationId || null;
  if (
    enforceRateLimit &&
    !(await consumeRateLimit("reservation-lookup", `${name}:${phone}`, 10))
  )
    return "RATE_LIMITED" as const;
  const rows =
    await getSql()`SELECT r.*,e.slug event_slug,e.title event_title,e.event_start_at,e.cancel_deadline_at,e.inquiry_contact,COALESCE(array_agg(s.label ORDER BY s.label) FILTER(WHERE rs.released_at IS NULL),'{}') seats FROM reservations r JOIN events e ON e.id=r.event_id LEFT JOIN reservation_seats rs ON rs.reservation_id=r.id LEFT JOIN seats s ON s.id=rs.seat_id WHERE r.reserver_name=${name} AND regexp_replace(r.reserver_phone,'[^0-9]','','g')=${phone} AND (${reservationUuid}::uuid IS NULL OR r.id=${reservationUuid}::uuid) GROUP BY r.id,e.slug,e.title,e.event_start_at,e.cancel_deadline_at,e.inquiry_contact ORDER BY r.created_at DESC LIMIT 50`;
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
  const name = text(formData, "name").trim();
  const phone = normalizePhone(text(formData, "phone"));
  const password = text(formData, "lookupPassword");
  if (!name) return { error: "예매할 때 입력한 이름을 입력해주세요." };
  if (phone.length < 8 || phone.length > 15)
    return {
      error: "연락처는 숫자 8~15자리로 입력해주세요. 하이픈은 있어도 됩니다.",
    };
  if (!/^\d{4,6}$/.test(password))
    return { error: "조회 패스워드는 예매할 때 입력한 숫자 4~6자리입니다." };

  const sql = getSql();
  const reservationId = text(formData, "reservationId");
  if (!reservationId) {
    if (!(await consumeRateLimit("reservation-lookup", `${name}:${phone}`, 10)))
      return { error: "조회 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };
  }
  if (reservationId && !z.string().uuid().safeParse(reservationId).success)
    return {
      error:
        "선택한 예매 정보가 올바르지 않습니다. 목록에서 다시 선택해주세요.",
    };

  const rows =
    await sql`SELECT r.id,r.created_at,r.quantity,r.status,r.lookup_password_hash,r.lookup_password_must_change,e.title event_title,e.event_start_at FROM reservations r JOIN events e ON e.id=r.event_id WHERE r.reserver_name=${name} AND regexp_replace(r.reserver_phone,'[^0-9]','','g')=${phone} ORDER BY e.event_start_at DESC,r.created_at DESC LIMIT 50`;
  const matched = [];
  for (const candidate of rows)
    if (await verifyPassword(password, String(candidate.lookup_password_hash)))
      matched.push(candidate);
  const candidates = matched.map((candidate) => ({
    id: String(candidate.id),
    eventTitle: String(candidate.event_title),
    eventStartAt: String(candidate.event_start_at),
    createdAt: String(candidate.created_at),
    quantity: Number(candidate.quantity),
    status: String(candidate.status),
  }));
  const passwordChangeCandidate = matched.find(
    (candidate) => candidate.lookup_password_must_change,
  );
  if (passwordChangeCandidate)
    return {
      passwordChange: {
        reservationId: String(passwordChangeCandidate.id),
        eventTitle: String(passwordChangeCandidate.event_title),
      },
    };
  if (candidates.length > 1 && !reservationId) return { candidates };
  if (
    !candidates.length ||
    (reservationId && !candidates.some((item) => item.id === reservationId))
  )
    return {
      error:
        "일치하는 예매를 찾지 못했습니다. 예매 당시 이름과 연락처 숫자, 조회 패스워드 숫자 4~6자리를 확인해주세요. 연락처 하이픈 유무는 조회에 영향을 주지 않습니다.",
    };

  if (!reservationId) formData.set("reservationId", candidates[0].id);
  const row = await findReservation(formData, false);
  if (row === "RATE_LIMITED")
    return { error: "조회 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };
  if (!row)
    return {
      error:
        "일치하는 예매를 찾지 못했습니다. 예매 당시 이름과 연락처 숫자, 조회 패스워드 숫자 4~6자리를 확인해주세요. 연락처 하이픈 유무는 조회에 영향을 주지 않습니다.",
    };
  const ticketRows = await getSql()`
    SELECT rt.ticket_number,rt.qr_image_data,rt.qr_generation_status,rt.checked_in_at,s.label seat_label
    FROM reservation_tickets rt
    LEFT JOIN seats s ON s.id=rt.seat_id
    WHERE rt.reservation_id=${row.id}
    ORDER BY rt.ticket_number
  `;
  return {
    candidates: candidates.length > 1 ? candidates : undefined,
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
      tickets:
        row.status === "CONFIRMED" || row.status === "CHECKED_IN"
          ? ticketRows.map((ticket) => ({
              number: Number(ticket.ticket_number),
              seat: ticket.seat_label ? String(ticket.seat_label) : null,
              qrImageData: ticket.qr_image_data
                ? String(ticket.qr_image_data)
                : null,
              qrStatus: String(ticket.qr_generation_status),
              checkedInAt: ticket.checked_in_at
                ? String(ticket.checked_in_at)
                : null,
            }))
          : [],
      seats: (row.seats as string[]) ?? [],
      cancelDeadline: String(row.cancel_deadline_at),
      checkedInAt: row.checked_in_at ? String(row.checked_in_at) : null,
      inquiryContact: String(row.inquiry_contact ?? ""),
    },
  };
}

export async function changeTemporaryLookupPassword(
  _: LookupActionState,
  formData: FormData,
): Promise<LookupActionState> {
  const newPassword = text(formData, "newLookupPassword");
  const confirmation = text(formData, "newLookupPasswordConfirmation");
  if (!/^\d{4,6}$/.test(newPassword))
    return { error: "새 조회 패스워드는 숫자 4~6자리로 입력해주세요." };
  if (newPassword !== confirmation)
    return { error: "새 조회 패스워드가 서로 일치하지 않습니다." };
  const row = await findReservation(formData);
  if (row === "RATE_LIMITED")
    return { error: "변경 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };
  if (!row || !row.lookup_password_must_change)
    return { error: "임시 조회 패스워드 변경 정보를 다시 확인해주세요." };

  const passwordHash = await hashPassword(newPassword);
  const updated = await getSql()`
    UPDATE reservations
    SET lookup_password_hash=${passwordHash},lookup_password_must_change=FALSE
    WHERE id=${row.id} AND lookup_password_must_change
    RETURNING id
  `;
  if (!updated[0]) return { error: "조회 패스워드를 변경하지 못했습니다." };
  formData.set("lookupPassword", newPassword);
  return lookupReservation({}, formData);
}

export async function resetReservationLookupPassword(
  _: ResetLookupPasswordState,
  formData: FormData,
): Promise<ResetLookupPasswordState> {
  const session = await requireOrganizer();
  const eventId = text(formData, "eventId");
  const reservationId = text(formData, "reservationId");
  if (
    !z.string().uuid().safeParse(eventId).success ||
    !z.string().uuid().safeParse(reservationId).success
  )
    return { error: "예매 정보가 올바르지 않습니다." };
  if (text(formData, "callbackConfirmed") !== "on")
    return { error: "저장된 연락처로 역전화 확인을 완료해주세요." };
  if (!(await consumeRateLimit("lookup-password-reset", reservationId, 3)))
    return { error: "초기화 횟수가 너무 많습니다. 15분 후 다시 시도해주세요." };

  const temporaryPassword = String(randomInt(100000, 1000000));
  const passwordHash = await hashPassword(temporaryPassword);
  const rows = await getSql()`
    UPDATE reservations r
    SET lookup_password_hash=${passwordHash},
        lookup_password_must_change=TRUE,
        lookup_password_reset_at=NOW(),
        lookup_password_reset_by=${session.organizerId}
    FROM events e
    WHERE r.id=${reservationId} AND r.event_id=${eventId}
      AND e.id=r.event_id AND e.organizer_id=${session.organizerId}
      AND r.status IN ('PENDING_PAYMENT','CONFIRMED','WAITLISTED')
    RETURNING r.id
  `;
  if (!rows[0]) return { error: "초기화할 수 없는 예매입니다." };
  revalidatePath(`/dashboard/events/${eventId}/reservations`);
  return { temporaryPassword };
}

export async function cancelReservation(
  _: LookupActionState,
  formData: FormData,
): Promise<LookupActionState> {
  const row = await findReservation(formData);
  if (row === "RATE_LIMITED")
    return { error: "조회 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };
  if (!row) return { error: "예매 조회 정보를 다시 확인해주세요." };
  if (row.lookup_password_must_change)
    return { error: "임시 조회 패스워드를 새 패스워드로 먼저 변경해주세요." };
  if (row.status === "CHECKED_IN")
    return { error: "입장 완료된 예매는 취소할 수 없습니다." };
  const entered =
    await getSql()`SELECT 1 FROM reservation_tickets WHERE reservation_id=${row.id} AND checked_in_at IS NOT NULL LIMIT 1`;
  if (entered[0])
    return { error: "일부 인원이 입장한 예매는 취소할 수 없습니다." };
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
      tickets: [],
      seats: [],
      cancelDeadline: String(row.cancel_deadline_at),
      checkedInAt: null,
      inquiryContact: String(row.inquiry_contact ?? ""),
    },
  };
}
