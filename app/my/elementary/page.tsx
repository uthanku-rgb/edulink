'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Smile, 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Sparkles, 
  CheckCircle,
  Award,
  Heart
} from 'lucide-react';
import { mockElementaryStudents } from '../../../data/mockData';
import { getDailyCards, saveDailyCards, getPillarSchedule } from '../../../lib/storage';
import { DailyCard, ElementaryStudent, Pillar, ElementaryPhase } from '../../../types';

function ElementaryStudentPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStudentId = searchParams.get('studentId');

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [student, setStudent] = useState<ElementaryStudent | null>(null);
  const [dailyCard, setDailyCard] = useState<DailyCard | null>(null);
  const [todayPillar, setTodayPillar] = useState<Pillar>('영어');
  const [loading, setLoading] = useState(true);

  // 오늘 날짜 문자열 YYYY-MM-DD
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
    // URL 파라미터 또는 세션에서 이전 선택 학생 로드
    const activeStudentId = queryStudentId || localStorage.getItem('elem-student-id');
    
    if (activeStudentId) {
      setSelectedStudentId(activeStudentId);
      const found = mockElementaryStudents.find(s => s.id === activeStudentId);
      if (found) {
        setStudent(found);
        if (!queryStudentId) {
          localStorage.setItem('elem-student-id', activeStudentId);
        }
      }
    } else if (mockElementaryStudents.length > 0) {
      setSelectedStudentId(mockElementaryStudents[0].id);
      setStudent(mockElementaryStudents[0]);
      localStorage.setItem('elem-student-id', mockElementaryStudents[0].id);
    }

    // 오늘 기둥 로드
    const schedule = getPillarSchedule();
    setTodayPillar(schedule.byWeekday[todayWeekday] || '영어');
    setLoading(false);
  }, [todayWeekday, queryStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      const cards = getDailyCards();
      let card = cards.find(c => c.studentId === selectedStudentId && c.date === todayStr);
      
      // 만약 오늘 카드가 아직 없다면, 학생을 위한 기본 카드 생성
      if (!card) {
        card = {
          id: `dc_${selectedStudentId}_${todayStr.replace(/-/g, '')}`,
          studentId: selectedStudentId,
          date: todayStr,
          attendance: '정상',
          phasesDone: { P1: false, P2: false, P3: false, P4: false },
          pillarToday: todayPillar,
          helpPoints: [],
          condition: 3,
          coachNote: '오늘도 웃으며 즐겁게 공부해보아요! 화이팅!'
        };
        const updatedCards = [card, ...cards.filter(c => !(c.studentId === selectedStudentId && c.date === todayStr))];
        saveDailyCards(updatedCards);
      }
      setDailyCard(card);
    }
  }, [selectedStudentId, todayPillar, todayStr]);

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    localStorage.setItem('elem-student-id', id);
    const found = mockElementaryStudents.find(s => s.id === id);
    setStudent(found || null);
  };

  const getPillarBadge = (pillar: Pillar) => {
    switch (pillar) {
      case '수학':
        return { label: '수학 기둥 🔢', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      case '영어':
        return { label: '영어 기둥 🦊', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case '토론':
        return { label: '토론 기둥 🗣️', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
  };

  const getConditionEmoji = (level: number) => {
    switch (level) {
      case 1: return '😢 힘겨움';
      case 2: return '🙁 피곤함';
      case 3: return '😐 보통';
      case 4: return '🙂 신남';
      case 5: return '😀 최고!';
      default: return '😐 보통';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        학생 정보 불러오는 중...
      </div>
    );
  }

  const pBadge = getPillarBadge(todayPillar);

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col pb-12 font-sans text-slate-800 antialiased">
      {/* Top Header Bar */}
      <header className="w-full bg-white border-b border-emerald-100 px-4 py-3 sticky.top-0 z-10 flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.push('/')}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1 text-[11px] font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>나가기</span>
        </button>
        
        {/* Student Selector / Read-only label */}
        <div className="flex items-center gap-2">
          <Smile className="w-4.5 h-4.5 text-emerald-500 animate-bounce" />
          {queryStudentId ? (
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs px-3.5 py-1.5 font-bold">
              {student ? `${student.name} 어린이` : '어린이'} 포털
            </span>
          ) : (
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="bg-emerald-50 border border-emerald-200 rounded-xl text-xs px-3 py-1.5 font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              {mockElementaryStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} 어린이
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-[11px] font-bold text-emerald-700 border border-emerald-200 select-none">
          {student ? student.name[0] : '초'}
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="w-full max-w-lg px-4 mx-auto mt-6 flex-1 flex flex-col">
        
        {/* Welcome Board */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden mb-6">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 pointer-events-none">
            <Smile className="w-40 h-40" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-white/20 border border-white/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-emerald-100">
              {student?.school} · {student?.grade}
            </span>
            <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full shadow-sm ${pBadge.color}`}>
              {pBadge.label}
            </span>
          </div>

          <h2 className="text-xl font-black mt-3 flex items-center gap-1.5">
            {student?.name} 학생 환영해요!
          </h2>
          <p className="text-[11px] text-emerald-100/90 mt-1 leading-relaxed font-medium">
            오늘도 즐겁고 신나게 공부 미션을 달성하고 캐릭터 보상을 채워나가 보아요!
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-100">
            <span>오늘 날짜</span>
            <span className="bg-emerald-950/20 px-2.5 py-1 rounded-lg text-white text-[11px] border border-white/5">
              {todayStr.replace(/-/g, '.')} ({todayWeekday}요일)
            </span>
          </div>
        </div>

        {/* Quest Section (Routine Status) */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm mb-6">
          <h3 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 mb-4 uppercase tracking-wider">
            <Award className="w-4.5 h-4.5 text-emerald-500" />
            오늘 나의 성장 퀘스트 (Routine)
          </h3>
          
          <div className="flex flex-col gap-3">
            {[
              { key: 'P1', label: 'P1. 예열 인지게임 완료', desc: '두뇌 예열 슬롯 학습하기' },
              { key: 'P2', label: 'P2. 메인 수업 완성', desc: '요일별 기둥 클래스 참여하기' },
              { key: 'P3', label: 'P3. 백지 인출 확인', desc: '배운 핵심 개념 스스로 떠올려 쓰기' },
              { key: 'P4', label: 'P4. 학습 회고 및 표현', desc: '오늘 배운 새로운 표현/소감 정리하기' }
            ].map((phase) => {
              const isDone = dailyCard?.phasesDone[phase.key as ElementaryPhase] || false;
              return (
                <div
                  key={phase.key}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-semibold'
                      : 'bg-[#FAF9F6] border-slate-100 text-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border shrink-0 ${
                      isDone ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-200 border-slate-300 text-slate-500'
                    }`}>
                      {phase.key}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold leading-normal">{phase.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-normal">{phase.desc}</p>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isDone ? 'bg-emerald-550 text-white shadow-sm' : 'bg-slate-200 text-slate-400'
                  }`}>
                    <CheckCircle className="w-4.5 h-4.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Study Tools Shortcuts */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm mb-6">
          <h3 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 mb-4 uppercase tracking-wider">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
            나의 공부방 바로가기
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* English App link */}
            <button
              onClick={() => router.push(`/english?studentId=${selectedStudentId}`)}
              className="p-4 bg-[#E8F6F4] hover:bg-[#DDF0ED] border border-[#BDE0D9]/50 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between h-28 shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-2">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 group-hover:text-teal-650 transition-colors">리틀팍스 영어</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-normal leading-tight">영어 쉐도잉 & 작문 미션</span>
              </div>
            </button>

            {/* Debate App link */}
            <button
              onClick={() => router.push(`/debate?studentId=${selectedStudentId}`)}
              className="p-4 bg-[#FFF6E9] hover:bg-[#FFEED6] border border-[#FFDEC4]/50 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between h-28 shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 group-hover:text-amber-650 transition-colors">디베이트 도우미</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-normal leading-tight">개요서 작성 & 에세이 제출</span>
              </div>
            </button>

            {/* Prework Demo Game link */}
            <button
              onClick={() => router.push(`/prework-demo?studentId=${selectedStudentId}`)}
              className="p-4 bg-[#EEEDFC] hover:bg-[#E3E1FC] border border-[#D1CDF9]/50 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between h-28 shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 group-hover:text-indigo-655 transition-colors">예열 인지게임</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-normal leading-tight">두뇌 깨우기 5개 인지 슬롯</span>
              </div>
            </button>
          </div>
        </div>

        {/* Coach Speech Note board */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-50 pb-2">
            <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500 animate-pulse" />
            선생님들의 한마디 응원
          </h3>
          
          <div className="flex gap-3.5 items-start">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
              👩‍🏫
            </div>
            <div className="relative flex-1 bg-[#F0FDF4] border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 font-medium leading-relaxed">
              {/* Arrow Decoration */}
              <div className="absolute left-[-6px] top-4 w-3 h-3 bg-[#F0FDF4] border-l border-b border-emerald-200 transform rotate-45" />
              {dailyCard?.coachNote ? dailyCard.coachNote : '오늘도 웃으며 즐겁게 공부해보아요! 화이팅!'}
            </div>
          </div>

          <div className="border-t border-slate-55 mt-1 pt-3.5 flex justify-between items-center text-[10px] font-semibold text-slate-500">
            <span>오늘 나의 컨디션</span>
            <span className="px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-bold">
              {dailyCard ? getConditionEmoji(dailyCard.condition) : '😐 보통'}
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function ElementaryStudentPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        로딩 중...
      </div>
    }>
      <ElementaryStudentPortalContent />
    </Suspense>
  );
}
