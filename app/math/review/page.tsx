'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Clock 
} from 'lucide-react';

export default function MathCoachReviewPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F4F6FC] text-[#2D3142] flex flex-col pb-12 font-gowun selection:bg-[#E2E8F0]">
      
      {/* Top Coach Navigation (Math Dedicated Design) */}
      <header className="bg-white shadow-sm border-b border-[#E2E8F0] px-4 md:px-8 py-3 sticky top-0 z-40">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF3FF] text-[#1E40AF] flex items-center justify-center text-xl shadow-sm">
              🧮
            </div>
            <div>
              <span className="font-gaegu text-xl md:text-2xl font-bold text-[#1E40AF]">정수진 코치</span>
              <span className="text-xs text-slate-500 ml-1">초등 수학 스토리텔링 관리자</span>
            </div>
          </div>
          
          <Link 
            href="/elementary"
            className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            초등 대시보드로 돌아가기
          </Link>
        </div>
      </header>

      {/* Main Console */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 mt-8 flex flex-col items-center justify-center">
        
        {/* Preparing Banner Card */}
        <section className="bg-white border-2 border-[#EBF3FF] rounded-[24px] p-8 md:p-12 shadow-md w-full text-center relative overflow-hidden">
          {/* Animated decorative shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />
          
          <div className="w-16 h-16 rounded-2xl bg-[#EBF3FF] text-[#1E40AF] flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100 animate-pulse">
            <Calculator className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-[#1E40AF] border border-[#B8D4FF] tracking-wider uppercase mb-3 inline-block">
            STORYTELLING MATH · COMING SOON
          </span>
          
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            수학 스토리텔링 코치 점검판 준비 중 ⚙️
          </h2>
          
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto mb-8 font-normal">
            수학의 추상적인 공식을 이야기 형식으로 직접 쓰고 설명하며 메타인지 능력을 극대화하는 신규 학습 과정입니다. 현재 학생용 수학 스토리라이팅 위저드 및 코치 첨삭용 분석 엔진 콘텐츠를 활발히 개발하고 있습니다.
          </p>

          {/* Feature Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            
            {/* Feature 1 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">1. 개념 이미지 모델링</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                학생들이 추상적 수학 원리를 실생활 그림이나 인포그래픽 카드로 시각화하는 과정의 이해도를 평가합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">2. 스토리 서술형 첨삭</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                공식만 대입하는 풀이가 아닌, 소설처럼 이야기 구조로 원리를 증명한 서술 에세이 결과물을 맞춤 코칭합니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">3. 논리 분석 및 리포팅</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                연산 비약, 조건 누락, 핵심 키워드 유무 등을 정밀 AI 분석과 연계하여 학부모 피드백 리포트로 한 번에 전송합니다.
              </p>
            </div>

          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              개발 예정 완료일: 2026.06.30
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              대상 학년: 초등 전 학년
            </span>
          </div>

        </section>

      </main>
    </div>
  );
}
