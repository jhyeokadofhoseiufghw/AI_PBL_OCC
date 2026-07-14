import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const scrypt = promisify(scryptCallback);
const sql = neon(process.env.DATABASE_URL);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

const organizer = {
  id: randomUUID(),
  email: "stage.manager@example.com",
  password: "CampusStage!2026",
  name: "김서윤",
  phone: "010-4827-1936",
  organizationName: "모퉁이 스테이지",
};
const event = {
  id: randomUUID(),
  title: "여름 끝의 플레이리스트",
  slug: "summer-end-playlist-2026",
  venue: "신촌 몽향 소극장",
  description:
    "방학의 끝자락, 각자의 방에서 곡을 쓰던 네 팀이 작은 무대에 모입니다. 인디 팝부터 어쿠스틱 포크까지, 늦여름 저녁을 닮은 대학생 뮤지션들의 라이브 공연입니다. 공연 시작 30분 전부터 입장할 수 있으며 전석 자유석으로 운영됩니다.",
  poster:
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85",
  detailImage:
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=85",
};
const reservation = {
  id: randomUUID(),
  name: "박지우",
  phone: "010-7352-6841",
  depositorName: "박지우",
  lookupPassword: "2608",
};

const [organizerPasswordHash, lookupPasswordHash] = await Promise.all([
  hashPassword(organizer.password),
  hashPassword(reservation.lookupPassword),
]);

await sql.transaction([
  sql`TRUNCATE TABLE organizers CASCADE`,
  sql`TRUNCATE TABLE request_rate_limits`,
  sql`
    INSERT INTO organizers (id,email,password_hash,name,phone,organization_name)
    VALUES (${organizer.id},${organizer.email},${organizerPasswordHash},${organizer.name},${organizer.phone},${organizer.organizationName})
  `,
  sql`
    INSERT INTO events (
      id,organizer_id,title,slug,venue,description,poster_image_url,detail_image_url,
      runtime_minutes,genre,ticket_price,bank_name,account_number,account_holder,
      inquiry_contact,reservation_type,total_capacity,max_tickets_per_person,
      cancel_deadline_at,event_start_at,event_end_at,status,published_at
    ) VALUES (
      ${event.id},${organizer.id},${event.title},${event.slug},${event.venue},${event.description},
      ${event.poster},${event.detailImage},100,'밴드/라이브',18000,'카카오뱅크','3333-28-7410926','김서윤',
      ${"예매 취소 후 환불은 영업일 기준 2~3일이 소요됩니다. 공연 및 환불 문의: 010-4827-1936 / 카카오톡 오픈채팅 https://open.kakao.com/o/sample-stage"},
      'FIRST_COME',60,4,NOW()+INTERVAL '19 days',NOW()+INTERVAL '21 days',NOW()+INTERVAL '21 days 1 hour 40 minutes','SCHEDULED',NOW()
    )
  `,
  sql`
    INSERT INTO ticket_types (event_id,name,price)
    VALUES (${event.id},'일반',18000),(${event.id},'대학생',15000)
  `,
  sql`
    INSERT INTO feed_posts (event_id,image_url,content,created_at)
    VALUES
      (${event.id},${event.poster},${"첫 합주를 마쳤습니다. 서로 다른 학교에서 모인 네 팀이 늦여름의 공기를 닮은 셋리스트를 준비하고 있어요. 작은 무대에서 가까이 만나요."},NOW()-INTERVAL '2 days'),
      (${event.id},${event.detailImage},${"공연 당일 오후 5시 30분부터 티켓 확인과 입장이 시작됩니다. 전석 자유석이며 텀블러를 가져오시면 로비 음료를 1,000원 할인해 드려요."},NOW()-INTERVAL '1 day')
  `,
  sql`
    INSERT INTO reservations (
      id,event_id,ticket_type_id,reserver_name,reserver_phone,depositor_name,
      lookup_password_hash,quantity,unit_price,total_price,request_note,status
    ) SELECT
      ${reservation.id},${event.id},tt.id,${reservation.name},${reservation.phone},${reservation.depositorName},
      ${lookupPasswordHash},2,tt.price,tt.price*2,${"일행과 함께 방문합니다. 가능하면 통로 쪽 좌석으로 안내 부탁드려요."},'PENDING_PAYMENT'
    FROM ticket_types tt WHERE tt.event_id=${event.id} AND tt.name='대학생'
  `,
]);

const counts = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM organizers) organizers,
    (SELECT COUNT(*)::int FROM events) events,
    (SELECT COUNT(*)::int FROM reservations) reservations,
    (SELECT COUNT(*)::int FROM feed_posts) feed_posts,
    (SELECT COUNT(*)::int FROM ticket_types) ticket_types
`;

console.log(
  JSON.stringify(
    {
      counts: counts[0],
      organizer: {
        email: organizer.email,
        password: organizer.password,
      },
      reservation: {
        name: reservation.name,
        phone: reservation.phone,
        lookupPassword: reservation.lookupPassword,
      },
      event: { title: event.title, slug: event.slug },
    },
    null,
    2,
  ),
);
