ALTER TABLE events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE events e SET published_at=COALESCE(e.published_at,e.updated_at)
WHERE e.published_at IS NULL AND (
    e.status <> 'HIDDEN'
    OR EXISTS (SELECT 1 FROM reservations r WHERE r.event_id=e.id)
);
