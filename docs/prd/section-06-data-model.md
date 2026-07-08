# 06. 데이터 모델 / DB 설계

## 1. DB 선택
- **Supabase Postgres**

## 2. 모델 목록
- organizers
- events
- ticket_types
- seats
- reservations
- feed_posts

> 참고: `waitlist`는 별도 테이블로 분리할 수도 있지만, 현재 PRD 기준으로는 `reservations.status = '대기 신청'`으로도 표현 가능하다.  
> 단, 구현 시 복잡도가 올라가면 `waitlist_entries` 테이블로 분리하는 것을 권장한다.

---

# 3. organizers

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| email | text | 로그인 이메일 |
| password_hash | text | 비밀번호 해시 |
| name | text | 기획자 이름 |
| phone | text | 연락처 |
| organization_name | text | 단체명 / 팀명 |
| created_at | timestamptz | 생성일 |

---

# 4. events

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| organizer_id | uuid | organizers FK |
| title | text | 공연명 |
| slug | text | 공개 URL용 식별자 |
| venue | text | 장소 |
| description | text | 상세 설명 |
| poster_image_url | text | 포스터 이미지 |
| bank_account_info | text | 입금 계좌 |
| reservation_type | text | `FIRST_COME` / `SEAT_SELECTION` |
| max_tickets_per_person | int | 1인 최대 예매 매수 |
| cancel_deadline_at | timestamptz | 취소 마감 시간 |
| event_start_at | timestamptz | 공연 시작 시간 |
| event_end_at | timestamptz nullable | 공연 종료 시간(선택) |
| status | text | 예정 / 진행 중 / 종료 / 비공개 / 취소 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

---

# 5. ticket_types

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | events FK |
| name | text | 일반 / 학생 / VIP |
| price | int | 가격 |
| created_at | timestamptz | 생성일 |

### 제약
- 티켓 타입별 수량 필드는 두지 않는다.

---

# 6. seats

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | events FK |
| label | text | 좌석명 예: A1 |
| is_active | boolean | 사용 여부 |
| created_at | timestamptz | 생성일 |

### 제약
- `(event_id, label)` 유니크 권장

---

# 7. reservations

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | events FK |
| ticket_type_id | uuid nullable | ticket_types FK |
| seat_id | uuid nullable | seats FK (좌석 지정 공연일 때만) |
| reserver_name | text | 예매자 이름 |
| reserver_phone | text | 연락처 |
| depositor_name | text | 입금자명 |
| quantity | int | 예매 매수 |
| request_note | text nullable | 요청사항 |
| status | text | 입금 대기 / 예매 확정 / 취소 / 입장 완료 / 대기 신청 |
| reservation_code | text nullable | 입금 승인 후 발급되는 예매번호 |
| qr_token | text nullable | 입금 승인 후 발급되는 QR 식별값 |
| checked_in_at | timestamptz nullable | 체크인 시각 |
| created_at | timestamptz | 신청 시각 |
| updated_at | timestamptz | 수정일 |

### 핵심 정책
- `reservation_code`는 **입금 승인 후에만 생성**
- `qr_token`도 **입금 승인 후에만 생성**
- `checked_in_at`이 있으면 상태는 사실상 `입장 완료`

---

# 8. feed_posts

| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | events FK |
| image_url | text | 이미지 |
| content | text | 본문 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

---

# 9. 상태값 Enum 제안

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

# 10. Supabase Storage 버킷 제안
- `event-posters`
- `feed-images`
- `qr-assets` (선택)

---

# 11. 인덱스 / 제약 권장사항
- `events.slug` unique
- `reservations.reservation_code` unique
- `reservations.qr_token` unique
- `reservations(event_id, reserver_phone)`
- `feed_posts(event_id, created_at desc)`
