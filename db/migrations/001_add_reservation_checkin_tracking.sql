ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

UPDATE reservations
SET checked_in_at = updated_at
WHERE status = 'CHECKED_IN'
  AND checked_in_at IS NULL;

ALTER TABLE reservations
    DROP CONSTRAINT IF EXISTS reservations_checked_in_at_status_check;

ALTER TABLE reservations
    ADD CONSTRAINT reservations_checked_in_at_status_check
        CHECK (
            (status = 'CHECKED_IN' AND checked_in_at IS NOT NULL)
            OR (status <> 'CHECKED_IN' AND checked_in_at IS NULL)
        );

CREATE INDEX IF NOT EXISTS idx_reservations_event_status
    ON reservations(event_id, status);

CREATE INDEX IF NOT EXISTS idx_reservations_checked_in_at
    ON reservations(event_id, checked_in_at DESC);
