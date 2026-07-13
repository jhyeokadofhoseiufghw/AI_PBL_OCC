-- Enable UUID generation for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. organizers Table
CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    venue TEXT NOT NULL,
    description TEXT,
    poster_image_url TEXT,
    detail_image_url TEXT,
    runtime_minutes INTEGER CHECK (runtime_minutes IS NULL OR runtime_minutes > 0),
    genre TEXT,
    ticket_price INTEGER NOT NULL DEFAULT 0 CHECK (ticket_price >= 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    reservation_type TEXT NOT NULL CHECK (reservation_type IN ('FIRST_COME', 'SEAT_SELECTION')),
    total_capacity INTEGER,
    max_tickets_per_person INTEGER NOT NULL DEFAULT 4 CHECK (max_tickets_per_person > 0),
    cancel_deadline_at TIMESTAMPTZ NOT NULL,
    event_start_at TIMESTAMPTZ NOT NULL,
    event_end_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'HIDDEN', 'CANCELLED')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT events_capacity_matches_reservation_type_check
        CHECK (
            (reservation_type = 'FIRST_COME' AND total_capacity IS NOT NULL AND total_capacity > 0)
            OR (reservation_type = 'SEAT_SELECTION' AND total_capacity IS NULL)
        ),
    CONSTRAINT events_time_order_check
        CHECK (event_end_at IS NULL OR event_end_at > event_start_at)
);

-- 3. ticket_types Table
CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 일반, 학생 등
    price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, name)
);

-- 4. seats Table
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- A1, B1 등
    layout_row INTEGER CHECK (layout_row IS NULL OR layout_row > 0),
    layout_column INTEGER CHECK (layout_column IS NULL OR layout_column > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, label)
);

-- 5. reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    reserver_name TEXT NOT NULL,
    reserver_phone TEXT NOT NULL,
    depositor_name TEXT NOT NULL,
    lookup_password_hash TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    total_price INTEGER NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    request_note TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'WAITLISTED')),
    reservation_code TEXT UNIQUE, -- 입금 승인 시 생성
    qr_token TEXT UNIQUE,        -- 입금 승인 시 생성
    qr_image_data TEXT,          -- python-qrcode가 생성한 data URL
    qr_generation_status TEXT NOT NULL DEFAULT 'NOT_REQUESTED'
        CHECK (qr_generation_status IN ('NOT_REQUESTED', 'PENDING', 'READY', 'FAILED')),
    qr_generation_error TEXT,
    checked_in_at TIMESTAMPTZ,   -- QR 체크인 완료 시각
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reservations_total_price_matches_quantity_check
        CHECK (total_price = unit_price * quantity),
    CONSTRAINT reservations_checked_in_at_status_check
        CHECK (
            (status = 'CHECKED_IN' AND checked_in_at IS NOT NULL)
            OR (status <> 'CHECKED_IN' AND checked_in_at IS NULL)
        )
);

-- 6. reservation_seats Table
CREATE TABLE IF NOT EXISTS reservation_seats (
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    PRIMARY KEY (reservation_id, seat_id)
);

-- 6-1. reservation_tickets Table (one admission QR per reserved seat/ticket)
CREATE TABLE IF NOT EXISTS reservation_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE SET NULL,
    ticket_number INTEGER NOT NULL CHECK (ticket_number > 0),
    qr_token TEXT NOT NULL UNIQUE,
    qr_image_data TEXT,
    qr_generation_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (qr_generation_status IN ('PENDING', 'READY', 'FAILED')),
    qr_generation_error TEXT,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reservation_id, ticket_number),
    UNIQUE (reservation_id, seat_id)
);

-- 7. feed_posts Table
CREATE TABLE IF NOT EXISTS feed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    image_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_rate_limits (
    key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 1,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_genre_start ON events(genre, event_start_at);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_types_event_name ON ticket_types(event_id, name);
CREATE INDEX IF NOT EXISTS idx_seats_event ON seats(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event_status ON reservations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_lookup ON reservations(event_id, reserver_phone);
CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations(reservation_code);
CREATE INDEX IF NOT EXISTS idx_reservations_qr_token ON reservations(qr_token);
CREATE INDEX IF NOT EXISTS idx_reservations_checked_in_at ON reservations(event_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservation_seats_reservation ON reservation_seats(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_tickets_reservation ON reservation_tickets(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_tickets_checked_in ON reservation_tickets(checked_in_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_seats_active_seat
    ON reservation_seats(seat_id)
    WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feed_posts_event ON feed_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_recent ON feed_posts(event_id, created_at DESC);

-- Automatic updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_modtime ON events;
CREATE TRIGGER update_events_modtime
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_modtime ON reservations;
CREATE TRIGGER update_reservations_modtime
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feed_posts_modtime ON feed_posts;
CREATE TRIGGER update_feed_posts_modtime
    BEFORE UPDATE ON feed_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
