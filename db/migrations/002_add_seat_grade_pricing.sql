CREATE TABLE IF NOT EXISTS seat_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, name)
);

INSERT INTO seat_grades (event_id, name, price, sort_order)
SELECT DISTINCT s.event_id, '일반', 0, 0
FROM seats s
WHERE NOT EXISTS (
    SELECT 1
    FROM seat_grades sg
    WHERE sg.event_id = s.event_id
      AND sg.name = '일반'
);

ALTER TABLE seats
    ADD COLUMN IF NOT EXISTS seat_grade_id UUID REFERENCES seat_grades(id) ON DELETE RESTRICT;

UPDATE seats s
SET seat_grade_id = sg.id
FROM seat_grades sg
WHERE sg.event_id = s.event_id
  AND sg.name = '일반'
  AND s.seat_grade_id IS NULL;

ALTER TABLE seats
    ALTER COLUMN seat_grade_id SET NOT NULL;

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS unit_price INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_price INTEGER NOT NULL DEFAULT 0;

ALTER TABLE reservations
    DROP CONSTRAINT IF EXISTS reservations_unit_price_check,
    DROP CONSTRAINT IF EXISTS reservations_total_price_check,
    DROP CONSTRAINT IF EXISTS reservations_total_price_matches_quantity_check;

ALTER TABLE reservations
    ADD CONSTRAINT reservations_unit_price_check CHECK (unit_price >= 0),
    ADD CONSTRAINT reservations_total_price_check CHECK (total_price >= 0),
    ADD CONSTRAINT reservations_total_price_matches_quantity_check
        CHECK (total_price = unit_price * quantity);

CREATE INDEX IF NOT EXISTS idx_seat_grades_event
    ON seat_grades(event_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seat_grades_event_name
    ON seat_grades(event_id, name);

CREATE INDEX IF NOT EXISTS idx_seats_grade
    ON seats(seat_grade_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_types_event_name
    ON ticket_types(event_id, name);

DROP TRIGGER IF EXISTS update_seat_grades_modtime ON seat_grades;
CREATE TRIGGER update_seat_grades_modtime
    BEFORE UPDATE ON seat_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
