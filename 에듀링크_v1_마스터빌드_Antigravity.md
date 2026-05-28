# 에듀링크 (EduLink) v1 — 마스터 빌드 문서

> **이 문서 사용법**: 아래 Step 1~4는 각각 독립된 Antigravity 프롬프트 블록입니다. Step 1을 통째로 복사해 Antigravity에 던지고, 완성되면 Step 2를 던지는 식으로 단계별 진행하세요. 데이터 모델·디자인 시스템은 공통이므로 Step 1에서 한 번 정의됩니다.
>
> **기존 "Antigravity_프롬프트_매니저대시보드_v1.md"는 본 문서로 대체·폐기됩니다.**

---

## 0. 에듀링크 v1 정의

> **에듀링크 v1 = 매니저 단독 운영 콘솔.** 학생/학부모 포털 없음. 매니저가 모든 데이터를 직접 입력하고 모니터링한다. 관독·학원에서 즉시 사용 가능한 도구.
>
> **v2 확장 (지금은 안 만듦)**: 학생 직접 입력 → 매니저 확인 흐름, 학부모 포털, 학생 앱.

### v1 핵심 원칙
- 매니저 1명이 학생 20~30명을 한 콘솔에서 운영
- 모든 데이터 입력 주체 = 매니저
- 학생 데이터를 **전체 한눈에** 스캔 가능 (정연님 우선 요구사항)
- Mock 데이터 없이도 매니저가 실제 학원에서 바로 입력해서 쓸 수 있어야 함

### v1 화면 구성 (우선순위 순)

| 순위 | 화면 | 역할 | Step |
|---|---|---|---|
| 1 | 대시보드 (모니터링) | 전체 학생 현황 한눈에 + 알림 + 할 일 + 통계 | Step 1 |
| 2 | 학생 상세 + 기록 입력 | 학생 등록 / 일일 기록 입력 / D-21 플랜 작성 | Step 2 |
| 3 | 리포트 생성 | 학생별 주간/시즌 리포트 자동 생성 (출력·복사) | Step 3 |
| 4 | 문제 은행 / 처방 | PDF + 메타데이터 등록, 학생별 처방 | Step 4 |

---

## 1. 데이터 모델 (전체, 매니저 입력 전제)

`/types/index.ts`:

```typescript
export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';
export type Phase = 'Build' | 'Race' | 'Battle' | 'Autopsy';
export type ExamType = '중간' | '기말' | '모의';
export type Attendance = '정상' | '지각' | '결석' | '외출';
export type AlertSeverity = 'crisis' | 'warning' | 'info';
export type StudentState = 'crisis' | 'warning' | 'normal' | 'autopsy';

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  school: string;
  parentContact: string;       // 카톡 ID 또는 전화 (v2 리포트 발송용)
  enrolledAt: string;          // ISO date
  memo: string;
}

export interface Exam {
  id: string;
  studentId: string;
  school: string;
  subjects: string[];          // ["국어","영어","수학","과학"]
  examDate: string;            // ISO date (D-Day)
  type: ExamType;
}

export interface Cycle {
  id: string;
  examId: string;
  studentId: string;
  phase: Phase;
  startDate: string;
  endDate: string;
}

// 매니저가 매일 입력하는 일일 기록
export interface DailyRecord {
  id: string;
  studentId: string;
  date: string;                // ISO date
  attendance: Attendance;
  studyMinutes: number;        // 학습 시간(분)
  reviewStage: 1 | 2 | 3;      // 회독 단계
  completedPlan: boolean;      // 오늘 계획 완수 여부
  condition: 1 | 2 | 3 | 4 | 5;// 컨디션
  managerNote: string;         // 매니저 관찰 메모
}

// D-21 역산 플랜 (매니저가 작성/조정)
export interface D21Plan {
  id: string;
  studentId: string;
  examId: string;
  cells: D21Cell[];            // 21칸
}

export interface D21Cell {
  dDay: number;                // 21, 20, ... 1, 0(D-Day)
  date: string;
  subjects: string[];          // 그 날 다룰 과목
  task: string;                // 할 일
  reviewStage: 1 | 2 | 3 | null;
  done: boolean;
}

// N회독 트래커
export interface ReviewTracker {
  id: string;
  studentId: string;
  examId: string;
  items: ReviewItem[];
}

export interface ReviewItem {
  subject: string;
  material: string;            // 교과서/프린트/문제집명
  stage1Done: boolean;         // 1회독 (개념)
  stage2Done: boolean;         // 2회독 (문제)
  stage3Done: boolean;         // 3회독 (암기)
}

export interface Alert {
  id: string;
  studentId: string;
  studentName: string;
  severity: AlertSeverity;
  context: string;             // "김민준 (중3) · 진척률 32%"
  detail: string;              // "회독 1단계 미완료 · D-7"
  createdAt: string;
  status: 'open' | 'handled' | 'dismissed';
}

// 대시보드용 계산된 학생 상태
export interface StudentStatus {
  studentId: string;
  studentName: string;
  grade: Grade;
  school: string;
  phase: Phase;
  dDay: number;                // 음수면 시험 후
  progressPercent: number;
  reviewStage: 1 | 2 | 3;
  attendance7d: number;        // 최근 7일 출석률 %
  alertCount: number;
  state: StudentState;
}

export interface TodayTasks {
  dailyRecordsToInput: number; // 오늘 일일 기록 입력할 학생 수
  reportsToGenerate: number;
  examAnalysisToInput: number;
  prescriptionsPending: number;
  newStudentSetup: number;
}

export interface WeekStats {
  totalStudents: number;
  avgProgressPercent: number;
  avgAttendancePercent: number;
  crisisCount: number;
}
```

---

## 2. 공통 디자인 시스템 (모든 Step 공통)

### 기술 스택
- Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · lucide-react
- 폰트: Pretendard
- 상태관리: 로컬 상태 + (v1은) localStorage 또는 JSON 파일 영속화. 외부 DB 없이 시작.

### 색상
| 의미 | 배경 | 텍스트 | 보더 |
|---|---|---|---|
| 페이지 | bg-slate-50 | — | — |
| surface | bg-white | text-slate-900 | border-slate-200 |
| 라벨 | — | text-slate-500 | — |
| 위기 | bg-red-50 | text-red-900 | border-red-200 |
| 주의 | bg-amber-50 | text-amber-900 | border-amber-200 |
| 정상 | bg-green-50 | text-green-900 | border-green-200 |
| 회고 | bg-blue-50 | text-blue-900 | border-blue-200 |
| Active | bg-blue-50 | text-blue-700 | — |

### 타이포 / 레이아웃
- H1 22px/500, H2 14px/500, 본문 14px/400, 라벨 12px/text-slate-500, 숫자강조 18px/500
- 최대너비 max-w-7xl, 패딩 p-6 md:p-8, 카드 gap-3 p-4, rounded-lg/xl
- **No gradients, no shadows. Sentence case. font-weight 400/500만. 모든 숫자 Math.round().**

### 반응형
- 1024px+ 풀 / 768~1024 축소 / ~768 1열 (Section Nav만 가로 스크롤)

### 공통 네비게이션 (모든 화면 상단)
탭 7개: 대시보드 · 학생 · 일일 기록 · 리포트 · 문제 은행 · 수행평가 · 시험 분석

### 파일 구조
```
/app
  /layout.tsx
  /page.tsx                    — 대시보드 (Step 1)
  /students/page.tsx           — 학생 목록 (Step 2)
  /students/[id]/page.tsx      — 학생 상세 + 기록 입력 (Step 2)
  /students/new/page.tsx       — 학생 등록 (Step 2)
  /reports/page.tsx            — 리포트 생성 (Step 3)
  /question-bank/page.tsx      — 문제 은행 (Step 4)
/components
  /AppNav.tsx
  /shared/{StudentCard,MetricCard,AlertRow,StatusBadge}.tsx
  ... (Step별 컴포넌트)
/data/mockData.ts
/types/index.ts
/lib/storage.ts                — localStorage 영속화 헬퍼
```

---

## STEP 1 — 대시보드 (모니터링) 〔Antigravity에 이 블록을 던지세요〕

```
프로젝트 "에듀링크(EduLink)"를 Next.js 14 + TypeScript + Tailwind로 새로 시작한다.
에듀링크는 한국 학원+관독의 매니저 단독 운영 콘솔이다. 매니저가 학생 20~30명의
데이터를 직접 입력하고 모니터링한다. 학생/학부모 포털은 없다 (v2).

[이 문서의 "1. 데이터 모델"과 "2. 공통 디자인 시스템"을 여기에 그대로 붙여넣을 것]

## 이번 작업: 대시보드 메인 화면 (/app/page.tsx)

매니저가 매일 첫 화면으로 보는 화면. 위→아래 구조:

1. Header — "에듀링크 · 매니저 콘솔" + "대시보드", 우측에 매니저명/날짜/담당 학생 수

2. AppNav — 공통 탭 7개 (대시보드 active)

3. Crisis Alerts — 위기 시그널 카드 (빨강). Alert[] 중 severity='crisis' 표시.
   각 행: context(좌) + detail(우). 클릭 시 /students/[id] 이동.

4. Today's Tasks — 매니저 오늘 할 일 5개 카드:
   일일 기록 입력 N명 / 리포트 생성 N건 / 시험 분석 입력 N명 /
   맞춤 문제 처방 N명 / 신규 학생 셋업 N명

5. 전체 학생 현황 테이블 (★ 핵심 — "전체 한눈에")
   - 담당 학생 28명 전체를 컴팩트 테이블로 한 화면에 표시
   - 컬럼: 학생명 | 학년 | 학교 | 시즌단계 | D-Day | 진척률 | 회독 | 출석률(7일) | 알림
   - 행 좌측에 상태 색상 점 (crisis=red, warning=amber, normal=green, autopsy=blue)
   - 컬럼 헤더 클릭 시 정렬 (진척률·D-Day·알림 등)
   - 상단에 필터 칩: 전체 / 위기 / 주의 / 정상 / 회고
   - 행 클릭 시 /students/[id] 이동
   - 28명이 스크롤 없이 또는 최소 스크롤로 한눈에 들어오도록 행 높이 컴팩트하게

6. Week Stats — 메트릭 4개: 담당 학생 수 / 평균 진척률 / 평균 출석률 / 위기 학생 수

## Mock 데이터
28명 학생을 다양한 상태로 생성 (위기 3명, 주의 5명, 정상 18명, 회고 2명).
StudentStatus[], Alert[], TodayTasks, WeekStats를 /data/mockData.ts에 정의.

## 검증
- 1024px에서 28명 테이블이 한눈에 스캔됨
- 정렬·필터 작동
- 375px 모바일에서 테이블이 가로 스크롤로 보임
- TypeScript strict 통과, 컴포넌트 분리

완성 후 화면을 보여달라.
```

---

## STEP 2 — 학생 상세 + 기록 입력 〔대시보드 완성 후 던지세요〕

```
에듀링크에 학생 관리·입력 화면을 추가한다. 매니저가 모든 데이터를 입력한다.

## 2-1. 학생 등록 (/students/new)
폼으로 신규 학생 입력:
- 기본: 이름, 학년(select), 학교, 학부모 연락처, 메모
- 시험 설정: 시험 종류(중간/기말/모의), 시험일(date), 과목(다중 입력)
- 저장 시 Student + Exam + Cycle 자동 생성. Cycle phase는 시험일 기준 자동 계산
  (D-60~22=Build, D-21~1=Race, D-0=Battle, 시험후 7일=Autopsy)

## 2-2. 학생 목록 (/students)
- 대시보드 전체 테이블과 동일하되, "학생 추가" 버튼 + 검색창
- 행 클릭 → 학생 상세

## 2-3. 학생 상세 + 기록 입력 (/students/[id])
한 화면에서 학생 1명의 모든 것을 보고 입력:

(a) 상단 요약: 이름·학년·학교 / 시즌 단계 / D-Day / 진척률 / 출석률

(b) 일일 기록 입력 폼 (오늘 날짜 기본, 날짜 변경 가능)
   - 출결(정상/지각/결석/외출), 학습 시간(분), 회독 단계(1/2/3),
     오늘 계획 완수(toggle), 컨디션(1~5), 매니저 메모
   - 저장 시 DailyRecord 생성. 최근 기록 목록 아래에 표시.

(c) D-21 역산 플랜 (탭 또는 섹션)
   - 시험일 기준 21칸 그리드 자동 생성 (D-21 ~ D-0)
   - 각 칸: 과목·할 일·회독 단계 입력, 완수 체크
   - 시각적으로 LETS의 역산 달력처럼 (D-Day에서 거꾸로). 격자 형태.
   - 매니저가 칸을 클릭해 편집

(d) N회독 트래커 (탭 또는 섹션)
   - 과목별 자료 등록 + 1/2/3회독 체크
   - 진척률 자동 계산 → 학생 상태에 반영

## 검증
- 학생 등록 → 목록 → 상세 흐름 작동
- 일일 기록 입력 후 대시보드 숫자에 반영 (localStorage 영속화)
- D-21 그리드가 시험일 기준 자동 생성
- StudentCard/StatusBadge 등 Step 1 컴포넌트 재사용

완성 후 화면을 보여달라.
```

---

## STEP 3 — 리포트 생성 〔학생 입력 완성 후〕

```
에듀링크에 리포트 생성 화면(/reports)을 추가한다.

- 학생 선택 → 기간 선택(주간/시즌) → "리포트 생성" 버튼
- 시스템이 DailyRecord·D21Plan·ReviewTracker 데이터로 리포트 자동 작성:
  · 이번 주 출석·학습 시간·계획 완수율·회독 진척
  · 시즌 단계 및 D-Day
  · 매니저 코멘트 입력란 (한 줄)
  · 다음 주 목표 (자동 제안 + 매니저 수정)
- 출력 옵션: 화면 미리보기 + "복사" 버튼 (카톡 붙여넣기용 텍스트) + 인쇄(window.print)
- v2에서 카톡 알림톡 자동 발송 연동 예정 (지금은 복사·인쇄까지만)

검증: 학생 데이터로 리포트가 자동 채워지고, 매니저가 코멘트만 추가하면 완성.
완성 후 화면을 보여달라.
```

---

## STEP 4 — 문제 은행 / 처방 〔리포트 완성 후〕

```
에듀링크에 문제 은행 화면(/question-bank)을 추가한다. 하이브리드 구조.

## 4-1. 문제 등록
- PDF 첨부 (파일 업로드)
- 메타데이터 입력: 학교 / 학년 / 학기 / 과목 / 단원(대·중) / 유형(개념·적용·서술형·실수형·고난도·빈출·오답다발) / 난이도(1~5) / 기출년도 / 출처
- 저장 → QuestionBank 항목 생성

## 4-2. 검색·필터
- 메타데이터 기반 검색 (학교+학년+과목+단원+유형+난이도 조합)
- 결과 리스트

## 4-3. 학생별 처방
- 학생 선택 → 약점(취약 단원/유형) 기준 문제 자동 추천
- 매니저가 추천 중 선택 → 처방 세트 생성 (Prescription)
- 처방 이력 표시

검증: 문제 등록 → 메타데이터 검색 → 학생 처방 흐름 작동.
완성 후 화면을 보여달라.
```

---

## 3. 빌드 후 다음 단계 (v1 완성 이후)

| 영역 | 시점 |
|---|---|
| 시험 분석 · 수행평가 화면 | v1.1 |
| localStorage → 실제 DB (Supabase 등) | v1.2 |
| 카톡 알림톡 리포트 자동 발송 | v2 |
| 학생 직접 입력 → 매니저 확인 흐름 | v2 |
| 학부모 포털 / 학생 앱 | v2+ |

---

## 4. 결정 필요 (빌드 중 마주칠 것)

| # | 사항 | 잠정 |
|---|---|---|
| 1 | v1 데이터 영속화 방식 | localStorage로 시작, v1.2에서 Supabase |
| 2 | D-21 플랜 자동 생성 로직 (과목 배분 규칙) | 매니저 수동 입력부터, 자동 배분은 후속 |
| 3 | 진척률 계산 공식 | (완수한 D21Cell + 완료 회독) / 전체. 빌드 중 확정 |
| 4 | 문제 은행 단원 분류 체계 | 별도 작업 (정연 학원 기준) |

---

*에듀링크 v1 — 매니저 단독 콘솔. Step 1(대시보드)부터 순서대로 Antigravity에 던져 빌드. 학생/학부모 포털은 v2 확장.*
