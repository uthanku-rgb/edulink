'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  BookMarked, 
  Clock, 
  Smile,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import Header from '../../../components/Header';
import SectionNav from '../../../components/SectionNav';
import { 
  getStudents, 
  getExams, 
  getCycles, 
  getDailyRecords, 
  getD21Plans, 
  getReviewTrackers,
  saveDailyRecords,
  saveD21Plans,
  saveReviewTrackers,
  getBuildPlans,
  saveBuildPlans
} from '../../../lib/storage';
import { 
  Student, 
  Exam, 
  Cycle, 
  DailyRecord, 
  D21Plan, 
  D21Cell,
  ReviewTracker, 
  ReviewItem,
  Attendance,
  BuildPlan,
  BuildWeek,
  BuildCell
} from '../../../types';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  // 데이터 상태
  const [student, setStudent] = useState<Student | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [d21Plan, setD21Plan] = useState<D21Plan | null>(null);
  const [buildPlan, setBuildPlan] = useState<BuildPlan | null>(null);
  const [tracker, setTracker] = useState<ReviewTracker | null>(null);
  
  // UI 상태
  const [activeTab, setActiveTab] = useState<'daily' | 'planner' | 'tracker'>('daily');
  const [subTab, setSubTab] = useState<'build' | 'race'>('race');
  const [loading, setLoading] = useState(true);

  // 일일 기록 폼 상태
  const [att, setAtt] = useState<Attendance>('정상');
  const [studyMin, setStudyMin] = useState(240);
  const [revStage, setRevStage] = useState<1 | 2 | 3>(1);
  const [compPlan, setCompPlan] = useState(true);
  const [cond, setCond] = useState<number>(3);
  const [note, setNote] = useState('');
  const [recordDate, setRecordDate] = useState('');

  // 플래너 편집 상태
  const [editingCell, setEditingCell] = useState<D21Cell | null>(null);
  const [cellSubjectStr, setCellSubjectStr] = useState('');
  const [cellTask, setCellTask] = useState('');
  const [cellStage, setCellStage] = useState<number | null>(null);
  const [cellDone, setCellDone] = useState(false);

  // N회독 새 자료 추가 폼 상태
  const [newSubject, setNewSubject] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  useEffect(() => {
    // 최초 데이터 로딩
    const loadStudentData = async () => {
      try {
        const students = await getStudents();
        const foundStudent = students.find(s => s.id === studentId);
        
        if (!foundStudent) {
          setLoading(false);
          return;
        }

        setStudent(foundStudent);
        const exams = await getExams();
        setExam(exams.find(e => e.studentId === studentId) || null);
        
        const cycles = await getCycles();
        setCycle(cycles.find(c => c.studentId === studentId) || null);
        
        const allRecords = await getDailyRecords();
        setDailyRecords(allRecords.filter(r => r.studentId === studentId));
        
        const plans = await getD21Plans();
        setD21Plan(plans.find(p => p.studentId === studentId) || null);
        
        const trackers = await getReviewTrackers();
        setTracker(trackers.find(t => t.studentId === studentId) || null);

        // Build Plan 로드 및 자동 생성
        const buildPlans = await getBuildPlans();
        let foundBuildPlan = buildPlans.find(p => p.studentId === studentId) || null;
        const foundExam = exams.find(e => e.studentId === studentId) || null;

        if (foundExam && !foundBuildPlan) {
          const runwayWeeks = foundExam.type === '모의' ? 8 : 4;
          const weeks: BuildWeek[] = [];
          const startWeek = runwayWeeks;
          const endWeek = 4;

          for (let w = startWeek; w >= endWeek; w--) {
            const dDayStart = w * 7;
            const dDayEnd = dDayStart - 6;

            const cells: BuildCell[] = foundExam.subjects.map(subject => {
              let reviewGoal: 1 | 2 | 3 = 1;
              if (runwayWeeks === 8) {
                if (w === 4) reviewGoal = 3;
                else if (w === 6 || w === 5) reviewGoal = 2;
                else reviewGoal = 1;
              } else {
                reviewGoal = 2; // 4주차(D-28~22)는 2회독 기본 배분
              }

              return {
                subject,
                reviewGoal,
                material: '',
                done: false
              };
            });

            weeks.push({
              weekNo: w,
              dDayStart,
              dDayEnd,
              cells
            });
          }

          const newBuildPlan: BuildPlan = {
            id: `bp_${studentId.split('_')[1]}`,
            studentId,
            examId: foundExam.id,
            weeks
          };

          await saveBuildPlans([...buildPlans.filter(p => p.studentId !== studentId), newBuildPlan]);
          foundBuildPlan = newBuildPlan;
        }
        setBuildPlan(foundBuildPlan);

        // Phase에 따른 기본 서브 탭 결정
        const foundCycle = cycles.find(c => c.studentId === studentId) || null;
        if (foundCycle && foundCycle.phase === 'Build') {
          setSubTab('build');
        } else {
          setSubTab('race');
        }

        // 일일 기록 날짜 기본값 (오늘 날짜)
        setRecordDate(new Date('2026-05-27').toISOString().split('T')[0]);
      } catch (err) {
        console.error('Failed to load student detail data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        학생 정보 로드 중...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center font-normal text-xs text-slate-400 p-4">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <span>해당 학생을 찾을 수 없습니다.</span>
        <button onClick={() => router.push('/students')} className="mt-4 text-blue-500 hover:underline">
          목록으로 가기
        </button>
      </div>
    );
  }

  // D-Day 계산
  const getDDayString = () => {
    if (!exam) return '-';
    const today = new Date('2026-05-27');
    const examD = new Date(exam.examDate);
    const diff = Math.ceil((examD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (cycle?.phase === 'Autopsy') {
      return `Autopsy · T+${Math.abs(diff)}`;
    }
    return `${cycle?.phase || 'Build'} · D-${diff}`;
  };

  // 최근 7일 출석률 계산
  const calculateAttendance = () => {
    if (dailyRecords.length === 0) return 100;
    const present = dailyRecords.filter(r => r.attendance !== '결석').length;
    return Math.round((present / dailyRecords.length) * 100);
  };

  // 플래너 전체 완료율
  const calculatePlannerProgress = () => {
    if (!d21Plan || d21Plan.cells.length === 0) return 0;
    const done = d21Plan.cells.filter(c => c.done).length;
    return Math.round((done / d21Plan.cells.length) * 100);
  };

  // 1. 일일 기록 저장 제출 핸들러
  const handleDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recordDate) return;

    const newRecord: DailyRecord = {
      id: `dr_${studentId.split('_')[1]}_${recordDate.replace(/-/g, '')}`,
      studentId,
      date: recordDate,
      attendance: att,
      studyMinutes: att === '결석' ? 0 : studyMin,
      reviewStage: revStage,
      completedPlan: att === '결석' ? false : compPlan,
      condition: cond as 1 | 2 | 3 | 4 | 5,
      managerNote: note,
      status: 'confirmed',
      submittedBy: 'manager',
      confirmedAt: new Date().toISOString()
    };

    try {
      const allRecords = await getDailyRecords();
      // 중복 체크 및 업데이트
      const filtered = allRecords.filter(r => !(r.studentId === studentId && r.date === recordDate));
      const updated = [newRecord, ...filtered];
      
      await saveDailyRecords(updated);
      setDailyRecords(updated.filter(r => r.studentId === studentId));
      
      // 입력 폼 리셋
      setNote('');
      alert('일일 기록이 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error('Failed to save daily record:', err);
      alert('저장에 실패했습니다.');
    }
  };

  const handleConfirmRecord = async (rec: DailyRecord) => {
    try {
      const allRecords = await getDailyRecords();
      const updated = allRecords.map(r => {
        if (r.id === rec.id) {
          return {
            ...r,
            status: 'confirmed' as const,
            confirmedAt: new Date().toISOString()
          };
        }
        return r;
      });
      await saveDailyRecords(updated);
      setDailyRecords(updated.filter(r => r.studentId === studentId));
      alert('해당 기록이 승인되었습니다.');
    } catch (err) {
      console.error('Failed to confirm record:', err);
      alert('승인에 실패했습니다.');
    }
  };

  const handleLoadDraftForEdit = (rec: DailyRecord) => {
    setRecordDate(rec.date);
    setAtt(rec.attendance || '정상');
    setStudyMin(rec.studyMinutes);
    setRevStage(rec.reviewStage);
    setCompPlan(rec.completedPlan);
    setCond(rec.condition);
    setNote(rec.managerNote || '');
  };

  // 2. 플래너 셀 클릭 편집 개시
  const startEditCell = (cell: D21Cell) => {
    setEditingCell(cell);
    setCellSubjectStr(cell.subjects.join(', '));
    setCellTask(cell.task);
    setCellStage(cell.reviewStage);
    setCellDone(cell.done);
  };

  // 플래너 편집 저장 핸들러
  const handleSaveCell = async () => {
    if (!d21Plan || !editingCell) return;

    const updatedCells = d21Plan.cells.map((c): D21Cell => {
      if (c.dDay === editingCell.dDay) {
        return {
          ...c,
          subjects: cellSubjectStr.split(',').map(s => s.trim()).filter(Boolean),
          task: cellTask,
          reviewStage: cellStage as 1 | 2 | 3 | null,
          done: cellDone,
        };
      }
      return c;
    });

    const updatedPlan: D21Plan = {
      ...d21Plan,
      cells: updatedCells,
    };

    try {
      const allPlans = await getD21Plans();
      const filtered = allPlans.filter(p => p.studentId !== studentId);
      await saveD21Plans([...filtered, updatedPlan]);
      setD21Plan(updatedPlan);
      
      setEditingCell(null);
      alert('해당 날짜 계획이 수정되었습니다.');
    } catch (err) {
      console.error('Failed to save planner cell:', err);
    }
  };

  // 3. N회독 체크박스 값 변경 핸들러
  const handleTrackerCheck = async (subjectName: string, stage: 1 | 2 | 3, value: boolean) => {
    if (!tracker) return;

    const updatedItems = tracker.items.map((item): ReviewItem => {
      if (item.subject === subjectName) {
        return {
          ...item,
          stage1Done: stage === 1 ? value : item.stage1Done,
          stage2Done: stage === 2 ? value : item.stage2Done,
          stage3Done: stage === 3 ? value : item.stage3Done,
        };
      }
      return item;
    });

    const updatedTracker: ReviewTracker = {
      ...tracker,
      items: updatedItems,
    };

    try {
      const allTrackers = await getReviewTrackers();
      const filtered = allTrackers.filter(t => t.studentId !== studentId);
      await saveReviewTrackers([...filtered, updatedTracker]);
      setTracker(updatedTracker);
    } catch (err) {
      console.error('Failed to save review tracker check:', err);
    }
  };

  // N회독 새 자료 추가 핸들러
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tracker || !newSubject || !newMaterial) return;

    const newItem: ReviewItem = {
      subject: newSubject,
      material: newMaterial,
      stage1Done: false,
      stage2Done: false,
      stage3Done: false,
    };

    const updatedTracker: ReviewTracker = {
      ...tracker,
      items: [...tracker.items, newItem],
    };

    try {
      const allTrackers = await getReviewTrackers();
      const filtered = allTrackers.filter(t => t.studentId !== studentId);
      await saveReviewTrackers([...filtered, updatedTracker]);
      setTracker(updatedTracker);
      
      setNewSubject('');
      setNewMaterial('');
      alert('학습 교재가 추가되었습니다.');
    } catch (err) {
      console.error('Failed to add tracker item:', err);
    }
  };

  // N회독 교재 삭제 핸들러
  const handleDeleteMaterial = async (index: number) => {
    if (!tracker) return;
    if (!confirm('해당 교재를 트래커에서 삭제하시겠습니까?')) return;

    const updatedItems = [...tracker.items];
    updatedItems.splice(index, 1);

    const updatedTracker: ReviewTracker = {
      ...tracker,
      items: updatedItems,
    };

    try {
      const allTrackers = await getReviewTrackers();
      const filtered = allTrackers.filter(t => t.studentId !== studentId);
      await saveReviewTrackers([...filtered, updatedTracker]);
      setTracker(updatedTracker);
    } catch (err) {
      console.error('Failed to delete tracker item:', err);
    }
  };

  // Build 주간 격자 셀 수정 핸들러
  const handleUpdateBuildCell = async (weekNo: number, subject: string, field: 'reviewGoal' | 'material' | 'done', value: string | number | boolean) => {
    if (!buildPlan) return;

    const updatedWeeks = buildPlan.weeks.map((week): BuildWeek => {
      if (week.weekNo === weekNo) {
        const updatedCells = week.cells.map((cell): BuildCell => {
          if (cell.subject === subject) {
            return {
              ...cell,
              [field]: value
            };
          }
          return cell;
        });
        return {
          ...week,
          cells: updatedCells
        };
      }
      return week;
    });

    const updatedPlan: BuildPlan = {
      ...buildPlan,
      weeks: updatedWeeks
    };

    try {
      const allBuildPlans = await getBuildPlans();
      const filtered = allBuildPlans.filter(p => p.studentId !== studentId);
      await saveBuildPlans([...filtered, updatedPlan]);
      setBuildPlan(updatedPlan);
    } catch (err) {
      console.error('Failed to update build plan cell:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header title={`${student.name} 상세 관리`} />
      <SectionNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-4">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push('/students')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-normal mb-4 no-print"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          학생 목록으로 돌아가기
        </button>

        {/* 상단: 학생 기본 정보 요약 패널 */}
        <div className="bg-white border border-[#E5E1DA] rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
            <span className="text-base font-medium text-slate-900">{student.name}</span>
            <span className="text-xs text-slate-400 mt-1">{student.school} · {student.grade}</span>
            <span className="text-[10px] text-slate-500 font-normal mt-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
              메모: {student.memo || '없음'}
            </span>
          </div>

          <div className="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
            <span className="text-xs text-slate-400">현재 사이클</span>
            <span className="text-lg font-medium text-slate-800 mt-1">{getDDayString()}</span>
            <span className="text-[10px] text-slate-400 font-normal mt-1">시험일: {exam?.examDate || '미정'}</span>
          </div>

          <div className="flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
            <span className="text-xs text-slate-400">역산 플랜 진척률</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-medium text-slate-800">{calculatePlannerProgress()}%</span>
              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden max-w-24">
                <div className="bg-green-500 h-full" style={{ width: `${calculatePlannerProgress()}%` }}></div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-normal mt-1">D-21 기준 완수율</span>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-xs text-slate-400">최근 출석률 (7일)</span>
            <span className="text-lg font-medium text-slate-800 mt-1">{calculateAttendance()}%</span>
            <span className="text-[10px] text-slate-400 font-normal mt-1">결석 제외 일일 출결 비율</span>
          </div>
        </div>

        {/* 탭 컨트롤바 */}
        <div className="flex border-b border-[#E5E1DA] mb-4 gap-1 no-print">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1 px-4 py-2.5 text-xs font-normal border-b-2 -mb-[2px] transition-all ${
              activeTab === 'daily'
                ? 'border-slate-800 text-slate-850 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>일일 기록 입력</span>
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-1 px-4 py-2.5 text-xs font-normal border-b-2 -mb-[2px] transition-all ${
              activeTab === 'planner'
                ? 'border-slate-800 text-slate-850 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>D-21 역산 플래너</span>
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1 px-4 py-2.5 text-xs font-normal border-b-2 -mb-[2px] transition-all ${
              activeTab === 'tracker'
                ? 'border-slate-800 text-slate-850 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>N회독 트래커</span>
          </button>
        </div>

        {/* 탭 본문 영역 */}
        {activeTab === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 좌측: 기록 입력 폼 */}
            <div className="lg:col-span-1 bg-white border border-[#E5E1DA] rounded-xl p-4">
              <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">일일 일지 기록</span>
              
              <form onSubmit={handleDailySubmit} className="flex flex-col gap-3 text-xs font-normal">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">날짜 선택</label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">출결 상태</label>
                  <select
                    value={att}
                    onChange={(e) => setAtt(e.target.value as Attendance)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    <option value="정상">정상 등원</option>
                    <option value="지각">지각 등원</option>
                    <option value="외출">외출/조퇴</option>
                    <option value="결석">결석</option>
                  </select>
                </div>

                {att !== '결석' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-500">학습 시간(분)</label>
                      <input
                        type="number"
                        min={0}
                        max={1440}
                        value={studyMin}
                        onChange={(e) => setStudyMin(Number(e.target.value))}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-slate-500">오늘 회독 단계</label>
                      <select
                        value={revStage}
                        onChange={(e) => setRevStage(Number(e.target.value) as 1 | 2 | 3)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                      >
                        <option value={1}>1회독 (개념/이해)</option>
                        <option value={2}>2회독 (문제풀이/오답)</option>
                        <option value={3}>3회독 (암기/요약)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between border border-slate-100 p-2 rounded-lg bg-slate-50">
                      <label className="text-slate-500">오늘 목표 계획 완수</label>
                      <input
                        type="checkbox"
                        checked={compPlan}
                        onChange={(e) => setCompPlan(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-800 focus:ring-0 focus:outline-none accent-slate-800"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-slate-500">오늘 학생 컨디션 ({cond}/5점)</label>
                      <div className="flex items-center gap-1 bg-[#FAF9F6] p-2 border border-slate-200 rounded-lg">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCond(i + 1)}
                            className={`p-1 rounded transition-colors ${
                              cond === i + 1 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">매니저 관찰 및 피드백 메모</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] h-16 resize-none"
                    placeholder="오늘 학생의 행동, 졸음, 학습 태도 등을 기재"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2 text-center text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  기록 저장하기
                </button>
              </form>
            </div>

            {/* 우측: 기존 입력 히스토리 */}
            <div className="lg:col-span-2 bg-white border border-[#E5E1DA] rounded-xl p-4">
              <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">최근 학습 입력 히스토리</span>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-normal">
                      <th className="py-2 px-1">날짜</th>
                      <th className="py-2 px-1">출결</th>
                      <th className="py-2 px-1">학습 시간</th>
                      <th className="py-2 px-1 text-center">계획 완수</th>
                      <th className="py-2 px-1">컨디션</th>
                      <th className="py-2 px-1">매니저 메모</th>
                      <th className="py-2 px-1 text-center w-28">상태 및 승인</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 font-normal">
                          아직 기록된 일일 일지가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      [...dailyRecords]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((rec) => (
                          <tr key={rec.id} className="border-b border-slate-100 text-slate-700">
                            <td className="py-2 px-1 font-medium">{rec.date}</td>
                            <td className="py-2 px-1">
                              <span className={`px-1 rounded text-[10px] ${
                                rec.attendance === '정상' ? 'bg-green-150 text-green-700' :
                                rec.attendance === '결석' ? 'bg-red-150 text-red-700' :
                                'bg-amber-150 text-amber-700'
                              }`}>
                                {rec.attendance}
                              </span>
                            </td>
                            <td className="py-2 px-1">{rec.attendance === '결석' ? '-' : `${rec.studyMinutes}분`}</td>
                            <td className="py-2 px-1 text-center">
                              {rec.attendance === '결석' ? '-' : rec.completedPlan ? (
                                <span className="text-green-600 font-medium">완수</span>
                              ) : (
                                <span className="text-red-500 font-normal">미완수</span>
                              )}
                            </td>
                            <td className="py-2 px-1">
                              {rec.attendance === '결석' ? '-' : `${rec.condition} / 5`}
                            </td>
                            <td className="py-2 px-1 max-w-[150px] truncate" title={rec.managerNote}>
                              {rec.managerNote || '-'}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {rec.status === 'draft' ? (
                                <div className="flex items-center justify-center gap-1 no-print">
                                  <button
                                    onClick={() => handleConfirmRecord(rec)}
                                    className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] hover:bg-slate-700 font-medium active:scale-95 transition-all"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => handleLoadDraftForEdit(rec)}
                                    className="px-1.5 py-0.5 bg-white border border-slate-250 text-slate-650 rounded text-[10px] hover:bg-slate-50 font-medium"
                                  >
                                    수정
                                  </button>
                                </div>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-green-50 border border-green-150 text-green-700 text-[10px] rounded font-semibold">
                                  확정
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="flex flex-col gap-4">
            {/* 서브 탭 셀렉터 */}
            <div className="flex border-b border-[#E5E1DA] gap-1 bg-white p-2 rounded-xl border no-print">
              <button
                type="button"
                onClick={() => setSubTab('build')}
                className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${
                  subTab === 'build'
                    ? 'bg-slate-800 text-white font-medium shadow'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Build 주간 계획 (D-22 이상)
              </button>
              <button
                type="button"
                onClick={() => setSubTab('race')}
                className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${
                  subTab === 'race'
                    ? 'bg-slate-800 text-white font-medium shadow'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Race D-21 계획 (D-21 ~ D-Day)
              </button>
            </div>

            {/* Build 주간 계획 격자 */}
            {subTab === 'build' && (
              <div className="w-full">
                {!buildPlan || buildPlan.weeks.length === 0 ? (
                  <div className="bg-white border border-[#E5E1DA] rounded-xl p-8 text-center text-slate-400 font-normal">
                    주간 역산 계획 데이터가 없습니다. 시험 과목을 등록해 주세요.
                  </div>
                ) : (
                  <div className="bg-white border border-[#E5E1DA] rounded-xl p-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-normal">
                          <th className="py-2.5 px-2 w-48">주차 (Runway)</th>
                          {exam?.subjects.map(subject => (
                            <th key={subject} className="py-2.5 px-2 min-w-[200px]">{subject}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {buildPlan.weeks.map(week => (
                          <tr key={week.weekNo} className="border-b border-slate-100 hover:bg-slate-50/40">
                            <td className="py-4 px-2 font-medium text-slate-700">
                              <div className="font-semibold text-slate-800">{week.weekNo}주차</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">D-{week.dDayStart} ~ D-{week.dDayEnd}</div>
                            </td>
                            {exam?.subjects.map(subject => {
                              const cell = week.cells.find(c => c.subject === subject);
                              
                              // 트래커 실적 확인
                              let trackerMatch = null;
                              let currentReview = '미완료';
                              if (tracker && cell && cell.material) {
                                trackerMatch = tracker.items.find(
                                  item => item.subject === subject && item.material.trim() === cell.material.trim()
                                );
                                if (trackerMatch) {
                                  if (trackerMatch.stage3Done) currentReview = '3회독 완료';
                                  else if (trackerMatch.stage2Done) currentReview = '2회독 완료';
                                  else if (trackerMatch.stage1Done) currentReview = '1회독 완료';
                                }
                              }

                              return (
                                <td key={subject} className="py-4 px-2">
                                  {cell ? (
                                    <div className="flex flex-col gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                                      {/* 상단: 목표 회독 드롭다운 & done 체크 */}
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-slate-400 font-medium">목표:</span>
                                          <select
                                            value={cell.reviewGoal}
                                            onChange={(e) => handleUpdateBuildCell(week.weekNo, subject, 'reviewGoal', Number(e.target.value) as 1 | 2 | 3)}
                                            className="px-1.5 py-0.5 border border-slate-250 rounded text-[10px] focus:outline-none focus:border-slate-400 bg-white font-normal"
                                          >
                                            <option value={1}>1회독 (개념)</option>
                                            <option value={2}>2회독 (문제)</option>
                                            <option value={3}>3회독 (암기)</option>
                                          </select>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            checked={cell.done}
                                            onChange={(e) => handleUpdateBuildCell(week.weekNo, subject, 'done', e.target.checked)}
                                            className="w-3.5 h-3.5 rounded text-slate-800 focus:ring-0 focus:outline-none accent-slate-800 cursor-pointer"
                                          />
                                          <span className="text-[10px] text-slate-500 font-medium">완료</span>
                                        </div>
                                      </div>

                                      {/* 중단: 교재 입력 */}
                                      <input
                                        type="text"
                                        value={cell.material}
                                        onChange={(e) => handleUpdateBuildCell(week.weekNo, subject, 'material', e.target.value)}
                                        placeholder="교재/프린트명"
                                        className="px-2 py-1 border border-slate-200 rounded text-[10px] focus:outline-none focus:border-slate-400 bg-white w-full font-normal"
                                      />

                                      {/* 하단: 실적 매핑 표시 */}
                                      <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-normal">
                                        <span className="text-slate-400">N회독 실적:</span>
                                        {cell.material ? (
                                          trackerMatch ? (
                                            <span className={`font-semibold ${currentReview !== '미완료' ? 'text-indigo-600' : 'text-slate-400'}`}>
                                              {currentReview}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400 italic">트래커 미연동</span>
                                          )
                                        ) : (
                                          <span className="text-slate-400 italic">교재 미지정</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-450 italic text-[10px]">계획 없음</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Race D-21 계획 (기존 일일 그리드 & 개별 격자 상세 편집) */}
            {subTab === 'race' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 좌측/중간: D-21 달력형 플래너 그리드 */}
                <div className="lg:col-span-2 bg-white border border-[#E5E1DA] rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="font-medium text-slate-800 text-xs">D-21 역산 플래너 그리드 (LETS 리버스 캘린더)</span>
                    <span className="text-[10px] text-slate-400">격자 칸을 클릭하여 세부 계획을 편집하세요.</span>
                  </div>

                  {!d21Plan ? (
                    <div className="py-12 text-center text-slate-400 font-normal">
                      아직 구성된 D-21 플래너가 없습니다. 학생 등록 시 설정된 시험일을 기반으로 생성됩니다.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {d21Plan.cells.map((cell) => (
                        <div
                          key={cell.dDay}
                          onClick={() => startEditCell(cell)}
                          className={`flex flex-col justify-between border p-2 rounded-lg cursor-pointer transition-all text-[11px] min-h-[75px] ${
                            cell.done
                              ? 'bg-green-50 border-green-200 text-[#065F46]'
                              : cell.dDay === 0
                              ? 'bg-red-50 border-red-200 text-[#9B1C1C]'
                              : 'bg-[#FAF9F6] border-slate-200 hover:border-slate-400 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1 opacity-80">
                            <span className="font-medium">
                              {cell.dDay === 0 ? 'D-Day' : `D-${cell.dDay}`}
                            </span>
                            <span className="text-[9px] scale-90 origin-right">
                              {cell.date.split('-')[2]}일
                            </span>
                          </div>

                          <div className="flex-1 line-clamp-2 leading-snug font-normal opacity-90">
                            {cell.subjects.length > 0 && (
                              <span className="font-medium inline-block mr-1">
                                [{cell.subjects.join('/')}]
                              </span>
                            )}
                            {cell.task || '계획 없음'}
                          </div>

                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100/50 text-[9px] opacity-75">
                            <span>{cell.reviewStage ? `${cell.reviewStage}회독` : '-'}</span>
                            <span className="font-medium">
                              {cell.done ? '✓ 완수' : '대기'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 우측: 셀 편집 폼 */}
                <div className="lg:col-span-1 bg-white border border-[#E5E1DA] rounded-xl p-4">
                  <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">개별 격자 상세 편집</span>

                  {editingCell ? (
                    <div className="flex flex-col gap-3 text-xs font-normal">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-1">
                        <span className="font-medium text-slate-800 block text-xs">
                          {editingCell.dDay === 0 ? 'D-Day (시험일)' : `시험 대비 D-${editingCell.dDay}`}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">날짜: {editingCell.date}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-slate-500">배치 과목 (쉼표 구분)</label>
                        <input
                          type="text"
                          value={cellSubjectStr}
                          onChange={(e) => setCellSubjectStr(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                          placeholder="수학, 영어"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-slate-500">수행 과제 / 할 일</label>
                        <textarea
                          value={cellTask}
                          onChange={(e) => setCellTask(e.target.value)}
                          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] h-16 resize-none"
                          placeholder="기출 단원 풀이 및 오답"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-slate-500">지정 회독 단계</label>
                        <select
                          value={cellStage === null ? '' : cellStage}
                          onChange={(e) => setCellStage(e.target.value ? Number(e.target.value) : null)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                        >
                          <option value="">없음 / 미지정</option>
                          <option value={1}>1회독 (개념)</option>
                          <option value={2}>2회독 (문제풀이)</option>
                          <option value={3}>3회독 (암기단권화)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between border border-slate-100 p-2 rounded-lg bg-slate-50">
                        <label className="text-slate-500">일정 수행 완료 체크</label>
                        <input
                          type="checkbox"
                          checked={cellDone}
                          onChange={(e) => setCellDone(e.target.checked)}
                          className="w-4 h-4 rounded text-slate-800 focus:ring-0 focus:outline-none accent-slate-800"
                        />
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setEditingCell(null)}
                          className="flex-1 py-2 text-center text-xs font-normal text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCell}
                          className="flex-1 py-2 text-center text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          계획 변경 저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-normal border border-dashed border-slate-200 rounded-xl">
                      격자에서 수정하고 싶은 D-Day 카드를 클릭하면 상세 편집 창이 로드됩니다.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 좌측/중간: N회독 관리 테이블 */}
            <div className="lg:col-span-2 bg-white border border-[#E5E1DA] rounded-xl p-4">
              <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">과목별 핵심 교재 N회독 점검</span>

              {!tracker || tracker.items.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-normal">
                  아직 등록된 교재 자료가 없습니다. 우측 추가 폼에서 학습 교재를 추가해 주세요.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-normal">
                        <th className="py-2.5 px-2">과목</th>
                        <th className="py-2.5 px-2">학습 교재 / 프린트명</th>
                        <th className="py-2.5 px-2 text-center w-20">1회독 (개념)</th>
                        <th className="py-2.5 px-2 text-center w-20">2회독 (문제)</th>
                        <th className="py-2.5 px-2 text-center w-20">3회독 (암기)</th>
                        <th className="py-2.5 px-2 text-center w-12">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracker.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 text-slate-700 font-normal">
                          <td className="py-2.5 px-2 font-medium">{item.subject}</td>
                          <td className="py-2.5 px-2 text-slate-650">{item.material}</td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.stage1Done}
                              onChange={(e) => handleTrackerCheck(item.subject, 1, e.target.checked)}
                              className="w-4 h-4 rounded text-slate-800 focus:ring-0 focus:outline-none accent-slate-800"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.stage2Done}
                              disabled={!item.stage1Done} // 1회독 완료 전 2회독 불가 유도
                              onChange={(e) => handleTrackerCheck(item.subject, 2, e.target.checked)}
                              className="w-4 h-4 rounded text-slate-800 focus:ring-0 focus:outline-none accent-slate-800 disabled:opacity-30"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.stage3Done}
                              disabled={!item.stage2Done} // 2회독 완료 전 3회독 불가 유도
                              onChange={(e) => handleTrackerCheck(item.subject, 3, e.target.checked)}
                              className="w-4 h-4 rounded text-slate-800 focus:ring-0 focus:outline-none accent-slate-800 disabled:opacity-30"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleDeleteMaterial(index)}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 우측: 새 교재 추가 폼 */}
            <div className="lg:col-span-1 bg-white border border-[#E5E1DA] rounded-xl p-4">
              <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">학습 자료 교재 추가</span>

              <form onSubmit={handleAddMaterial} className="flex flex-col gap-3 text-xs font-normal">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">과목명 *</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    placeholder="예: 수학, 영어, 독서 등"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">교재/자료명 *</label>
                  <input
                    type="text"
                    required
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    placeholder="예: 쎈 수학, 학교 프린트물"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2 text-center text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 교재 추가</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
