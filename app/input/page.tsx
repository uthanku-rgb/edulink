'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import { 
  getDailyCards, 
  saveDailyCards, 
  getPillarSchedule, 
  seedElementaryMockDataIfEmpty 
} from '../../lib/storage';
import { mockElementaryStudents } from '../../data/mockData';
import { DailyCard, ElementaryStudent, Pillar, ElementaryPhase, PillarSchedule } from '../../types';
import { Check, ClipboardList, AlertCircle, X, HelpCircle } from 'lucide-react';

export default function InputPage() {
  const [students] = useState<ElementaryStudent[]>(mockElementaryStudents);
  const [dailyCards, setDailyCards] = useState<DailyCard[]>([]);
  const [pillarSchedule, setPillarSchedule] = useState<PillarSchedule | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<ElementaryStudent | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 입력용 상태
  const [attendance, setAttendance] = useState<'정상' | '지각' | '결석'>('정상');
  const [phases, setPhases] = useState<Record<ElementaryPhase, boolean>>({
    P1: false,
    P2: false,
    P3: false,
    P4: false
  });
  const [helpPointInput, setHelpPointInput] = useState('');
  const [helpPoints, setHelpPoints] = useState<string[]>([]);
  const [condition, setCondition] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [coachNote, setCoachNote] = useState('');

  // 오늘 날짜 계산 (시스템의 로컬 타임존 반영 포맷)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayStr = getTodayString();

  // 요일 구하기
  const getWeekdayString = (): '월'|'화'|'수'|'목'|'금' => {
    const d = new Date();
    const day = d.getDay(); // 0: 일, 1: 월 ... 6: 토
    const map: Record<number, '월'|'화'|'수'|'목'|'금'> = {
      1: '월',
      2: '화',
      3: '수',
      4: '목',
      5: '금'
    };
    // 토/일요일이면 금요일 또는 월요일로 대체
    return map[day] || '금';
  };

  const todayWeekday = getWeekdayString();

  useEffect(() => {
    const initData = async () => {
      try {
        await seedElementaryMockDataIfEmpty();
        setDailyCards(getDailyCards());
        setPillarSchedule(getPillarSchedule());
      } catch (error) {
        console.error('초등 입력 화면 초기 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const getPillarToday = (): Pillar => {
    if (!pillarSchedule) return '수학';
    return pillarSchedule.byWeekday[todayWeekday] || '수학';
  };

  // 학생 선택 시 모달 오픈 및 기존 입력값 로드
  const handleSelectStudent = (student: ElementaryStudent) => {
    setSelectedStudent(student);
    
    // 오늘 입력된 카드가 있는지 확인
    const existingCard = dailyCards.find(
      (c) => c.studentId === student.id && c.date === todayStr
    );

    if (existingCard) {
      setAttendance(existingCard.attendance);
      setPhases({ ...existingCard.phasesDone });
      setHelpPoints([...existingCard.helpPoints]);
      setCondition(existingCard.condition);
      setCoachNote(existingCard.coachNote || '');
    } else {
      // 기본값 설정
      setAttendance('정상');
      setPhases({
        P1: false,
        P2: false,
        P3: false,
        P4: false
      });
      setHelpPoints([]);
      setCondition(4);
      setCoachNote('');
    }
  };

  // 도움 포인트 추가
  const handleAddHelpPoint = () => {
    if (helpPointInput.trim() === '') return;
    if (helpPoints.includes(helpPointInput.trim())) return;
    setHelpPoints([...helpPoints, helpPointInput.trim()]);
    setHelpPointInput('');
  };

  // 도움 포인트 삭제
  const handleRemoveHelpPoint = (index: number) => {
    setHelpPoints(helpPoints.filter((_, i) => i !== index));
  };

  // 저장 처리
  const handleSave = () => {
    if (!selectedStudent) return;

    const pillarToday = getPillarToday();
    const cardId = `dc_${selectedStudent.id}_${todayStr.replace(/-/g, '')}`;

    const newCard: DailyCard = {
      id: cardId,
      studentId: selectedStudent.id,
      date: todayStr,
      attendance,
      phasesDone: phases,
      pillarToday,
      helpPoints,
      condition,
      coachNote: coachNote.trim() !== '' ? coachNote.trim() : undefined
    };

    // 기존 리스트에서 오늘 입력된 해당 학생 카드가 있으면 업데이트, 없으면 추가
    const updatedCards = dailyCards.filter(
      (c) => !(c.studentId === selectedStudent.id && c.date === todayStr)
    );
    updatedCards.push(newCard);

    setDailyCards(updatedCards);
    saveDailyCards(updatedCards);
    setSelectedStudent(null); // 모달 닫기
  };

  // 오늘 입력 완료 여부 확인
  const isCompletedToday = (studentId: string) => {
    return dailyCards.some((c) => c.studentId === studentId && c.date === todayStr);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        데이터 로드 중...
      </div>
    );
  }

  const pillarToday = getPillarToday();

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header 
        title="루틴 입력 (초등)" 
        studentCount={students.length} 
        managerName="루틴 서포터" 
        dateString={`${todayStr.replace(/-/g, '.')} (${todayWeekday})`} 
      />
      <SectionNav />

      <main className="flex-1 max-w-md w-full mx-auto px-4 mt-6">
        {/* 상단 안내 메시지 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3 text-slate-700">
          <ClipboardList className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-amber-900 mb-0.5">서포터 일일 루틴 입력</p>
            <p>담당 코호트 학생들의 오늘 루틴 진행도를 탭하여 3초 만에 기록하세요. 저장 즉시 대시보드 케어 시그널에 동기화됩니다.</p>
          </div>
        </div>

        {/* 오늘 기둥 정보 요약 */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-slate-400 text-xs">오늘의 학습 기둥 ({todayWeekday}요일)</span>
            <h3 className="text-lg font-bold text-slate-800 mt-0.5">{pillarToday} 클래스</h3>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-semibold border border-indigo-100">
            요일 자동 지정
          </span>
        </div>

        {/* 코호트 학생 리스트 */}
        <h2 className="text-sm font-semibold text-slate-500 mb-3 px-1">오늘 등록 대상 학생 ({students.length}명)</h2>
        <div className="grid grid-cols-2 gap-3">
          {students.map((student) => {
            const completed = isCompletedToday(student.id);
            const todayCard = dailyCards.find(c => c.studentId === student.id && c.date === todayStr);

            return (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className={`relative flex flex-col justify-between items-start text-left p-4 rounded-2xl border transition-all duration-150 active:scale-[0.98] h-32 ${
                  completed
                    ? 'bg-[#E8F1EA]/60 border-[#5E9E7E]/40 shadow-sm'
                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                {/* 완료 상태 체크 마크 */}
                {completed && (
                  <div className="absolute top-3 right-3 bg-[#5E9E7E] text-white rounded-full p-0.5">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                )}

                <div className="w-full">
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {student.school} · {student.grade}
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    {student.name}
                  </span>
                </div>

                <div className="w-full flex items-center justify-between mt-auto">
                  {completed && todayCard ? (
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        todayCard.attendance === '정상' ? 'bg-[#E8F1EA] text-[#2F5C46] border-[#5E9E7E]/30' :
                        todayCard.attendance === '지각' ? 'bg-[#FBF1DD] text-[#7A5A1E] border-[#C9962F]/30' :
                        'bg-[#FBEAE3] text-[#8A4B36] border-[#D98B6F]/30'
                      }`}>
                        {todayCard.attendance}
                      </span>
                      <span className="text-lg">
                        {todayCard.condition === 5 && '😀'}
                        {todayCard.condition === 4 && '🙂'}
                        {todayCard.condition === 3 && '😐'}
                        {todayCard.condition === 2 && '🙁'}
                        {todayCard.condition === 1 && '😢'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-slate-300" /> 입력 필요
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* 입력 모달 (포커스 타깃을 크게 구성한 모바일 최적화 레이아웃) */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center no-print">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto flex flex-col p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs text-slate-400">{selectedStudent.school} · {selectedStudent.grade}</span>
                <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name} 일일 기록</h3>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. 출결 선택 (큰 버튼 3개) */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 mb-2">오늘 출결</label>
              <div className="grid grid-cols-3 gap-2">
                {(['정상', '지각', '결석'] as const).map((type) => {
                  const isActive = attendance === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAttendance(type)}
                      className={`py-3.5 rounded-xl border text-sm font-semibold transition-all ${
                        isActive
                          ? type === '정상' ? 'bg-[#5E9E7E] border-[#5E9E7E] text-white shadow-sm' :
                            type === '지각' ? 'bg-[#C9962F] border-[#C9962F] text-white shadow-sm' :
                            'bg-[#D98B6F] border-[#D98B6F] text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. P1 ~ P4 단계 완수 토글 (큰 선택 영역) */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 mb-2">루틴 단계별 완수 여부</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'P1', label: 'P1 복습·발표' },
                  { key: 'P2', label: 'P2 워크샵' },
                  { key: 'P3', label: 'P3 메인 클래스' },
                  { key: 'P4', label: 'P4 자습' }
                ].map((item) => {
                  const isDone = phases[item.key as ElementaryPhase];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPhases({ ...phases, [item.key]: !isDone })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all h-20 ${
                        isDone
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 block mb-0.5">{item.key}</span>
                      <span className="text-xs">{item.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1.5 ${
                        isDone ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? '완수' : '미진행'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 오늘 기둥 정보 (읽기 전용) */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">오늘의 메인 기둥 (요일 자동 지정)</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-700 font-medium flex justify-between items-center text-sm">
                <span>{pillarToday} 클래스 ({todayWeekday}요일)</span>
                <span className="text-xs text-slate-400">읽기 전용</span>
              </div>
            </div>

            {/* 4. 도움 포인트 입력 (한 줄 리스트 형태) */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                도움 포인트 (도움이 필요한 점이 있다면 적어주세요)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="예: 나눗셈 개념 흔들림, 교재 없음 등"
                  value={helpPointInput}
                  onChange={(e) => setHelpPointInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHelpPoint();
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddHelpPoint}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-semibold border border-slate-200"
                >
                  추가
                </button>
              </div>

              {/* 추가된 도움 포인트 리스트 */}
              {helpPoints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {helpPoints.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-1 bg-[#FBEAE3] text-[#8A4B36] border border-[#D98B6F]/40 px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      <span>{item}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveHelpPoint(idx)}
                        className="hover:bg-coral-100 text-[#C2410C] rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. 컨디션 선택 (5개 이모지 버튼) */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 mb-2">컨디션 피드백</label>
              <div className="flex justify-between items-center gap-2">
                {[
                  { level: 1, emoji: '😢', label: '매우 지침' },
                  { level: 2, emoji: '🙁', label: '다소 피곤' },
                  { level: 3, emoji: '😐', label: '보통' },
                  { level: 4, emoji: '🙂', label: '좋음' },
                  { level: 5, emoji: '😀', label: '최상' }
                ].map((item) => {
                  const isSel = condition === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setCondition(item.level as 1 | 2 | 3 | 4 | 5)}
                      className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border transition-all ${
                        isSel
                          ? 'bg-amber-50 border-amber-400 font-bold scale-[1.03] shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-[9px] text-slate-400 mt-1 block">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. 매니저 관찰 메모 (코치 전달사항) */}
            <div className="mb-8">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">서포터 전달 코멘트 (선택)</label>
              <textarea
                placeholder="코치가 확인해야 할 중요한 내용이나 오늘 관찰 특이사항을 적어주세요."
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {/* 하단 제어 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
