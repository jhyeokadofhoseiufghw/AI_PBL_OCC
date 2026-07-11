"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { getSql } from "@/lib/db/client";

export type ReservationActionState = { error?: string };

const schema = z.object({
  eventId: z.string().uuid(),
  eventSlug: z.string().min(1),
  ticketTypeId: z.union([z.literal(""), z.string().uuid()]),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(8).max(30),
  depositorName: z.string().trim().min(1).max(80),
  lookupPassword: z.string().regex(/^\d{4,6}$/, "조회 패스워드는 숫자 4~6자리여야 합니다."),
  quantity: z.coerce.number().int().positive(),
  requestNote: z.string().trim().max(500),
});

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createReservation(_: ReservationActionState, formData: FormData): Promise<ReservationActionState> {
  const parsed = schema.safeParse({
    eventId: text(formData, "eventId"), eventSlug: text(formData, "eventSlug"), ticketTypeId: text(formData, "ticketTypeId"),
    name: text(formData, "name"), phone: text(formData, "phone"), depositorName: text(formData, "depositorName"),
    lookupPassword: text(formData, "lookupPassword"), quantity: text(formData, "quantity"), requestNote: text(formData, "requestNote"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };

  const data = parsed.data;
  const seatIds = [...new Set(formData.getAll("seatIds").map(String))];
  const sql = getSql();
  const eventRows = await sql`
    SELECT id, slug, reservation_type, max_tickets_per_person
    FROM events WHERE id = ${data.eventId} AND slug = ${data.eventSlug} AND status IN ('SCHEDULED', 'IN_PROGRESS') LIMIT 1
  `;
  const event = eventRows[0];
  if (!event) return { error: "예매할 수 없는 공연입니다." };
  if (data.quantity > Number(event.max_tickets_per_person)) return { error: "공연의 1인 최대 예매 매수를 초과했습니다." };
  if (event.reservation_type === "SEAT_SELECTION" && seatIds.length !== data.quantity) return { error: "선택 좌석 수와 예매 매수가 일치하지 않습니다." };
  if (event.reservation_type === "FIRST_COME" && seatIds.length > 0) return { error: "선착순 공연에는 좌석을 선택할 수 없습니다." };

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
      if (rows.length === 0) return { error: "잔여 수량이 부족하거나 티켓 타입이 올바르지 않습니다." };
    } else {
      const [reservationRows] = await sql.transaction((tx) => [
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
      ], { isolationLevel: "Serializable" });
      if (reservationRows.length === 0) return { error: "선택한 좌석을 사용할 수 없거나 티켓 타입이 올바르지 않습니다." };
    }
  } catch {
    return { error: "다른 관객이 먼저 좌석을 선택했습니다. 좌석을 다시 선택해주세요." };
  }

  redirect(`/reservation/status?event=${encodeURIComponent(data.eventSlug)}&created=1`);
}
