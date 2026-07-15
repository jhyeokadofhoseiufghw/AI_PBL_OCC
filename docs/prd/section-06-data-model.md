# 06. 데이터 모델 / DB 설계

## 1. DB 선택

- **Neon DB (serverless Postgres)**

### 선택 이유

- MVP에서 필요한 데이터는 관계형 테이블과 트랜잭션 중심이다.
- Neon은 PostgreSQL 호환 DB이므로 기존 테이블/enum/인덱스 설계를 그대로 활용할 수 있다.
- Next.js Server Actions에서 서버 전용 `DATABASE_URL`로 직접 접근한다.
- 인증, 파일 저장, 데이터 접근 제어는 Neon DB 외부의 애플리케이션 계층에서 처리한다.

## 2. 모델 목록

- organizers
- events
- ticket_types
- seats
- reservations
- reservation_seats
- feed_posts

> 참고: `waitlist`는 별도 테이블로 분리할 수도 있지만, 현재 PRD 기준으로는 `reservations.status = '대기 신청'`으로도 표현 가능하다.  
> 단, 구현 시 복잡도가 올라가면 `waitlist_entries` 테이블로 분리하는 것을 권장한다.

---

# 3. organizers

| 필드              | 타입        | 설명          |
| ----------------- | ----------- | ------------- |
| id                | uuid        | PK            |
| email             | text        | 로그인 이메일 |
| password_hash     | text        | 비밀번호 해시 |
| name              | text        | 기획자 이름   |
| phone             | text        | 연락처        |
| organization_name | text        | 단체명 / 팀명 |
| created_at        | timestamptz | 생성일        |

---

# 4. events

| 필드                   | 타입                 | 설명                                            |
| ---------------------- | -------------------- | ----------------------------------------------- |
| id                     | uuid                 | PK                                              |
| organizer_id           | uuid                 | organizers FK                                   |
| title                  | text                 | 공연명                                          |
| slug                   | text                 | 공개 URL용 식별자                               |
| venue                  | text                 | 장소                                            |
| description            | text                 | 상세 설명                                       |
| poster_image_url       | text                 | 포스터 이미지                                   |
| detail_image_url       | text nullable        | 상세 설명 대표 이미지(포스터와 분리)            |
| runtime_minutes        | int nullable         | 러닝타임(분)                                    |
| genre                  | text nullable        | 홈 장르 탐색용 분류                             |
| ticket_price           | int                  | 티켓 타입이 없을 때 적용되는 공연 기본 가격     |
| bank_name              | text                 | 입금 은행명                                     |
| account_number         | text                 | 입금 계좌번호                                   |
| account_holder         | text                 | 예금주명                                        |
| inquiry_contact        | text nullable        | 환불 절차 및 공연 문의 연락처/오픈채팅 링크     |
| reservation_type       | text                 | `FIRST_COME` / `SEAT_SELECTION`                 |
| total_capacity         | int nullable         | 선착순 공연 총 수용 인원(좌석 지정 공연은 null) |
| max_tickets_per_person | int                  | 1인 최대 예매 매수                              |
| cancel_deadline_at     | timestamptz          | 취소 마감 시간                                  |
| event_start_at         | timestamptz          | 공연 시작 시간                                  |
| event_end_at           | timestamptz nullable | 공연 종료 시간(선택)                            |
| status                 | text                 | 예정 / 진행 중 / 종료 / 비공개 / 취소           |
| published_at           | timestamptz nullable | 최초 공개 시각, 좌석 배치 잠금 기준             |
| created_at             | timestamptz          | 생성일                                          |
| updated_at             | timestamptz          | 수정일                                          |

---

# 5. ticket_types

| 필드       | 타입        | 설명             |
| ---------- | ----------- | ---------------- |
| id         | uuid        | PK               |
| event_id   | uuid        | events FK        |
| name       | text        | 일반 / 학생 등   |
| price      | int         | 티켓 타입별 가격 |
| created_at | timestamptz | 생성일           |

### 제약

- 티켓 타입별 수량 필드는 두지 않는다.
- 가격은 0 이상의 정수이며 예매 생성 시점에 `reservations.unit_price`로 복사한다.
- 공연에 티켓 타입을 설정하지 않을 수 있다. 이 경우 예매의 `ticket_type_id`는 null이다.

---

# 6. seats

| 필드          | 타입         | 설명                  |
| ------------- | ------------ | --------------------- |
| id            | uuid         | PK                    |
| event_id      | uuid         | events FK             |
| label         | text         | 좌석명 예: A1         |
| layout_row    | int nullable | 좌석 배치도의 행 위치 |
| layout_column | int nullable | 좌석 배치도의 열 위치 |
| is_active     | boolean      | 사용 여부             |
| created_at    | timestamptz  | 생성일                |

### 제약

- `(event_id, label)` 유니크 권장
- 최초 생성 배치도의 행·열 위치를 관객 좌석 선택 화면에서도 유지한다.
- 모든 좌석은 `events.ticket_price`의 동일한 단가를 사용한다.

---

# 7. reservations

| 필드                 | 타입                 | 설명                                                 |
| -------------------- | -------------------- | ---------------------------------------------------- |
| id                   | uuid                 | PK                                                   |
| event_id             | uuid                 | events FK                                            |
| ticket_type_id       | uuid nullable        | ticket_types FK                                      |
| reserver_name        | text                 | 예매자 이름                                          |
| reserver_phone       | text                 | 연락처                                               |
| depositor_name       | text                 | 입금자명                                             |
| lookup_password_hash | text                 | 관객 승인 여부 확인/상세 조회/취소용 패스워드 해시   |
| quantity             | int                  | 예매 매수                                            |
| unit_price           | int                  | 예매 생성 시점의 1매 단가                            |
| total_price          | int                  | 예매 생성 시점의 총액                                |
| request_note         | text nullable        | 요청사항                                             |
| status               | text                 | 입금 대기 / 예매 확정 / 취소 / 입장 완료 / 대기 신청 |
| reservation_code     | text nullable        | 입금 승인 후 발급되는 예매번호                       |
| qr_token             | text nullable        | 입금 승인 후 발급되는 QR 식별값                      |
| checked_in_at        | timestamptz nullable | QR 체크인 완료 시각                                  |
| created_at           | timestamptz          | 신청 시각                                            |
| updated_at           | timestamptz          | 수정일                                               |

### 핵심 정책

- `lookup_password_hash`는 예매 신청 시 생성하며 원문 패스워드는 저장하지 않음
- 선착순 공연은 `quantity`로 수량을 저장하고 좌석 연결을 만들지 않음
- 좌석 지정 공연은 `quantity`와 `reservation_seats` 연결 개수가 일치해야 함
- 티켓 타입이 있으면 `ticket_types.price`, 없으면 `events.ticket_price`를 `unit_price`로 저장
- `total_price = unit_price * quantity`로 저장
- DB 제약으로 `total_price`는 `unit_price * quantity`와 일치해야 한다.
- 예매 이후 가격 설정이 변경되어도 `unit_price`, `total_price`는 변경하지 않음
- `reservation_code`는 **입금 승인 후에만 생성**
- `qr_token`도 **입금 승인 후에만 생성**
- 체크인 성공 시 `status = 입장 완료`와 `checked_in_at = now()`를 같은 트랜잭션에서 기록
- 중복 체크인 시 기존 `checked_in_at`을 덮어쓰지 않음
- DB 제약으로 `status = CHECKED_IN`인 예약은 `checked_in_at`을 반드시 가져야 하며, 그 외 상태는 `checked_in_at`을 비워 둔다.

---

# 8. reservation_seats

| 필드           | 타입                 | 설명                           |
| -------------- | -------------------- | ------------------------------ |
| reservation_id | uuid                 | reservations FK                |
| seat_id        | uuid                 | seats FK                       |
| created_at     | timestamptz          | 생성일                         |
| released_at    | timestamptz nullable | 취소로 좌석 점유를 해제한 시각 |

### 제약

- `(reservation_id, seat_id)` 복합 PK
- `released_at IS NULL`인 행에 대해 `seat_id` partial unique를 적용해 한 좌석의 동시 중복 점유를 막음
- 예약 생성 트랜잭션에서 좌석을 잠가 동시 요청의 중복 점유 방지
- 취소 시 `released_at`을 기록해 좌석을 복구하고 과거 선택 좌석 이력도 보존

---

# 9. reservation_tickets

| 필드                 | 타입                 | 설명                         |
| -------------------- | -------------------- | ---------------------------- |
| id                   | uuid                 | PK                           |
| reservation_id       | uuid                 | reservations FK              |
| seat_id              | uuid nullable        | 좌석 지정 예매의 seats FK    |
| ticket_number        | int                  | 예매 내 티켓 순번            |
| qr_token             | text unique          | 티켓별 추측 불가능한 QR 토큰 |
| qr_image_data        | text nullable        | 생성된 QR 이미지 데이터      |
| qr_generation_status | text                 | PENDING / READY / FAILED     |
| checked_in_at        | timestamptz nullable | 해당 티켓 입장 시각          |

### 핵심 정책

- 확정된 예약은 `quantity`와 동일한 수의 티켓을 가진다.
- 좌석 지정 예약은 예약 좌석과 티켓을 1:1로 연결한다.
- 티켓별 QR과 체크인 상태는 독립적이며, 모든 티켓이 체크인되면 예약 전체를 입장 완료로 변경한다.
- 일부 티켓이 입장한 예약은 승인 취소할 수 없다.

---

# 10. feed_posts

| 필드       | 타입        | 설명      |
| ---------- | ----------- | --------- |
| id         | uuid        | PK        |
| event_id   | uuid        | events FK |
| image_url  | text        | 이미지    |
| content    | text        | 본문      |
| created_at | timestamptz | 생성일    |
| updated_at | timestamptz | 수정일    |

### 정책

- `event_id`별 피드 게시글은 1개만 허용하며 `feed_posts(event_id)` 유니크 인덱스로 강제한다.
- 공연 상세 설명과 피드 본문은 서로 복제하지 않고 독립적으로 관리한다.
- 공연 공개만으로 피드 게시글을 자동 생성하지 않는다.
- 피드 게시글은 홈 통합 피드 전용이며 공연 상세 페이지에서는 조회하지 않는다.

---

# 10. 상태값 Enum 제안

## event_status

- SCHEDULED
- IN_PROGRESS
- COMPLETED
- HIDDEN
- CANCELLED

## reservation_status

- PENDING_PAYMENT
- CONFIRMED
- CANCELLED
- CHECKED_IN
- WAITLISTED

> UI/기획 문서에서는 한글 상태명을 사용하고, DB/코드에서는 위 영문 enum을 사용할 것을 권장한다.

---

# 11. 파일 / 이미지 저장 정책

- Neon DB에는 이미지 파일 자체를 저장하지 않는다.
- 공연 포스터와 피드 이미지는 외부 이미지 저장소 또는 공개 이미지 URL을 사용한다.
- DB에는 `poster_image_url`, `feed_posts.image_url`처럼 URL 문자열만 저장한다.
- QR은 별도 이미지 파일로 DB에 저장하지 않는다.
- QR 이미지는 `qr_token`을 기반으로 서버에서 `python-qrcode` 생성기를 통해 동적으로 생성하거나, 필요 시 외부 스토리지에 저장한 URL만 DB에 저장한다.

---

# 12. 인덱스 / 제약 권장사항

- `events.slug` unique
- `events(genre, event_start_at)`
- `ticket_types(event_id, name)` unique
- `seats(event_id, label)` unique
- `reservation_seats(reservation_id, seat_id)` primary key
- `reservation_seats(seat_id) WHERE released_at IS NULL` unique
- `reservations.reservation_code` unique
- `reservations.qr_token` unique
- `reservations(event_id, reserver_phone)`
- `reservations(event_id, status)`
- `reservations(event_id, checked_in_at desc)`
- `feed_posts(event_id, created_at desc)`
