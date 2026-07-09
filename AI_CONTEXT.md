# AI PBL: OCC(One-click Check-in) Project AI Context

이 파일은 ChatGPT Codex, Claude, Cursor 등 AI 코딩 어시스턴트가 프로젝트의 구조와 기획 요구사항을 즉시 파악하고 구현을 시작할 수 있도록 요약된 개발 지침서입니다.

---

## 1. 프로젝트 개요 (Overview)
- **명칭**: 소규모 공연을 위한 피드형 예매 및 운영 관리 플랫폼 (OCC)
- **목적**: 동아리, 소규모 밴드 등의 공연 기획자가 겪는 수동 입금 확인, 좌석 매핑, QR 입장 관리 등의 번거로움을 자동화하여 운영 비용을 단축하고, 피드(Feed) 서비스를 통해 관객의 흥미 유발 및 예매 전환을 돕습니다.
- **주요 대상**: 
  - **기획자 (Organizer)**: 회원 가입 가능, 공연 생성, 티켓/좌석 배치, 입금 확인/승인, QR 체크인 스캔, 대시보드 통계 조회.
  - **관객 (Audience)**: 비회원 예매, 예약 확인(이름+연락처+조회 패스워드), QR 티켓 제시, 예매 취소.

---

## 2. 요구사항 및 기획 링크 (PRD Documents)
기획에 관한 모든 마크다운 문서는 [docs/prd](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd)에 있습니다. 특정 도메인을 수정하거나 기획 규칙을 확인할 때 아래 문서를 반드시 먼저 참고하십시오.

1. **[전체 요약 및 인덱스](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/PRD_INDEX.md)**: 전체 요구사항의 색인 및 탐색 규칙.
2. **[개요 및 배경](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-01-overview.md)**: 프로젝트 핵심 목표 및 대상 정의.
3. **[사용자 및 역할](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-02-users-and-roles.md)**: 역할 및 상태 전이 정의.
4. **[사용자 시나리오/플로우](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-03-user-flows.md)**: 기획자 및 비회원 예매자 흐름.
5. **[기능 요구사항](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-04-feature-requirements.md)**: 구현해야 하는 구체적 피처 명세.
6. **[라우팅 및 화면 설계](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-05-dashboard-and-pages.md)**: 화면 구성(App Router 라우트 목록).
7. **[데이터 모델](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-06-data-model.md)**: 테이블 필드 및 제약 조건.
8. **[서버 액션 & API](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-07-api-and-actions.md)**: 핵심 비즈니스 로직 함수 목록.
9. **[인증 및 보안](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-08-auth-and-security.md)**: 접근 제어 및 비회원 예약조회 보안.
10. **[구현 가이드](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-09-tech-stack-and-implementation.md)**: 폴더 컨벤션 및 Neon DB 가이드.
11. **[MVP 범위 및 로드맵](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-10-mvp-scope-and-roadmap.md)**: 개발 일정 및 제외 대상.
12. **[미정 항목](file:///Users/jjaek/Developer/AI_PBL_OCC/docs/prd/section-11-open-questions.md)**: 정책적 논의가 필요한 열린 질문들.

---

## 3. 핵심 아키텍처 및 구현 방식
- **Next.js Server Actions**: 데이터 수정 작업은 API 엔드포인트 대신 `use server` 액션을 호출하여 Neon DB에 반영합니다.
- **QR 생성**: `vendor/python-qrcode`에 클론한 `https://github.com/lincolnloop/python-qrcode` 코드를 `scripts/qr/generate_qr.py` wrapper로 호출해 `qr_token` 기반 QR 이미지를 생성합니다.
- **QR 체크인 스캐너**: 기획자 체크인 화면은 `@yudiel/react-qr-scanner`를 사용하며, 휴대폰 후면 카메라(`facingMode: 'environment'`)를 우선 사용합니다.
- **도메인 중심 폴더 구조**:
  - 소스 코드는 `src/features/[domain]/` 하위에 위치시킵니다.
  - 예: `src/features/reservations/actions.ts` (서버 액션), `src/features/reservations/components/` (컴포넌트)
- **Neon DB 스키마**: [db/schema.sql](file:///Users/jjaek/Developer/AI_PBL_OCC/db/schema.sql)에 PostgreSQL 테이블 구조가 선언되어 있습니다. 쿼리를 작성하기 전 스키마 타입을 확인하십시오.

---

## 4. 로컬 실행 방법
1. `.env.example` 파일을 복사하여 `.env.local`을 생성하고 Neon DB 연결 문자열을 입력합니다.
2. `npm run dev`를 실행하여 `http://localhost:3000`에서 개발 서버를 구동합니다.
