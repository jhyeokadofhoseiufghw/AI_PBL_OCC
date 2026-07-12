ALTER TABLE seats
    ADD COLUMN IF NOT EXISTS layout_row INTEGER,
    ADD COLUMN IF NOT EXISTS layout_column INTEGER;

ALTER TABLE seats
    DROP CONSTRAINT IF EXISTS seats_layout_row_check,
    ADD CONSTRAINT seats_layout_row_check CHECK (layout_row IS NULL OR layout_row > 0),
    DROP CONSTRAINT IF EXISTS seats_layout_column_check,
    ADD CONSTRAINT seats_layout_column_check CHECK (layout_column IS NULL OR layout_column > 0);
