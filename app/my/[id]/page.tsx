'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Smile, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  ClipboardList,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  PenTool
} from 'lucide-react';
import { getStudents, getDailyRecords, saveDailyRecords } from '../../../lib/storage';
import { Student, DailyRecord, Attendance } from '../../../types';

export default function StudentDraftInputPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2026-05-27은 중고등 시스템의 기준 "오늘" 날짜
  const TODAY_DATE = '2026-05-27';

  // 입력 필드 상태
  const [studyMinutes, setStudyMinutes] = useState<number>(240);
  const [reviewStage, setReviewStage] = useState<1 | 2 | 3>(1);
  const [completedPlan, setCompletedPlan] = useState<boolean>(true);
  const [condition, setCondition] = useState<number>(3);
  const [studentMemo, setStudentMemo] = useState<string>('');
  
  // 기존 기록 상태
  const [existingRecord, setExistingRecord] = useState<DailyRecord | null>(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const students = await getStudents();
        const found = students.find(s => s.id === studentId);
        if (!found) {
          setLoading(false);
          return;
        }
        setStudent(found);

        const allRecords = await getDailyRecords();
        const todayRec = allRecords.find(r => r.studentId === studentId && r.date === TODAY_DATE);
        
        if (todayRec) {
          setExistingRecord(todayRec);
          setStudyMinutes(todayRec.studyMinutes);
          setReviewStage(todayRec.reviewStage);
          setCompletedPlan(todayRec.completedPlan);
          setCondition(todayRec.condition);
          setStudentMemo(todayRec.managerNote || ''); // 학생 메모는 managerNote에 보관
        }
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, [studentId]);

  const handleStudyMinutesChange = (value: number) => {
    if (existingRecord?.status === 'confirmed') return;
    setStudyMinutes(Math.max(0, Math.min(1440, value)));
  };

  const handleQuickAdd = (mins: number) => {
    if (existingRecord?.status === 'confirmed') return;
    setStudyMinutes(prev => Math.max(0, Math.min(1440, prev + mins)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingRecord?.status === 'confirmed') return;
    setIsSubmitting(true);

    const recordId = `dr_${studentId.split('_')[1]}_${TODAY_DATE.replace(/-/g, '')}`;
    const newRecord: DailyRecord = {
      id: recordId,
      studentId,
      date: TODAY_DATE,
      attendance: existingRecord ? existingRecord.attendance : '정상' as Attendance, // 학생 입력 시 출결은 기존 값을 가져오거나 정상 기본값
      studyMinutes,
      reviewStage,
      completedPlan,
      condition: condition as 1 | 2 | 3 | 4 | 5,
      managerNote: studentMemo, // 학생 한 줄 메모 재사용
      status: 'draft',
      submittedBy: 'student',
    };

    try {
      const allRecords = await getDailyRecords();
      const filtered = allRecords.filter(r => !(r.studentId === studentId && r.date === TODAY_DATE));
      const updated = [newRecord, ...filtered];
      
      await saveDailyRecords(updated);
      setExistingRecord(newRecord);
      alert('오늘의 학습 초안 기록이 저장되었습니다! 매니저 확인 후 확정됩니다.');
    } catch (err) {
      console.error('Failed to save student draft:', err);
      alert('기록 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        학생 정보 불러오는 중...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-2" />
        <span className="text-sm font-medium text-slate-800">학생 정보가 존재하지 않습니다.</span>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-700 transition-colors"
        >
          대시보드로 이동
        </button>
      </div>
    );
  }

  const isConfirmed = existingRecord?.status === 'confirmed';

  // 컨디션 이모지 매핑
  const emojis = [
    { score: 1, char: '😞', label: '피곤해요' },
    { score: 2, char: '😐', label: '그저래요' },
    { score: 3, char: '🙂', label: '보통임다' },
    { score: 4, char: '😊', label: '집중잘됨' },
    { score: 5, char: '🤩', label: '완전최상' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center pb-12 font-sans selection:bg-slate-850 selection:text-white">
      {/* 모바일 상단 바 */}
      <header className="w-full max-w-md bg-white border-b border-[#E5E1DA] px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-slate-800">에듀링크 중고등 콘솔 (학생용)</span>
        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
          {student.name[0]}
        </div>
      </header>

      {/* 메인 폼 컨테이너 */}
      <main className="w-full max-w-md px-4 mt-6">
        {/* 학생 소개 카드 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden mb-6">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <PenTool className="w-32 h-32" />
          </div>
          <span className="text-[10px] bg-slate-700/50 px-2 py-0.5 rounded-full font-medium tracking-wider text-slate-200">
            {student.school} · {student.grade}
          </span>
          <h2 className="text-xl font-bold mt-2 flex items-center gap-1">
            {student.name} <span className="text-sm font-normal text-slate-350">학생 반갑습니다!</span>
          </h2>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            오늘 공부한 내용을 적어주세요. 제출하신 내용은 담당 매니저 선생님의 검토 후 확정됩니다.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-300">작성 기준 날짜</span>
            <span className="text-xs font-bold text-slate-100 bg-slate-850 px-2.5 py-1 rounded-lg">
              2026.05.27 (월)
            </span>
          </div>
        </div>

        {/* 상태 안내 배지 */}
        {isConfirmed ? (
          <div className="bg-[#ECFDF5] border border-green-200 text-[#065F46] rounded-xl p-4 mb-6 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold">매니저 확인 완료</h4>
              <p className="text-[10px] text-[#047857] mt-0.5 leading-relaxed">
                오늘 일지가 매니저 선생님에 의해 승인(확정)되었습니다. 추가 수정은 선생님께 요청해 주세요.
              </p>
            </div>
          </div>
        ) : existingRecord ? (
          <div className="bg-[#FEF3C7] border border-amber-200 text-[#92400E] rounded-xl p-4 mb-6 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold">승인 대기 중인 초안</h4>
              <p className="text-[10px] text-[#B45309] mt-0.5 leading-relaxed">
                이미 오늘 기록 초안을 제출하셨습니다. 매니저 선생님이 승인하기 전까지는 언제든 수정할 수 있습니다.
              </p>
            </div>
          </div>
        ) : null}

        {/* 입력 양식 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* 1. 학습 시간 */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>오늘 총 순공 시간 (학습 시간)</span>
            </label>
            
            <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <button
                type="button"
                onClick={() => handleQuickAdd(-30)}
                disabled={isConfirmed}
                className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-650 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-40"
              >
                -30
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={studyMinutes}
                  onChange={(e) => handleStudyMinutesChange(Number(e.target.value))}
                  disabled={isConfirmed}
                  className="w-20 text-center font-bold text-lg text-slate-800 focus:outline-none bg-transparent"
                  min={0}
                  max={1440}
                />
                <span className="text-xs text-slate-500 font-semibold ml-0.5">분</span>
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  ({Math.floor(studyMinutes / 60)}시간 {studyMinutes % 60}분)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickAdd(30)}
                disabled={isConfirmed}
                className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-650 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-40"
              >
                +30
              </button>
            </div>

            {/* 빠른 누적 버튼 (모바일용 큰 터치 타깃) */}
            <div className="grid grid-cols-3 gap-2 mt-3 no-print">
              <button
                type="button"
                onClick={() => handleQuickAdd(60)}
                disabled={isConfirmed}
                className="py-2 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-150 transition-colors disabled:opacity-40"
              >
                + 1시간
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(120)}
                disabled={isConfirmed}
                className="py-2 text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-150 transition-colors disabled:opacity-40"
              >
                + 2시간
              </button>
              <button
                type="button"
                onClick={() => setStudyMinutes(240)}
                disabled={isConfirmed}
                className="py-2 text-[11px] font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-150 transition-colors disabled:opacity-40"
              >
                기본 (4h)
              </button>
            </div>
          </div>

          {/* 2. 회독 단계 */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>오늘 주로 공부한 회독 단계</span>
            </label>
            
            <div className="flex flex-col gap-2">
              {[
                { value: 1, label: '1회독 (개념/이해)', desc: '교과서/인강 개념 정리 및 이해 중심' },
                { value: 2, label: '2회독 (문제풀이/오답)', desc: '본격 유형 문제 풀이 및 틀린 문항 분석' },
                { value: 3, label: '3회독 (암기/단권화)', desc: '핵심 요약 백지 쓰기, 기출 단권화 암기' }
              ].map((stage) => {
                const selected = reviewStage === stage.value;
                return (
                  <button
                    key={stage.value}
                    type="button"
                    disabled={isConfirmed}
                    onClick={() => setReviewStage(stage.value as 1 | 2 | 3)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      selected 
                        ? 'bg-slate-800 border-slate-800 text-white shadow-sm' 
                        : 'bg-[#FAF9F6] border-slate-200 text-slate-700 hover:border-slate-350'
                    } disabled:opacity-60`}
                  >
                    <span className="text-xs font-bold">{stage.label}</span>
                    <span className={`text-[10px] mt-0.5 font-normal ${selected ? 'text-slate-300' : 'text-slate-450'}`}>
                      {stage.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 오늘 계획 완수 여부 */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col">
                <span>오늘 계획 완수 완료</span>
                <span className="text-[10px] text-slate-400 font-normal mt-0.5">매니저님이 지정한 일일 플랜 전부 수행 여부</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isConfirmed}
              onClick={() => setCompletedPlan(prev => !prev)}
              className={`w-14 h-8 rounded-full transition-all relative p-1 ${
                completedPlan ? 'bg-slate-800' : 'bg-slate-200'
              } disabled:opacity-50`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-all shadow-md flex items-center justify-center text-[10px] font-bold ${
                completedPlan ? 'translate-x-6 text-slate-800' : 'translate-x-0 text-slate-400'
              }`}>
                {completedPlan ? 'O' : 'X'}
              </div>
            </button>
          </div>

          {/* 4. 컨디션 */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
              <Smile className="w-4 h-4 text-slate-500" />
              <span>오늘 나의 학습 컨디션 / 집중도</span>
            </label>
            
            <div className="grid grid-cols-5 gap-2 text-center">
              {emojis.map((emoji) => {
                const selected = condition === emoji.score;
                return (
                  <button
                    key={emoji.score}
                    type="button"
                    disabled={isConfirmed}
                    onClick={() => setCondition(emoji.score)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                      selected 
                        ? 'bg-slate-800 border-slate-800 text-white scale-105' 
                        : 'bg-[#FAF9F6] border-slate-200 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    <span className="text-xl">{emoji.char}</span>
                    <span className={`text-[9px] mt-1 whitespace-nowrap ${selected ? 'font-semibold text-slate-100' : 'text-slate-450'}`}>
                      {emoji.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 한 줄 메모 */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>한 줄 메모 (공부 소감, 질문 사항 등)</span>
            </label>
            
            <textarea
              value={studentMemo}
              onChange={(e) => setStudentMemo(e.target.value)}
              disabled={isConfirmed}
              rows={3}
              maxLength={150}
              placeholder="예: 오늘 영어 수능특강 12강 오답 정리 끝냈습니다. 수학 오답은 내일 마저 진행할게요!"
              className="w-full bg-[#FAF9F6] rounded-xl border border-slate-200 p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors resize-none leading-relaxed disabled:opacity-60"
            />
            <div className="text-right text-[9px] text-slate-400 mt-1">
              {studentMemo.length} / 150자
            </div>
          </div>

          {/* 저장 및 제출 버튼 */}
          {!isConfirmed && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-800 text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:bg-slate-700 hover:shadow transition-all active:scale-[0.99] text-xs flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>기록 제출 중...</span>
              ) : (
                <>
                  <span>오늘 초안 기록 제출하기</span>
                </>
              )}
            </button>
          )}

          {isConfirmed && (
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full bg-slate-100 border border-slate-200 text-slate-650 font-semibold py-3.5 rounded-2xl hover:bg-slate-200 transition-all text-xs text-center"
            >
              대시보드로 돌아가기
            </button>
          )}

        </form>
      </main>
    </div>
  );
}
