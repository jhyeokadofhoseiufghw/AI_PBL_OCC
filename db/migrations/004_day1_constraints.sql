ALTER TABLE events
    DROP CONSTRAINT IF EXISTS events_max_tickets_per_person_check,
    ADD CONSTRAINT events_max_tickets_per_person_check CHECK (max_tickets_per_person > 0),
    DROP CONSTRAINT IF EXISTS events_time_order_check,
    ADD CONSTRAINT events_time_order_check CHECK (event_end_at IS NULL OR event_end_at > event_start_at);

ALTER TABLE reservations
    DROP CONSTRAINT IF EXISTS reservations_quantity_check,
    ADD CONSTRAINT reservations_quantity_check CHECK (quantity > 0);
