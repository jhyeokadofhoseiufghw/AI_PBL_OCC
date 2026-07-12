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
    UPDATE reservations
    SET status='CHECKED_IN', checked_in_at=NOW()
    WHERE event_id=${eventId} AND qr_token=${qrToken} AND status='CONFIRMED'
    RETURNING reserver_name, quantity, checked_in_at
  `;
  if (checkedIn[0]) {
    const at = String(checkedIn[0].checked_in_at);
    revalidatePath(`/dashboard/events/${eventId}/check-in`);
    revalidatePath(`/dashboard/events/${eventId}/reservations`);
    revalidatePath("/dashboard");
    return {
      status: "success",
      message: `${String(checkedIn[0].reserver_name)} · ${Number(checkedIn[0].quantity)}명 입장 완료`,
      checkedInAt: at,
    };
  }

  const rows =
    await sql`SELECT status, checked_in_at FROM reservations WHERE event_id=${eventId} AND qr_token=${qrToken} LIMIT 1`;
  const reservation = rows[0];
  if (!reservation) {
    const otherEvent =
      await sql`SELECT 1 FROM reservations WHERE qr_token=${qrToken} LIMIT 1`;
    return otherEvent[0]
      ? { status: "error", message: "다른 공연에서 발급된 QR입니다." }
      : { status: "error", message: "등록되지 않았거나 무효화된 QR입니다." };
  }
  if (reservation.status === "CHECKED_IN")
    return {
      status: "duplicate",
      message: "이미 입장 처리된 QR입니다.",
      checkedInAt: String(reservation.checked_in_at),
    };
  if (reservation.status === "CANCELLED")
    return { status: "error", message: "취소된 예매의 QR입니다." };
  if (reservation.status !== "CONFIRMED")
    return { status: "error", message: "입장 가능한 예매 상태가 아닙니다." };
  return { status: "error", message: "체크인할 수 없는 QR입니다." };
}
