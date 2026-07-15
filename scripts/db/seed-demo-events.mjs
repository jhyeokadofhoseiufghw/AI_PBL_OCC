import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql=neon(process.env.DATABASE_URL);
const organizers=await sql`SELECT id FROM organizers ORDER BY created_at LIMIT 1`;
if(!organizers[0])throw new Error("Create an organizer account before seeding demo events.");
const organizerId=String(organizers[0].id);
const demos=[
 {slug:"demo-midnight-jazz",title:"한여름 밤의 재즈",genre:"밴드/음악",venue:"성수 라이브홀",days:7,price:28000,type:"FIRST_COME",capacity:80,poster:"https://picsum.photos/seed/occ-jazz/800/1131",description:"도시의 한여름 밤을 채우는 피아노 트리오와 색소폰의 라이브 세션입니다.",posts:["리허설 현장의 첫 소리를 공개합니다. 여름밤과 잘 어울리는 셋리스트를 준비했어요.","공연 당일에는 입장 30분 전부터 로비가 열립니다."]},
 {slug:"demo-rooftop-play",title:"옥상 위의 우리",genre:"연극",venue:"대학로 작은극장 봄",days:12,price:22000,type:"SEAT_SELECTION",poster:"https://picsum.photos/seed/occ-play/800/1131",description:"서로 다른 계절을 살아온 두 사람이 오래된 건물 옥상에서 나누는 하룻밤의 이야기입니다.",posts:["무대 디자인 스케치를 공개합니다. 작은 옥상이 관객의 기억 속 공간으로 변합니다.","배우들과 함께한 첫 런스루를 무사히 마쳤습니다."]},
 {slug:"demo-dance-breath",title:"숨의 결",genre:"전통/무용",venue:"서울문화예술센터 소극장",days:18,price:30000,type:"SEAT_SELECTION",poster:"https://picsum.photos/seed/occ-dance/800/1131",description:"한국무용의 호흡과 현대적인 움직임이 만나는 창작 무용 공연입니다.",posts:["의상과 조명이 처음 만난 날의 장면을 전합니다."]},
 {slug:"demo-campus-musical",title:"다시, 여름방학",genre:"뮤지컬",venue:"청년예술극장",days:24,price:35000,type:"FIRST_COME",capacity:120,poster:"https://picsum.photos/seed/occ-musical/800/1131",description:"졸업을 앞둔 다섯 친구가 마지막 여름방학에 다시 꺼내 보는 꿈을 그린 창작 뮤지컬입니다.",posts:["메인 넘버 녹음을 마쳤습니다. 공연장에서 함께 부를 순간을 기다릴게요.","캐릭터 포스터 촬영 비하인드를 공개합니다."]},
 {slug:"demo-acoustic-letter",title:"어쿠스틱 편지",genre:"밴드/음악",venue:"망원 스테이지",days:31,price:18000,type:"FIRST_COME",capacity:60,poster:"https://picsum.photos/seed/occ-acoustic/800/1131",description:"기타와 목소리만으로 전하는 다섯 팀의 작은 음악 편지입니다.",posts:["공연 순서와 참여 뮤지션을 공개합니다. 각 팀의 서로 다른 이야기를 만나보세요."]},
];
for(const demo of demos){
 const rows=await sql`INSERT INTO events(organizer_id,title,slug,venue,description,poster_image_url,detail_image_url,runtime_minutes,genre,ticket_price,bank_name,account_number,account_holder,reservation_type,total_capacity,max_tickets_per_person,cancel_deadline_at,event_start_at,event_end_at,status) VALUES(${organizerId},${demo.title},${demo.slug},${demo.venue},${demo.description},${demo.poster},${`https://picsum.photos/seed/${demo.slug}-detail/1200/800`},120,${demo.genre},${demo.price},'OCC 데모은행','000-0000-0000','OCC 공연팀',${demo.type},${demo.type==='FIRST_COME'?demo.capacity:null},4,NOW()+${demo.days-1}*INTERVAL '1 day',NOW()+${demo.days}*INTERVAL '1 day',NOW()+${demo.days}*INTERVAL '1 day'+INTERVAL '2 hours','SCHEDULED') ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,venue=EXCLUDED.venue,description=EXCLUDED.description,poster_image_url=EXCLUDED.poster_image_url,detail_image_url=EXCLUDED.detail_image_url,genre=EXCLUDED.genre,ticket_price=EXCLUDED.ticket_price,cancel_deadline_at=EXCLUDED.cancel_deadline_at,event_start_at=EXCLUDED.event_start_at,event_end_at=EXCLUDED.event_end_at,status='SCHEDULED' RETURNING id`;
 const eventId=String(rows[0].id);
 await sql`DELETE FROM feed_posts WHERE event_id=${eventId}`;
 await sql`INSERT INTO feed_posts(event_id,image_url,content,created_at) VALUES(${eventId},${`https://picsum.photos/seed/${demo.slug}-feed-1/1000/1000`},${demo.posts[0]},NOW()-INTERVAL '1 hour')`;
 await sql`INSERT INTO ticket_types(event_id,name) VALUES(${eventId},'일반'),(${eventId},'학생') ON CONFLICT(event_id,name) DO NOTHING`;
 if(demo.type==='SEAT_SELECTION'){const labels=Array.from({length:24},(_,i)=>`${String.fromCharCode(65+Math.floor(i/8))}${i%8+1}`);for(const label of labels)await sql`INSERT INTO seats(event_id,label) VALUES(${eventId},${label}) ON CONFLICT(event_id,label) DO UPDATE SET is_active=TRUE`;}
}
console.log(`Seeded ${demos.length} public demo events.`);
