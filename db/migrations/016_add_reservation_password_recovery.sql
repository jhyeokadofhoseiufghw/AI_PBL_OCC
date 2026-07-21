ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS lookup_password_must_change BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lookup_password_reset_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lookup_password_reset_by UUID REFERENCES organizers(id) ON DELETE SET NULL;
