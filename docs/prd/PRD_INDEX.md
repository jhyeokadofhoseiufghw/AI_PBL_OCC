# README.md

# 소규모 공연 피드형 예매 및 운영 관리 플랫폼 PRD 인덱스

> **프로젝트명(가칭)**: 소규모 공연을 위한 피드형 예매 및 운영 관리 플랫폼  
> **문서 목적**: Antigravity 프로젝트 폴더에 넣고, AI가 전체 PRD 문맥을 빠르게 탐색/참조할 수 있도록 만든 **색인형 README**  
> **기준 스택**: Next.js(App Router) + Neon DB + Gemini CLI + Antigravity  
> **문서 범위**: 4일 MVP 기준 PRD 초안

---

# 1. 이 README의 역할

이 README는 단순 소개 문서가 아니라, **Antigravity / Gemini CLI가 PRD 문서를 탐색하기 위한 인덱스 허브**다.  
따라서 아래 목적을 충족하도록 작성한다.

1. **세부 PRD md 파일의 위치를 한 번에 찾을 수 있어야 한다.**
2. **각 문서가 무엇을 담고 있는지 요약을 보고 바로 판단할 수 있어야 한다.**
3. **어떤 문서를 먼저 읽어야 하는지 우선순위를 파악할 수 있어야 한다.**
4. **AI가 “어떤 질문에 대한 답이 어느 문서에 있는지” 빠르게 찾을 수 있어야 한다.**

---

# 2. 프로젝트 한 줄 정의

**소규모 공연 기획자가 여러 공연을 생성하고, 공연 홍보 피드를 운영하며, 비회원 예매 / 입금 승인 / 대기열 / QR 입장까지 한 곳에서 관리할 수 있는 운영 중심 공연 예매 플랫폼**

---

# 3. 문서 사용 규칙 (Antigravity / AI 컨텍스트용)

이 폴더를 읽는 AI는 아래 순서로 문서를 해석한다.

## 3-1. 우선 읽을 문서

1. `section-01-overview.md`
2. `section-02-users-and-roles.md`
3. `section-04-feature-requirements.md`
4. `section-06-data-model.md`
5. `section-10-mvp-scope-and-roadmap.md`

## 3-2. 세부 구현이 필요할 때 추가로 읽을 문서

- 화면/라우팅 구조가 필요하면 → `section-05-dashboard-and-pages.md`
- 서버 액션 / API 단위가 필요하면 → `section-07-api-and-actions.md`
- 인증 / 보안 정책이 필요하면 → `section-08-auth-and-security.md`
- 실제 기술 구현 방향이 필요하면 → `section-09-tech-stack-and-implementation.md`
- 미정 정책 / 예외 처리가 필요하면 → `section-11-open-questions.md`

## 3-3. 이 README를 읽는 AI가 알아야 할 전제

- 이 프로젝트의 **Primary User는 기획자(Organizer)** 다.
- 관객(Audience)은 **비회원 예매 사용자**다.
- 핵심 목표는 **기획자의 예매/운영 관리 시간 절감**이다.
- 피드는 단순 부가 기능이 아니라 **공연 발견 → 예매 유입 구조**다.
- PRD는 **4일 MVP** 기준이며, 자동화보다 **명확한 수동 운영 플로우**를 우선한다.

---

# 4. PRD 인덱스 테이블

아래 표는 **Antigravity가 읽기 쉬운 색인 표**를 목표로 작성했다.  
각 문서는 다음 4가지 관점으로 요약된다.

- **문서명**: 실제 md 파일명
- **주제**: 문서가 다루는 핵심 영역
- **핵심 질문**: 이 문서를 읽으면 답할 수 있는 질문
- **요약**: 문서 핵심 내용 2~4줄 요약

---

## PRD 문서 인덱스

| No. | 파일명                                                                                       | 주제                               | 핵심 질문                                                      | 요약                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [section-01-overview.md](./section-01-overview.md)                                           | 프로젝트 개요 / 문제 정의          | **“왜 이 제품을 만드는가?”**                                   | 소규모 공연 운영에서 발생하는 수동 예매 관리 문제, 좌석/입금/대기열 운영의 비효율, 홍보와 예매가 분리된 문제를 정의한다. 제품의 Primary Goal / Secondary Goal과 MVP 원칙을 설명한다.                                                          |
| 2   | [section-02-users-and-roles.md](./section-02-users-and-roles.md)                             | 사용자 / 역할 / 상태값 / 용어 사전 | **“누가 무엇을 할 수 있고, 상태값은 어떻게 정의되는가?”**      | Organizer / Audience / System 역할을 명확히 정의한다. 공연 상태(Event Status), 예매 상태(Reservation Status), 비회원 조회 구조, Ticket Type / Seat / Reservation 같은 핵심 용어를 정리한다.                                                   |
| 3   | [section-03-user-flows.md](./section-03-user-flows.md)                                       | 핵심 사용자 플로우                 | **“사용자는 실제로 어떤 순서로 이 서비스를 사용하는가?”**      | 기획자 회원가입 → 공연 생성 → 피드 작성 → 입금 승인 → 체크인까지의 흐름과, 관객의 홈 피드 탐색 → 공연 상세 → 비회원 예매 → 승인 확인 → QR 조회 → 입장까지의 흐름을 단계별로 정리한다.                                                         |
| 4   | [section-04-feature-requirements.md](./section-04-feature-requirements.md)                   | 기능 요구사항 본문                 | **“MVP에서 어떤 기능을 반드시 구현해야 하는가?”**              | 기획자 인증/대시보드, 공연 생성/관리, 피드형 홍보, 비회원 예매/조회/취소, 입금 승인/대기열, QR 체크인까지 MVP 핵심 기능을 기능 단위로 정의한다. PRD의 중심 문서다.                                                                            |
| 5   | [section-05-dashboard-and-pages.md](./section-05-dashboard-and-pages.md)                     | 화면 구조 / 라우팅 / 대시보드      | **“어떤 페이지가 필요하고, 화면은 어떻게 나뉘는가?”**          | Next.js App Router 기준 라우트 구조를 제안하고, 홈 피드 / 공연 상세 / 예매 페이지 / 승인 확인 / 상세 조회 / 대시보드 / 공연 운영 탭 구조를 정리한다. 기획자 화면 우선순위도 설명한다.                                                         |
| 6   | [section-06-data-model.md](./section-06-data-model.md)                                       | 데이터 모델 / DB 설계              | **“데이터를 어떤 테이블과 필드로 저장하는가?”**                | organizers / events / ticket_types / seats / reservations / reservation_seats / feed_posts 중심의 DB 스키마 초안을 제시한다. 단일 티켓 가격, 복수 좌석 점유, 수용 인원, reservation_code/qr_token 정책 등 구현에 직접 연결되는 내용을 담는다. |
| 7   | [section-07-api-and-actions.md](./section-07-api-and-actions.md)                             | API / Server Actions 설계          | **“어떤 서버 액션이 필요하고, 각 액션은 무엇을 처리하는가?”**  | Organizer 인증, Event 생성/수정, Feed 작성, Reservation 생성/조회/취소, 입금 승인, 대기자 전환, QR 체크인, 통계 조회까지의 서버 액션 단위를 정리한다. 구현 작업 분해에 유용하다.                                                              |
| 8   | [section-08-auth-and-security.md](./section-08-auth-and-security.md)                         | 인증 / 권한 / 보안                 | **“누가 어떤 데이터에 접근할 수 있고, 어떤 검증이 필요한가?”** | Organizer 이메일 로그인, Audience 비회원 예매, 예약 조회 조건(공연 식별자+이름+연락처+조회 패스워드), QR 체크인 보안, 데이터 접근 제어, rate limit 등 MVP 수준의 인증/보안 정책을 정의한다.                                                   |
| 9   | [section-09-tech-stack-and-implementation.md](./section-09-tech-stack-and-implementation.md) | 기술 스택 / 구현 가이드            | **“이 PRD를 실제로 어떤 방식으로 구현할 것인가?”**             | Next.js + Neon DB + `python-qrcode` + `@yudiel/react-qr-scanner` 조합을 전제로, 기능별 구현 우선순위, 도메인 단위 폴더 구조, Server Actions 중심 개발 방식, 4일 MVP에 맞는 좌석/체크인 구현 전략을 제안한다.                                  |
| 10  | [section-10-mvp-scope-and-roadmap.md](./section-10-mvp-scope-and-roadmap.md)                 | MVP 범위 / 일정 / 우선순위         | **“4일 안에 어디까지 만들고, 무엇을 버릴 것인가?”**            | 핵심 기능 3개를 중심으로 MVP 포함 범위 / 제외 범위를 명확히 구분하고, Day 1~4 기준 개발 로드맵을 제시한다. 범위 통제와 일정 판단의 기준 문서다.                                                                                               |
| 11  | [section-11-open-questions.md](./section-11-open-questions.md)                               | 미정 항목 / 추후 확장              | **“아직 확정되지 않은 정책과 추후 확장 포인트는 무엇인가?”**   | 대기열 상세 UX, 취소 후 환불 안내, 피드 정렬 기준, 공연 상태 자동 전환 세부 기준 등 아직 확정되지 않은 항목을 정리한다. 구현 전 최종 의사결정이 필요한 지점을 모아둔 문서다.                                                                  |

---

# 5. 문서별 추천 사용 시나리오

## 시나리오 A — “서비스를 3분 안에 이해하고 싶다”

읽을 순서:

1. `section-01-overview.md`
2. `section-02-users-and-roles.md`
3. `section-03-user-flows.md`
4. `section-10-mvp-scope-and-roadmap.md`

## 시나리오 B — “바로 개발에 들어가고 싶다”

읽을 순서:

1. `section-04-feature-requirements.md`
2. `section-06-data-model.md`
3. `section-07-api-and-actions.md`
4. `section-08-auth-and-security.md`
5. `section-09-tech-stack-and-implementation.md`

## 시나리오 C — “페이지 구조/디자인/IA를 잡고 싶다”

읽을 순서:

1. `section-03-user-flows.md`
2. `section-05-dashboard-and-pages.md`
3. `section-04-feature-requirements.md`
4. [`../design/README.md`](../design/README.md)

## 시나리오 D — “아직 결정 안 된 항목만 모아서 보고 싶다”

읽을 문서:

- `section-11-open-questions.md`

---

# 6. 현재 PRD에서 가장 중요한 결정사항 요약

## 제품 방향

- 이 서비스는 **관객 중심 티켓 플랫폼**이 아니라 **기획자 운영 중심 플랫폼**이다.

## 예매 구조

- 관객은 **비회원 예매**
- 입금은 **기획자 수동 승인**
- **입금 승인 후에만 예매번호/QR 발급**

## 피드 구조

- **메인 홈 통합 피드**
- 공연별 대표 피드 1개(직접 작성 또는 AI 문구 선택)
- 공연 상세 페이지에는 피드 미노출
- 피드는 공연 발견과 홍보 유입을 위한 핵심 기능

## 운영 구조

- 기획자는 여러 공연을 만들 수 있다.
- 공연별로 단일 티켓 가격/좌석/티켓 타입/예매/대기열/체크인을 관리한다.
- 공연 상세 운영 화면의 핵심은 **예매자 목록 테이블**이다.

## 상태 구조

- 공연 상태: 예정 / 진행 중 / 종료 / 비공개 / 취소
- 예매 상태: 입금 대기 / 예매 확정 / 취소 / 입장 완료 / 대기 신청

---

# 7. Antigravity용 빠른 탐색 키워드

AI가 특정 질문에 대한 문서를 빠르게 찾을 수 있도록 키워드를 남긴다.

| 찾고 싶은 내용                 | 먼저 볼 문서                                                     |
| ------------------------------ | ---------------------------------------------------------------- |
| 제품 목표 / 문제 정의          | `section-01-overview.md`                                         |
| Organizer / Audience 역할 정의 | `section-02-users-and-roles.md`                                  |
| 공연 상태 / 예매 상태 enum     | `section-02-users-and-roles.md`, `section-06-data-model.md`      |
| 관객 예매 플로우               | `section-03-user-flows.md`, `section-04-feature-requirements.md` |
| 기획자 대시보드 구조           | `section-05-dashboard-and-pages.md`                              |
| 공연 생성 필드 / 예매 필드     | `section-04-feature-requirements.md`                             |
| DB 테이블 / 컬럼 설계          | `section-06-data-model.md`                                       |
| 서버 액션 / API 단위           | `section-07-api-and-actions.md`                                  |
| 인증 / 조회 보안 정책          | `section-08-auth-and-security.md`                                |
| 기술 스택 / 구현 전략          | `section-09-tech-stack-and-implementation.md`                    |
| MVP 포함/제외 범위             | `section-10-mvp-scope-and-roadmap.md`                            |
| 아직 미정인 정책               | `section-11-open-questions.md`                                   |

---

# 8. 이 README를 갱신해야 하는 시점

아래 중 하나가 바뀌면 README의 인덱스/요약도 같이 갱신해야 한다.

1. 세부 md 파일이 추가되거나 삭제될 때
2. 각 문서의 역할이 바뀔 때
3. 핵심 정책(예: 예매 상태, 피드 구조, 인증 정책)이 바뀔 때
4. MVP 범위가 달라질 때

---

# 9. 최종 메모

이 PRD 세트는 **“소규모 공연 운영자가 실제로 쓸 수 있는 MVP를 4일 안에 구현하기 위한 문서”** 다.  
따라서 이 README는 단순 소개보다 **빠른 탐색성 / 문맥 복원성 / 구현 연결성**을 우선한다.

즉, 새로운 대화창이나 새로운 AI 세션에서 이 폴더를 읽을 때는:

1. 이 README로 전체 구조를 파악하고
2. 필요한 질문에 맞는 세부 md 파일로 이동하고
3. 세부 문서를 읽어 구현/기획 판단을 이어가면 된다.
