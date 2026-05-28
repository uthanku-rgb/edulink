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
