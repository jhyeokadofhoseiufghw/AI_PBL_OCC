# 09. 기술 스택 / 구현 가이드

## 1. 권장 기술 스택

### 프론트엔드
- **Next.js (App Router)**
- TypeScript
- Tailwind CSS
- shadcn/ui (선택)

### 백엔드 / DB
- **Supabase**
  - Postgres
  - Storage
  - Auth 또는 커스텀 인증 보조

### QR
- QR 생성 라이브러리
- 체크인 스캐너:
  - `html5-qrcode` 또는 `@yudiel/react-qr-scanner`

---

## 2. 구현 전략

## 원칙 1. Server Actions 우선
폼 제출 / 승인 / 취소 / 체크인 같은 핵심 액션은 Server Action으로 처리한다.

## 원칙 2. 페이지보다 도메인 우선
아래 단위로 코드를 나누는 것을 권장한다.

```txt
src/
  app/
  features/
    auth/
    events/
    reservations/
    feeds/
    checkin/
  lib/
    supabase/
    auth/
    utils/
```

## 원칙 3. UI보다 운영 흐름 우선
예쁜 애니메이션보다 아래 흐름이 먼저 완성되어야 한다.
- 공연 생성
- 예매 신청
- 입금 승인
- 예매번호/QR 발급
- 상세 조회
- QR 체크인

---

## 3. Supabase 사용 가이드

### Storage 버킷
- `event-posters`
- `feed-images`

### DB 테이블
- organizers
- events
- ticket_types
- seats
- reservations
- feed_posts

---

## 4. AI 바이브 코딩 운영 방식

## Gemini CLI / Antigravity 사용 시 작업 단위 추천
### Step 1. 인증
- Organizer 회원가입 / 로그인
- 보호 라우트

### Step 2. 공연 생성
- 이벤트 생성 폼
- 티켓 타입 / 좌석 생성

### Step 3. 피드
- 게시글 작성 / 홈 피드 / 공연 상세 피드

### Step 4. 예매
- 선착순 / 좌석 지정 예매
- 승인 여부 확인 / 상세 조회

### Step 5. 운영
- 입금 승인 / 대기열 / 체크인

---

## 5. 구현 우선순위

### P0
- Organizer 인증
- 공연 생성
- 공연 목록
- 예매 생성
- 입금 승인
- 예매번호/QR 발급
- 상세 조회
- 체크인

### P1
- 홈 피드
- 공연 상세 피드
- 대시보드 통계
- 대기열 전환

### P2
- UI polish
- 검색/필터 강화
- 운영 편의 개선

---

## 6. 좌석 지정 UI 구현 메모
7일 MVP 기준에서는 다음 정도가 적절하다.
- 좌석을 카드/버튼 그리드로 렌더링
- 선택 가능한 좌석 / 이미 점유된 좌석 구분
- 복잡한 공연장 맵 에디터는 제외

---

## 7. 테스트 포인트
- 같은 좌석 중복 예약 방지
- 취소 시 좌석 복구
- 입금 승인 전 QR 접근 불가
- 입장 완료 후 QR 재사용 방지
- 취소 마감 시간 이후 취소 불가
