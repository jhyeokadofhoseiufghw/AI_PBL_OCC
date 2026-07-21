ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS cancellation_actor TEXT
        CHECK (cancellation_actor IN ('AUDIENCE', 'ORGANIZER')),
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_by_organizer UUID
        REFERENCES organizers(id) ON DELETE SET NULL;
