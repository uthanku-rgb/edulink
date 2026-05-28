# Antigravity 프롬프트: 매니저 대시보드 메인 화면 빌드

> 이 문서를 그대로 새 Antigravity 프로젝트의 첫 프롬프트로 사용하세요.

---

## 프로젝트 컨텍스트

당신은 한국의 학원+관독(관리형 독서실) 결합형 운영 시스템 "관독학원운영OS"의 **매니저 포털**을 Next.js + TypeScript + Tailwind CSS로 빌드합니다.

### 시스템 개요
- 학원에 관독을 결합한 운영 시스템. 사용자 4종: 학생 / 매니저 / 원장 / 학부모.
- 핵심 원칙: **"시스템이 만들고, 매니저는 검토·처방·면담만 한다."**
- 매니저 1명이 학생 20~30명 관리 가능한 ROI 목표 (에듀플렉스 8~12명 대비 2~3배).

### 매니저 역할
LETS·에듀플렉스가 다루는 학원 운영 영역(학습 코칭·일일 리포트·문제 공급·수행평가·시험 분석·입시 상담·과목 특화 관리)을 **하나도 빼지 않고** 다루되, "직접 만드는 부담"은 시스템이 흡수하고 매니저는 컨펌·처방·면담만 합니다.

### Phase 1 빌드 범위 (참고, 이번 작업은 그 중 1개)
- 학생 포털 5개 화면 (반응형 PC + 모바일)
- **매니저 포털 6개 화면 ← 이번 작업은 그 중 "대시보드 메인" 화면**
- 원장 포털 2개 화면
- 학부모 채널 (카톡 알림톡 자동 발송)

---

## 이번 작업: 매니저 대시보드 메인 화면

### 사용자 페르소나
- 이름: 정수진
- 역할: 학원 매니저
- 담당: 학생 20~30명 (예시 28명)
- 일일 사용 패턴: 매일 등원 후 첫 화면. 알림·오늘 할 일·학생 상태를 한눈에 확인.
- 학생당 평균 13분/주 소요가 목표 (이 화면이 그걸 가능하게 함).

### 화면 구조 (위 → 아래)

```
┌────────────────────────────────────────────┐
│ [Header]   학원명·매니저명·날짜            │
├────────────────────────────────────────────┤
│ [Section Nav] 7개 탭 (가로 스크롤)         │
├────────────────────────────────────────────┤
│ [Crisis Alerts] 위기 시그널 3건 (빨강)     │
├────────────────────────────────────────────┤
│ [Today's Tasks] 오늘 할 일 6개 카드        │
├────────────────────────────────────────────┤
│ [Student Cards] 담당 학생 카드 그리드      │
├────────────────────────────────────────────┤
│ [Week Stats] 이번 주 통계 4개 메트릭       │
└────────────────────────────────────────────┘
```

---

## 컴포넌트별 상세 사양

### 1. Header
- 좌측 상단: "정연학원 · 매니저 포털" (작은 회색 텍스트)
- 좌측 하단: "대시보드" (큰 글씨 + 아이콘)
- 우측 상단: 매니저 이름 ("정수진", 강조)
- 우측 하단: "담당 28명 · 2026.05.27 (월)" (작은 회색)
- 하단에 구분선

### 2. Section Nav (Tab Pills)
가로 스크롤 가능한 7개 탭. 모바일에서도 가로 스크롤 유지.
1. **대시보드** (active) — bg-blue-50, text-blue-700, font-medium
2. 학생 28 — outline 스타일
3. 일일 리포트 — outline
4. 학부모 리포트 — outline
5. 문제 은행 — outline
6. 수행평가 — outline
7. 시험 분석 — outline

각 탭은 lucide-react 아이콘 + 라벨 (둘 다 표시).

### 3. Crisis Alerts (위기 시그널)
빨간색 배경 카드. 매니저가 가장 먼저 봐야 할 영역.
- 헤더 좌측: "⚠ 위기 시그널 3건" (font-medium, text-red-900)
- 헤더 우측: "즉시 대응" (작은 텍스트, text-red-700)
- 3행 (각 행은 좌측·우측 분리):
  - **김민준 (중3) · 진척률 32%** | 회독 1단계 미완료 · D-7
  - **이서연 (고1) · 결석 3일 연속** | 학부모 컨택 필요
  - **박지호 (고2) · 시작 안 함** | 콘텐츠 C3 미시작 · D-14
- 각 행 클릭 시 학생 상세로 이동 (`/students/[id]`, Phase 1 후속)

### 4. Today's Tasks (오늘 할 일)
흰색 카드 안에 6개 작업 카드 (2열 × 3행 또는 3열 × 2행, 반응형).
- 헤더: "오늘 할 일" (font-medium)
- 6개 작업:
  | 라벨 (회색) | 값 (강조) |
  |---|---|
  | 학부모 리포트 컨펌 | 5건 |
  | 일일 코멘트 자동초안 | 23명 |
  | 신규 학생 OJT | 17:00 |
  | 시험 분석 입력 | 2명 |
  | 수행평가 일정 알림 | 3건 |
  | 맞춤 문제 처방 | 8명 |
- 각 카드 배경: bg-slate-100
- 각 카드 클릭 시 해당 작업 화면으로 이동 (Phase 1 후속)

### 5. Student Cards (담당 학생 카드 그리드)
헤더 + 학생 카드 그리드.
- 헤더 좌측: "담당 학생 (상태별)" (font-medium)
- 헤더 우측: "진척률 기준 정렬" (작은 회색)
- 4개 학생 카드 (2열 그리드), 하단에 "+ 학생 24명 더보기" 링크

각 학생 카드 구조:
- 좌측: 학생명 (강조) + 학년 (예: "김민준 · 중3")
- 우측: 시즌 단계 + D-Day 라벨 (작은 배지, 배경 흰색, 모서리 둥글게)
- 하단: 한 줄 요약 (작은 텍스트)

4개 예시 학생 (각 색상으로 표시):
1. **김민준 · 중3** | 라벨 "Race · D-7" | "진척 32% · 회독 1단계 · 알림 3건" | 배경 bg-red-50, 텍스트 text-red-900
2. **최유나 · 고1** | 라벨 "Race · D-12" | "진척 58% · 어제 미입력 · 컨디션" | 배경 bg-amber-50, 텍스트 text-amber-900
3. **정하린 · 고2** | 라벨 "Race · D-9" | "진척 84% · 회독 2단계 · 정상" | 배경 bg-green-50, 텍스트 text-green-900
4. **서지윤 · 고3** | 라벨 "Autopsy · T+3" | "회고 진행 중 · C4 60%" | 배경 bg-blue-50, 텍스트 text-blue-900

### 6. Week Stats (이번 주 통계)
헤더 + 4개 메트릭 카드 (4열 그리드, 모바일에선 2×2).
- 헤더: "이번 주 통계" (font-medium)
- 4개 메트릭:
  | 라벨 (작은 회색) | 값 (큰 숫자 + 작은 단위) |
  |---|---|
  | 평균 진척률 | 78% |
  | 콘텐츠 완료율 | 65% |
  | 학부모 리포트 | 22/28 |
  | 매니저 시간/학생 | 13분 |
- 각 메트릭 카드: 배경 bg-slate-100, padding 1rem, rounded-lg

---

## 데이터 모델 (TypeScript)

`/types/index.ts`에 정의:

```typescript
// Phase 1 핵심 엔티티

export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';
export type Phase = 'Build' | 'Race' | 'Battle' | 'Autopsy';
export type ExamType = 'midterm' | 'final' | 'mock';
export type AlertSeverity = 'crisis' | 'warning' | 'info';
export type AlertType = 'progress_low' | 'absence' | 'no_start' | 'condition_alert' | 'content_incomplete';
export type AlertStatus = 'open' | 'handled' | 'dismissed';
export type StudentState = 'crisis' | 'warning' | 'normal' | 'autopsy';

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  school: string;
  managerId: string;
  enrolledAt: Date;
}

export interface Manager {
  id: string;
  name: string;
  studentIds: string[];
}

export interface Exam {
  id: string;
  studentId: string;
  school: string;
  subjects: string[];
  examDate: Date;
  type: ExamType;
}

export interface Cycle {
  id: string;
  examId: string;
  phase: Phase;
  startDate: Date;
  endDate: Date;
}

export interface Alert {
  id: string;
  studentId: string;
  studentName: string;
  managerId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  context: string;       // e.g., "진척률 32%", "결석 3일 연속"
  detail: string;        // e.g., "회독 1단계 미완료 · D-7"
  createdAt: Date;
  status: AlertStatus;
}

export interface StudentStatus {
  studentId: string;
  studentName: string;
  grade: Grade;
  phase: Phase;
  dDay: number;          // 음수면 시험 후 (T+3 = dDay -3)
  progressPercent: number;
  reviewStage: 1 | 2 | 3;
  alertCount: number;
  state: StudentState;
  summaryLine: string;   // 한 줄 요약 (UI에 표시)
}

export interface TodayTasks {
  parentReportsToConfirm: number;
  dailyCommentsToAdd: number;
  newStudentOJT?: string;        // "17:00" 형식
  examAnalysisToInput: number;
  performanceTaskAlerts: number;
  prescriptionsPending: number;
}

export interface WeekStats {
  avgProgressPercent: number;
  contentCompletionPercent: number;
  parentReportsSent: number;
  parentReportsTotal: number;
  avgManagerMinutesPerStudent: number;
}
```

---

## Mock 데이터

`/data/mockData.ts`에 즉시 사용 가능한 Mock 데이터:

```typescript
import type { Manager, Alert, StudentStatus, TodayTasks, WeekStats } from '@/types';

export const mockManager: Manager = {
  id: 'mgr_01',
  name: '정수진',
  studentIds: Array.from({ length: 28 }, (_, i) => `stu_${String(i + 1).padStart(2, '0')}`),
};

export const mockAlerts: Alert[] = [
  {
    id: 'alert_01',
    studentId: 'stu_01',
    studentName: '김민준',
    managerId: 'mgr_01',
    type: 'progress_low',
    severity: 'crisis',
    message: '진척률 32%',
    context: '김민준 (중3) · 진척률 32%',
    detail: '회독 1단계 미완료 · D-7',
    createdAt: new Date('2026-05-27T08:00:00'),
    status: 'open',
  },
  {
    id: 'alert_02',
    studentId: 'stu_02',
    studentName: '이서연',
    managerId: 'mgr_01',
    type: 'absence',
    severity: 'crisis',
    message: '결석 3일 연속',
    context: '이서연 (고1) · 결석 3일 연속',
    detail: '학부모 컨택 필요',
    createdAt: new Date('2026-05-27T08:00:00'),
    status: 'open',
  },
  {
    id: 'alert_03',
    studentId: 'stu_03',
    studentName: '박지호',
    managerId: 'mgr_01',
    type: 'no_start',
    severity: 'crisis',
    message: '시작 안 함',
    context: '박지호 (고2) · 시작 안 함',
    detail: '콘텐츠 C3 미시작 · D-14',
    createdAt: new Date('2026-05-27T08:00:00'),
    status: 'open',
  },
];

export const mockStudentStatuses: StudentStatus[] = [
  {
    studentId: 'stu_01',
    studentName: '김민준',
    grade: '중3',
    phase: 'Race',
    dDay: 7,
    progressPercent: 32,
    reviewStage: 1,
    alertCount: 3,
    state: 'crisis',
    summaryLine: '진척 32% · 회독 1단계 · 알림 3건',
  },
  {
    studentId: 'stu_04',
    studentName: '최유나',
    grade: '고1',
    phase: 'Race',
    dDay: 12,
    progressPercent: 58,
    reviewStage: 1,
    alertCount: 1,
    state: 'warning',
    summaryLine: '진척 58% · 어제 미입력 · 컨디션',
  },
  {
    studentId: 'stu_05',
    studentName: '정하린',
    grade: '고2',
    phase: 'Race',
    dDay: 9,
    progressPercent: 84,
    reviewStage: 2,
    alertCount: 0,
    state: 'normal',
    summaryLine: '진척 84% · 회독 2단계 · 정상',
  },
  {
    studentId: 'stu_06',
    studentName: '서지윤',
    grade: '고3',
    phase: 'Autopsy',
    dDay: -3,
    progressPercent: 0,  // Autopsy 단계라 별도 진척
    reviewStage: 3,
    alertCount: 0,
    state: 'autopsy',
    summaryLine: '회고 진행 중 · C4 60%',
  },
  // ... 나머지 24명은 비슷한 패턴으로 생성하거나 "+더보기"로 처리
];

export const mockTodayTasks: TodayTasks = {
  parentReportsToConfirm: 5,
  dailyCommentsToAdd: 23,
  newStudentOJT: '17:00',
  examAnalysisToInput: 2,
  performanceTaskAlerts: 3,
  prescriptionsPending: 8,
};

export const mockWeekStats: WeekStats = {
  avgProgressPercent: 78,
  contentCompletionPercent: 65,
  parentReportsSent: 22,
  parentReportsTotal: 28,
  avgManagerMinutesPerStudent: 13,
};

export const mockToday = new Date('2026-05-27T08:00:00');  // 월요일
```

---

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **lucide-react** (아이콘)
- 폰트: **Pretendard** (한글, [Pretendard CDN](https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css) 또는 npm 패키지)

---

## 디자인 시스템

### 색상 (Tailwind 클래스)
| 의미 | 배경 | 텍스트 | 보더 |
|---|---|---|---|
| 페이지 배경 | bg-slate-50 | — | — |
| 메인 surface | bg-white | text-slate-900 | border-slate-200 |
| 라벨/캡션 | — | text-slate-500 | — |
| 위기 (crisis) | bg-red-50 | text-red-900 | border-red-200 |
| 주의 (warning) | bg-amber-50 | text-amber-900 | border-amber-200 |
| 정상 (normal) | bg-green-50 | text-green-900 | border-green-200 |
| 회고 (autopsy) | bg-blue-50 | text-blue-900 | border-blue-200 |
| Active tab | bg-blue-50 | text-blue-700 | — |

### 타이포그래피
- **H1** (페이지 타이틀): 22px / font-medium (font-weight 500)
- **H2** (섹션 타이틀): 14px / font-medium
- **본문**: 14px / font-normal
- **라벨/캡션**: 12px / text-slate-500
- **숫자 강조** (메트릭): 18px / font-medium

### 레이아웃
- 페이지 최대 너비: `max-w-7xl mx-auto` (1280px)
- 메인 패딩: `p-6 md:p-8`
- 카드 간격: `gap-3`
- 카드 패딩: `p-4`
- 모서리: `rounded-lg` (8px), `rounded-xl` (12px) for outer containers
- 보더: `border border-slate-200` (default), `border-2` for emphasis (예: active 카드)

### 원칙 (반드시 지킬 것)
- **No gradients, no shadows** (그림자·그라데이션 일체 사용 금지)
- **Sentence case** (대시보드, 학생 28, 오늘 할 일 — Title Case나 ALL CAPS 금지)
- **Round numbers**: 모든 % / 평균 / 메트릭 값에 `Math.round()` 적용
- **font-weight는 400 또는 500만 사용** (600/700 금지)
- 한글 mid-sentence bolding 금지 (라벨·헤딩에만 font-medium)

---

## 반응형 사양

| 너비 | 레이아웃 |
|---|---|
| 1024px+ (desktop) | 풀 레이아웃. Today's Tasks 3열, Week Stats 4열, Student Cards 2열 |
| 768px~1024px (tablet) | Today's Tasks 2열, Week Stats 2열, Student Cards 2열 |
| ~768px (mobile) | 모든 그리드 1열. Section Nav 가로 스크롤 유지. |

---

## 파일 구조

```
/app
  /layout.tsx           — Pretendard 폰트 로드, 전역 스타일
  /page.tsx             — 매니저 대시보드 (이번 작업의 결과물)
/components
  /Header.tsx           — Section 1
  /SectionNav.tsx       — Section 2
  /CrisisAlerts.tsx     — Section 3
  /TodayTasks.tsx       — Section 4
  /StudentCards.tsx     — Section 5
  /WeekStats.tsx        — Section 6
  /shared
    /StudentCard.tsx    — 재사용 가능 (다른 화면에서도 사용 예정)
    /MetricCard.tsx     — 재사용 가능
    /AlertRow.tsx       — 재사용 가능
/data
  /mockData.ts          — 위 Mock 데이터
/types
  /index.ts             — 위 TypeScript 인터페이스
```

---

## 확장 고려

본 화면은 매니저 포털 6개 화면 중 첫 번째. 향후 추가될 화면:
- `/students/[id]` — 학생별 상세 (StudentCard 재사용)
- `/daily-reports` — 일일 학습 리포트 (자동 초안 + 코멘트)
- `/parent-reports` — 학부모 리포트 컨펌 (카톡 알림톡 발송)
- `/question-bank` — 문제 은행 (PDF + 메타데이터 검색)
- `/performance-tasks` — 수행평가 관리
- `/exam-analysis` — 시험 분석

컴포넌트는 재사용 가능하게 설계할 것. 특히 `StudentCard`, `MetricCard`, `AlertRow`는 다른 화면에서도 동일 형태로 사용 예정.

---

## 검증 기준 (Definition of Done)

- [ ] 1024px PC에서 자연스럽게 표시
- [ ] 768px 태블릿에서도 깨지지 않음
- [ ] 375px 모바일에서도 작동 (모든 그리드 1열)
- [ ] Mock 데이터로 즉시 실행 가능 (서버 호출 없음)
- [ ] TypeScript strict mode 통과
- [ ] 컴포넌트별 파일 분리 (재사용 가능 구조)
- [ ] No gradients, no shadows
- [ ] Sentence case 준수
- [ ] 한글 폰트 (Pretendard) 정상 로드
- [ ] 모든 숫자가 `Math.round()` 처리됨

---

## 첫 작업 순서

다음 순서로 진행해 주세요:

1. **Next.js 14 프로젝트 초기화** (`npx create-next-app@latest`, App Router, TypeScript, Tailwind 선택)
2. **Pretendard 폰트 설정** (`/app/layout.tsx`에 CDN 또는 npm 패키지로 추가)
3. **TypeScript 인터페이스 정의** (`/types/index.ts`에 위 내용)
4. **Mock 데이터 생성** (`/data/mockData.ts`에 위 내용)
5. **각 섹션 컴포넌트 빌드** (`/components` 하위에 6개 파일)
6. **공유 컴포넌트 빌드** (`/components/shared/` 하위에 3개 파일)
7. **대시보드 페이지 조립** (`/app/page.tsx`에서 6개 섹션 조립)
8. **반응형 확인** (1024px / 768px / 375px)

빌드 완료 후 실행 결과 화면을 보여주세요.

---

## 한 줄 핵심

> 매니저가 매일 첫 화면으로 보는 대시보드. 시스템이 만든 알림·할 일·학생 상태·통계를 매니저가 한 화면에서 검토하고 우선순위를 정할 수 있게 하는 것이 목표. 매니저는 만들지 않고, 검토·처방·면담만 한다.
