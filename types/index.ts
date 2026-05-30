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
  status: 'draft' | 'confirmed';   // 초안 / 확정
  submittedBy: 'student' | 'manager';
  confirmedAt?: string;            // ISO datetime
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
  parentReportsToConfirm: number;  // 학부모 리포트 컨펌
  dailyCommentsToAdd: number;      // 일일 코멘트 자동초안
  newStudentOJT: string;           // 신규 학생 OJT (예: "17:00")
  examAnalysisToInput: number;     // 시험 분석 입력
  performanceTaskAlerts: number;   // 수행평가 일정 알림
  prescriptionsPending: number;    // 맞춤 문제 처방
}

export interface WeekStats {
  totalStudents: number;
  avgProgressPercent: number;
  avgAttendancePercent: number;
  crisisCount: number;
}

// 문제 은행 데이터 모델
export interface QuestionBankItem {
  id: string;
  filename: string;           // PDF 파일명
  school: string;
  grade: Grade;
  semester: string;           // "1학기 중간" 등
  subject: string;
  unit: string;               // 대단원-중단원
  type: string;               // "개념" | "적용" | "서술형" | "실수형" | "고난도" | "빈출" | "오답다발"
  level: number;              // 난이도 (1~5)
  year: number;               // 기출년도
  source: string;             // 학교기출/모의고사/시중문제집
  accuracy?: number;          // 정답률 % (선택)
}

// 처방전 데이터 모델
export interface Prescription {
  id: string;
  studentId: string;
  studentName: string;
  managerId: string;
  questionIds: string[];
  prescriptionDate: string;    // ISO Date
  status: 'pending' | 'completed';
}

// 초등 루틴 모드 관련 타입
export type Pillar = '수학' | '영어' | '토론';
export type ElementaryPhase = 'P1' | 'P2' | 'P3' | 'P4';
export type CareState = 'care' | 'watch' | 'good';   // 케어 / 관심 / 순항

export interface DailyCard {
  id: string;
  studentId: string;
  date: string;                         // ISO date
  attendance: '정상' | '지각' | '결석';
  phasesDone: Record<ElementaryPhase, boolean>;   // P1~P4 완수
  pillarToday: Pillar;                  // 그날 메인 클래스 기둥(요일로 자동)
  helpPoints: string[];                 // "도움 받고 싶어요" 한 줄들
  condition: 1 | 2 | 3 | 4 | 5;         // 컨디션(이모지)
  coachNote?: string;
}

export interface PillarSchedule {
  byWeekday: Record<'월'|'화'|'수'|'목'|'금', Pillar>;
}

export interface CareSignal {
  studentId: string;
  studentName: string;
  state: CareState;
  reason: string;                       // "도움 포인트 3회 · 컨디션 하락"
}

export interface ElementaryStudent {
  id: string;
  name: string;
  grade: string;
  school: string;
}

export interface DebateTopic {
  id: string;
  q: string;
  values: [string, string];
  desc: string;
  questions: string[];
  keywords: string[];
}

export interface EvidenceItem {
  id: string;
  content: string;
  source: string;
  side: '찬성' | '반대';
}

export interface DebatePrep {
  id: string;
  studentId: string;
  topicId: string;
  date: string;
  side: '찬성' | '반대' | null;
  evidence: EvidenceItem[];
  essay: {
    intro: string;
    body: string;
    concl: string;
  };
  rebuttal: {
    their: string;
    mine: string;
  };
  status: 'in_progress' | 'done';
}

export interface WorkshopPhase {
  name: string;
  min: number;
  say: string;
  students: string;
  tip: string;
  showBig: string;
  showSub: string;
  present?: boolean;
}

export interface Workshop {
  id: string;
  title: string;
  topic: string;
  phases: WorkshopPhase[];
}

export interface ExpressionItem {       // 표현 은행 한 줄
  id: string; studentId: string; date: string;
  text: string;                  // 건진 영어 표현/단어
  meaning?: string;              // 뜻(선택)
  sourceBook?: string;           // 어느 책에서
  reviewed: boolean;             // 복습 체크
}

export type WritingType = 'diary' | 'bookreport';

export interface EnglishOutput {        // 오늘의 아웃풋 산출물
  id: string; studentId: string; date: string;
  book: string;                  // 오늘 들은 책
  minutes: number;               // 학습 시간(분)
  retellNote?: string;           // 리텔링 준비 메모(말하기 전 키워드)
  hasRecording: boolean;         // 녹음 제출
  recordingId?: string;          // IndexedDB 키 (오디오 blob)
  writing?: string;              // 한 줄 영작
  writingType?: WritingType;
  level: string;                 // 오늘 리틀팍스 레벨
  coachNote?: string;            // 코치 한 줄 피드백
}

export interface EnglishProgress {       // 학생별 누적(파생값, 계산해서 채움)
  studentId: string;
  littlefoxLevel: string;         // 현재 리틀팍스 레벨(가장 최근 EnglishOutput.level)
  ourStage: number;               // 우리 단계 1~N (STAGE_MAP로 매핑)
  booksCumulative: number;        // 누적 책 수
  expressionsCount: number;       // 표현 은행 누적
  recordingsCount: number;        // 녹음 누적
  writingsCount: number;          // 영작 누적
  weekMinutes: number;            // 이번 주 학습 시간 합
}

