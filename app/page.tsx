'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { 
  getStudentStatuses, 
  getDailyCards, 
  seedMockDataIfEmpty, 
  seedElementaryMockDataIfEmpty 
} from '../lib/storage';
import { 
  GraduationCap, 
  Smile, 
  ChevronRight, 
  Settings, 
  UserCheck, 
  ShieldAlert, 
  ClipboardList, 
  Sparkles,
  BookOpen,
  MessageSquare
} from 'lucide-react';

export default function PortalPage() {
  const [loading, setLoading] = useState(true);
  const [middleHighCount, setMiddleHighCount] = useState(28);
  const [elemCount, setElemCount] = useState(6);
  const [middleHighCrisis, setMiddleHighCrisis] = useState(0);
  const [elemCareCount, setElemCareCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await seedMockDataIfEmpty();
        await seedElementaryMockDataIfEmpty();

        // 중고등 통계
        const secondaryStatuses = await getStudentStatuses();
        setMiddleHighCount(secondaryStatuses.length);
        setMiddleHighCrisis(secondaryStatuses.filter(s => s.state === 'crisis').length);

        // 초등 통계
        const elemCards = getDailyCards();
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayCards = elemCards.filter(c => c.date === todayStr);
        
        // 초등 케어 시그널 연산
        const watchOrCareCount = todayCards.filter(c => c.attendance === '결석' || c.condition <= 2 || (c.helpPoints && c.helpPoints.length >= 2)).length;
        setElemCount(6); // 초등학생 총 6명 고정
        setElemCareCount(watchOrCareCount);
      } catch (err) {
        console.error('Failed to load portal stats:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        포탈 로딩 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12 font-sans text-slate-800">
      {/* 포탈 헤더 */}
      <Header 
        title="에듀링크 통합포탈" 
        studentCount={middleHighCount + elemCount} 
        managerName="정수진 코치" 
        dateString="2026.05.27 (월)" 
      />

      {/* 포탈 메인 영역 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 mt-8 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            에듀링크 학습 관리 시스템
          </h2>
          <p className="text-xs text-slate-500 mt-1.5">담당 학생들의 학교 급별 성격에 맞게 설계된 전용 코칭 대시보드로 진입하세요.</p>
        </div>

        {/* 대시보드 카드 구도 (중고등 vs 초등) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          
          {/* Card 1: 중고등 코칭 센터 */}
          <Link 
            href="/middle-high"
            className="group bg-white border border-[#E5E1DA] hover:border-indigo-400 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between h-64 text-left"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 mb-4 transition-transform group-hover:scale-105">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                중고등 코칭 센터
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                D-21 역산 공부 계획 수립, 핵심 과목 N회독 완수율 체크, 모의/내신 성적 및 수행평가 통합 관리.
              </p>
            </div>
            
            <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs">
              <div className="flex gap-3 text-slate-500">
                <span>학생 <strong className="text-slate-800">{middleHighCount}명</strong></span>
                {middleHighCrisis > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5" /> 위기 {middleHighCrisis}명
                  </span>
                )}
              </div>
              <span className="text-indigo-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                진입하기 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Card 2: 초등 루틴 센터 */}
          <Link 
            href="/elementary"
            className="group bg-white border border-[#E5E1DA] hover:border-emerald-400 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between h-64 text-left"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-4 transition-transform group-hover:scale-105">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                초등 루틴 센터
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                일일 공부 습관 P1~P4 완수 현황 추적, 도움 포인트 알림, 실시간 컨디션 체크 및 밀착 케어 시그널 점검.
              </p>
            </div>
            
            <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs">
              <div className="flex gap-3 text-slate-500">
                <span>학생 <strong className="text-slate-800">{elemCount}명</strong></span>
                {elemCareCount > 0 ? (
                  <span className="flex items-center gap-1 text-[#D98B6F] font-medium">
                    <UserCheck className="w-3.5 h-3.5" /> 케어 대상 {elemCareCount}명
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">순항 중</span>
                )}
              </div>
              <span className="text-emerald-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                진입하기 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

        </div>

        {/* 퀵 숏컷 영역 */}
        <section className="mt-12 bg-white border border-[#E5E1DA] rounded-2xl p-5 max-w-3xl mx-auto w-full">
          <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            ⚡ 과목 특화 & 학습 처방 단축 링크
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Link 
              href="/english/review"
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl font-medium flex flex-col gap-1 text-slate-700"
            >
              <span className="text-slate-400 text-[10px] block">초등 영어</span>
              <span className="flex items-center justify-between">
                영어 점검판 <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </Link>

            <Link 
              href="/debate/review"
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl font-medium flex flex-col gap-1 text-slate-700"
            >
              <span className="text-slate-400 text-[10px] block">초등 토론</span>
              <span className="flex items-center justify-between">
                토론 점검판 <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </Link>

            <Link 
              href="/question-bank"
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl font-medium flex flex-col gap-1 text-slate-700"
            >
              <span className="text-slate-400 text-[10px] block">중고등 내신</span>
              <span className="flex items-center justify-between">
                문제 은행 <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </Link>

            <Link 
              href="/workshop"
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl font-medium flex flex-col gap-1 text-slate-700"
            >
              <span className="text-slate-400 text-[10px] block">코치용 세션</span>
              <span className="flex items-center justify-between">
                워크샵 진행 <Settings className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </Link>
          </div>
        </section>

        {/* 리포트 및 관리 시스템 바로가기 */}
        <section className="mt-6 bg-white border border-[#E5E1DA] rounded-2xl p-5 max-w-3xl mx-auto w-full">
          <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            📊 에듀링크 리포트 및 등록 관리
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Link 
              href="/reports/review"
              className="p-4 bg-indigo-50/20 hover:bg-indigo-50/50 border border-indigo-150 rounded-2xl font-semibold flex flex-col gap-1 text-slate-800 transition-colors"
            >
              <span className="text-indigo-600 text-[10px] font-bold block uppercase tracking-wider">코치 권한</span>
              <span className="flex items-center justify-between text-sm">
                리포트 검수 큐 바로가기 <ChevronRight className="w-4 h-4 text-indigo-500" />
              </span>
              <p className="text-[11px] text-slate-400 font-normal mt-1 leading-normal">
                학습 주간 리포트 검수, 코치 의견 작성 및 승인, 리포트 카카오톡 알림톡 전송
              </p>
            </Link>

            <Link 
              href="/desk"
              className="p-4 bg-emerald-50/20 hover:bg-emerald-50/50 border border-emerald-150 rounded-2xl font-semibold flex flex-col gap-1 text-slate-800 transition-colors"
            >
              <span className="text-emerald-600 text-[10px] font-bold block uppercase tracking-wider">데스크 권한</span>
              <span className="flex items-center justify-between text-sm">
                데스크 등록 관리 콘솔 바로가기 <ChevronRight className="w-4 h-4 text-emerald-500" />
              </span>
              <p className="text-[11px] text-slate-400 font-normal mt-1 leading-normal">
                학생별 프리워크(추가과금) 수강 ON/OFF 토글 제어 및 데이터베이스 동기화
              </p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
