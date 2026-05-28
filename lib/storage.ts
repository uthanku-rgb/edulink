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
  AlertSeverity
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
      }));
      setStorageItem(KEYS.DAILY_RECORDS, mapped);
      return mapped;
    }
  } catch (err) {
    console.error('Supabase getDailyRecords failed:', err);
  }
  return local.length > 0 ? local : mockData.mockDailyRecords;
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
      manager_note: r.managerNote
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
    const sortedRecords = [...studentRecords].sort((a, b) => b.date.localeCompare(a.date));
    const latestRecord = sortedRecords[0];
    const reviewStage = latestRecord ? latestRecord.reviewStage : 1;

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
