'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StudentStatus } from '../../types';

interface StudentCardProps {
  status: StudentStatus;
}

export default function StudentCard({ status }: StudentCardProps) {
  const router = useRouter();

  // 상태별 테마 색상 설정
  const themeMap = {
    crisis: {
      bg: 'bg-[#FDF2F2]',
      border: 'border-[#F5D0D0]',
      text: 'text-[#9B1C1C]',
      badgeText: 'text-[#9B1C1C]',
    },
    warning: {
      bg: 'bg-[#FEF3C7]',
      border: 'border-[#FCD34D]',
      text: 'text-[#92400E]',
      badgeText: 'text-[#92400E]',
    },
    normal: {
      bg: 'bg-[#ECFDF5]',
      border: 'border-[#A7F3D0]',
      text: 'text-[#065F46]',
      badgeText: 'text-[#065F46]',
    },
    autopsy: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#BFDBFE]',
      text: 'text-[#1E40AF]',
      badgeText: 'text-[#1E40AF]',
    },
  };

  const currentTheme = themeMap[status.state] || themeMap.normal;

  // D-Day 또는 T-Day 문자열 포맷팅
  const getDDayString = () => {
    if (status.phase === 'Autopsy') {
      return `Autopsy · T+${Math.abs(status.dDay)}`;
    }
    return `${status.phase} · D-${status.dDay}`;
  };

  // 상세 문자열 구성
  const getSummaryLine = () => {
    if (status.studentId === 'stu_01') {
      return `진척 32% · 회독 1단계 · 알림 3건`;
    }
    if (status.studentId === 'stu_04') {
      return `진척 58% · 어제 미입력 · 컨디션`;
    }
    if (status.studentId === 'stu_05') {
      return `진척 84% · 회독 2단계 · 정상`;
    }
    if (status.studentId === 'stu_06') {
      return `회고 진행 중 · C4 60%`;
    }
    
    // 기본 생성
    if (status.phase === 'Autopsy') {
      return `회고 완료 · 다음 시즌 대기 중`;
    }
    return `진척 ${status.progressPercent}% · 회독 ${status.reviewStage}단계 · 출석 ${status.attendance7d}%`;
  };

  return (
    <div
      onClick={() => router.push(`/students/${status.studentId}`)}
      className={`flex flex-col justify-between p-4 rounded-xl border ${currentTheme.bg} ${currentTheme.border} ${currentTheme.text} cursor-pointer hover:opacity-90 transition-all duration-150`}
    >
      {/* 상단: 이름/학년(좌) + 배지(우) */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {status.studentName} · <span className="text-xs opacity-85">{status.grade}</span>
        </span>
        <span className={`text-[10px] font-medium bg-white px-2 py-0.5 rounded-full ${currentTheme.badgeText}`}>
          {getDDayString()}
        </span>
      </div>

      {/* 하단: 상태 요약 한 줄 */}
      <div className="text-xs opacity-80 mt-3 font-normal">
        {getSummaryLine()}
      </div>
    </div>
  );
}
