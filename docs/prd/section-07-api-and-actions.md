# 07. API / 서버 액션 설계

## 1. 구현 원칙
- Next.js App Router + Server Actions 우선
- 복잡한 외부 API 게이트웨이보다 **서버 액션 + Neon DB 쿼리** 중심
- 클라이언트 상태는 최소화하고 서버를 기준으로 진실 소스를 유지

---

# 2. Organizer 인증 관련

## `signUpOrganizer`
### 입력
- email
- password
- name
- phone
- organizationName

### 처리
- organizer 생성
- 비밀번호 해시 저장
- 세션 생성 또는 로그인 페이지 이동

## `signInOrganizer`
### 입력
- email
- password

### 처리
- 인증 성공 시 대시보드 이동

---

# 3. Event 관련

## `createEvent`
### 입력
- 공연 기본 정보
- reservationType
- maxTicketsPerPerson
- cancelDeadlineAt
- ticketTypes[]
- seats[] (좌석 지정 공연인 경우)

### 처리
- event 생성
- ticket_types 생성
- seats 생성
- slug 생성

## `updateEvent`
- 공연 기본 정보 수정
- 상태 변경
- 취소 마감 시간 수정

## `listOrganizerEvents`
- 기획자의 공연 목록 조회

## `getEventDetail`
- 공연 상세 조회
- 기획자용 / 관객용 각각 사용 가능

---

# 4. Feed 관련

## `createFeedPost`
### 입력
- eventId
- image
- content

### 처리
- 이미지 업로드
- 게시글 생성

## `listHomeFeedPosts`
### 처리
- 여러 공연의 피드를 최신순으로 조회
- 공연 상태가 `비공개`, `취소`인 경우 노출 정책 검토 필요

## `listEventFeedPosts`
### 입력
- eventId

### 처리
- 해당 공연의 피드만 조회

---

# 5. Reservation 관련

## `createReservation`
### 입력
- eventId
- ticketTypeId
- seatId(optional)
- name
- phone
- depositorName
- lookupPassword
- quantity
- requestNote

### 처리
- 예매 가능 여부 검증
- 좌석/수량 가능 여부 검증
- 조회 패스워드 해시 저장
- reservation 생성
- 상태는 기본적으로 `입금 대기`
- 매진 상태라면 `대기 신청` 생성 흐름 고려

## `getReservationApprovalStatus`
### 입력
- name
- phone
- lookupPassword

### 처리
- 이름/연락처/조회 패스워드 검증
- 해당 사용자의 예약 중 승인 여부 확인
- 승인된 예약이 있으면 예매번호 노출

## `getReservationDetail`
### 입력
- name
- phone
- lookupPassword

### 처리
- 이름/연락처/조회 패스워드 검증
- 예약 상세 반환
- `qr_token` 기반 QR 이미지 또는 QR 이미지 생성 URL 반환
- 취소 가능 여부 계산

## `cancelReservation`
### 입력
- name
- phone
- lookupPassword

### 처리
- 이름/연락처/조회 패스워드 검증
- 취소 가능 시간 검증
- 예약 상태 변경
- 좌석/수량 복구

---

# 6. Organizer 운영 액션

## `approveReservationPayment`
### 입력
- reservationId

### 처리
- 상태를 `예매 확정`으로 변경
- reservation_code 생성
- qr_token 생성
- `python-qrcode` 기반 QR 생성 흐름에서 사용할 수 있도록 qr_token을 저장

## `convertWaitlistReservation`
### 입력
- reservationId

### 처리
- `대기 신청` 상태 예매를 일반 예매 흐름으로 전환
- 전환 정책은 구현 시 확정 필요

## `listEventReservations`
### 입력
- eventId
- filters(optional)

### 처리
- 공연 예매 목록 반환
- 상태 필터 / 검색 지원

---

# 7. Check-in 관련

## 클라이언트 스캐너
- `/dashboard/events/[id]/check-in` 화면에서 `@yudiel/react-qr-scanner` 사용
- `constraints.facingMode = 'environment'`로 후면 카메라 우선
- `allowMultiple = false` 또는 스캔 성공 직후 `paused = true` 처리
- 감지한 `rawValue`를 qrToken으로 보고 `checkInByQr` Server Action 호출

## `checkInByQr`
### 입력
- qrToken

### 처리
1. qrToken으로 예약 조회
2. 상태가 예매 확정인지 확인
3. 이미 입장 완료인지 확인
4. 문제 없으면 상태를 `입장 완료`로 변경

## `generateReservationQrImage`
### 입력
- reservationId 또는 qrToken

### 처리
- 예매 확정 상태인지 검증
- `qr_token`을 QR payload로 사용
- 서버 내부에서 클론된 `lincolnloop/python-qrcode` 코드를 호출해 PNG 또는 SVG 생성
- 생성된 이미지는 상세 조회 화면에 응답하거나, 외부 스토리지 사용 시 저장 후 URL 반환

---

# 8. 통계 조회 액션

## `getDashboardStats`
### 반환 예시
- 총 공연 수
- 예정/진행중/종료 공연 수
- 입금 대기 수
- 예매 확정 수
- 오늘 체크인 수
- 대기 신청 수

## `getEventStats`
### 반환 예시
- 총 예매 수
- 상태별 예매 수
- 좌석 점유 수
- 대기 신청 수
