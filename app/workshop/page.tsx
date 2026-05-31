'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { mockWorkshops } from '../../data/workshops';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

export default function WorkshopListPage() {
  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#283139] flex flex-col pb-12 font-gowun">
      {/* 헤더 */}
      <Header 
        title="워크샵 진행 도우미" 
        studentCount={6} 
        managerName="정수진 코치" 
        dateString="2026.05.30 (토)" 
      />
      
      {/* 뒤로가기 버튼 */}
      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 mt-6">
        <Link 
          href="/elementary" 
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition-all hover:scale-[1.01]"
        >
          ← 초등 대시보드로 돌아가기
        </Link>
      </div>
      
      {/* 본문 내용 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 mt-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-jua text-[#283139] tracking-wide mb-2">
            라이브 워크샵 세션 선택
          </h1>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            코치진이 라이브로 학생들과 상호작용하며 30분간 진행할 주제별 워크샵입니다.<br />
            진행을 시작할 주제 카드를 아래에서 선택하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockWorkshops.map((workshop) => {
            const totalDuration = workshop.phases.reduce((sum, phase) => sum + phase.min, 0);
            
            return (
              <div 
                key={workshop.id}
                className="bg-white border border-slate-200/50 rounded-[20px] p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* 머리글 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#e4eff0] text-[#15756B] text-[10px] px-2.5 py-1 rounded-full font-bold uppercase">
                      라이브 세션
                    </span>
                  </div>
                  
                  {/* 타이틀 */}
                  <h2 className="text-xl md:text-2xl font-jua text-[#283139] mb-1.5">
                    {workshop.title}
                  </h2>
                  
                  {/* 토픽 명 */}
                  <p className="text-[#15756B] text-xs font-semibold mb-4">
                    주제: {workshop.topic}
                  </p>
                  
                  {/* 설명/통계 */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-6 font-normal">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#15756B]" />
                      총 {totalDuration}분
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#15756B]" />
                      {workshop.phases.length}단계 구성
                    </span>
                  </div>
                </div>

                <Link
                  href={`/workshop/${encodeURIComponent(workshop.id)}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#15756B] hover:bg-[#0f574f] active:bg-[#0c443e] text-white py-3.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer group shadow-sm hover:shadow-md"
                >
                  진행 도우미 시작하기
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
