'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { WeekStats as WeekStatsType } from '../types';

interface WeekStatsProps {
  stats: WeekStatsType;
}

export default function WeekStats({ stats }: WeekStatsProps) {
  const statList = [
    { label: '평균 진척률', value: `${Math.round(stats.avgProgressPercent)}%` },
    { label: '콘텐츠 완료율', value: '65%' }, // 가이드상 완료율 고정 혹은 계산식
    { label: '학부모 리포트', value: '22/28' }, // 가이드상 발송 비율
    { label: '매니저 시간/학생', value: '13분' },
  ];

  return (
    <div className="w-full bg-white border border-[#E5E1DA] rounded-xl p-4 mb-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm mb-3">
        <BarChart3 className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
        <span>이번 주 통계</span>
      </div>

      {/* 4개 통계 카드 (데스크톱 4열, 태블릿 2열, 모바일 2열) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statList.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col bg-[#F5F5F4] rounded-lg p-3 text-left"
          >
            {/* 통계 라벨 */}
            <span className="text-[10px] md:text-xs text-slate-500 font-normal">
              {stat.label}
            </span>

            {/* 통계 수치 */}
            <span className="text-base md:text-lg font-medium text-slate-900 mt-1">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
