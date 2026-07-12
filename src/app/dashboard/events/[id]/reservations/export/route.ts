import { NextResponse } from "next/server";
import { getOrganizerSession } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";
const csv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOrganizerSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params,
    { searchParams } = new URL(request.url),
    q = searchParams.get("q") ?? "",
    status = searchParams.get("status") ?? "";
  const rows =
    await getSql()`SELECT r.reserver_name,r.reserver_phone,r.depositor_name,r.quantity,r.total_price,r.status,r.reservation_code,r.checked_in_at,r.created_at,tt.name ticket_type,COALESCE(string_agg(s.label,', '),'') seats FROM reservations r JOIN events e ON e.id=r.event_id LEFT JOIN ticket_types tt ON tt.id=r.ticket_type_id LEFT JOIN reservation_seats rs ON rs.reservation_id=r.id AND rs.released_at IS NULL LEFT JOIN seats s ON s.id=rs.seat_id WHERE r.event_id=${id} AND e.organizer_id=${session.organizerId} AND (${q}='' OR r.depositor_name ILIKE ${`%${q}%`} OR r.reserver_phone ILIKE ${`%${q}%`} OR r.reserver_name ILIKE ${`%${q}%`}) AND (${status}='' OR r.status=${status}) GROUP BY r.id,tt.name ORDER BY r.created_at DESC`;
  const header = [
    "예매자",
    "연락처",
    "입금자",
    "매수",
    "좌석",
    "티켓 타입",
    "금액",
    "상태",
    "예매번호",
    "체크인 시각",
    "신청 시각",
  ];
  const body = rows.map((r) =>
    [
      r.reserver_name,
      r.reserver_phone,
      r.depositor_name,
      r.quantity,
      r.seats,
      r.ticket_type,
      r.total_price,
      r.status,
      r.reservation_code,
      r.checked_in_at,
      r.created_at,
    ]
      .map(csv)
      .join(","),
  );
  return new NextResponse(
    "\uFEFF" + [header.map(csv).join(","), ...body].join("\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservations-${id}.csv"`,
      },
    },
  );
}
