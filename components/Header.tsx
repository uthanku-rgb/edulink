'use client';

import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  title: string;
  studentCount?: number;
  managerName?: string;
  dateString?: string;
}

export default function Header({
  title = '대시보드',
  studentCount = 28,
  managerName = '정수진',
  dateString = '2026.05.27 (월)',
}: HeaderProps) {
  return (
    <header className="w-full bg-[#FAF9F6] pt-6 pb-2 border-b border-[#E5E1DA] no-print">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        {/* 좌측 영역 */}
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-normal">
            정연학원 · 매니저 포털
          </span>
          <div className="flex items-center gap-2 mt-1">
            <LayoutDashboard className="w-5 h-5 text-slate-800" strokeWidth={1.5} />
            <h1 className="text-xl md:text-2xl font-medium text-slate-900 leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* 우측 영역 */}
        <div className="flex flex-col md:items-end text-left md:text-right">
          <span className="text-base font-medium text-slate-900">
            {managerName}
          </span>
          <span className="text-xs text-slate-400 font-normal mt-0.5">
            담당 {studentCount}명 · {dateString}
          </span>
        </div>
      </div>
    </header>
  );
}
