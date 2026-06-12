'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PreworkRunner from '../../components/prework/PreworkRunner';
import Header from '../../components/Header';
import { ArrowLeft } from 'lucide-react';
import { getTodayStr, getDisplayDateStr } from '../../lib/dateService';

function DemoRunnerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read student information from query parameters or default to mock student
  const studentId = searchParams.get('studentId') || 'stu_elem_01';
  const studentName = searchParams.get('studentName') || '김민준';
  
  const todayStr = getTodayStr();

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 mt-8 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/elementary')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E1DA] hover:bg-slate-50 text-xs font-semibold text-slate-655 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          초등 대시보드로 돌아가기
        </button>
        <span className="text-xs text-slate-400 font-medium">데모 세션 (시드 자동 생성)</span>
      </div>

      <PreworkRunner
        studentId={studentId}
        studentName={studentName}
        date={todayStr}
        gradeTrack="low"
        difficulty={2} // Run on difficulty 2 for testing
        onExit={() => router.push('/elementary')}
      />
    </div>
  );
}

export default function PreworkDemoPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12 font-sans text-slate-800">
      <Header 
        title="프리워크 인지 워밍업 (데모)" 
        studentCount={6} 
        managerName="정수진 코치" 
        dateString={getDisplayDateStr()} 
      />

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-xs text-slate-450">
          데모 환경 준비 중...
        </div>
      }>
        <DemoRunnerContent />
      </Suspense>
    </div>
  );
}
