CREATE TABLE IF NOT EXISTS reservation_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE SET NULL,
    ticket_number INTEGER NOT NULL CHECK (ticket_number > 0),
    qr_token TEXT NOT NULL UNIQUE,
    qr_image_data TEXT,
    qr_generation_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (qr_generation_status IN ('PENDING', 'READY', 'FAILED')),
    qr_generation_error TEXT,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reservation_id, ticket_number),
    UNIQUE (reservation_id, seat_id)
);

INSERT INTO reservation_tickets (
    reservation_id, seat_id, ticket_number, qr_token, qr_image_data,
    qr_generation_status, checked_in_at
)
SELECT
    r.id,
    ranked_seats.seat_id,
    ticket_number,
    CASE WHEN ticket_number = 1 AND r.qr_token IS NOT NULL
        THEN r.qr_token ELSE encode(gen_random_bytes(32), 'hex') END,
    CASE WHEN ticket_number = 1 THEN r.qr_image_data ELSE NULL END,
    CASE WHEN ticket_number = 1 AND r.qr_image_data IS NOT NULL
        THEN 'READY' ELSE 'PENDING' END,
    CASE WHEN r.status = 'CHECKED_IN' THEN r.checked_in_at ELSE NULL END
FROM reservations r
CROSS JOIN LATERAL generate_series(1, r.quantity) AS ticket_number
LEFT JOIN LATERAL (
    SELECT rs.seat_id
    FROM reservation_seats rs
    WHERE rs.reservation_id = r.id AND rs.released_at IS NULL
    ORDER BY rs.created_at, rs.seat_id
    OFFSET ticket_number - 1 LIMIT 1
) ranked_seats ON TRUE
WHERE r.status IN ('CONFIRMED', 'CHECKED_IN')
ON CONFLICT (reservation_id, ticket_number) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_reservation_tickets_reservation
    ON reservation_tickets(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_tickets_checked_in
    ON reservation_tickets(checked_in_at DESC);
