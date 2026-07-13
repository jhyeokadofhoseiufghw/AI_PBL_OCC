"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export type CheckInResult = {
  status: "success" | "duplicate" | "error";
  message: string;
  checkedInAt?: string;
};

const inputSchema = z.object({
  eventId: z.string().uuid(),
  qrToken: z.string().min(20).max(200),
});

export async function checkInByQr(
  eventId: string,
  qrToken: string,
): Promise<CheckInResult> {
  const parsed = inputSchema.safeParse({ eventId, qrToken });
  if (!parsed.success)
    return { status: "error", message: "올바른 OCC QR 코드가 아닙니다." };

  const session = await requireOrganizer();
  const sql = getSql();
  const owned =
    await sql`SELECT id FROM events WHERE id=${eventId} AND organizer_id=${session.organizerId} LIMIT 1`;
  if (!owned[0])
    return { status: "error", message: "이 공연의 체크인 권한이 없습니다." };

  const checkedIn = await sql`
    UPDATE reservation_tickets rt
    SET checked_in_at=NOW()
    FROM reservations r
    WHERE rt.reservation_id=r.id AND r.event_id=${eventId} AND rt.qr_token=${qrToken}
      AND r.status IN('CONFIRMED','CHECKED_IN') AND rt.checked_in_at IS NULL
    RETURNING rt.reservation_id,rt.ticket_number,rt.seat_id,rt.checked_in_at
  `;
  if (checkedIn[0]) {
    const at = String(checkedIn[0].checked_in_at);
    const reservationRows = await sql`
      SELECT r.reserver_name,s.label seat_label
      FROM reservations r
      LEFT JOIN seats s ON s.id=${checkedIn[0].seat_id}::uuid
      WHERE r.id=${checkedIn[0].reservation_id}
    `;
    await sql`
      UPDATE reservations r SET status='CHECKED_IN',checked_in_at=${at}
      WHERE r.id=${checkedIn[0].reservation_id} AND NOT EXISTS(
        SELECT 1 FROM reservation_tickets rt
        WHERE rt.reservation_id=r.id AND rt.checked_in_at IS NULL
      )
    `;
    revalidatePath(`/dashboard/events/${eventId}/check-in`);
    revalidatePath(`/dashboard/events/${eventId}/reservations`);
    revalidatePath("/dashboard");
    return {
      status: "success",
      message: `${String(reservationRows[0].reserver_name)} · 티켓 ${Number(checkedIn[0].ticket_number)}${reservationRows[0].seat_label ? ` (${String(reservationRows[0].seat_label)})` : ""} 입장 완료`,
      checkedInAt: at,
    };
  }

  const rows = await sql`
    SELECT r.status,rt.checked_in_at
    FROM reservation_tickets rt JOIN reservations r ON r.id=rt.reservation_id
    WHERE r.event_id=${eventId} AND rt.qr_token=${qrToken} LIMIT 1
  `;
  const ticket = rows[0];
  if (!ticket) {
    const otherEvent =
      await sql`SELECT 1 FROM reservation_tickets WHERE qr_token=${qrToken} LIMIT 1`;
    return otherEvent[0]
      ? { status: "error", message: "다른 공연에서 발급된 QR입니다." }
      : { status: "error", message: "등록되지 않았거나 무효화된 QR입니다." };
  }
  if (ticket.checked_in_at)
    return {
      status: "duplicate",
      message: "이미 입장 처리된 QR입니다.",
      checkedInAt: String(ticket.checked_in_at),
    };
  if (ticket.status === "CANCELLED")
    return { status: "error", message: "취소된 예매의 QR입니다." };
  if (!["CONFIRMED", "CHECKED_IN"].includes(String(ticket.status)))
    return { status: "error", message: "입장 가능한 예매 상태가 아닙니다." };
  return { status: "error", message: "체크인할 수 없는 QR입니다." };
}
