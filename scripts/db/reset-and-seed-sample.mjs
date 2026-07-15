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
  ["page.turner@example.com", "PageTurn!2026", "박소은", "010-4217-6380", "페이지 스테이지"],
  ["orbit.music@example.com", "OrbitSound!2026", "윤태경", "010-9072-1546", "오비트 사운드"],
  ["slow.step@example.com", "SlowStep!2026", "조유림", "010-3658-7012", "느린걸음 프로젝트"],
  ["frame.club@example.com", "FrameClub!2026", "백승호", "010-6481-2935", "프레임 클럽"],
  ["small.table@example.com", "SmallTable!2026", "이채린", "010-2739-8164", "작은탁자 기획단"],
  ["room.seven@example.com", "RoomSeven!2026", "김도윤", "010-5146-9820", "룸세븐 컬렉티브"],
  ["campus.canvas@example.com", "Canvas!2026", "장하은", "010-8362-4751", "캠퍼스 캔버스"],
  ["after.class@example.com", "AfterClass!2026", "서민재", "010-1927-6048", "수업뒤 제작소"],
  ["lightbox.cinema@example.com", "Lightbox!2026", "남지수", "010-7504-3286", "라이트박스 시네마"],
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
    genre: "음악",
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
        `${blobBase}/rooftop-302/performance-v1.png`,
        "첫 전막 런스루를 마쳤습니다. 80석의 작은 지하극장을 노래와 옥탑의 불빛으로 채웁니다.",
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
        `${blobBase}/between-waves/performance-v1.png`,
        "무대 옆에서 바라본 첫 조명 리허설. 한 줄기 빛과 다섯 개의 호흡으로 70분을 채웁니다.",
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
    genre: "음악",
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
        `${blobBase}/grass-three/performance-v1.png`,
        "작은 천막과 스피커 설치를 미리 점검했습니다. 무료 예매로 편하게 자리를 예약할 수 있어요.",
      ],
    ],
  },
  {
    organizer: 0,
    title: "마지막 버스가 떠난 뒤",
    slug: "after-the-last-bus-2026",
    venue: "성북 작은무대 정류장",
    genre: "연극",
    description:
      "막차가 떠난 뒤 낯선 정류장에 남은 세 대학생이 첫차가 올 때까지 서로의 목적지를 묻는 창작극입니다. 직접 만든 낡은 벤치와 가로등 하나를 중심으로, 떠나야 할 때와 기다려야 할 때에 관한 이야기를 담았습니다.\n\n공연은 인터미션 없이 80분이며 40석 전석 자유석입니다. 공연 시작 20분 전부터 입장할 수 있고, 공연 중 촬영과 녹음은 제한됩니다.",
    poster: "/demo/last-bus/poster.png",
    detail: "/demo/last-bus/detail.png",
    runtime: 80,
    price: 12000,
    bank: ["카카오뱅크", "3333-14-8250619", "김서윤"],
    inquiry: "공연 하루 전 오후 6시까지 전액 환불됩니다. 문의: 010-4827-1936",
    type: "FIRST_COME",
    capacity: 40,
    max: 4,
    days: 25,
    ticketTypes: [["일반", 12000], ["대학생", 9000]],
    feeds: [[
      "/demo/last-bus/poster.png",
      "막차가 떠난 뒤에도 끝내 하지 못한 말이 남아 있습니다. 작은 정류장에서 시작되는 세 청춘의 밤을 만나보세요.",
    ]],
  },
  {
    organizer: 3,
    title: "파란 방의 합주",
    slug: "blue-room-ensemble-2026",
    venue: "동교 생활문화센터 연습실",
    genre: "음악",
    description:
      "서로 다른 전공의 대학생 네 명이 방과 후 파란 연습실에 모여 준비한 작은 실내악 공연입니다. 바이올린, 첼로, 클라리넷과 건반이 익숙한 선율과 짧은 자작곡을 번갈아 들려드립니다.\n\n공연은 70분이며 55명 선착순 입장입니다. 연주자와 관객이 같은 바닥 높이에 앉는 편안한 공연으로, 곡 사이에는 짧은 해설이 함께합니다.",
    poster: "/demo/blue-room-ensemble/poster.png",
    detail: "/demo/blue-room-ensemble/detail.png",
    runtime: 70,
    price: 15000,
    bank: ["국민은행", "012501-04-617824", "최유진"],
    inquiry: "공연 2일 전까지 전액 환불됩니다. 문의: 010-7743-5209",
    type: "FIRST_COME",
    capacity: 55,
    max: 4,
    days: 31,
    ticketTypes: [["일반", 15000], ["대학생", 11000]],
    feeds: [[
      "/demo/blue-room-ensemble/feed.png",
      "서로 다른 네 악기가 한 곡의 호흡을 찾아가고 있습니다. 파란 연습실에서 시작된 조용하고 다정한 합주에 초대합니다.",
    ]],
  },
  {
    organizer: 4,
    title: "우리의 작은 라디오",
    slug: "our-small-radio-2026",
    venue: "연희 청년문화실 지하방송실",
    genre: "연극",
    description:
      "폐국을 앞둔 교내 라디오 방송의 마지막 생방송을 배경으로 한 낭독극입니다. 세 명의 진행자가 오래된 사연과 보내지 못한 답장을 읽으며 자신들의 마지막 이야기도 조심스럽게 꺼냅니다.\n\n러닝타임은 65분이며 35석 전석 자유석입니다. 작은 방송실을 재현한 공간에서 마이크와 간단한 음향 효과만으로 진행합니다.",
    poster: "/demo/small-radio/poster.png",
    detail: "/demo/small-radio/detail.png",
    runtime: 65,
    price: 10000,
    bank: ["우리은행", "1002-761-582043", "한재민"],
    inquiry: "공연 전날 오후 5시까지 전액 환불됩니다. 문의: night.reading@example.com",
    type: "FIRST_COME",
    capacity: 35,
    max: 3,
    days: 19,
    ticketTypes: [["일반", 10000], ["대학생", 7000]],
    feeds: [[
      "/demo/small-radio/feed.png",
      "빨간 불이 켜지면 오래 미뤄둔 마지막 사연이 시작됩니다. 서른다섯 명의 청취자와 함께하는 작은 라디오의 밤입니다.",
    ]],
  },
  {
    organizer: 6,
    title: "각주 없는 밤",
    slug: "night-without-footnotes-2026",
    venue: "대학로 소극장 틈",
    genre: "연극",
    description: "졸업 논문 마감을 앞둔 사학과 학생 네 명이 밤새 학과 자료실을 지키며 벌어지는 창작극입니다. 기록으로 남은 사실과 각자가 기억하는 진실이 엇갈리는 순간을 유쾌하고 따뜻하게 풀어냅니다.\n\n공연은 85분이며 48석 전석 자유석입니다. 공연 시작 20분 전부터 입장할 수 있습니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 85, price: 14000, bank: ["토스뱅크", "1001-2847-6103", "박소은"],
    inquiry: "공연 하루 전까지 전액 환불됩니다. 문의: page.turner@example.com",
    type: "FIRST_COME", capacity: 48, max: 4, days: 23,
    ticketTypes: [["일반", 14000], ["대학생", 10000]],
    feeds: [["/demo/placeholder-event-image.svg", "각주에 가려졌던 네 사람의 진짜 이야기가 오늘 밤 시작됩니다. 자료실 문이 닫힌 뒤 펼쳐지는 사학과 청춘극을 만나보세요."]],
  },
  {
    organizer: 6,
    title: "종이별의 지도",
    slug: "map-of-paper-stars-2026",
    venue: "성수 창작공간 모서리",
    genre: "뮤지컬",
    description: "천문 동아리방 철거를 하루 앞둔 밤, 다섯 학생이 오래된 관측 일지를 펼치며 잊고 있던 약속을 노래하는 창작 뮤지컬입니다. 피아노와 기타의 소박한 라이브 연주로 열 곡을 들려드립니다.\n\n러닝타임은 110분이며 인터미션 15분이 포함됩니다. 72석 지정 좌석제로 운영합니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 110, price: 24000, bank: ["토스뱅크", "1001-2847-6103", "박소은"],
    inquiry: "공연 3일 전까지 전액 환불됩니다. 문의: page.turner@example.com",
    type: "SEAT_SELECTION", seatRows: 8, seatColumns: 9, max: 4, days: 38,
    ticketTypes: [["일반", 24000], ["대학생", 19000]],
    feeds: [["/demo/placeholder-event-image.svg", "접어둔 종이별마다 우리가 놓친 약속이 하나씩 남아 있습니다. 작은 동아리방에서 우주보다 넓게 펼쳐질 노래를 만나보세요."]],
  },
  {
    organizer: 7,
    title: "오후 네 시의 화음",
    slug: "harmony-at-four-2026",
    venue: "망원 생활음악실",
    genre: "음악",
    description: "수업을 마친 대학생 보컬 다섯 명이 준비한 아카펠라 공연입니다. 익숙한 대중음악을 새롭게 편곡한 곡과 짧은 자작곡을 목소리만으로 들려드립니다.\n\n공연은 75분이며 60명 선착순 입장입니다. 곡 사이에 편곡 과정에 관한 짧은 이야기가 이어집니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 75, price: 16000, bank: ["신한은행", "110-638-274910", "윤태경"],
    inquiry: "공연 2일 전까지 전액 환불됩니다. 문의: orbit.music@example.com",
    type: "FIRST_COME", capacity: 60, max: 4, days: 16,
    ticketTypes: [["일반", 16000], ["대학생", 12000]],
    feeds: [["/demo/placeholder-event-image.svg", "악기 없이 다섯 목소리만으로 오후의 공기를 채웁니다. 익숙한 노래가 새로운 화음으로 바뀌는 순간을 함께해주세요."]],
  },
  {
    organizer: 7,
    title: "계단 아래 콘서트",
    slug: "concert-under-the-stairs-2026",
    venue: "연남 지하연습실 B1",
    genre: "음악",
    description: "학교와 아르바이트를 오가며 음악을 만든 세 팀이 함께 여는 소규모 라이브입니다. 포크, 인디 팝, 로파이 록을 오가며 각 팀의 자작곡을 가장 가까운 거리에서 들려드립니다.\n\n공연은 95분이며 50명 선착순 입장입니다. 플래시 없는 휴대폰 촬영은 가능합니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 95, price: 18000, bank: ["신한은행", "110-638-274910", "윤태경"],
    inquiry: "공연 전날까지 전액 환불됩니다. 문의: orbit.music@example.com",
    type: "FIRST_COME", capacity: 50, max: 4, days: 29,
    ticketTypes: [["일반", 18000], ["대학생", 14000]],
    feeds: [["/demo/placeholder-event-image.svg", "계단 아래 작은 방에서 세 팀의 새 노래가 처음 울립니다. 무대 바로 앞에서 시작되는 가장 가까운 라이브에 초대합니다."]],
  },
  {
    organizer: 8,
    title: "반 박자 느린 우리",
    slug: "half-beat-slower-2026",
    venue: "문래 움직임연습장 2층",
    genre: "무용/댄스",
    description: "항상 조금씩 타이밍이 어긋나는 네 사람이 서로의 속도를 발견해가는 창작 무용 공연입니다. 운동화 마찰음과 손뼉, 짧은 전자음만으로 일상의 리듬을 무대에 옮깁니다.\n\n공연은 60분이며 56석 지정 좌석제입니다. 일부 장면에 빠른 조명 변화가 있습니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 60, price: 20000, bank: ["국민은행", "451201-04-782196", "조유림"],
    inquiry: "공연 48시간 전까지 전액 환불됩니다. 문의: slow.step@example.com",
    type: "SEAT_SELECTION", seatRows: 7, seatColumns: 8, max: 3, days: 33,
    ticketTypes: [["일반", 20000], ["청년예술인", 15000]],
    feeds: [["/demo/placeholder-event-image.svg", "조금 늦고 조금 다른 네 개의 박자가 마침내 한 장면에서 만납니다. 서두르지 않는 움직임의 시간을 함께 바라봐주세요."]],
  },
  {
    organizer: 9,
    title: "여섯 번째 테이크",
    slug: "the-sixth-take-2026",
    venue: "충무로 독립영화관 숨",
    genre: "영화/영상",
    description: "대학생 영화 제작팀 세 팀의 단편영화 상영회입니다. 실패한 인터뷰, 비어 있는 자취방, 새벽 편의점을 소재로 한 15분 안팎의 작품 세 편을 상영하고 감독과의 대화를 진행합니다.\n\n전체 프로그램은 100분이며 70석 전석 자유석입니다. 상영 시작 후 입장이 제한될 수 있습니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 100, price: 9000, bank: ["카카오뱅크", "3333-19-4061827", "백승호"],
    inquiry: "상영 전날까지 전액 환불됩니다. 문의: frame.club@example.com",
    type: "FIRST_COME", capacity: 70, max: 4, days: 20,
    ticketTypes: [["일반", 9000], ["학생", 6000]],
    feeds: [["/demo/placeholder-event-image.svg", "다섯 번의 실패 끝에 완성한 세 편의 짧은 영화가 처음 관객을 만납니다. 상영 뒤 제작진과 솔직한 이야기도 나눠요."]],
  },
  {
    organizer: 10,
    title: "처음 만드는 축제",
    slug: "making-our-first-festival-2026",
    venue: "신촌 청년문화공간 모임방",
    genre: "강연/토크",
    description: "대학 축제와 소규모 공연을 직접 기획한 학생 기획자 세 명이 시행착오를 나누는 공개 대화입니다. 예산표 만들기, 출연팀 섭외, 공간 협의와 당일 운영까지 실제 경험을 중심으로 이야기합니다.\n\n토크는 90분이며 마지막 25분은 자유 질의응답으로 진행합니다. 참가자는 45명으로 제한합니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 90, price: 5000, bank: ["우리은행", "1002-938-164720", "이채린"],
    inquiry: "행사 전날까지 전액 환불됩니다. 문의: small.table@example.com",
    type: "FIRST_COME", capacity: 45, max: 2, days: 14,
    ticketTypes: [["참가권", 5000]],
    feeds: [["/demo/placeholder-event-image.svg", "축제는 화려한 무대보다 한 장의 예산표에서 시작됐습니다. 처음 기획하는 사람을 위한 현실적인 시행착오를 함께 나눕니다."]],
  },
  {
    organizer: 11,
    title: "창문을 빌려드립니다",
    slug: "windows-for-rent-2026",
    venue: "을지로 프로젝트룸 7",
    genre: "전시",
    description: "자취방과 기숙사 창문에서 바라본 풍경을 모은 대학생 사진·드로잉 전시입니다. 열두 명의 참여자가 같은 시각에 본 서로 다른 하늘과 골목을 작은 인화물과 기록 노트로 소개합니다.\n\n전시는 주말 사흘간 오후 1시부터 8시까지 열립니다. 회차별 30명까지 무료로 예약할 수 있습니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 60, price: 0, bank: ["농협은행", "302-7619-4825-11", "김도윤"],
    inquiry: "무료 전시입니다. 단체 방문 문의: room.seven@example.com",
    type: "FIRST_COME", capacity: 30, max: 5, days: 27,
    ticketTypes: [["무료 관람", 0]],
    feeds: [["/demo/placeholder-event-image.svg", "같은 시간, 열두 개의 창문에는 모두 다른 저녁이 걸렸습니다. 우리 곁의 평범한 풍경을 천천히 들여다보세요."]],
  },
  {
    organizer: 12,
    title: "붙였다 떼는 마음",
    slug: "peel-and-stick-hearts-2026",
    venue: "서교 독립전시공간 점",
    genre: "전시",
    description: "스티커, 메모지, 영수증처럼 쉽게 붙이고 버리는 종이로 만든 설치 전시입니다. 시각디자인과 학생 여덟 명이 관계 속에서 남겨진 짧은 문장과 흔적을 각자의 방식으로 재구성했습니다.\n\n관람 시간은 약 40분이며 회차별 25명까지 입장합니다. 일부 작품에는 관객이 직접 메모를 붙일 수 있습니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 40, price: 7000, bank: ["하나은행", "175-910482-63017", "장하은"],
    inquiry: "관람 하루 전까지 전액 환불됩니다. 문의: campus.canvas@example.com",
    type: "FIRST_COME", capacity: 25, max: 4, days: 36,
    ticketTypes: [["일반", 7000], ["학생", 5000]],
    feeds: [["/demo/placeholder-event-image.svg", "쉽게 떼어낸 작은 종이에도 오래 남는 마음이 있습니다. 여덟 명의 학생이 모은 관계의 흔적을 직접 붙여 완성해주세요."]],
  },
  {
    organizer: 13,
    title: "오늘의 대사는 없습니다",
    slug: "no-lines-today-2026",
    venue: "혜화 연습실 작은문",
    genre: "기타",
    description: "관객이 건넨 장소와 감정을 바탕으로 장면을 즉석에서 만드는 대학생 즉흥 공연입니다. 정해진 대본 없이 네 명의 출연자가 몸짓, 짧은 노래와 대화로 매회 다른 이야기를 완성합니다.\n\n공연은 70분이며 42명 선착순 입장입니다. 관객 참여는 선택 사항이며 편하게 관람만 해도 좋습니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 70, price: 13000, bank: ["카카오뱅크", "3333-22-7180462", "서민재"],
    inquiry: "공연 하루 전까지 전액 환불됩니다. 문의: after.class@example.com",
    type: "FIRST_COME", capacity: 42, max: 3, days: 18,
    ticketTypes: [["일반", 13000], ["대학생", 10000]],
    feeds: [["/demo/placeholder-event-image.svg", "오늘 무대에는 정해진 대사도 결말도 없습니다. 여러분이 건넨 한 단어가 세상에 하나뿐인 장면으로 이어집니다."]],
  },
  {
    organizer: 14,
    title: "엔딩 크레딧 이후",
    slug: "after-the-ending-credits-2026",
    venue: "합정 커뮤니티 시네마 오후",
    genre: "영화/영상",
    description: "졸업을 앞둔 학생 감독 네 명이 완성한 10분 안팎의 초단편을 연속 상영합니다. 영화가 끝난 뒤 인물에게 남은 시간을 상상한 네 작품과 제작 노트를 함께 소개합니다.\n\n상영과 관객 대화를 포함해 85분이며 52석 전석 자유석입니다. 모든 작품에 한글 자막이 제공됩니다.",
    poster: "/demo/placeholder-event-image.svg", detail: "/demo/placeholder-event-image.svg",
    runtime: 85, price: 8000, bank: ["케이뱅크", "100-193-846205", "남지수"],
    inquiry: "상영 전날까지 전액 환불됩니다. 문의: lightbox.cinema@example.com",
    type: "FIRST_COME", capacity: 52, max: 4, days: 41,
    ticketTypes: [["일반", 8000], ["학생", 5000]],
    feeds: [["/demo/placeholder-event-image.svg", "화면이 어두워진 뒤에도 인물들의 시간은 계속 흐릅니다. 네 명의 학생 감독이 상상한 엔딩 다음 장면을 만나보세요."]],
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

const allowedGenres = new Set([
  "연극", "뮤지컬", "음악", "무용/댄스", "전시", "강연/토크", "영화/영상", "기타",
]);
const eventCountsByOrganizer = events.reduce((counts, event) => {
  counts.set(event.organizer, (counts.get(event.organizer) ?? 0) + 1);
  return counts;
}, new Map());
if (organizers.length !== 15 || events.length !== 20) {
  throw new Error("Sample data must contain 15 organizers and 20 events.");
}
if (events.some((event) => event.feeds.length !== 1)) {
  throw new Error("Every sample event must contain exactly one feed post.");
}
if ([...eventCountsByOrganizer.values()].some((count) => count > 2)) {
  throw new Error("A sample organizer cannot own more than two events.");
}
if ([...eventCountsByOrganizer.entries()].filter(([index, count]) => index >= 6 && count === 2).length !== 2) {
  throw new Error("Exactly two new organizers must own two events.");
}
if (events.some((event) => !allowedGenres.has(event.genre))) {
  throw new Error("Every sample event must use an allowed genre.");
}

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
