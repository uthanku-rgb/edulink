import { 
  Student, 
  Exam, 
  Cycle, 
  DailyRecord, 
  D21Plan, 
  ReviewTracker, 
  Alert, 
  QuestionBankItem, 
  Prescription,
  StudentStatus,
  Phase,
  StudentState
} from '../types';
import * as mockData from '../data/mockData';

// 로컬 스토리지 키 정의
const KEYS = {
  STUDENTS: 'edulink_students',
  EXAMS: 'edulink_exams',
  CYCLES: 'edulink_cycles',
  DAILY_RECORDS: 'edulink_daily_records',
  D21_PLANS: 'edulink_d21_plans',
  REVIEW_TRACKERS: 'edulink_review_trackers',
  ALERTS: 'edulink_alerts',
  QUESTIONS: 'edulink_questions',
  PRESCRIPTIONS: 'edulink_prescriptions',
};

// 브라우저 환경 검사 및 로컬 스토리지 입출력 안전 처리
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
};

// 1. 학생 CRUD
export const getStudents = (): Student[] => 
  getStorageItem(KEYS.STUDENTS, mockData.mockStudents);

export const saveStudents = (students: Student[]): void => 
  setStorageItem(KEYS.STUDENTS, students);

// 2. 시험 일정 CRUD
export const getExams = (): Exam[] => 
  getStorageItem(KEYS.EXAMS, mockData.mockExams);

export const saveExams = (exams: Exam[]): void => 
  setStorageItem(KEYS.EXAMS, exams);

// 3. 사이클 CRUD
export const getCycles = (): Cycle[] => 
  getStorageItem(KEYS.CYCLES, mockData.mockCycles);

export const saveCycles = (cycles: Cycle[]): void => 
  setStorageItem(KEYS.CYCLES, cycles);

// 4. 일일 기록 CRUD
export const getDailyRecords = (): DailyRecord[] => 
  getStorageItem(KEYS.DAILY_RECORDS, mockData.mockDailyRecords);

export const saveDailyRecords = (records: DailyRecord[]): void => 
  setStorageItem(KEYS.DAILY_RECORDS, records);

// 5. D-21 플랜 CRUD
export const getD21Plans = (): D21Plan[] => 
  getStorageItem(KEYS.D21_PLANS, mockData.mockD21Plans);

export const saveD21Plans = (plans: D21Plan[]): void => 
  setStorageItem(KEYS.D21_PLANS, plans);

// 6. N회독 트래커 CRUD
export const getReviewTrackers = (): ReviewTracker[] => 
  getStorageItem(KEYS.REVIEW_TRACKERS, mockData.mockReviewTrackers);

export const saveReviewTrackers = (trackers: ReviewTracker[]): void => 
  setStorageItem(KEYS.REVIEW_TRACKERS, trackers);

// 7. 알림 CRUD
export const getAlerts = (): Alert[] => 
  getStorageItem(KEYS.ALERTS, mockData.mockAlerts);

export const saveAlerts = (alerts: Alert[]): void => 
  setStorageItem(KEYS.ALERTS, alerts);

// 8. 문제 은행 CRUD
export const getQuestions = (): QuestionBankItem[] => 
  getStorageItem(KEYS.QUESTIONS, mockData.mockQuestions);

export const saveQuestions = (questions: QuestionBankItem[]): void => 
  setStorageItem(KEYS.QUESTIONS, questions);

// 9. 처방 CRUD
export const getPrescriptions = (): Prescription[] => 
  getStorageItem(KEYS.PRESCRIPTIONS, mockData.mockPrescriptions);

export const savePrescriptions = (prescriptions: Prescription[]): void => 
  setStorageItem(KEYS.PRESCRIPTIONS, prescriptions);

// 10. 학생 상태 리스트 동적 연산 (대시보드 핵심 데이터)
export const getStudentStatuses = (): StudentStatus[] => {
  const students = getStudents();
  const exams = getExams();
  const cycles = getCycles();
  const dailyRecords = getDailyRecords();
  const d21Plans = getD21Plans();
  const alerts = getAlerts();
  const today = new Date('2026-05-27'); // 기준 오늘 날짜

  return students.map((student): StudentStatus => {
    // 해당 학생의 시험 일정
    const exam = exams.find(e => e.studentId === student.id);
    // 해당 학생의 사이클 단계
    const cycle = cycles.find(c => c.studentId === student.id);
    const phase: Phase = cycle ? cycle.phase : 'Build';

    // D-Day 계산
    let dDay = 99;
    if (exam) {
      const examDate = new Date(exam.examDate);
      const diffTime = examDate.getTime() - today.getTime();
      dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 진척률 계산: D-21 플랜의 완료된 셀 개수 비율
    let progressPercent = 0;
    const plan = d21Plans.find(p => p.studentId === student.id);
    if (plan && plan.cells.length > 0) {
      const doneCells = plan.cells.filter(c => c.done).length;
      progressPercent = Math.round((doneCells / plan.cells.length) * 100);
    } else {
      // 플랜이 없는데 Race/Battle 단계이면 모킹
      if (phase === 'Race') progressPercent = 45;
      else if (phase === 'Battle') progressPercent = 90;
      else if (phase === 'Autopsy') progressPercent = 100;
    }

    // 회독 단계: 최근 일일 기록의 회독 단계 또는 1
    const studentRecords = dailyRecords.filter(r => r.studentId === student.id);
    const sortedRecords = [...studentRecords].sort((a, b) => b.date.localeCompare(a.date));
    const latestRecord = sortedRecords[0];
    const reviewStage = latestRecord ? latestRecord.reviewStage : 1;

    // 최근 7일 출석률
    const recent7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const recordsIn7Days = studentRecords.filter(r => recent7Days.includes(r.date));
    const presentRecords = recordsIn7Days.filter(r => r.attendance !== '결석');
    const attendance7d = recordsIn7Days.length > 0 
      ? Math.round((presentRecords.length / recordsIn7Days.length) * 100)
      : 100;

    // 미결 알림 개수
    const studentAlerts = alerts.filter(a => a.studentId === student.id && a.status === 'open');
    const alertCount = studentAlerts.length;

    // 학생 위기 상태 결정
    let state: StudentState = 'normal';
    const hasCrisis = studentAlerts.some(a => a.severity === 'crisis');
    const hasWarning = studentAlerts.some(a => a.severity === 'warning');

    if (hasCrisis) {
      state = 'crisis';
    } else if (hasWarning) {
      state = 'warning';
    } else if (phase === 'Autopsy') {
      state = 'autopsy';
    }

    return {
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      school: student.school,
      phase,
      dDay,
      progressPercent,
      reviewStage,
      attendance7d,
      alertCount,
      state,
    };
  });
};
