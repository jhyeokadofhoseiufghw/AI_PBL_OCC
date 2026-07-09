# 09. 기술 스택 / 구현 가이드

## 1. 권장 기술 스택

### 프론트엔드
- **Next.js (App Router)**
- TypeScript
- Tailwind CSS
- shadcn/ui (선택)

### 백엔드 / DB
- **Neon DB (최종 선택)**
  - Serverless Postgres
  - 서버 전용 `DATABASE_URL` 기반 연결
- **인증**
  - MVP에서는 Organizer 이메일/비밀번호 기반 커스텀 인증
  - 비밀번호/조회 패스워드는 해시 저장
- **이미지 저장**
  - Neon DB에는 파일을 저장하지 않고 이미지 URL만 저장
  - 실제 파일 업로드가 필요하면 Vercel Blob, Cloudinary, S3 같은 외부 스토리지 사용

### QR
- QR 생성:
  - `lincolnloop/python-qrcode` GitHub 저장소를 클론해 사용
  - 권장 위치: `vendor/python-qrcode`
  - 서버 내부 Python wrapper 또는 CLI 호출 방식으로 QR 이미지 생성
- 체크인 스캐너:
  - `@yudiel/react-qr-scanner` (최종 선택)
  - 선택 이유: Next.js/React 컴포넌트로 직접 사용 가능, 휴대폰 후면 카메라 제약 설정 가능, 스캔 일시 정지/재개와 카메라 선택 UX 구현이 쉬움

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
    db/
    auth/
    utils/
scripts/
  qr/
    generate_qr.py
vendor/
  python-qrcode/
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

## 3. Neon DB 사용 가이드

### 연결 방식
- 서버 코드에서만 `DATABASE_URL`을 사용한다.
- 브라우저에 DB 연결 문자열을 노출하지 않는다.
- Server Actions 또는 서버 전용 repository/helper 함수에서만 쿼리를 실행한다.

### 파일 저장
- `event-posters`, `feed-images` 같은 파일은 Neon DB에 직접 저장하지 않는다.
- MVP에서는 이미지 URL 입력 방식으로 시작할 수 있다.
- 업로드 기능이 필요해지면 별도 스토리지 서비스를 붙인다.
- QR 이미지는 `qr_token`을 기반으로 서버에서 동적으로 생성한다.
- 생성된 QR 파일을 보관해야 할 경우에도 DB에는 파일이 아니라 URL만 저장한다.

### DB 테이블
- organizers
- events
- ticket_types
- seats
- reservations
- feed_posts

---

## 4. AI 바이브 코딩 운영 방식

## QR 생성 구현 메모
- `vendor/python-qrcode`에 `https://github.com/lincolnloop/python-qrcode`를 클론한다.
- Python 실행 환경에는 `qrcode[pil]` 또는 클론 저장소의 의존성을 설치한다.
- 서버에서는 `scripts/qr/generate_qr.py` wrapper를 통해 로컬 클론 코드를 호출한다.
- Next.js Server Action은 직접 브라우저에서 QR 생성기를 호출하지 않는다.
- 서버 전용 함수가 `qr_token`을 Python wrapper에 전달하고 PNG/SVG 결과를 받아 상세 조회 화면에 제공한다.
- QR payload에는 개인정보를 넣지 않고, 추측 불가능한 `qr_token`만 넣는다.
- Python QR 생성 실패 시 상세 조회 화면은 QR 대신 재시도 가능한 오류 상태를 보여준다.

## QR 체크인 스캐너 구현 메모
- 설치 대상 패키지: `@yudiel/react-qr-scanner`
- 체크인 화면은 클라이언트 컴포넌트로 구현한다.
- `@yudiel/react-qr-scanner`의 `Scanner` 컴포넌트를 사용한다.
- 기본 constraints:
  - `facingMode: 'environment'`
  - `aspectRatio: 1`
- `formats`는 QR 코드만 대상으로 제한한다.
- 스캔 성공 시 첫 번째 감지 결과의 `rawValue`를 `qrToken`으로 사용한다.
- Server Action 호출 중에는 `paused = true`로 중복 스캔을 막는다.
- 성공/실패 결과를 받은 뒤 운영자가 다음 관객을 받을 수 있도록 재개 버튼을 제공한다.
- 카메라 권한 거부, 지원하지 않는 브라우저, HTTPS가 아닌 환경에 대한 오류 상태를 제공한다.

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
- Python QR 생성기 연동
- `@yudiel/react-qr-scanner` 기반 휴대폰 카메라 체크인

---

## 5. 구현 우선순위

### P0
- Organizer 인증
- 공연 생성
- 공연 목록
- 예매 생성
- 입금 승인
- 예매번호/QR 발급
- `python-qrcode` 기반 QR 이미지 생성
- 상세 조회
- `@yudiel/react-qr-scanner` 기반 체크인

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
4일 MVP 기준에서는 다음 정도가 적절하다.
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
