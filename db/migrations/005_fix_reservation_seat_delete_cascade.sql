ALTER TABLE reservation_seats
    DROP CONSTRAINT IF EXISTS reservation_seats_seat_id_fkey,
    ADD CONSTRAINT reservation_seats_seat_id_fkey
        FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE;
