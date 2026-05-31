'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import { 
  getDailyCards, 
  seedElementaryMockDataIfEmpty, 
  getPillarSchedule,
  getMasteryChecks,
  getGaps
} from '../../lib/storage';
import { mockElementaryStudents } from '../../data/mockData';
import { DailyCard, ElementaryStudent, CareSignal, CareState, PillarSchedule, MasteryCheck, Gap } from '../../types';
import { 
  Users, 
  CheckCircle, 
  Smile, 
  Calendar, 
  ChevronRight, 
  BookOpen, 
  HeartHandshake, 
  Info,
  MessageSquare,
  Presentation,
  Calculator,
  Target,
  Sparkles
} from 'lucide-react';

export default function ElementaryDashboardPage() {
  const [students] = useState<ElementaryStudent[]>(mockElementaryStudents);
  const [dailyCards, setDailyCards] = useState<DailyCard[]>([]);
  const [pillarSchedule, setPillarSchedule] = useState<PillarSchedule | null>(null);
  const [masteryChecks, setMasteryChecks] = useState<MasteryCheck[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<ElementaryStudent | null>(null);
  const [loading, setLoading] = useState(true);

  // 오늘 날짜 및 요일 정보
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayStr = getTodayString();

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

  useEffect(() => {
    const initData = async () => {
      try {
        await seedElementaryMockDataIfEmpty();
        setDailyCards(getDailyCards());
        setPillarSchedule(getPillarSchedule());
        setMasteryChecks(getMasteryChecks());
        setGaps(getGaps());
      } catch (error) {
        console.error('초등 오늘 화면 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 최근 N일 날짜 배열 생성
  const getRecentDates = (baseDateStr: string, count = 5): string[] => {
    const dates = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(baseDateStr);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // 1. 메트릭 연산
  const todayCards = dailyCards.filter((c) => c.date === todayStr);

  // 출석률: (오늘 출석 + 지각 학생) / 전체 학생
  const attendanceRate = students.length > 0
    ? Math.round(
        (todayCards.filter((c) => c.attendance === '정상' || c.attendance === '지각').length /
          students.length) *
          100
      )
    : 0;

  // 단계 완수율(평균): 각 학생별 (완료 단계 수 / 4)의 평균
  const avgPhaseCompletion = students.length > 0
    ? Math.round(
        (students.reduce((sum, student) => {
          const card = todayCards.find((c) => c.studentId === student.id);
          if (!card) return sum;
          const doneCount = Object.values(card.phasesDone).filter(Boolean).length;
          return sum + (doneCount / 4);
        }, 0) /
          students.length) *
          100
      )
    : 0;

  // 평균 컨디션
  const activeConditionCards = todayCards.filter((c) => c.attendance !== '결석');
  const avgCondition = activeConditionCards.length > 0
    ? (
        activeConditionCards.reduce((sum, c) => sum + c.condition, 0) /
        activeConditionCards.length
      ).toFixed(1)
    : '0.0';

  // === 완전학습 메트릭 연산 (초등) ===
  const elementaryStudentIds = students.map(s => s.id);
  
  // 1. 반 평균 인출률: 초등 학생들의 모든 MasteryCheck의 retrievalScore 평균
  const elChecks = masteryChecks.filter(c => elementaryStudentIds.includes(c.studentId));
  const classAvgRecall = elChecks.length > 0
    ? Math.round(elChecks.reduce((acc, cur) => acc + cur.retrievalScore, 0) / elChecks.length)
    : 0;

  // 2. 구멍 누적 탑 학생: 초등 학생들 중 open 상태인 Gap이 가장 많은 학생
  const elOpenGaps = gaps.filter(g => g.status === 'open' && elementaryStudentIds.includes(g.studentId));
  
  // Count open gaps per student
  const gapCounts: Record<string, number> = {};
  elementaryStudentIds.forEach(id => {
    gapCounts[id] = 0;
  });
  elOpenGaps.forEach(g => {
    gapCounts[g.studentId] = (gapCounts[g.studentId] || 0) + 1;
  });

  let topGapStudentId = '';
  let maxGapsCount = 0;
  Object.entries(gapCounts).forEach(([studentId, count]) => {
    if (count > maxGapsCount) {
      maxGapsCount = count;
      topGapStudentId = studentId;
    }
  });

  const topGapStudentName = topGapStudentId
    ? students.find(s => s.id === topGapStudentId)?.name || '알 수 없음'
    : '';

  // 3. 오늘 백지 테스트 미실시: 초등 학생 수 (6) - 오늘 MasteryCheck가 등록된 초등 학생 수
  const todayTestedStudentIds = new Set(
    elChecks.filter(c => c.date === todayStr).map(c => c.studentId)
  );
  const todayUntestedCount = Math.max(0, students.length - todayTestedStudentIds.size);

  // 2. 케어 시그널 계산 규칙
  const getStudentCareSignal = (student: ElementaryStudent): CareSignal => {
    const studentCards = dailyCards.filter((c) => c.studentId === student.id);
    const todayCard = studentCards.find((c) => c.date === todayStr);

    const recent5Days = getRecentDates(todayStr, 5);
    const recent5Cards = studentCards.filter((c) => recent5Days.includes(c.date));

    // 최근 5일 도움 포인트 누적
    const helpPointsCount = recent5Cards.reduce(
      (sum, card) => sum + (card.helpPoints?.length || 0),
      0
    );

    const todayAttendance = todayCard ? todayCard.attendance : '정상';
    const todayCondition = todayCard ? todayCard.condition : 5;

    let state: CareState = 'good';
    let reason = '';

    if (todayAttendance === '결석') {
      state = 'care';
      reason = '오늘 결석 상태 — 가정 연락 및 일정 확인이 필요합니다';
    } else if (todayCondition <= 2) {
      state = 'care';
      reason = `오늘 컨디션 하락(${todayCondition}점) — 격려와 따뜻한 개별 멘토링을 권장해요`;
    } else if (helpPointsCount >= 3) {
      state = 'care';
      reason = `최근 5일 도움 포인트 ${helpPointsCount}회 발생 — 수업 집중도를 살피고 이해도를 챙겨주세요`;
    } else if (todayAttendance === '지각') {
      state = 'watch';
      reason = '오늘 지각 출석 — 등원 루틴 점검 및 부드러운 환영 지도가 필요해요';
    } else if (todayCondition === 3) {
      state = 'watch';
      reason = '오늘 컨디션 평이(3점) — 학습 의욕 저하가 없는지 살짝 체크해주세요';
    } else if (helpPointsCount >= 1 && helpPointsCount <= 2) {
      state = 'watch';
      reason = `이번 주 도움 포인트 ${helpPointsCount}회 기록 — 관심 있게 지켜보고 피드백을 모아주세요`;
    }

    return {
      studentId: student.id,
      studentName: student.name,
      state,
      reason
    };
  };

  const careSignals = students.map(getStudentCareSignal);
  const careAndWatchList = careSignals.filter((sig) => sig.state === 'care' || sig.state === 'watch');

  // 3. 최근 3일 흐름 데이터
  const getStudent3DayHistory = (studentId: string) => {
    const studentCards = dailyCards.filter((c) => c.studentId === studentId);
    const recent3Days = getRecentDates(todayStr, 3);
    
    // 최근 3일 순으로 정렬해서 반환
    return recent3Days.map((dateStr) => {
      const card = studentCards.find((c) => c.date === dateStr);
      return {
        date: dateStr,
        card
      };
    });
  };

  const getCareBadgeStyle = (state: CareState) => {
    switch (state) {
      case 'care':
        return 'bg-[#FBEAE3] text-[#8A4B36] border border-[#D98B6F]';
      case 'watch':
        return 'bg-[#FBF1DD] text-[#7A5A1E] border border-[#C9962F]';
      case 'good':
        return 'bg-[#E8F1EA] text-[#2F5C46] border border-[#5E9E7E]';
    }
  };

  const getConditionEmoji = (level: number) => {
    switch (level) {
      case 1: return '😢 매우 지침';
      case 2: return '🙁 피곤함';
      case 3: return '😐 보통';
      case 4: return '🙂 좋음';
      case 5: return '😀 최상';
      default: return '😐 보통';
    }
  };

  const selectedHistory = selectedStudent ? getStudent3DayHistory(selectedStudent.id) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        데이터 로드 중...
      </div>
    );
  }

  const weekDaysList = ['월', '화', '수', '목', '금'] as const;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header 
        title="초등 대시보드" 
        studentCount={students.length} 
        managerName="정수진 코치" 
        dateString={`${todayStr.replace(/-/g, '.')} (${todayWeekday})`} 
      />
      <SectionNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-6">
        
        {/* 상단 메트릭 3개 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 rounded-xl p-2.5 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">오늘 출석률</span>
              <span className="text-lg md:text-xl font-bold text-slate-800">{attendanceRate}%</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 rounded-xl p-2.5 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">평균 루틴 완수율</span>
              <span className="text-lg md:text-xl font-bold text-slate-800">{avgPhaseCompletion}%</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 rounded-xl p-2.5 shrink-0">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">평균 컨디션</span>
              <span className="text-lg md:text-xl font-bold text-slate-800">{avgCondition} / 5</span>
            </div>
          </div>
        </div>

        {/* 초등 전용 피드백 및 수업 도구 */}
        <section className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-[#2C9C8F]" />
              초등 전용 피드백 및 수업 도구
            </h2>
            <span className="text-[11px] text-slate-400">과목별 전문 코칭 앱 바로 실행</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 영어 */}
            <Link 
              href="/english/review"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-slate-100 hover:border-[#2C9C8F] bg-slate-50/40 hover:bg-[#E8F6F4]/10 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-28 shadow-sm hover:shadow"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#E8F6F4] text-[#2C9C8F] flex items-center justify-center mb-2">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-[#2C9C8F] transition-colors">영어 피드백 콘솔</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">리틀팍스 스피킹 녹음 및 영작 피드백</span>
              </div>
            </Link>

            {/* 토론 */}
            <Link 
              href="/debate/review"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-slate-100 hover:border-teal-500 bg-slate-50/40 hover:bg-teal-50/10 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-28 shadow-sm hover:shadow"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-teal-600 transition-colors">토론 관찰 피드백</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">디베이트 개요서 및 에세이 첨삭</span>
              </div>
            </Link>

            {/* 수학 */}
            <Link 
              href="/math/review"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-slate-100 hover:border-indigo-400 bg-slate-50/40 hover:bg-indigo-50/10 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-28 shadow-sm hover:shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calculator className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">준비 중</span>
                </div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors">수학 스토리텔링</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">수학 논리력 진단 및 피드백</span>
              </div>
            </Link>

            {/* 워크숍 */}
            <Link 
              href="/workshop"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-slate-100 hover:border-purple-400 bg-slate-50/40 hover:bg-purple-50/10 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-28 shadow-sm hover:shadow"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                  <Presentation className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-purple-600 transition-colors">라이브 워크숍 진행</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">세션 타이머 및 오버레이 컨트롤</span>
              </div>
            </Link>

            {/* 완전학습 */}
            <Link 
              href="/mastery"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-slate-100 hover:border-[#4F46E5] bg-slate-50/40 hover:bg-[#EEEDFC]/10 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-28 shadow-sm hover:shadow"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#EEEDFC] text-[#4F46E5] flex items-center justify-center mb-2">
                  <Target className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-[#4F46E5] transition-colors">완전학습 점검판</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">백지 인출 채점 및 결손(구멍) 케어</span>
              </div>
            </Link>

            {/* 프리워크 */}
            <Link 
              href="/prework-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-slate-100 hover:border-indigo-400 bg-slate-50/40 hover:bg-indigo-50/10 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-28 shadow-sm hover:shadow"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors">프리워크 워밍업</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">두뇌 예열을 위한 5슬롯 인지 게임</span>
              </div>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측/중앙 영역 (기둥 스케줄 & 오늘 챙길 학생) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* 주간 기둥 진행 현황 */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  주간 학습 기둥 현황
                </h2>
                <span className="text-[11px] text-slate-400">월 ~ 금요일 코스 스케줄</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {weekDaysList.map((day) => {
                  const isToday = day === todayWeekday;
                  const pillar = pillarSchedule ? pillarSchedule.byWeekday[day] : '';
                  return (
                    <div 
                      key={day} 
                      className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                        isToday 
                          ? 'bg-indigo-600 border-indigo-600 text-white font-bold scale-[1.02] shadow-md shadow-indigo-100' 
                          : 'bg-slate-50 border-slate-100 text-slate-600'
                      }`}
                    >
                      <span className={`text-xs block mb-1 ${isToday ? 'text-indigo-100' : 'text-slate-400'}`}>{day}</span>
                      <span className="text-xs md:text-sm font-semibold">{pillar}</span>
                      {isToday && (
                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full mt-1.5 text-white">
                          오늘
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 완전학습 (Mastery Learning) 현황 위젯 */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Target className="w-4.5 h-4.5 text-[#4F46E5]" />
                  완전학습 (Mastery Learning) 현황
                </h2>
                <Link 
                  href="/mastery"
                  className="text-[11px] text-[#4F46E5] hover:underline font-semibold flex items-center gap-0.5"
                >
                  완전학습 관리관 가기 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-normal">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px] font-medium block">반 평균 인출률</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-slate-800">{classAvgRecall}%</span>
                    <span className="text-[9px] text-slate-400 font-medium">초등 평균</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px] font-medium block">구멍 누적 학생 (케어 신호)</span>
                  <div className="flex items-baseline mt-1">
                    {maxGapsCount > 0 ? (
                      <Link 
                        href="/mastery"
                        className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                      >
                        ⚠️ {topGapStudentName} ({maxGapsCount}개 구멍)
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-[#2C9C8F]">✅ 없음 (순항 중)</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px] font-medium block">오늘 백지 테스트 미실시</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-lg font-bold ${todayUntestedCount > 0 ? 'text-amber-600' : 'text-[#2C9C8F]'}`}>
                      {todayUntestedCount}명
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">/ 총 {students.length}명</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 오늘 챙길 학생 */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <HeartHandshake className="w-4.5 h-4.5 text-[#D98B6F]" />
                  오늘 케어 코멘트 대상자 ({careAndWatchList.length}명)
                </h2>
                <span className="text-[11px] text-slate-400">도움 포인트 누적 또는 상태 알림 학생</span>
              </div>

              {careAndWatchList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Smile className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-medium">모든 학생이 오늘 원활하게 성장하고 있습니다.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {careAndWatchList.map((sig) => {
                    const student = students.find((s) => s.id === sig.studentId);
                    const isSelected = selectedStudent?.id === sig.studentId;
                    return (
                      <button
                        key={sig.studentId}
                        onClick={() => student && setSelectedStudent(student)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                          isSelected 
                            ? 'border-slate-800 shadow-sm ring-1 ring-slate-800' 
                            : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 pr-4">
                          {/* 케어/관심 배지 */}
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase shrink-0 ${getCareBadgeStyle(sig.state)}`}>
                            {sig.state === 'care' ? '케어' : '관심'}
                          </span>
                          
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold text-slate-800 block">
                              {sig.studentName} <span className="font-normal text-slate-400 text-[10px]">({student?.school} · {student?.grade})</span>
                            </span>
                            <span className="text-xs text-slate-500 block truncate mt-0.5 font-normal">
                              {sig.reason}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* 우측 영역 (3일 루틴 세부 흐름 피드) */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm h-full flex flex-col">
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-indigo-500" />
                최근 3일 루틴 흐름
              </h2>

              {!selectedStudent ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                  <Info className="w-7 h-7 text-slate-300 mb-2.5" />
                  <p className="text-xs leading-relaxed max-w-[180px]">
                    챙길 학생 리스트의 행을 클릭하시면 최근 3일간의 구체적인 루틴 데이터 흐름을 추적할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* 학생 기본정보 */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-5 flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{selectedStudent.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {selectedStudent.school} · {selectedStudent.grade}
                      </span>
                    </div>
                    <Link
                      href={`/prework-demo?studentId=${selectedStudent.id}&studentName=${encodeURIComponent(selectedStudent.name)}`}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all border border-indigo-100/50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>프리워크 워밍업 실행</span>
                    </Link>
                  </div>

                  {/* 타임라인 피드 */}
                  <div className="flex flex-col gap-5 flex-1 overflow-y-auto">
                    {selectedHistory.map((item) => {
                      const card = item.card;
                      const dateObj = new Date(item.date);
                      const displayDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

                      return (
                        <div key={item.date} className="relative pl-6 border-l-2 border-slate-100 last:border-l-0 pb-1">
                          {/* 타임라인 노드 장식 */}
                          <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                            card 
                              ? card.attendance === '결석' ? 'bg-[#D98B6F] border-white' :
                                card.attendance === '지각' ? 'bg-[#C9962F] border-white' :
                                'bg-[#5E9E7E] border-white'
                              : 'bg-slate-300 border-white'
                          }`} />

                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700">{displayDate}</span>
                            {card ? (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                                card.attendance === '정상' ? 'bg-[#E8F1EA] text-[#2F5C46] border-[#5E9E7E]/30' :
                                card.attendance === '지각' ? 'bg-[#FBF1DD] text-[#7A5A1E] border-[#C9962F]/30' :
                                'bg-[#FBEAE3] text-[#8A4B36] border-[#D98B6F]/30'
                              }`}>
                                {card.attendance}
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">미기록</span>
                            )}
                          </div>

                          {card ? (
                            <div className="space-y-2">
                              {/* 완수 단계 배지 */}
                              <div className="flex flex-wrap gap-1">
                                {(['P1', 'P2', 'P3', 'P4'] as const).map((p) => {
                                  const done = card.phasesDone[p];
                                  return (
                                    <span 
                                      key={p} 
                                      className={`text-[9px] px-1 py-0.5 rounded-md font-medium ${
                                        done ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-300 border border-slate-100'
                                      }`}
                                    >
                                      {p}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* 컨디션 */}
                              <div className="text-[10px] text-slate-600 flex items-center gap-1.5">
                                <span className="font-semibold text-slate-400">컨디션:</span>
                                <span>{getConditionEmoji(card.condition)}</span>
                              </div>

                              {/* 도움 포인트 */}
                              <div className="text-[10px] text-slate-600 flex flex-col gap-1">
                                <span className="font-semibold text-slate-400 block">도움 포인트:</span>
                                {card.helpPoints && card.helpPoints.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {card.helpPoints.map((hp, idx) => (
                                      <span key={idx} className="bg-[#FBEAE3] text-[#8A4B36] text-[9px] px-1.5 py-0.5 rounded border border-[#D98B6F]/40">
                                        {hp}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">도움 요청 없음</span>
                                )}
                              </div>

                              {/* 관찰 노트 */}
                              {card.coachNote && (
                                <div className="bg-slate-50 rounded-lg p-2 mt-1 border border-slate-100 text-[10px] text-slate-600 leading-normal">
                                  <span className="font-semibold text-slate-500 block mb-0.5">서포터 메모:</span>
                                  {card.coachNote}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">해당 날짜에 입력된 루틴 데이터가 없습니다.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs mt-4 transition-all"
                  >
                    목록으로 돌아가기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
