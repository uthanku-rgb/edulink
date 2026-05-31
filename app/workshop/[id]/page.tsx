'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { mockWorkshops } from '../../../data/workshops';
import { mockElementaryStudents } from '../../../data/mockData';
import { getDailyCards, saveDailyCards, getPillarSchedule } from '../../../lib/storage';
import { DailyCard } from '../../../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Monitor, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  Trophy, 
  X
} from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function WorkshopDetailPage({ params }: PageProps) {
  const router = useRouter();
  
  // URL 디코딩
  const workshopId = decodeURIComponent(params.id);
  const workshop = mockWorkshops.find(w => w.id === workshopId);

  // 상태 관리
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showProjector, setShowProjector] = useState(false);
  const [presentDone, setPresentDone] = useState<Record<string, boolean>>({});
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [dailyCards, setDailyCards] = useState<DailyCard[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 오늘 날짜 계산
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
    const day = d.getDay();
    const map: Record<number, '월'|'화'|'수'|'목'|'금'> = {
      1: '월',
      2: '화',
      3: '수',
      4: '목',
      5: '금'
    };
    return map[day] || '금';
  };

  const todayWeekday = getWeekdayString();

  // 초기 마운트 시 데이터 로드
  useEffect(() => {
    setDailyCards(getDailyCards());
    
    // 발표 명단 초기화 (전부 미완료)
    const initialPresentMap: Record<string, boolean> = {};
    mockElementaryStudents.forEach(student => {
      initialPresentMap[student.id] = false;
    });
    setPresentDone(initialPresentMap);
  }, []);

  // 단계 이동 시 타이머 자동 세팅
  useEffect(() => {
    if (workshop && workshop.phases[currentPhaseIndex]) {
      setTimeLeft(workshop.phases[currentPhaseIndex].min * 60);
      setTimerRunning(false);
    }
  }, [currentPhaseIndex, workshop]);

  // 카운트다운 타이머 구동
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerRunning]);

  // Esc 키를 누르면 프로젝터 오버레이 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProjector(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!workshop) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center p-6 text-center font-gowun">
        <h2 className="text-xl font-jua text-[#283139] mb-4">워크샵을 찾을 수 없습니다.</h2>
        <button 
          onClick={() => router.push('/workshop')}
          className="bg-[#15756B] text-white px-6 py-2.5 rounded-xl font-bold text-sm"
        >
          워크샵 목록으로 이동
        </button>
      </div>
    );
  }

  const currentPhase = workshop.phases[currentPhaseIndex];

  // 타이머 시간 포맷 (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 타이머 제어 함수
  const startTimer = () => setTimerRunning(true);
  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(currentPhase.min * 60);
  };

  // 발표 토글 함수
  const toggleStudentPresent = (studentId: string) => {
    setPresentDone(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // 완료 학생 수 계산
  const checkedStudentsCount = Object.values(presentDone).filter(Boolean).length;
  const totalCohortCount = mockElementaryStudents.length;

  // 워크샵 완료 처리 및 DB 반영
  const handleFinishWorkshop = () => {
    const pillarSchedule = getPillarSchedule();
    const pillarToday = pillarSchedule.byWeekday[todayWeekday] || '토론';
    const updatedCards = [...dailyCards];

    mockElementaryStudents.forEach(student => {
      const isPresentDone = presentDone[student.id];
      if (isPresentDone) {
        // 기존 카드 탐색
        const cardIndex = updatedCards.findIndex(
          c => c.studentId === student.id && c.date === todayStr
        );

        if (cardIndex >= 0) {
          // 기존 카드 업데이트
          updatedCards[cardIndex] = {
            ...updatedCards[cardIndex],
            phasesDone: {
              ...updatedCards[cardIndex].phasesDone,
              P2: true
            }
          };
        } else {
          // 신규 카드 생성
          const cardId = `dc_${student.id}_${todayStr.replace(/-/g, '')}`;
          const newCard: DailyCard = {
            id: cardId,
            studentId: student.id,
            date: todayStr,
            attendance: '정상',
            phasesDone: {
              P1: false,
              P2: true, // 워크샵 완수
              P3: false,
              P4: false
            },
            pillarToday,
            helpPoints: [],
            condition: 4
          };
          updatedCards.push(newCard);
        }
      }
    });

    saveDailyCards(updatedCards);
    setDailyCards(updatedCards);
    setShowCompleteModal(true);
  };

  // 타이머 색상: 60초 이하면 부드러운 호박색(#D99B2B), 아니면 기본 차콜색(#283139)
  const timerColorClass = timeLeft <= 60 ? 'text-[#D99B2B]' : 'text-[#283139]';

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#283139] flex flex-col pb-12 font-gowun">
      {/* 헤더 */}
      <Header 
        title={workshop.title} 
        studentCount={totalCohortCount} 
        managerName="정수진 코치" 
        dateString={`${todayStr.replace(/-/g, '.')} (${todayWeekday})`} 
      />
      


      {/* 워크샵 메인 콘솔 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 mt-6">
        
        {/* 상단 브레드크럼 및 뒤로가기 */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => router.push('/workshop')}
            className="flex items-center gap-1 text-slate-500 hover:text-[#283139] text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            목록으로 돌아가기
          </button>
          <span className="text-xs text-[#15756B] bg-[#e4eff0] px-3 py-1 rounded-full font-bold">
            실시간 코칭 세션
          </span>
        </div>

        {/* 상단 단계 탭 (이름 + N분) */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-2.5 shadow-sm mb-6 flex overflow-x-auto gap-1">
          {workshop.phases.map((phase, idx) => {
            const isCurrent = idx === currentPhaseIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentPhaseIndex(idx)}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-center transition-all cursor-pointer ${
                  isCurrent 
                    ? 'bg-[#15756B] text-white font-bold shadow-sm' 
                    : 'bg-white hover:bg-slate-50 text-slate-500 font-medium'
                }`}
              >
                <span className="text-xs block">{phase.name}</span>
                <span className={`text-[10px] block mt-0.5 ${isCurrent ? 'text-teal-100' : 'text-slate-400'}`}>
                  {phase.min}분
                </span>
              </button>
            );
          })}
        </div>

        {/* 메인 2열 그리드 (좌측: 콘솔 및 타이머 / 우측: 발표체크 및 코치팁) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 좌측 메인 영역 (콘솔 상세 & 타이머) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* 타이머 카드 */}
            <div className="bg-white border border-slate-200/50 rounded-[20px] p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-400 font-medium mb-2">
                현재 단계 남은 시간 ({currentPhase.name})
              </span>
              
              {/* 대형 타이머 */}
              <div className={`text-6xl md:text-7xl font-jua tracking-wider ${timerColorClass} transition-colors duration-300 mb-6`}>
                {formatTime(timeLeft)}
              </div>
              
              {/* 제어 버튼 */}
              <div className="flex items-center gap-2 w-full max-w-sm">
                {!timerRunning ? (
                  <button
                    onClick={startTimer}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#15756B] hover:bg-[#0f574f] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    시작
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#D99B2B] hover:bg-[#b07d20] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    일시정지
                  </button>
                )}
                
                <button
                  onClick={resetTimer}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  리셋
                </button>
              </div>
            </div>

            {/* 본문 콘텐츠 카드 */}
            <div className="bg-white border border-slate-200/50 rounded-[20px] p-6 shadow-sm space-y-6">
              
              {/* 멘트: 이렇게 말하세요 */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-2.5">
                  📢 코치 멘트 (이렇게 말하세요)
                </h3>
                <div className="bg-[#e4eff0]/40 border-l-[4px] border-[#15756B] rounded-r-xl p-4 text-sm leading-relaxed text-[#283139] font-medium whitespace-pre-line">
                  &ldquo;{currentPhase.say}&rdquo;
                </div>
              </div>

              {/* 학생의 활동 */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 mb-2">
                  ✍️ 학생이 하는 활동
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 font-normal">
                  {currentPhase.students}
                </p>
              </div>

              {/* 하단 유틸리티 제어 */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                
                <button
                  onClick={() => setShowProjector(true)}
                  className="flex items-center gap-2 bg-[#283139] hover:bg-[#1a2025] text-white py-3 px-5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  <Monitor className="w-4 h-4" />
                  🖥️ 학생 화면에 보여주기
                </button>

                <div className="flex gap-2">
                  {currentPhaseIndex > 0 && (
                    <button
                      onClick={() => setCurrentPhaseIndex(prev => prev - 1)}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      이전 단계
                    </button>
                  )}

                  {currentPhaseIndex < workshop.phases.length - 1 ? (
                    <button
                      onClick={() => setCurrentPhaseIndex(prev => prev + 1)}
                      className="flex items-center gap-1 bg-[#15756B] hover:bg-[#0f574f] text-white py-3 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      다음 단계
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishWorkshop}
                      className="flex items-center gap-1.5 bg-[#15756B] hover:bg-[#0f574f] text-white py-3 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Trophy className="w-4 h-4 fill-white/10" />
                      워크샵 마치기
                    </button>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* 우측 사이드 영역 (발표명단 & 코치팁) */}
          <div className="flex flex-col gap-6">
            
            {/* 발표 명단 카드 (present === true 인 경우만 동작) */}
            {currentPhase.present ? (
              <div className="bg-white border border-slate-200/50 rounded-[20px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-[#283139] flex items-center gap-1.5">
                    📢 실시간 발표 체크
                  </h3>
                  <span className="text-xs bg-[#e4eff0] text-[#15756B] font-bold px-2 py-0.5 rounded-full">
                    {checkedStudentsCount} / {totalCohortCount}명 완료
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 leading-normal">
                  오늘 참석한 학생들의 이름을 누르면 발표 완료 상태로 토글됩니다. 워크샵 완료 시 오늘 루틴(P2)에 즉시 반영됩니다.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {mockElementaryStudents.map(student => {
                    const isDone = presentDone[student.id];
                    return (
                      <button
                        key={student.id}
                        onClick={() => toggleStudentPresent(student.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                          isDone 
                            ? 'bg-[#e4eff0] border-[#15756B] text-[#15756B] font-semibold' 
                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>{student.name}</span>
                        {isDone && <Check className="w-3.5 h-3.5 text-[#15756B]" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // 발표 단계가 아닐 때의 안내 플레이스홀더
              <div className="bg-white border border-slate-200/50 rounded-[20px] p-5 shadow-sm text-center py-8">
                <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-400 mb-1">발표 단계가 아닙니다</h4>
                <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
                  &ldquo;발표&rdquo; 단계로 이동하면 실시간 발표 체크리스트가 여기에 나타납니다.
                </p>
              </div>
            )}

            {/* 코치 팁 카드 */}
            <div className="bg-white border border-slate-200/50 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-xs font-bold text-[#15756B] flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                💡 코치 진행 팁
              </h3>
              <div className="text-xs leading-relaxed text-slate-600 whitespace-pre-line bg-[#fbfbf9] p-3.5 rounded-xl border border-slate-100">
                {currentPhase.tip}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* 🖥️ 학생 화면 (프로젝터/TV 모드) 전체화면 오버레이 */}
      {showProjector && (
        <div className="fixed inset-0 bg-[#FAF9F6] z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
          
          {/* 오버레이 닫기 버튼 */}
          <button
            onClick={() => setShowProjector(false)}
            className="absolute top-6 right-6 bg-[#283139]/10 hover:bg-[#283139]/20 text-[#283139] p-3 rounded-full transition-colors cursor-pointer"
            title="닫기 (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 중앙 콘텐츠 */}
          <div className="max-w-4xl w-full flex flex-col items-center justify-center">
            
            {/* 현재 상단 테마 로고/카테고리 데코 */}
            <div className="mb-8 select-none">
              <span className="text-[#15756B] text-xs font-bold tracking-[0.2em] uppercase border border-[#15756B]/30 px-4 py-1.5 rounded-full">
                {workshop.topic} · {currentPhase.name}
              </span>
            </div>

            {/* 메인 텍스트 */}
            <h1 className="text-4xl md:text-6xl font-jua text-[#283139] tracking-wide mb-6 leading-tight whitespace-pre-line">
              {currentPhase.showBig}
            </h1>

            {/* 서브 텍스트 */}
            <p className="text-xl md:text-2xl font-gowun text-[#15756B] leading-relaxed font-semibold max-w-2xl whitespace-pre-line">
              {currentPhase.showSub}
            </p>

          </div>

          {/* 하단 도움말 팁 */}
          <div className="absolute bottom-6 text-[10px] text-slate-400 select-none">
            [Esc] 키를 누르거나 오른쪽 상단 닫기 아이콘을 클릭하면 대시보드로 돌아갑니다.
          </div>
        </div>
      )}

      {/* 워크샵 마치기 완료 확인 모달 */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl text-center border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 bg-[#e4eff0] text-[#15756B] rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-jua text-[#283139] mb-2">
              워크샵 완료!
            </h3>
            
            <p className="text-xs text-slate-500 font-normal leading-relaxed mb-6">
              오늘 코호트 학생 중 발표 완료로 체크된 <strong>{checkedStudentsCount}명</strong>의<br />
              일일 루틴 <strong>P2 (워크샵)</strong> 완수 정보가 오늘 기록에 정상 저장되었습니다.<br />
              학생 대시보드 및 리포트에 즉시 연동됩니다.
            </p>

            <button
              onClick={() => {
                setShowCompleteModal(false);
                router.push('/workshop');
              }}
              className="w-full bg-[#15756B] hover:bg-[#0f574f] text-white py-3.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm hover:shadow-md"
            >
              워크샵 완료 및 종료하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
