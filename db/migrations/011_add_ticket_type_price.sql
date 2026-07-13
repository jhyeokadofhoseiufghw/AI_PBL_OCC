ALTER TABLE ticket_types
ADD COLUMN IF NOT EXISTS price INTEGER;

UPDATE ticket_types tt
SET price = e.ticket_price
FROM events e
WHERE tt.event_id = e.id AND tt.price IS NULL;

ALTER TABLE ticket_types
ALTER COLUMN price SET NOT NULL;

ALTER TABLE ticket_types
ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE ticket_types
DROP CONSTRAINT IF EXISTS ticket_types_price_check;

ALTER TABLE ticket_types
ADD CONSTRAINT ticket_types_price_check CHECK (price >= 0);
