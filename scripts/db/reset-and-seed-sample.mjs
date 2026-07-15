import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { neon } from "@neondatabase/serverless";
import QRCode from "qrcode";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const scrypt = promisify(scryptCallback);
const sql = neon(process.env.DATABASE_URL);
const blobBase = "https://ccvycoic01vkm6jq.public.blob.vercel-storage.com/demo";

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

function future(days, extraMinutes = 0) {
  return new Date(Date.now() + (days * 24 * 60 + extraMinutes) * 60 * 1000);
}

const organizers = [
  [
    "stage.manager@example.com",
    "CampusStage!2026",
    "김서윤",
    "010-4827-1936",
    "모퉁이 스테이지",
  ],
  [
    "theater.archive@example.com",
    "LostStage!2026",
    "이도현",
    "010-6194-2758",
    "극단 사잇문",
  ],
  [
    "rooftop.musical@example.com",
    "Rooftop302!",
    "정하린",
    "010-3582-7164",
    "스물셋 프로젝트",
  ],
  [
    "wave.movement@example.com",
    "MoveWave!2026",
    "최유진",
    "010-7743-5209",
    "움직임 연구소 결",
  ],
  [
    "night.reading@example.com",
    "NightBook!2026",
    "한재민",
    "010-2961-8437",
    "문장과 활",
  ],
  [
    "grass.acoustic@example.com",
    "GrassThree!",
    "오서아",
    "010-8350-4612",
    "캠퍼스 어쿠스틱 클럽 오후",
  ],
].map(([email, password, name, phone, organizationName]) => ({
  id: randomUUID(),
  email,
  password,
  name,
  phone,
  organizationName,
}));

const events = [
  {
    organizer: 0,
    title: "여름 끝의 플레이리스트",
    slug: "summer-end-playlist-2026",
    venue: "신촌 몽향 소극장",
    genre: "밴드/라이브",
    description:
      "방학의 끝자락, 각자의 방과 동아리방에서 곡을 쓰던 대학생 네 팀이 신촌의 작은 지하 무대에 모입니다. 어쿠스틱 포크로 문을 열고 인디 팝과 얼터너티브 록으로 이어지는 100분 동안, 아직 음원으로 발표되지 않은 자작곡과 각 팀이 고른 여름의 마지막 노래를 들려드립니다.\n\n신촌 몽향 소극장은 무대와 객석의 거리가 가까운 60석 규모입니다. 공연 시작 30분 전부터 입장하며 전석 자유석입니다. 무음 촬영은 가능하지만 플래시와 삼각대는 사용할 수 없습니다.",
    poster: `${blobBase}/sample-event/poster-v1.png`,
    detail: `${blobBase}/sample-event/detail-v2.png`,
    runtime: 100,
    price: 18000,
    bank: ["카카오뱅크", "3333-28-7410926", "김서윤"],
    inquiry:
      "예매 취소 후 환불은 영업일 기준 2~3일이 소요됩니다. 문의: 010-4827-1936",
    type: "FIRST_COME",
    capacity: 60,
    max: 4,
    days: 21,
    ticketTypes: [
      ["일반", 18000],
      ["대학생", 15000],
    ],
    feeds: [
      [
        `${blobBase}/sample-event/feed-v1.png`,
        "기타 줄을 다시 맞추고 마지막 셋리스트를 적었습니다. 늦여름의 끝에서 만날 단 하루의 라이브, 작은 무대 바로 앞에서 함께해요.",
      ],
      [
        `${blobBase}/sample-event/poster-v1.png`,
        "서로 다른 학교에서 모인 네 팀의 이름을 공개합니다. 지금 예매하면 대학생 티켓으로 조금 더 가볍게 만날 수 있어요.",
      ],
    ],
  },
  {
    organizer: 1,
    title: "분실물 보관소",
    slug: "lost-and-found-room-2026",
    venue: "혜화 새벽소극장",
    genre: "연극",
    description:
      "교내 분실물 보관소에서 야간 근로를 시작한 대학생 수현은 주인이 나타나지 않는 물건마다 짧은 메모를 붙입니다. 한 짝뿐인 운동화, 멈춘 알람시계, 비가 오지 않던 날 맡겨진 빨간 우산. 폐기 날짜가 다가온 어느 저녁, 물건을 찾으러 온 세 사람의 이야기가 이어집니다.\n\n공연은 인터미션 없이 85분이며 45석 전석 자유석입니다. 공연 중 촬영과 녹음은 어렵고, 시작 후 10분 동안 입장이 제한될 수 있습니다.",
    poster: `${blobBase}/lost-and-found/poster-v1.png`,
    detail: `${blobBase}/lost-and-found/detail-v1.png`,
    runtime: 85,
    price: 12000,
    bank: ["토스뱅크", "1001-9462-8375", "이도현"],
    inquiry:
      "공연 2일 전 오후 6시까지 전액 환불 가능합니다. 문의: 010-6194-2758",
    type: "FIRST_COME",
    capacity: 45,
    max: 4,
    days: 12,
    ticketTypes: [
      ["일반", 12000],
      ["대학생", 9000],
    ],
    feeds: [
      [
        `${blobBase}/lost-and-found/feed-v1.png`,
        "빨간 우산, 멈춘 알람시계, 한 짝뿐인 운동화. 오늘도 주인을 기다리는 소품들을 꺼냈습니다.",
      ],
      [
        `${blobBase}/lost-and-found/detail-v1.png`,
        "여섯 배우의 마지막 교내 연습을 마쳤습니다. 가까운 45석 객석에서 창작극 〈분실물 보관소〉를 만나보세요.",
      ],
    ],
  },
  {
    organizer: 2,
    title: "옥탑방 302호",
    slug: "rooftop-room-302-2026",
    venue: "서강 아트스페이스 지하극장",
    genre: "뮤지컬",
    description:
      "철거를 앞둔 옥탑방 302호에 마지막 세입자들이 모입니다. 서로 다른 이유로 서울에 남은 다섯 청춘이 하룻밤 동안 짐을 나누고, 말하지 못했던 꿈을 노래하는 창작 뮤지컬입니다. 피아노와 기타 중심의 라이브 연주로 열두 곡을 들려드립니다.\n\n러닝타임은 인터미션 포함 125분입니다. 80석 지정 좌석제로 운영하며 공연 시작 30분 전부터 티켓을 수령할 수 있습니다. 1막 시작 후에는 지정된 장면에서만 입장할 수 있습니다.",
    poster: `${blobBase}/rooftop-302/poster-v1.png`,
    detail: `${blobBase}/rooftop-302/detail-v1.png`,
    runtime: 125,
    price: 28000,
    bank: ["신한은행", "110-492-816530", "정하린"],
    inquiry:
      "공연 3일 전까지 전액, 하루 전까지 50% 환불됩니다. 문의: rooftop.musical@example.com",
    type: "SEAT_SELECTION",
    seatRows: 8,
    seatColumns: 10,
    max: 4,
    days: 28,
    ticketTypes: [
      ["일반", 28000],
      ["대학생", 22000],
      ["조기예매", 19000],
    ],
    feeds: [
      [
        `${blobBase}/rooftop-302/feed-v1.png`,
        "옥탑방의 다섯 인물을 위한 의상 색을 골랐습니다. 각자의 색이 무대에서 어떻게 만나는지 기대해주세요.",
      ],
      [
        `${blobBase}/rooftop-302/performance-v1.png`,
        "첫 전막 런스루를 마쳤습니다. 80석의 작은 지하극장을 노래와 옥탑의 불빛으로 채웁니다.",
      ],
      [
        `${blobBase}/rooftop-302/poster-v1.png`,
        "조기예매 티켓이 이번 주에 마감됩니다. 철거 전 마지막 밤, 옥탑방 302호의 손님이 되어주세요.",
      ],
    ],
  },
  {
    organizer: 3,
    title: "파동 사이",
    slug: "between-the-waves-2026",
    venue: "문래 움직임공간 낮은숨",
    genre: "무용/댄스",
    description:
      "다섯 명의 대학생 무용수가 물결이 번지고 사라지는 시간을 몸의 호흡으로 옮긴 창작 현대무용입니다. 바닥에 그려진 곡선과 한 장의 푸른 천만으로 서로 밀어내고 다시 가까워지는 움직임을 만듭니다.\n\n공연은 70분이며 64석 지정 좌석제입니다. 일부 장면에 낮은 조도와 빠른 조명 변화가 있습니다. 무대와 1열의 거리가 가까워 공연 중 이동과 촬영은 제한됩니다.",
    poster: `${blobBase}/between-waves/poster-v1.png`,
    detail: `${blobBase}/between-waves/detail-v1.png`,
    runtime: 70,
    price: 22000,
    bank: ["국민은행", "012501-04-938271", "최유진"],
    inquiry:
      "공연 48시간 전까지 전액 환불됩니다. 접근성 및 환불 문의: 010-7743-5209",
    type: "SEAT_SELECTION",
    seatRows: 8,
    seatColumns: 8,
    max: 3,
    days: 34,
    ticketTypes: [
      ["일반", 22000],
      ["청년예술인", 16000],
    ],
    feeds: [
      [
        `${blobBase}/between-waves/feed-v1.png`,
        "오늘은 바닥의 선을 다시 그리고 푸른 천의 길이를 맞췄습니다. 움직임이 지나간 자리도 작품의 일부가 됩니다.",
      ],
      [
        `${blobBase}/between-waves/performance-v1.png`,
        "무대 옆에서 바라본 첫 조명 리허설. 한 줄기 빛과 다섯 개의 호흡으로 70분을 채웁니다.",
      ],
      [
        `${blobBase}/between-waves/poster-v1.png`,
        "가장 가까운 자리에서 발끝과 바닥의 작은 떨림까지 만나보세요. 지정 좌석 예매가 열렸습니다.",
      ],
    ],
  },
  {
    organizer: 4,
    title: "밤의 도서관",
    slug: "library-at-night-2026",
    venue: "연희 독립서점 여백",
    genre: "기타",
    description:
      "문예창작과 학생 세 명이 쓴 짧은 소설을 작가가 직접 읽고, 첼로 연주가 이야기 사이의 여백을 잇는 낭독 공연입니다. 한 사람이 떠난 뒤 방에 남은 물건, 새벽 버스의 마지막 승객, 읽히지 않은 편지를 주제로 세 편을 들려드립니다.\n\n독립서점 영업 종료 후 35석으로 진행되며 러닝타임은 75분입니다. 음료 한 잔이 포함되고 좌석은 입장 순서대로 선택합니다. 공간이 협소해 큰 짐은 보관이 어렵습니다.",
    poster: `${blobBase}/night-library/poster-v1.png`,
    detail: `${blobBase}/night-library/detail-v1.png`,
    runtime: 75,
    price: 10000,
    bank: ["우리은행", "1002-761-493820", "한재민"],
    inquiry:
      "공연 전날 오후 5시까지 전액 환불됩니다. 문의: night.reading@example.com",
    type: "FIRST_COME",
    capacity: 35,
    max: 2,
    days: 17,
    ticketTypes: [
      ["일반", 10000],
      ["음료 미포함", 7000],
    ],
    feeds: [
      [
        `${blobBase}/night-library/feed-v1.png`,
        "세 편의 원고에 마지막 표시를 남겼습니다. 책장이 닫힌 뒤 시작되는 낭독과 첼로의 밤입니다.",
      ],
      [
        `${blobBase}/night-library/performance-v1.png`,
        "서른다섯 개의 서로 다른 의자를 놓아보았습니다. 조용한 서점에서 목소리와 현의 울림을 가까이 들어보세요.",
      ],
    ],
  },
  {
    organizer: 5,
    title: "잔디밭 세 시",
    slug: "grass-at-three-2026",
    venue: "한빛대학교 학생회관 앞 잔디마당",
    genre: "밴드/라이브",
    description:
      "캠퍼스 어쿠스틱 동아리 다섯 팀이 준비한 무료 봄 공연입니다. 기타 듀오, 보컬과 카혼, 우쿨렐레 트리오가 각자 좋아하는 노래와 자작곡을 20분씩 들려드립니다. 지나가다 잠시 앉아도 좋고 공연 전체를 함께해도 좋습니다.\n\n공연은 110분이며 별도 좌석 없이 잔디에 자유롭게 앉는 선착순 방식입니다. 돗자리를 가져오면 편하게 관람할 수 있습니다. 우천 시 학생회관 2층 다목적실로 변경됩니다.",
    poster: `${blobBase}/grass-three/poster-v1.png`,
    detail: `${blobBase}/grass-three/detail-v1.png`,
    runtime: 110,
    price: 0,
    bank: ["농협은행", "302-1847-5921-31", "오서아"],
    inquiry:
      "무료 공연이며 취소 수수료가 없습니다. 우천 장소 문의: 010-8350-4612",
    type: "FIRST_COME",
    capacity: 120,
    max: 6,
    days: 8,
    ticketTypes: [["무료 예매", 0]],
    feeds: [
      [
        `${blobBase}/grass-three/feed-v1.png`,
        "기타 케이스에 오늘의 순서를 붙였습니다. 돗자리 한 장 들고 오후 세 시 잔디밭에서 만나요.",
      ],
      [
        `${blobBase}/grass-three/performance-v1.png`,
        "작은 천막과 스피커 설치를 미리 점검했습니다. 무료 예매로 편하게 자리를 예약할 수 있어요.",
      ],
      [
        `${blobBase}/grass-three/poster-v1.png`,
        "비가 오면 학생회관 2층에서 그대로 공연합니다. 날씨와 상관없이 다섯 팀의 봄 노래를 들려드릴게요.",
      ],
    ],
  },
].map((event) => ({ ...event, id: randomUUID() }));

const reservationSpecs = [
  [0, "박지우", "010-7352-6841", "2608", 2, 1, "일행과 함께 방문합니다."],
  [0, "윤가은", "010-4168-9027", "3141", 1, 0, "입장 시간에 맞춰 도착할게요."],
  [0, "송민준", "010-9021-5574", "7720", 3, 1, "친구 두 명과 함께 갑니다."],
  [
    1,
    "김나연",
    "010-3815-6402",
    "4812",
    2,
    1,
    "가능하면 앞쪽에서 관람하고 싶어요.",
  ],
  [1, "임현우", "010-6470-2193", "9355", 1, 0, "없음"],
  [1, "배수빈", "010-5208-7716", "2026", 2, 1, "늦지 않게 도착하겠습니다."],
  [2, "서지훈", "010-8741-3360", "6134", 2, 1, "공연 기대하고 있습니다."],
  [2, "문채원", "010-2936-8451", "5580", 3, 2, "세 명이 나란히 앉고 싶어요."],
  [
    2,
    "강태윤",
    "010-7619-4285",
    "1198",
    1,
    0,
    "통로와 가까운 좌석이면 좋겠습니다.",
  ],
  [
    3,
    "정유나",
    "010-4307-9821",
    "8642",
    2,
    1,
    "무대 전체가 보이는 자리를 선택했습니다.",
  ],
  [3, "이건우", "010-9184-2506", "3579", 1, 0, "없음"],
  [3, "홍서진", "010-5726-1048", "4403", 2, 1, "동행인과 함께 관람합니다."],
  [4, "최다은", "010-2649-7138", "6825", 1, 0, "첼로 연주를 기대하고 있어요."],
  [
    4,
    "박준서",
    "010-8063-5294",
    "7251",
    2,
    1,
    "음료 미포함 티켓으로 신청합니다.",
  ],
  [4, "조하영", "010-3492-1680", "9304", 1, 0, "큰 짐 없이 방문하겠습니다."],
  [5, "신예린", "010-7158-3049", "2468", 2, 0, "돗자리를 가져갈게요."],
  [5, "권도윤", "010-4830-9265", "1357", 4, 0, "동아리 친구들과 함께 갑니다."],
  [5, "유소민", "010-6291-8703", "8080", 1, 0, "우천 장소도 확인했습니다."],
];

const organizerHashes = await Promise.all(
  organizers.map((organizer) => hashPassword(organizer.password)),
);

const ticketTypes = events.flatMap((event) =>
  event.ticketTypes.map(([name, price]) => ({
    id: randomUUID(),
    eventId: event.id,
    name,
    price,
  })),
);

const seatsByEvent = new Map();
for (const event of events.filter((item) => item.type === "SEAT_SELECTION")) {
  const seats = [];
  for (let row = 1; row <= event.seatRows; row += 1) {
    for (let column = 1; column <= event.seatColumns; column += 1) {
      seats.push({
        id: randomUUID(),
        eventId: event.id,
        label: `${String.fromCharCode(64 + row)}${column}`,
        row,
        column,
      });
    }
  }
  seatsByEvent.set(event.id, seats);
}

const seatCursor = new Map();
const reservations = await Promise.all(
  reservationSpecs.map(
    async (
      [eventIndex, name, phone, password, quantity, ticketTypeIndex, note],
      index,
    ) => {
      const event = events[eventIndex];
      const types = ticketTypes.filter((type) => type.eventId === event.id);
      const ticketType = types[ticketTypeIndex];
      const seats = seatsByEvent.get(event.id) ?? [];
      const cursor = seatCursor.get(event.id) ?? 0;
      const selectedSeats = seats.slice(cursor, cursor + quantity);
      seatCursor.set(event.id, cursor + quantity);
      const id = randomUUID();
      const tickets = await Promise.all(
        Array.from({ length: quantity }, async (_, ticketIndex) => {
          const token = randomBytes(32).toString("base64url");
          return {
            number: ticketIndex + 1,
            token,
            qrImage: await QRCode.toDataURL(token, {
              errorCorrectionLevel: "M",
              margin: 4,
              scale: 6,
            }),
            seatId: selectedSeats[ticketIndex]?.id ?? null,
          };
        }),
      );
      return {
        id,
        event,
        ticketType,
        name,
        phone,
        password,
        passwordHash: await hashPassword(password),
        quantity,
        note,
        selectedSeats,
        tickets,
        code: `OCC-2026-${String(index + 1).padStart(5, "0")}`,
      };
    },
  ),
);

const queries = [
  sql`TRUNCATE TABLE organizers CASCADE`,
  sql`TRUNCATE TABLE request_rate_limits`,
];

organizers.forEach((organizer, index) => {
  queries.push(sql`
    INSERT INTO organizers (id,email,password_hash,name,phone,organization_name)
    VALUES (${organizer.id},${organizer.email},${organizerHashes[index]},${organizer.name},${organizer.phone},${organizer.organizationName})
  `);
});

events.forEach((event) => {
  queries.push(sql`
    INSERT INTO events (
      id,organizer_id,title,slug,venue,description,poster_image_url,detail_image_url,
      runtime_minutes,genre,ticket_price,bank_name,account_number,account_holder,
      inquiry_contact,reservation_type,total_capacity,max_tickets_per_person,
      cancel_deadline_at,event_start_at,event_end_at,status,published_at
    ) VALUES (
      ${event.id},${organizers[event.organizer].id},${event.title},${event.slug},${event.venue},${event.description},
      ${event.poster},${event.detail},${event.runtime},${event.genre},${event.price},${event.bank[0]},${event.bank[1]},${event.bank[2]},
      ${event.inquiry},${event.type},${event.capacity ?? null},${event.max},${future(event.days - 2)},${future(event.days)},
      ${future(event.days, event.runtime)},'SCHEDULED',NOW()
    )
  `);
});

ticketTypes.forEach((type) => {
  queries.push(
    sql`INSERT INTO ticket_types (id,event_id,name,price) VALUES (${type.id},${type.eventId},${type.name},${type.price})`,
  );
});

for (const seats of seatsByEvent.values()) {
  seats.forEach((seat) => {
    queries.push(
      sql`INSERT INTO seats (id,event_id,label,layout_row,layout_column) VALUES (${seat.id},${seat.eventId},${seat.label},${seat.row},${seat.column})`,
    );
  });
}

events.forEach((event, eventIndex) => {
  event.feeds.slice(0, 1).forEach(([imageUrl, content]) => {
    queries.push(sql`
      INSERT INTO feed_posts (event_id,image_url,content,created_at)
      VALUES (${event.id},${imageUrl},${content},NOW()-${eventIndex + 1}*INTERVAL '3 hours')
    `);
  });
});

reservations.forEach((reservation) => {
  queries.push(sql`
    INSERT INTO reservations (
      id,event_id,ticket_type_id,reserver_name,reserver_phone,depositor_name,lookup_password_hash,
      quantity,unit_price,total_price,request_note,status,reservation_code,qr_generation_status,created_at
    ) VALUES (
      ${reservation.id},${reservation.event.id},${reservation.ticketType.id},${reservation.name},${reservation.phone},${reservation.name},
      ${reservation.passwordHash},${reservation.quantity},${reservation.ticketType.price},${reservation.ticketType.price * reservation.quantity},
      ${reservation.note},'CONFIRMED',${reservation.code},'NOT_REQUESTED',NOW()-INTERVAL '2 days'
    )
  `);
  reservation.selectedSeats.forEach((seat) => {
    queries.push(
      sql`INSERT INTO reservation_seats (reservation_id,seat_id) VALUES (${reservation.id},${seat.id})`,
    );
  });
  reservation.tickets.forEach((ticket) => {
    queries.push(sql`
      INSERT INTO reservation_tickets (
        reservation_id,seat_id,ticket_number,qr_token,qr_image_data,qr_generation_status
      ) VALUES (${reservation.id},${ticket.seatId},${ticket.number},${ticket.token},${ticket.qrImage},'READY')
    `);
  });
});

await sql.transaction(queries);

const counts = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM organizers) organizers,
    (SELECT COUNT(*)::int FROM events) events,
    (SELECT COUNT(*)::int FROM reservations) reservations,
    (SELECT COUNT(*)::int FROM reservations WHERE status='CONFIRMED') confirmed_reservations,
    (SELECT COUNT(*)::int FROM reservation_tickets WHERE qr_generation_status='READY') ready_tickets,
    (SELECT COUNT(*)::int FROM feed_posts) feed_posts,
    (SELECT COUNT(*)::int FROM ticket_types) ticket_types,
    (SELECT COUNT(*)::int FROM seats) seats
`;

console.log(
  JSON.stringify(
    {
      counts: counts[0],
      organizers: organizers.map(
        ({ email, password, name, organizationName }) => ({
          email,
          password,
          name,
          organizationName,
        }),
      ),
      sampleReservation: {
        name: reservations[0].name,
        phone: reservations[0].phone,
        lookupPassword: reservations[0].password,
      },
      events: events.map(({ title, slug, type, price }) => ({
        title,
        slug,
        type,
        price,
      })),
    },
    null,
    2,
  ),
);
