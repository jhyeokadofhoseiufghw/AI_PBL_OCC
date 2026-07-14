import "server-only";

import { notFound } from "next/navigation";

import { getSql } from "@/lib/db/client";

export async function getPublicEvent(slug: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT e.*,
      o.organization_name,
      CASE WHEN e.reservation_type = 'FIRST_COME' THEN
        GREATEST(e.total_capacity - COALESCE((
          SELECT SUM(r.quantity)::int FROM reservations r
          WHERE r.event_id = e.id AND r.status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN')
        ), 0), 0)
      ELSE (
        SELECT COUNT(*)::int FROM seats s
        WHERE s.event_id = e.id AND s.is_active
          AND NOT EXISTS (
            SELECT 1 FROM reservation_seats rs WHERE rs.seat_id = s.id AND rs.released_at IS NULL
          )
      ) END AS remaining_count
    FROM events e
    JOIN organizers o ON o.id = e.organizer_id
    WHERE e.slug = ${slug} AND e.status IN ('SCHEDULED', 'IN_PROGRESS')
    LIMIT 1
  `;
  if (!rows[0]) notFound();
  return rows[0];
}

export async function getEventReservationOptions(eventId: string) {
  const sql = getSql();
  const [ticketTypes, seats] = await Promise.all([
    sql`SELECT id, name, price FROM ticket_types WHERE event_id = ${eventId} ORDER BY created_at`,
    sql`
      SELECT s.id, s.label, s.layout_row, s.layout_column,
        EXISTS (SELECT 1 FROM reservation_seats rs WHERE rs.seat_id = s.id AND rs.released_at IS NULL) AS occupied
      FROM seats s WHERE s.event_id = ${eventId} AND s.is_active ORDER BY s.layout_row NULLS LAST, s.layout_column NULLS LAST, s.label
    `,
  ]);
  return { ticketTypes, seats };
}
