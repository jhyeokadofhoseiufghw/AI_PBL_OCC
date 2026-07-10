-- Collapse ticket-type and seat-grade pricing into one event-level ticket price.
-- Existing reservation unit_price/total_price snapshots are intentionally preserved.

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS ticket_price INTEGER,
    ADD COLUMN IF NOT EXISTS total_capacity INTEGER,
    ADD COLUMN IF NOT EXISTS detail_image_url TEXT,
    ADD COLUMN IF NOT EXISTS runtime_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS genre TEXT,
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS account_number TEXT,
    ADD COLUMN IF NOT EXISTS account_holder TEXT;

UPDATE events
SET bank_name = COALESCE(bank_name, '미설정'),
    account_number = COALESCE(account_number, bank_account_info),
    account_holder = COALESCE(account_holder, '미설정')
WHERE bank_name IS NULL
   OR account_number IS NULL
   OR account_holder IS NULL;

ALTER TABLE events
    ALTER COLUMN bank_name SET NOT NULL,
    ALTER COLUMN account_number SET NOT NULL,
    ALTER COLUMN account_holder SET NOT NULL,
    DROP CONSTRAINT IF EXISTS events_runtime_minutes_check;

ALTER TABLE events
    ADD CONSTRAINT events_runtime_minutes_check
        CHECK (runtime_minutes IS NULL OR runtime_minutes > 0),
    DROP COLUMN IF EXISTS bank_account_info;

WITH configured_prices AS (
    SELECT event_id, MAX(price) AS price
    FROM (
        SELECT event_id, price FROM ticket_types
        UNION ALL
        SELECT event_id, price FROM seat_grades
    ) prices
    GROUP BY event_id
)
UPDATE events e
SET ticket_price = COALESCE(configured_prices.price, 0)
FROM configured_prices
WHERE configured_prices.event_id = e.id
  AND e.ticket_price IS NULL;

UPDATE events
SET ticket_price = 0
WHERE ticket_price IS NULL;

ALTER TABLE events
    ALTER COLUMN ticket_price SET DEFAULT 0,
    ALTER COLUMN ticket_price SET NOT NULL,
    DROP CONSTRAINT IF EXISTS events_ticket_price_check;

ALTER TABLE events
    ADD CONSTRAINT events_ticket_price_check CHECK (ticket_price >= 0);

WITH active_quantities AS (
    SELECT event_id, GREATEST(COALESCE(SUM(quantity), 0), 1)::INTEGER AS capacity
    FROM reservations
    WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN')
    GROUP BY event_id
)
UPDATE events e
SET total_capacity = COALESCE(active_quantities.capacity, 1)
FROM active_quantities
WHERE e.id = active_quantities.event_id
  AND e.reservation_type = 'FIRST_COME'
  AND e.total_capacity IS NULL;

UPDATE events
SET total_capacity = 1
WHERE reservation_type = 'FIRST_COME'
  AND total_capacity IS NULL;

UPDATE events
SET total_capacity = NULL
WHERE reservation_type = 'SEAT_SELECTION';

ALTER TABLE events
    DROP CONSTRAINT IF EXISTS events_capacity_matches_reservation_type_check;

ALTER TABLE events
    ADD CONSTRAINT events_capacity_matches_reservation_type_check
        CHECK (
            (reservation_type = 'FIRST_COME' AND total_capacity IS NOT NULL AND total_capacity > 0)
            OR (reservation_type = 'SEAT_SELECTION' AND total_capacity IS NULL)
        );

CREATE TABLE IF NOT EXISTS reservation_seats (
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    PRIMARY KEY (reservation_id, seat_id)
);

ALTER TABLE reservation_seats
    ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
    DROP CONSTRAINT IF EXISTS reservation_seats_seat_id_key;

INSERT INTO reservation_seats (reservation_id, seat_id)
SELECT id, seat_id
FROM reservations
WHERE seat_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE reservations
    DROP COLUMN IF EXISTS seat_id;

CREATE INDEX IF NOT EXISTS idx_reservation_seats_reservation
    ON reservation_seats(reservation_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_seats_active_seat
    ON reservation_seats(seat_id)
    WHERE released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_genre_start
    ON events(genre, event_start_at);

DROP INDEX IF EXISTS idx_seats_grade;

ALTER TABLE seats
    DROP CONSTRAINT IF EXISTS seats_seat_grade_id_fkey,
    DROP COLUMN IF EXISTS seat_grade_id;

DROP TRIGGER IF EXISTS update_seat_grades_modtime ON seat_grades;
DROP INDEX IF EXISTS idx_seat_grades_event_name;
DROP INDEX IF EXISTS idx_seat_grades_event;
DROP TABLE IF EXISTS seat_grades;

ALTER TABLE ticket_types
    DROP COLUMN IF EXISTS price;
