import { 
  Student, 
  Exam, 
  Cycle, 
  DailyRecord, 
  D21Plan, 
  D21Cell,
  ReviewTracker, 
  ReviewItem,
  Alert,
  QuestionBankItem,
  Prescription,
  StudentStatus,
  Phase,
  StudentState,
  Grade,
  ExamType,
  Attendance,
  AlertSeverity,
  DailyCard,
  PillarSchedule,
  DebatePrep,
  ExpressionItem,
  EnglishOutput,
  MasteryTopic,
  MasteryCheck,
  Gap,
  BuildPlan
} from '../types';
import * as mockData from '../data/mockData';
import { supabase } from './supabaseClient';

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
  DEBATE_PREPS: 'edulink_debatepreps',
  EXPR_BANK: 'edulink_expr_bank',
  ENG_OUTPUT: 'edulink_eng_output',
  MASTERY_TOPICS: 'edulink_mastery_topic',
  MASTERY_CHECKS: 'edulink_mastery_check',
  GAPS: 'edulink_gap',
  BUILD_PLANS: 'edulink_build_plans',
};

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
export const getStudents = async (): Promise<Student[]> => {
  const local = getStorageItem<Student[]>(KEYS.STUDENTS, []);
  try {
    const { data, error } = await supabase.from('students').select('*').order('name', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: Student[] = data.map(s => ({
        id: s.id,
        name: s.name,
        grade: s.grade as Grade,
        school: s.school,
        parentContact: s.parent_contact || '',
        enrolledAt: s.enrolled_at,
        memo: s.memo || '',
      }));
      setStorageItem(KEYS.STUDENTS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getStudents failed, fallback to local:', err);
  }
  return local.length > 0 ? local : mockData.mockStudents;
};

export const saveStudents = async (students: Student[]): Promise<void> => {
  setStorageItem(KEYS.STUDENTS, students);
  try {
    const payload = students.map(s => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      school: s.school,
      parent_contact: s.parentContact,
      enrolled_at: s.enrolledAt,
      memo: s.memo
    }));
    const { error } = await supabase.from('students').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase saveStudents failed:', err);
  }
};

// 2. 시험 일정 CRUD
export const getExams = async (): Promise<Exam[]> => {
  const local = getStorageItem<Exam[]>(KEYS.EXAMS, []);
  try {
    const { data, error } = await supabase.from('exams').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: Exam[] = data.map(e => ({
        id: e.id,
        studentId: e.student_id,
        school: e.school,
        subjects: e.subjects,
        examDate: e.exam_date,
        type: e.type as ExamType,
      }));
      setStorageItem(KEYS.EXAMS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getExams failed:', err);
  }
  return local.length > 0 ? local : mockData.mockExams;
};

export const saveExams = async (exams: Exam[]): Promise<void> => {
  setStorageItem(KEYS.EXAMS, exams);
  try {
    const payload = exams.map(e => ({
      id: e.id,
      student_id: e.studentId,
      school: e.school,
      subjects: e.subjects,
      exam_date: e.examDate,
      type: e.type
    }));
    const { error } = await supabase.from('exams').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase saveExams failed:', err);
  }
};

// 3. 사이클 CRUD
export const getCycles = async (): Promise<Cycle[]> => {
  const local = getStorageItem<Cycle[]>(KEYS.CYCLES, []);
  try {
    const { data, error } = await supabase.from('cycles').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: Cycle[] = data.map(c => ({
        id: c.id,
        examId: c.exam_id,
        studentId: c.student_id,
        phase: c.phase as Phase,
        startDate: c.start_date,
        endDate: c.end_date,
      }));
      setStorageItem(KEYS.CYCLES, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getCycles failed:', err);
  }
  return local.length > 0 ? local : mockData.mockCycles;
};

export const saveCycles = async (cycles: Cycle[]): Promise<void> => {
  setStorageItem(KEYS.CYCLES, cycles);
  try {
    const payload = cycles.map(c => ({
      id: c.id,
      exam_id: c.examId,
      student_id: c.studentId,
      phase: c.phase,
      start_date: c.startDate,
      end_date: c.endDate
    }));
    const { error } = await supabase.from('cycles').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase saveCycles failed:', err);
  }
};

// 4. 일일 기록 CRUD
export const getDailyRecords = async (): Promise<DailyRecord[]> => {
  const local = getStorageItem<DailyRecord[]>(KEYS.DAILY_RECORDS, []);
  try {
    const { data, error } = await supabase.from('daily_records').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: DailyRecord[] = data.map(r => ({
        id: r.id,
        studentId: r.student_id,
        date: r.date,
        attendance: r.attendance as Attendance,
        studyMinutes: r.study_minutes,
        reviewStage: r.review_stage as 1 | 2 | 3,
        completedPlan: r.completed_plan,
        condition: r.condition,
        managerNote: r.manager_note || '',
        status: r.status || 'confirmed',
        submittedBy: r.submitted_by || r.submittedBy || 'manager',
        confirmedAt: r.confirmed_at || r.confirmedAt || undefined,
      }));
      setStorageItem(KEYS.DAILY_RECORDS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getDailyRecords failed:', err);
  }
  const mappedLocal = local.map(r => ({
    ...r,
    status: r.status || 'confirmed',
    submittedBy: r.submittedBy || 'manager',
    confirmedAt: r.confirmedAt
  }));
  return mappedLocal.length > 0 ? mappedLocal : mockData.mockDailyRecords.map(r => ({
    ...r,
    status: r.status || 'confirmed',
    submittedBy: r.submittedBy || 'manager',
    confirmedAt: r.confirmedAt
  }));
};

export const saveDailyRecords = async (records: DailyRecord[]): Promise<void> => {
  setStorageItem(KEYS.DAILY_RECORDS, records);
  try {
    const payload = records.map(r => ({
      id: r.id,
      student_id: r.studentId,
      date: r.date,
      attendance: r.attendance,
      study_minutes: r.studyMinutes,
      review_stage: r.reviewStage,
      completed_plan: r.completedPlan,
      condition: r.condition,
      manager_note: r.managerNote,
      status: r.status,
      submitted_by: r.submittedBy,
      confirmed_at: r.confirmedAt
    }));
    const { error } = await supabase.from('daily_records').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase saveDailyRecords failed:', err);
  }
};

// 5. D-21 플랜 CRUD
export const getD21Plans = async (): Promise<D21Plan[]> => {
  const local = getStorageItem<D21Plan[]>(KEYS.D21_PLANS, []);
  try {
    const { data: plansData, error: plansErr } = await supabase.from('d21_plans').select('*');
    if (plansErr) throw plansErr;

    const { data: cellsData, error: cellsErr } = await supabase.from('d21_cells').select('*');
    if (cellsErr) throw cellsErr;

    if (plansData && plansData.length > 0) {
      const mapped: D21Plan[] = plansData.map(p => {
        const planCells = (cellsData || [])
          .filter(c => c.plan_id === p.id)
          .map((c): D21Cell => ({
            dDay: c.d_day,
            date: c.date,
            subjects: c.subjects,
            task: c.task || '',
            reviewStage: c.review_stage as 1 | 2 | 3 | null,
            done: c.done
          }))
          .sort((a, b) => b.dDay - a.dDay);

        return {
          id: p.id,
          studentId: p.student_id,
          examId: p.exam_id,
          cells: planCells
        };
      });
      setStorageItem(KEYS.D21_PLANS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getD21Plans failed:', err);
  }
  return local.length > 0 ? local : mockData.mockD21Plans;
};

export const saveD21Plans = async (plans: D21Plan[]): Promise<void> => {
  setStorageItem(KEYS.D21_PLANS, plans);
  try {
    const plansPayload = plans.map(p => ({
      id: p.id,
      student_id: p.studentId,
      exam_id: p.examId
    }));
    const { error: plansErr } = await supabase.from('d21_plans').upsert(plansPayload);
    if (plansErr) throw plansErr;

    const cellsPayload = plans.flatMap(p => 
      p.cells.map(c => ({
        plan_id: p.id,
        d_day: c.dDay,
        date: c.date,
        subjects: c.subjects,
        task: c.task,
        review_stage: c.reviewStage,
        done: c.done
      }))
    );
    if (cellsPayload.length > 0) {
      const { error: cellsErr } = await supabase.from('d21_cells').upsert(cellsPayload);
      if (cellsErr) throw cellsErr;
    }
  } catch (err) {
    console.error('Supabase saveD21Plans failed:', err);
  }
};

// 6. N회독 트래커 CRUD
export const getReviewTrackers = async (): Promise<ReviewTracker[]> => {
  const local = getStorageItem<ReviewTracker[]>(KEYS.REVIEW_TRACKERS, []);
  try {
    const { data: trackersData, error: trackersErr } = await supabase.from('review_trackers').select('*');
    if (trackersErr) throw trackersErr;

    const { data: itemsData, error: itemsErr } = await supabase.from('review_items').select('*');
    if (itemsErr) throw itemsErr;

    if (trackersData && trackersData.length > 0) {
      const mapped: ReviewTracker[] = trackersData.map(t => {
        const trackerItems = (itemsData || [])
          .filter(i => i.tracker_id === t.id)
          .map((i): ReviewItem => ({
            subject: i.subject,
            material: i.material,
            stage1Done: i.stage1_done,
            stage2Done: i.stage2_done,
            stage3Done: i.stage3_done
          }));

        return {
          id: t.id,
          studentId: t.student_id,
          examId: t.exam_id,
          items: trackerItems
        };
      });
      setStorageItem(KEYS.REVIEW_TRACKERS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getReviewTrackers failed:', err);
  }
  return local.length > 0 ? local : mockData.mockReviewTrackers;
};

export const saveReviewTrackers = async (trackers: ReviewTracker[]): Promise<void> => {
  setStorageItem(KEYS.REVIEW_TRACKERS, trackers);
  try {
    const trackersPayload = trackers.map(t => ({
      id: t.id,
      student_id: t.studentId,
      exam_id: t.examId
    }));
    const { error: trackersErr } = await supabase.from('review_trackers').upsert(trackersPayload);
    if (trackersErr) throw trackersErr;

    const itemsPayload = trackers.flatMap(t => 
      t.items.map(i => ({
        tracker_id: t.id,
        subject: i.subject,
        material: i.material,
        stage1_done: i.stage1Done,
        stage2_done: i.stage2Done,
        stage3_done: i.stage3Done
      }))
    );
    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase.from('review_items').upsert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }
  } catch (err) {
    console.error('Supabase saveReviewTrackers failed:', err);
  }
};

// 7. 알림 CRUD
export const getAlerts = async (): Promise<Alert[]> => {
  const local = getStorageItem<Alert[]>(KEYS.ALERTS, []);
  try {
    const { data, error } = await supabase.from('alerts').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: Alert[] = data.map(a => ({
        id: a.id,
        studentId: a.student_id,
        studentName: a.student_name,
        severity: a.severity as AlertSeverity,
        context: a.context,
        detail: a.detail,
        createdAt: a.created_at,
        status: a.status as 'open' | 'handled' | 'dismissed',
      }));
      setStorageItem(KEYS.ALERTS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getAlerts failed:', err);
  }
  return local.length > 0 ? local : mockData.mockAlerts;
};

export const saveAlerts = async (alerts: Alert[]): Promise<void> => {
  setStorageItem(KEYS.ALERTS, alerts);
  try {
    const payload = alerts.map(a => ({
      id: a.id,
      student_id: a.studentId,
      student_name: a.studentName,
      severity: a.severity,
      context: a.context,
      detail: a.detail,
      created_at: a.createdAt,
      status: a.status
    }));
    const { error } = await supabase.from('alerts').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase saveAlerts failed:', err);
  }
};

// 8. 문제 은행 CRUD
export const getQuestions = async (): Promise<QuestionBankItem[]> => {
  const local = getStorageItem<QuestionBankItem[]>(KEYS.QUESTIONS, []);
  try {
    const { data, error } = await supabase.from('questions').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: QuestionBankItem[] = data.map(q => ({
        id: q.id,
        filename: q.filename,
        school: q.school,
        grade: q.grade as Grade,
        semester: q.semester,
        subject: q.subject,
        unit: q.unit,
        type: q.type,
        level: q.level,
        year: q.year,
        source: q.source,
        accuracy: q.accuracy
      }));
      setStorageItem(KEYS.QUESTIONS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getQuestions failed:', err);
  }
  return local.length > 0 ? local : mockData.mockQuestions;
};

export const saveQuestions = async (questions: QuestionBankItem[]): Promise<void> => {
  setStorageItem(KEYS.QUESTIONS, questions);
  try {
    const payload = questions.map(q => ({
      id: q.id,
      filename: q.filename,
      school: q.school,
      grade: q.grade,
      semester: q.semester,
      subject: q.subject,
      unit: q.unit,
      type: q.type,
      level: q.level,
      year: q.year,
      source: q.source,
      accuracy: q.accuracy
    }));
    const { error } = await supabase.from('questions').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase saveQuestions failed:', err);
  }
};

// 9. 처방 CRUD
export const getPrescriptions = async (): Promise<Prescription[]> => {
  const local = getStorageItem<Prescription[]>(KEYS.PRESCRIPTIONS, []);
  try {
    const { data, error } = await supabase.from('prescriptions').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: Prescription[] = data.map(p => ({
        id: p.id,
        studentId: p.student_id,
        studentName: p.student_name,
        managerId: p.manager_id,
        questionIds: p.question_ids,
        prescriptionDate: p.prescription_date,
        status: p.status as 'pending' | 'completed',
      }));
      setStorageItem(KEYS.PRESCRIPTIONS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getPrescriptions failed:', err);
  }
  return local.length > 0 ? local : mockData.mockPrescriptions;
};

export const savePrescriptions = async (prescriptions: Prescription[]): Promise<void> => {
  setStorageItem(KEYS.PRESCRIPTIONS, prescriptions);
  try {
    const payload = prescriptions.map(p => ({
      id: p.id,
      student_id: p.studentId,
      student_name: p.studentName,
      manager_id: p.managerId,
      question_ids: p.questionIds,
      prescription_date: p.prescriptionDate,
      status: p.status
    }));
    const { error } = await supabase.from('prescriptions').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase savePrescriptions failed:', err);
  }
};

// 10. 학생 상태 리스트 동적 연산 (대시보드 핵심 데이터)
export const getStudentStatuses = async (): Promise<StudentStatus[]> => {
  const students = await getStudents();
  const exams = await getExams();
  const cycles = await getCycles();
  const dailyRecords = await getDailyRecords();
  const d21Plans = await getD21Plans();
  const alerts = await getAlerts();
  const today = new Date('2026-05-27'); // 기준 오늘 날짜

  return students.map((student): StudentStatus => {
    const exam = exams.find(e => e.studentId === student.id);
    const cycle = cycles.find(c => c.studentId === student.id);
    const phase: Phase = cycle ? cycle.phase : 'Build';

    let dDay = 99;
    if (exam) {
      const examDate = new Date(exam.examDate);
      const diffTime = examDate.getTime() - today.getTime();
      dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    let progressPercent = 0;
    const plan = d21Plans.find(p => p.studentId === student.id);
    if (plan && plan.cells.length > 0) {
      const doneCells = plan.cells.filter(c => c.done).length;
      progressPercent = Math.round((doneCells / plan.cells.length) * 100);
    } else {
      if (phase === 'Race') progressPercent = 45;
      else if (phase === 'Battle') progressPercent = 90;
      else if (phase === 'Autopsy') progressPercent = 100;
    }

    const studentRecords = dailyRecords.filter(r => r.studentId === student.id);
    const confirmedStudentRecords = studentRecords.filter(r => r.status === 'confirmed');
    const sortedRecords = [...confirmedStudentRecords].sort((a, b) => b.date.localeCompare(a.date));
    const latestRecord = sortedRecords[0];
    const reviewStage = latestRecord ? latestRecord.reviewStage : 1;

    const recent7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const recordsIn7Days = confirmedStudentRecords.filter(r => recent7Days.includes(r.date));
    const presentRecords = recordsIn7Days.filter(r => r.attendance !== '결석');
    const attendance7d = recordsIn7Days.length > 0 
      ? Math.round((presentRecords.length / recordsIn7Days.length) * 100)
      : 100;

    const studentAlerts = alerts.filter(a => a.studentId === student.id && a.status === 'open');
    const alertCount = studentAlerts.length;

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

// 최초 데이터베이스에 모의 데이터 시딩을 진행하기 위한 헬퍼
export const seedMockDataIfEmpty = async (): Promise<void> => {
  try {
    const students = await getStudents();
    // 데이터베이스에 등록된 학생이 없을 경우에만 28명 및 연관 데이터 시딩
    if (students.length <= 1) { // create-next-app 기본 데이터 외 비었거나 초기 등록 상태
      console.log('Seeding mock data to Supabase...');
      await saveStudents(mockData.mockStudents);
      await saveExams(mockData.mockExams);
      await saveCycles(mockData.mockCycles);
      await saveDailyRecords(mockData.mockDailyRecords);
      await saveD21Plans(mockData.mockD21Plans);
      await saveReviewTrackers(mockData.mockReviewTrackers);
      await saveAlerts(mockData.mockAlerts);
      await saveQuestions(mockData.mockQuestions);
      await savePrescriptions(mockData.mockPrescriptions);
      console.log('Successfully seeded mock data!');
    }
  } catch (err) {
    console.error('Failed to seed mock data:', err);
  }
};

// --- 초등 루틴 모드 관련 헬퍼 함수 ---
const ELEM_KEYS = {
  DAILY_CARDS: 'edulink_dailycards',
  PILLAR_SCHEDULE: 'edulink_pillarschedule'
};

export const getDailyCards = (): DailyCard[] => {
  return getStorageItem<DailyCard[]>(ELEM_KEYS.DAILY_CARDS, []);
};

export const saveDailyCards = (cards: DailyCard[]): void => {
  setStorageItem(ELEM_KEYS.DAILY_CARDS, cards);
};

export const getPillarSchedule = (): PillarSchedule => {
  const defaultSchedule: PillarSchedule = {
    byWeekday: { '월': '수학', '화': '영어', '수': '수학', '목': '영어', '금': '토론' }
  };
  return getStorageItem<PillarSchedule>(ELEM_KEYS.PILLAR_SCHEDULE, defaultSchedule);
};

export const savePillarSchedule = (schedule: PillarSchedule): void => {
  setStorageItem(ELEM_KEYS.PILLAR_SCHEDULE, schedule);
};

export const seedElementaryMockDataIfEmpty = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const cards = getDailyCards();
    if (cards.length === 0) {
      console.log('Seeding elementary mock data to localStorage...');
      
      const today = new Date();
      const getOffsetDateStr = (offset: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
      };
      
      const t0 = getOffsetDateStr(0);   // 오늘
      const t1 = getOffsetDateStr(-1);  // 어제
      const t2 = getOffsetDateStr(-2);  // 그저께
      
      const seededCards = mockData.mockDailyCards.map(card => {
        let newDate = card.date;
        if (card.date === '2026-05-30') newDate = t0;
        else if (card.date === '2026-05-29') newDate = t1;
        else if (card.date === '2026-05-28') newDate = t2;
        
        return {
          ...card,
          id: `dc_${card.studentId}_${newDate.replace(/-/g, '')}`,
          date: newDate
        };
      });

      saveDailyCards(seededCards);
      
      const defaultSchedule: PillarSchedule = {
        byWeekday: { '월': '수학', '화': '영어', '수': '수학', '목': '영어', '금': '토론' }
      };
      savePillarSchedule(defaultSchedule);
      console.log('Successfully seeded elementary mock data!');
    }
  } catch (err) {
    console.error('Failed to seed elementary mock data:', err);
  }
};

// --- 토론 준비 도우미 관련 헬퍼 함수 ---
export const getDebatePreps = (): DebatePrep[] => {
  return getStorageItem<DebatePrep[]>(KEYS.DEBATE_PREPS, []);
};

export const saveDebatePreps = (preps: DebatePrep[]): void => {
  setStorageItem(KEYS.DEBATE_PREPS, preps);
};

export const seedDebatePrepsIfEmpty = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const preps = getDebatePreps();
    if (preps.length === 0) {
      console.log('Seeding mock debate preps to localStorage...');
      const mockPreps: DebatePrep[] = [
        {
          id: 'dp_estu_01_lie',
          studentId: 'estu_01',
          topicId: 'lie',
          date: '2026-05-29',
          side: '찬성',
          evidence: [
            {
              id: 'ev_01',
              content: '친구가 상처받지 않게 하기 위해서 거짓말이 필요할 때가 있다.',
              source: '부모님 말씀',
              side: '찬성'
            }
          ],
          essay: {
            intro: '우리는 살아가면서 정직해야 한다고 배우지만, 가끔은 친구를 위해 착한 거짓말을 해야 합니다.',
            body: '왜냐하면 친구의 기분을 상하게 하지 않고 마음을 지켜줄 수 있기 때문입니다. 부모님께서도 상황에 따라 배려가 정직보다 중요할 수 있다고 말씀하셨습니다.',
            concl: '따라서 친구의 마음을 따뜻하게 지켜주는 착한 거짓말은 해도 된다고 생각합니다.'
          },
          rebuttal: {
            their: '정직하지 않으면 결국 서로의 믿음이 깨질 수 있다고 생각할 수 있습니다.',
            mine: '하지만 오직 친구를 도우려는 순수한 마음에서 우러나온 거짓말은 믿음을 깨지 않고 우정을 더 깊어지게 만듭니다.'
          },
          status: 'done'
        },
        {
          id: 'dp_estu_02_zoo',
          studentId: 'estu_02',
          topicId: 'zoo',
          date: '2026-05-30',
          side: '반대',
          evidence: [
            {
              id: 'ev_02',
              content: '동물들이 좁은 우리 안에서 스트레스를 받아 이상 행동을 보인다.',
              source: '어린이 신문 기사',
              side: '반대'
            }
          ],
          essay: {
            intro: '동물원에 가면 신기한 동물들을 가까이서 볼 수 있어 즐겁습니다. 하지만 저는 동물원이 없어지거나 달라져야 한다고 생각합니다.',
            body: '어린이 신문에서 보았듯이 동물들이 좁은 우리에 갇히면 아주 심한 스트레스를 받습니다.',
            concl: ''
          },
          rebuttal: {
            their: '동물원은 멸종 위기 동물을 보호하고 생명을 교육하는 훌륭한 장소라고 할 수 있습니다.',
            mine: '그렇지만 동물을 좁은 철창에 가두지 않고도 자연 상태에서 보호하고 공부할 수 있는 대체 방법이 필요합니다.'
          },
          status: 'in_progress'
        }
      ];
      saveDebatePreps(mockPreps);
      console.log('Successfully seeded debate preps mock data!');
    }
  } catch (err) {
    console.error('Failed to seed debate preps:', err);
  }
};

export const getExpressionItems = (): ExpressionItem[] => {
  return getStorageItem<ExpressionItem[]>(KEYS.EXPR_BANK, []);
};

export const saveExpressionItems = (items: ExpressionItem[]): void => {
  setStorageItem(KEYS.EXPR_BANK, items);
};

export const getEnglishOutputs = (): EnglishOutput[] => {
  return getStorageItem<EnglishOutput[]>(KEYS.ENG_OUTPUT, []);
};

export const saveEnglishOutputs = (outputs: EnglishOutput[]): void => {
  setStorageItem(KEYS.ENG_OUTPUT, outputs);
};

export const seedEnglishMockDataIfEmpty = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const exprs = getExpressionItems();
    const outputs = getEnglishOutputs();
    if (exprs.length === 0 && outputs.length === 0) {
      console.log('Seeding english mock data to localStorage...');
      saveExpressionItems(mockData.mockExpressionItems);
      saveEnglishOutputs(mockData.mockEnglishOutputs);
      console.log('Successfully seeded english mock data!');
    }
  } catch (err) {
    console.error('Failed to seed english mock data:', err);
  }
};

// --- 완전학습 (Mastery Learning) CRUD 및 동적 연동 헬퍼 ---
export const getMasteryTopics = (): MasteryTopic[] => {
  return getStorageItem<MasteryTopic[]>(KEYS.MASTERY_TOPICS, []);
};

export const saveMasteryTopics = (topics: MasteryTopic[]): void => {
  setStorageItem(KEYS.MASTERY_TOPICS, topics);
};

export const getMasteryChecks = (): MasteryCheck[] => {
  return getStorageItem<MasteryCheck[]>(KEYS.MASTERY_CHECKS, []);
};

export const saveMasteryChecks = (checks: MasteryCheck[]): void => {
  setStorageItem(KEYS.MASTERY_CHECKS, checks);
  
  // 초등 DailyCard P1 연동:
  // 최신 저장된 MasteryCheck의 날짜 기준, 해당 학생의 오늘 DailyCard가 있다면 P1(복습 단계)을 완료(true) 처리합니다.
  if (checks.length > 0) {
    const latestCheck = checks[checks.length - 1];
    const checkDate = latestCheck.date;
    const cards = getDailyCards();
    const cardIndex = cards.findIndex(c => c.studentId === latestCheck.studentId && c.date === checkDate);
    if (cardIndex >= 0) {
      cards[cardIndex] = {
        ...cards[cardIndex],
        phasesDone: {
          ...cards[cardIndex].phasesDone,
          P1: true
        }
      };
      saveDailyCards(cards);
    }
  }
};

export const getGaps = (): Gap[] => {
  return getStorageItem<Gap[]>(KEYS.GAPS, []);
};

export const saveGaps = (gaps: Gap[]): void => {
  setStorageItem(KEYS.GAPS, gaps);
};

export const seedMasteryMockDataIfEmpty = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const topics = getMasteryTopics();
    const checks = getMasteryChecks();
    const gaps = getGaps();
    
    if (topics.length === 0 && checks.length === 0 && gaps.length === 0) {
      console.log('Seeding mastery mock data to localStorage...');
      
      const today = new Date();
      const getOffsetDateStr = (offset: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
      };
      
      const t0 = getOffsetDateStr(0);   // 오늘
      const t1 = getOffsetDateStr(-1);  // 어제
      
      // 1. MasteryTopics Seeding
      const mockTopics: MasteryTopic[] = [
        {
          id: 'mt_01',
          date: t1,
          subject: '수학',
          topic: '일차방정식의 풀이',
          keyPoints: [
            { id: 'kp_01_1', text: '이항할 때 부호가 반대로 바뀌는 원리 이해' },
            { id: 'kp_01_2', text: '양변에 같은 수를 곱하거나 나누는 등식의 성질 적용' },
            { id: 'kp_01_3', text: '괄호가 있는 경우 분배법칙을 전개하여 정리' }
          ]
        },
        {
          id: 'mt_02',
          date: t1,
          subject: '과학',
          topic: '소화계와 영양소 흡수',
          keyPoints: [
            { id: 'kp_02_1', text: '아밀레이스, 펩신 등 소화 효소의 영양소 분해 기능 작용' },
            { id: 'kp_02_2', text: '소장의 융털 구조가 표면적을 넓혀 흡수율을 높이는 이유' },
            { id: 'kp_02_3', text: '지용성 영양소와 수용성 영양소의 이동 경로 차이 설명' }
          ]
        },
        {
          id: 'mt_03',
          date: t0,
          subject: '영어',
          topic: '관계대명사의 한정적 용법',
          keyPoints: [
            { id: 'kp_03_1', text: '주격 관계대명사(who/which/that) 뒤에 동사 결합 구조' },
            { id: 'kp_03_2', text: '목적격 관계대명사 생략 가능한 조건 판단' },
            { id: 'kp_03_3', text: '선행사 수식 형태를 한국어 구문으로 대입 변환' }
          ]
        }
      ];
      
      // 2. MasteryChecks Seeding (인출률 50~100% 분포)
      const mockChecks: MasteryCheck[] = [
        {
          id: 'mc_01',
          studentId: 'estu_01', // 김민준
          topicId: 'mt_01',
          date: t1,
          method: 'blank_write',
          results: [
            { pointId: 'kp_01_1', recalled: true },
            { pointId: 'kp_01_2', recalled: true },
            { pointId: 'kp_01_3', recalled: false }
          ],
          retrievalScore: 67,
          studentDump: '이항할 때 부호가 바뀐다. 등식의 성질로 양변을 나눈다.',
          note: '괄호가 있을 때 분배법칙 전개 시 가끔 상수를 빠뜨리는 습관 있음.'
        },
        {
          id: 'mc_02',
          studentId: 'estu_02', // 박지민
          topicId: 'mt_01',
          date: t1,
          method: 'verbal',
          results: [
            { pointId: 'kp_01_1', recalled: true },
            { pointId: 'kp_01_2', recalled: true },
            { pointId: 'kp_01_3', recalled: true }
          ],
          retrievalScore: 100,
          studentDump: '말하기 구술로 완벽하게 3가지 포인트 다 이야기함.',
          note: '방정식 풀이 논리 구조가 아주 탄탄함.'
        },
        {
          id: 'mc_03',
          studentId: 'estu_03', // 이준우
          topicId: 'mt_02',
          date: t1,
          method: 'peer_explain',
          results: [
            { pointId: 'kp_02_1', recalled: true },
            { pointId: 'kp_02_2', recalled: false },
            { pointId: 'kp_02_3', recalled: false }
          ],
          retrievalScore: 33,
          studentDump: '소화효소가 음식물을 쪼갠다는 것은 아는데 융털이나 경로를 잘 설명 못함.',
          note: '융털의 생물학적 구조 암기 필요.'
        }
      ];
      
      // 3. Gaps Seeding (open / closed 혼재)
      const mockGaps: Gap[] = [
        {
          id: 'gap_01',
          studentId: 'estu_01',
          subject: '수학',
          topic: '일차방정식의 풀이',
          pointId: 'kp_01_3',
          pointText: '괄호가 있는 경우 분배법칙을 전개하여 정리',
          status: 'open',
          createdDate: t1,
          sourceTopicId: 'mt_01'
        },
        {
          id: 'gap_02',
          studentId: 'estu_03',
          subject: '과학',
          topic: '소화계와 영양소 흡수',
          pointId: 'kp_02_2',
          pointText: '소장의 융털 구조가 표면적을 넓혀 흡수율을 높이는 이유',
          status: 'open',
          createdDate: t1,
          sourceTopicId: 'mt_02'
        },
        {
          id: 'gap_03',
          studentId: 'estu_03',
          subject: '과학',
          topic: '소화계와 영양소 흡수',
          pointId: 'kp_02_3',
          pointText: '지용성 영양소와 수용성 영양소의 이동 경로 차이 설명',
          status: 'closed',
          createdDate: t1,
          closedDate: t0,
          sourceTopicId: 'mt_02'
        }
      ];

      saveMasteryTopics(mockTopics);
      saveMasteryChecks(mockChecks);
      saveGaps(mockGaps);
      console.log('Successfully seeded mastery mock data!');
    }
  } catch (err) {
    console.error('Failed to seed mastery mock data:', err);
  }
};

// === Build 주간 역산 계획 CRUD ===
export const getBuildPlans = async (): Promise<BuildPlan[]> => {
  const local = getStorageItem<BuildPlan[]>(KEYS.BUILD_PLANS, []);
  try {
    const { data, error } = await supabase.from('build_plans').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const mapped: BuildPlan[] = data.map(p => ({
        id: p.id,
        studentId: p.student_id,
        examId: p.exam_id,
        weeks: typeof p.weeks === 'string' ? JSON.parse(p.weeks) : p.weeks
      }));
      setStorageItem(KEYS.BUILD_PLANS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getBuildPlans failed, fallback to local:', err);
  }
  return local;
};

export const saveBuildPlans = async (plans: BuildPlan[]): Promise<void> => {
  setStorageItem(KEYS.BUILD_PLANS, plans);
  try {
    const payload = plans.map(p => ({
      id: p.id,
      student_id: p.studentId,
      exam_id: p.examId,
      weeks: p.weeks
    }));
    const { error } = await supabase.from('build_plans').upsert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase saveBuildPlans failed:', err);
  }
};
