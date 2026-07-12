ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS qr_image_data TEXT,
    ADD COLUMN IF NOT EXISTS qr_generation_status TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    ADD COLUMN IF NOT EXISTS qr_generation_error TEXT;

ALTER TABLE reservations
    DROP CONSTRAINT IF EXISTS reservations_qr_generation_status_check,
    ADD CONSTRAINT reservations_qr_generation_status_check
        CHECK (qr_generation_status IN ('NOT_REQUESTED', 'PENDING', 'READY', 'FAILED'));
