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
  TodayTasks, 
  WeekStats,
  Grade,
  Phase,
  Attendance,
  AlertSeverity,
  DailyCard,
  ElementaryStudent,
  Pillar,
  ExpressionItem,
  EnglishOutput
} from '../types';

// 날짜 오프셋 계산 헬퍼 (YYYY-MM-DD 형식 반환)
export const getDateOffsetString = (offsetDays: number): string => {
  const d = new Date('2026-05-27T09:00:00'); // 시안 기준 날짜: 2026년 5월 27일 (월)
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// 1. 학생 목록 (총 28명)
export const mockStudents: Student[] = [
  { id: 'stu_01', name: '김민준', grade: '중3', school: '신라중학교', parentContact: '010-1234-5678', enrolledAt: '2026-01-10', memo: '수학 취약, 집중 피드백 필요' },
  { id: 'stu_02', name: '이서연', grade: '고1', school: '영동고등학교', parentContact: '010-2345-6789', enrolledAt: '2025-12-01', memo: '출결 불량 경향, 학부모 컨택 자주 발생' },
  { id: 'stu_03', name: '박지호', grade: '고2', school: '대진고등학교', parentContact: '010-3456-7890', enrolledAt: '2026-03-02', memo: '학습 속도 느림. D-21 역산 수시 점검' },
  { id: 'stu_04', name: '최유나', grade: '고1', school: '영동고등학교', parentContact: '010-4567-8901', enrolledAt: '2026-02-15', memo: '성실하나 컨디션 기복 심함' },
  { id: 'stu_05', name: '정하린', grade: '고2', school: '대진고등학교', parentContact: '010-5678-9012', enrolledAt: '2025-11-20', memo: '상위권 유지 중, 자기주도적 성향' },
  { id: 'stu_06', name: '서지윤', grade: '고3', school: '개포고등학교', parentContact: '010-6789-0123', enrolledAt: '2024-03-01', memo: '재수 기로, 멘탈 관리 최우선' },
  // 나머지 22명 데이터 생성
  ...Array.from({ length: 22 }, (_, i): Student => {
    const grades: Grade[] = ['중1', '중2', '중3', '고1', '고2', '고3'];
    const schools = ['대치중학교', '역삼중학교', '휘문고등학교', '경기고등학교', '단대부고', '숙명여고'];
    const idNum = i + 7;
    const id = `stu_${String(idNum).padStart(2, '0')}`;
    return {
      id,
      name: `학생${idNum}`,
      grade: grades[i % grades.length],
      school: schools[i % schools.length],
      parentContact: `010-9999-${String(idNum).padStart(4, '0')}`,
      enrolledAt: '2026-03-02',
      memo: '일반 학생 기록'
    };
  })
];

// 2. 시험 일정
export const mockExams: Exam[] = [
  { id: 'ex_01', studentId: 'stu_01', school: '신라중학교', subjects: ['국어', '영어', '수학', '과학'], examDate: getDateOffsetString(7), type: '기말' }, // D-7
  { id: 'ex_02', studentId: 'stu_02', school: '영동고등학교', subjects: ['국어', '수학', '영어', '통합사회'], examDate: getDateOffsetString(14), type: '기말' }, // D-14
  { id: 'ex_03', studentId: 'stu_03', school: '대진고등학교', subjects: ['문학', '수학I', '영어I', '물리I'], examDate: getDateOffsetString(14), type: '기말' }, // D-14
  { id: 'ex_04', studentId: 'stu_04', school: '영동고등학교', subjects: ['국어', '수학', '영어', '통합과학'], examDate: getDateOffsetString(12), type: '기말' }, // D-12
  { id: 'ex_05', studentId: 'stu_05', school: '대진고등학교', subjects: ['문학', '수학I', '영어I', '화학I'], examDate: getDateOffsetString(9), type: '기말' }, // D-9
  { id: 'ex_06', studentId: 'stu_06', school: '개포고등학교', subjects: ['독서', '미적분', '영어II', '생명I'], examDate: getDateOffsetString(-3), type: '기말' }, // D+3 (T+3)
  // 나머지 22명 시험 일정
  ...mockStudents.slice(6).map((student, i): Exam => {
    // D-Day 다양하게 분배
    const offset = (i % 4 === 0) ? 5 : (i % 4 === 1) ? 15 : (i % 4 === 2) ? 25 : -5;
    return {
      id: `ex_${student.id.split('_')[1]}`,
      studentId: student.id,
      school: student.school,
      subjects: ['국어', '영어', '수학'],
      examDate: getDateOffsetString(offset),
      type: '기말'
    };
  })
];

// 3. 학습 사이클 (Exam에 맞춰 자동 계산)
export const mockCycles: Cycle[] = mockExams.map((exam): Cycle => {
  const d = new Date(exam.examDate);
  const today = new Date('2026-05-27');
  const diffTime = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let phase: Phase = 'Build';
  if (diffDays < 0 && diffDays >= -7) {
    phase = 'Autopsy';
  } else if (diffDays === 0) {
    phase = 'Battle';
  } else if (diffDays > 0 && diffDays <= 21) {
    phase = 'Race';
  } else {
    phase = 'Build';
  }

  return {
    id: `cy_${exam.id.split('_')[1]}`,
    examId: exam.id,
    studentId: exam.studentId,
    phase,
    startDate: getDateOffsetString(-40),
    endDate: exam.examDate
  };
});

// 4. 일일 기록 (최근 7일 분량 자동 생성)
export const mockDailyRecords: DailyRecord[] = (() => {
  const records: DailyRecord[] = [];
  const attendances: Attendance[] = ['정상', '정상', '정상', '정상', '지각', '외출', '정상'];
  
  mockStudents.forEach((student, index) => {
    // 최근 7일치
    for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
      const recordDate = getDateOffsetString(dayOffset);
      const randSeed = (index + Math.abs(dayOffset)) % 7;
      
      let attendance: Attendance = '정상';
      if (student.id === 'stu_02' && dayOffset >= -2) {
        // 이서연 결석 3일 연속 (D-2, D-1, 오늘 D-0)
        attendance = '결석';
      } else {
        attendance = attendances[randSeed];
      }

      // 오늘 미입력인 최유나 케이스
      if (student.id === 'stu_04' && dayOffset === 0) {
        // 오늘 기록 누락
        continue;
      }

      // v2 학생 초안 / 확정 여부 결정
      let status: 'draft' | 'confirmed' = 'confirmed';
      let submittedBy: 'student' | 'manager' = 'manager';
      let studyMinutes = attendance === '결석' ? 0 : 240 + (randSeed * 45);
      let reviewStage = (randSeed % 3 + 1) as 1 | 2 | 3;
      let completedPlan = attendance === '결석' ? false : randSeed !== 4;
      let condition = (randSeed % 5 + 1) as 1 | 2 | 3 | 4 | 5;
      let managerNote = attendance === '결석' ? '연락 두절 상태' : '무난하게 학습 진행';

      if (dayOffset === 0) {
        if (student.id === 'stu_01') {
          status = 'draft';
          submittedBy = 'student';
          studyMinutes = 180;
          reviewStage = 2;
          completedPlan = false;
          condition = 3;
          managerNote = '오늘 영어 단어와 수학 기출 분석을 했습니다. 약간 졸렸습니다.';
        } else if (student.id === 'stu_05') {
          status = 'draft';
          submittedBy = 'student';
          studyMinutes = 320;
          reviewStage = 3;
          completedPlan = true;
          condition = 5;
          managerNote = '오늘 역산 플랜에 있는 것 전부 마쳤습니다! 내일도 열심히 하겠습니다.';
        }
      }

      records.push({
        id: `dr_${student.id.split('_')[1]}_${recordDate.replace(/-/g, '')}`,
        studentId: student.id,
        date: recordDate,
        attendance,
        studyMinutes,
        reviewStage,
        completedPlan,
        condition,
        managerNote,
        status,
        submittedBy,
      });
    }
  });

  return records;
})();

// 5. D-21 역산 플랜 (Race 단계 학생들용)
export const mockD21Plans: D21Plan[] = mockExams.map((exam): D21Plan => {
  const cells = Array.from({ length: 22 }, (_, i): any => {
    const dDay = 21 - i;
    const date = getDateOffsetString(exam.examDate === getDateOffsetString(7) ? (7 - dDay) : (exam.examDate === getDateOffsetString(12) ? (12 - dDay) : (9 - dDay)));
    
    // 김민준(stu_01)의 경우 진척률 32% (D-21 ~ D-7 사이 총 22칸 중 약 7칸 정도 완료)
    let done = false;
    if (exam.studentId === 'stu_01') {
      done = dDay > 14; // D-21 ~ D-15 완료 (7칸) -> 7 / 22 = 32%
    } else if (exam.studentId === 'stu_04') {
      done = dDay > 9;  // D-21 ~ D-10 완료 (12칸) -> 12 / 22 = 55% (약 58%)
    } else if (exam.studentId === 'stu_05') {
      done = dDay > 3;  // D-21 ~ D-4 완료 (18칸) -> 18 / 22 = 82% (약 84%)
    } else {
      done = dDay > 10;
    }

    return {
      dDay,
      date,
      subjects: ['수학', '영어'],
      task: `개념 ${4 - Math.floor(dDay/7)}단원 N회독 풀이`,
      reviewStage: dDay > 14 ? 1 : dDay > 7 ? 2 : 3,
      done
    };
  });

  return {
    id: `pl_${exam.studentId.split('_')[1]}`,
    studentId: exam.studentId,
    examId: exam.id,
    cells
  };
});

// 6. N회독 트래커
export const mockReviewTrackers: ReviewTracker[] = mockExams.map((exam): ReviewTracker => {
  const isStu01 = exam.studentId === 'stu_01';
  const isStu04 = exam.studentId === 'stu_04';
  const isStu05 = exam.studentId === 'stu_05';
  const isStu06 = exam.studentId === 'stu_06';

  const items = [
    { 
      subject: '수학', 
      material: '교과서 및 쎈 수학', 
      stage1Done: isStu05 || isStu06, 
      stage2Done: isStu05, 
      stage3Done: isStu06 
    },
    { 
      subject: '영어', 
      material: '수능특강 Light', 
      stage1Done: true, 
      stage2Done: isStu05 || isStu06, 
      stage3Done: false 
    },
    { 
      subject: '국어', 
      material: '교과서 자습서', 
      stage1Done: !isStu01, 
      stage2Done: isStu05 || isStu06, 
      stage3Done: false 
    }
  ];

  return {
    id: `rt_${exam.studentId.split('_')[1]}`,
    studentId: exam.studentId,
    examId: exam.id,
    items
  };
});

// 7. 위기 시그널 알림 (Mockup에 명시된 3건)
export const mockAlerts: Alert[] = [
  {
    id: 'alt_01',
    studentId: 'stu_01',
    studentName: '김민준',
    severity: 'crisis',
    context: '김민준 (중3) · 진척률 32%',
    detail: '회독 1단계 미완료 · D-7',
    createdAt: getDateOffsetString(0) + 'T08:30:00Z',
    status: 'open'
  },
  {
    id: 'alt_02',
    studentId: 'stu_02',
    studentName: '이서연',
    severity: 'crisis',
    context: '이서연 (고1) · 결석 3일 연속',
    detail: '학부모 컨택 필요',
    createdAt: getDateOffsetString(0) + 'T08:45:00Z',
    status: 'open'
  },
  {
    id: 'alt_03',
    studentId: 'stu_03',
    studentName: '박지호',
    severity: 'crisis',
    context: '박지호 (고2) · 시작 안 함',
    detail: '콘텐츠 C3 미시작 · D-14',
    createdAt: getDateOffsetString(0) + 'T09:00:00Z',
    status: 'open'
  }
];

// 8. 오늘 할 일 (Mockup 기준 수치)
export const mockTodayTasks: TodayTasks = {
  parentReportsToConfirm: 5,
  dailyCommentsToAdd: 23,
  newStudentOJT: '17:00',
  examAnalysisToInput: 2,
  performanceTaskAlerts: 3,
  prescriptionsPending: 8
};

// 9. 이번 주 통계 (Mockup 기준 수치)
export const mockWeekStats: WeekStats = {
  totalStudents: 28,
  avgProgressPercent: 78,
  avgAttendancePercent: 95, // 시안의 평균 진척률 78%, 콘텐츠 완료율 65% 등을 조율하여 반영
  crisisCount: 3
};

// 10. 문제 은행 기초 데이터 (Step 4 대응용)
export const mockQuestions: QuestionBankItem[] = [
  { id: 'q_01', filename: '2025_영동고_1학년1학기_중간고사_기출.pdf', school: '영동고등학교', grade: '고1', semester: '1학기 중간', subject: '수학', unit: '다항식-다항식의 연산', type: '빈출', level: 3, year: 2025, source: '학교기출', accuracy: 72 },
  { id: 'q_02', filename: '2025_영동고_1학년1학기_기말고사_수학.pdf', school: '영동고등학교', grade: '고1', semester: '1학기 기말', subject: '수학', unit: '방정식과 부등식-이차함수', type: '오답다발', level: 4, year: 2025, source: '학교기출', accuracy: 55 },
  { id: 'q_03', filename: '대진고_고2_수학I_지수로그_킬러.pdf', school: '대진고등학교', grade: '고2', semester: '1학기 중간', subject: '수학', unit: '지수함수와 로그함수', type: '고난도', level: 5, year: 2024, source: '학교기출', accuracy: 35 },
  { id: 'q_04', filename: '개포고_고3_미적분_수열의극한_서술형.pdf', school: '개포고등학교', grade: '고3', semester: '1학기 중간', subject: '수학', unit: '수열의 극한', type: '서술형', level: 4, year: 2025, source: '학교기출', accuracy: 60 },
  { id: 'q_05', filename: '고1_수학_방정식_실수유형.pdf', school: '전체', grade: '고1', semester: '1학기 중간', subject: '수학', unit: '방정식과 부등식-이차방정식', type: '실수형', level: 3, year: 2026, source: '모의고사', accuracy: 80 }
];

export const mockPrescriptions: Prescription[] = [
  { id: 'pre_01', studentId: 'stu_01', studentName: '김민준', managerId: 'mgr_01', questionIds: ['q_01', 'q_05'], prescriptionDate: getDateOffsetString(-1), status: 'completed' }
];

// 초등 루틴 모드 모의 데이터
export const mockElementaryStudents: ElementaryStudent[] = [
  { id: 'estu_01', name: '김동현', grade: '초4', school: '한빛초등학교' },
  { id: 'estu_02', name: '이서진', grade: '초5', school: '가람초등학교' },
  { id: 'estu_03', name: '박민아', grade: '초3', school: '누리초등학교' },
  { id: 'estu_04', name: '최주원', grade: '초6', school: '새롬초등학교' },
  { id: 'estu_05', name: '정예은', grade: '초5', school: '도담초등학교' },
  { id: 'estu_06', name: '윤하준', grade: '초4', school: '하늘초등학교' }
];

// 기준일: 2026-05-30
export const mockDailyCards: DailyCard[] = [
  // 5월 28일 (그저께)
  {
    id: 'dc_estu_01_20260528',
    studentId: 'estu_01',
    date: '2026-05-28',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: false },
    pillarToday: '수학',
    helpPoints: [],
    condition: 4
  },
  {
    id: 'dc_estu_02_20260528',
    studentId: 'estu_02',
    date: '2026-05-28',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '수학',
    helpPoints: [],
    condition: 4
  },
  {
    id: 'dc_estu_03_20260528',
    studentId: 'estu_03',
    date: '2026-05-28',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: false },
    pillarToday: '수학',
    helpPoints: ['나눗셈 세로셈법 도움 요청'],
    condition: 4
  },
  {
    id: 'dc_estu_04_20260528',
    studentId: 'estu_04',
    date: '2026-05-28',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '수학',
    helpPoints: [],
    condition: 5
  },
  {
    id: 'dc_estu_05_20260528',
    studentId: 'estu_05',
    date: '2026-05-28',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '수학',
    helpPoints: [],
    condition: 4
  },
  {
    id: 'dc_estu_06_20260528',
    studentId: 'estu_06',
    date: '2026-05-28',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '수학',
    helpPoints: [],
    condition: 4
  },

  // 5월 29일 (어제)
  {
    id: 'dc_estu_01_20260529',
    studentId: 'estu_01',
    date: '2026-05-29',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: [],
    condition: 5
  },
  {
    id: 'dc_estu_02_20260529',
    studentId: 'estu_02',
    date: '2026-05-29',
    attendance: '지각',
    phasesDone: { P1: true, P2: true, P3: true, P4: false },
    pillarToday: '토론',
    helpPoints: [],
    condition: 3
  },
  {
    id: 'dc_estu_03_20260529',
    studentId: 'estu_03',
    date: '2026-05-29',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: ['토론 주제 리서치 도움 요청'],
    condition: 4
  },
  {
    id: 'dc_estu_04_20260529',
    studentId: 'estu_04',
    date: '2026-05-29',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: [],
    condition: 5
  },
  {
    id: 'dc_estu_05_20260529',
    studentId: 'estu_05',
    date: '2026-05-29',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: [],
    condition: 4
  },
  {
    id: 'dc_estu_06_20260529',
    studentId: 'estu_06',
    date: '2026-05-29',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: [],
    condition: 5
  },

  // 5월 30일 (오늘)
  {
    id: 'dc_estu_01_20260530',
    studentId: 'estu_01',
    date: '2026-05-30',
    attendance: '결석',
    phasesDone: { P1: false, P2: false, P3: false, P4: false },
    pillarToday: '토론', // (오늘이 토요일인 경우 기둥은 토론 혹은 임의 설정)
    helpPoints: [],
    condition: 1
  },
  {
    id: 'dc_estu_02_20260530',
    studentId: 'estu_02',
    date: '2026-05-30',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: false, P4: false },
    pillarToday: '토론',
    helpPoints: [],
    condition: 2
  },
  {
    id: 'dc_estu_03_20260530',
    studentId: 'estu_03',
    date: '2026-05-30',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: ['영어 스피킹 파트 도움 필요'],
    condition: 4
  },
  {
    id: 'dc_estu_04_20260530',
    studentId: 'estu_04',
    date: '2026-05-30',
    attendance: '지각',
    phasesDone: { P1: true, P2: true, P3: true, P4: false },
    pillarToday: '토론',
    helpPoints: [],
    condition: 4
  },
  {
    id: 'dc_estu_05_20260530',
    studentId: 'estu_05',
    date: '2026-05-30',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: [],
    condition: 3
  },
  {
    id: 'dc_estu_06_20260530',
    studentId: 'estu_06',
    date: '2026-05-30',
    attendance: '정상',
    phasesDone: { P1: true, P2: true, P3: true, P4: true },
    pillarToday: '토론',
    helpPoints: [],
    condition: 5
  }
];

export const mockExpressionItems: ExpressionItem[] = [
  // estu_01 (김동현, 초4)
  { id: 'exp_01', studentId: 'estu_01', date: '2026-05-28', text: "make up one's mind", meaning: "결심하다", sourceBook: "Peter Pan", reviewed: true },
  { id: 'exp_02', studentId: 'estu_01', date: '2026-05-28', text: "once upon a time", meaning: "옛날 옛적에", sourceBook: "Peter Pan", reviewed: true },
  { id: 'exp_03', studentId: 'estu_01', date: '2026-05-28', text: "run away", meaning: "도망치다", sourceBook: "Peter Pan", reviewed: false },
  { id: 'exp_04', studentId: 'estu_01', date: '2026-05-29', text: "as soon as possible", meaning: "가능한 한 빨리", sourceBook: "Space Patrol", reviewed: false },
  { id: 'exp_05', studentId: 'estu_01', date: '2026-05-29', text: "all of a sudden", meaning: "갑자기", sourceBook: "Space Patrol", reviewed: false },
  { id: 'exp_06', studentId: 'estu_01', date: '2026-05-29', text: "give up", meaning: "포기하다", sourceBook: "Space Patrol", reviewed: true },

  // estu_02 (이서진, 초5)
  { id: 'exp_07', studentId: 'estu_02', date: '2026-05-29', text: "keep in mind", meaning: "명심하다", sourceBook: "Aladdin", reviewed: true },
  { id: 'exp_08', studentId: 'estu_02', date: '2026-05-29', text: "look forward to", meaning: "기대하다", sourceBook: "Aladdin", reviewed: false },
  { id: 'exp_09', studentId: 'estu_02', date: '2026-05-29', text: "by the way", meaning: "그런데", sourceBook: "Aladdin", reviewed: false },
  { id: 'exp_10', studentId: 'estu_02', date: '2026-05-30', text: "depend on", meaning: "의존하다", sourceBook: "Wizard of Oz", reviewed: false },
  { id: 'exp_11', studentId: 'estu_02', date: '2026-05-30', text: "get along with", meaning: "사이좋게 지내다", sourceBook: "Wizard of Oz", reviewed: true },

  // estu_03 (박민아, 초3)
  { id: 'exp_12', studentId: 'estu_03', date: '2026-05-28', text: "take a look", meaning: "살펴보다", sourceBook: "Red Riding Hood", reviewed: true },
  { id: 'exp_13', studentId: 'estu_03', date: '2026-05-28', text: "figure out", meaning: "알아내다", sourceBook: "Red Riding Hood", reviewed: false },
  { id: 'exp_14', studentId: 'estu_03', date: '2026-05-28', text: "in front of", meaning: "앞에", sourceBook: "Red Riding Hood", reviewed: false },
  { id: 'exp_15', studentId: 'estu_03', date: '2026-05-30', text: "make a decision", meaning: "결정하다", sourceBook: "Cinderella", reviewed: false },
  { id: 'exp_16', studentId: 'estu_03', date: '2026-05-30', text: "day by day", meaning: "나날이", sourceBook: "Cinderella", reviewed: true },

  // estu_04 (최주원, 초6)
  { id: 'exp_17', studentId: 'estu_04', date: '2026-05-27', text: "make an effort", meaning: "노력하다", sourceBook: "Robin Hood", reviewed: true },
  { id: 'exp_18', studentId: 'estu_04', date: '2026-05-27', text: "take care of", meaning: "돌보다", sourceBook: "Robin Hood", reviewed: false },
  { id: 'exp_19', studentId: 'estu_04', date: '2026-05-27', text: "instead of", meaning: "대신에", sourceBook: "Robin Hood", reviewed: true },
  { id: 'exp_20', studentId: 'estu_04', date: '2026-05-29', text: "lead to", meaning: "이끌다", sourceBook: "Wind in the Willows", reviewed: false },
  { id: 'exp_21', studentId: 'estu_04', date: '2026-05-29', text: "no longer", meaning: "더 이상 ~않다", sourceBook: "Wind in the Willows", reviewed: false },

  // estu_05 (정예은, 초5)
  { id: 'exp_22', studentId: 'estu_05', date: '2026-05-29', text: "get tired of", meaning: "실증나다", sourceBook: "Danny's Dino", reviewed: true },
  { id: 'exp_23', studentId: 'estu_05', date: '2026-05-29', text: "deal with", meaning: "다루다", sourceBook: "Danny's Dino", reviewed: true },
  { id: 'exp_24', studentId: 'estu_05', date: '2026-05-29', text: "keep up with", meaning: "따라잡다", sourceBook: "Danny's Dino", reviewed: false },
  { id: 'exp_25', studentId: 'estu_05', date: '2026-05-29', text: "take part in", meaning: "참여하다", sourceBook: "Danny's Dino", reviewed: false },

  // estu_06 (윤하준, 초4)
  { id: 'exp_26', studentId: 'estu_06', date: '2026-05-28', text: "be good at", meaning: "~을 잘하다", sourceBook: "Space Patrol", reviewed: true },
  { id: 'exp_27', studentId: 'estu_06', date: '2026-05-28', text: "stand up for", meaning: "옹호하다", sourceBook: "Space Patrol", reviewed: false },
  { id: 'exp_28', studentId: 'estu_06', date: '2026-05-28', text: "agree with", meaning: "동의하다", sourceBook: "Space Patrol", reviewed: true },
  { id: 'exp_29', studentId: 'estu_06', date: '2026-05-28', text: "on purpose", meaning: "고의로", sourceBook: "Space Patrol", reviewed: false }
];

export const mockEnglishOutputs: EnglishOutput[] = [
  // estu_01 (김동현, 초4)
  {
    id: 'out_01',
    studentId: 'estu_01',
    date: '2026-05-28',
    book: 'Peter Pan',
    minutes: 50,
    level: '4',
    retellNote: 'Wendy and Peter fly to Neverland.',
    hasRecording: true,
    writing: 'I want to fly to Neverland with Peter Pan. It looks so fun.',
    writingType: 'diary'
  },
  {
    id: 'out_02',
    studentId: 'estu_01',
    date: '2026-05-29',
    book: 'Space Patrol',
    minutes: 45,
    level: '4',
    retellNote: 'Aliens attack the ship.',
    hasRecording: false,
    writing: 'The alien was scary but patrol saved the ship.',
    writingType: 'bookreport'
  },

  // estu_02 (이서진, 초5)
  {
    id: 'out_03',
    studentId: 'estu_02',
    date: '2026-05-29',
    book: 'Aladdin',
    minutes: 60,
    level: '5',
    retellNote: 'Aladdin finds the magic lamp.',
    hasRecording: true,
    writing: 'Aladdin is a poor boy but he got a magic lamp and three wishes.',
    writingType: 'bookreport'
  },
  {
    id: 'out_04',
    studentId: 'estu_02',
    date: '2026-05-30',
    book: 'Wizard of Oz',
    minutes: 50,
    level: '5',
    retellNote: 'Dorothy meets the Scarecrow.',
    hasRecording: false,
    writing: 'Dorothy met nice friends in Oz. They walked to Emerald City.',
    writingType: 'diary'
  },

  // estu_03 (박민아, 초3)
  {
    id: 'out_05',
    studentId: 'estu_03',
    date: '2026-05-28',
    book: 'Red Riding Hood',
    minutes: 40,
    level: '3',
    retellNote: 'Wolf eats grandma.',
    hasRecording: true,
    writing: 'The wolf was very bad. He lied to Red Riding Hood.',
    writingType: 'diary'
  },
  {
    id: 'out_06',
    studentId: 'estu_03',
    date: '2026-05-30',
    book: 'Cinderella',
    minutes: 55,
    level: '3',
    retellNote: 'Glass shoe fits Cinderella.',
    hasRecording: true,
    writing: 'Cinderella went to the ball and lost her glass shoe.',
    writingType: 'bookreport'
  },

  // estu_04 (최주원, 초6)
  {
    id: 'out_07',
    studentId: 'estu_04',
    date: '2026-05-27',
    book: 'Robin Hood',
    minutes: 60,
    level: '6',
    retellNote: 'Robin steals from the rich.',
    hasRecording: true,
    writing: 'Robin Hood helped poor people in Sherwood Forest. He is a hero.',
    writingType: 'bookreport'
  },
  {
    id: 'out_08',
    studentId: 'estu_04',
    date: '2026-05-29',
    book: 'Wind in the Willows',
    minutes: 55,
    level: '6',
    retellNote: 'Mole visits Toad.',
    hasRecording: true,
    writing: 'Toad loves driving fast cars. His friends try to stop him.',
    writingType: 'diary'
  },

  // estu_05 (정예은, 초5)
  {
    id: 'out_09',
    studentId: 'estu_05',
    date: '2026-05-29',
    book: "Danny's Dino",
    minutes: 40,
    level: '4',
    retellNote: 'Danny plays with dinosaur.',
    hasRecording: false,
    writing: "Danny has a giant dinosaur friend. They went to the zoo together.",
    writingType: 'diary'
  },

  // estu_06 (윤하준, 초4)
  {
    id: 'out_10',
    studentId: 'estu_06',
    date: '2026-05-28',
    book: 'Space Patrol',
    minutes: 50,
    level: '4',
    retellNote: 'Captain Star solves problem.',
    hasRecording: true,
    writing: 'Captain Star is very brave. He saved the galaxy.',
    writingType: 'bookreport'
  }
];




