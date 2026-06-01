'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';

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
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('user-role');
      setRole(storedRole);
    }
  }, []);

  const getPortalLabel = () => {
    switch (role) {
      case 'coach':
        return '정연학원 · 코치 포털';
      case 'supporter':
        return '정연학원 · 루틴 서포터 포털';
      case 'student-elem':
        return '정연학원 · 초등학생 포털';
      case 'student-midhigh':
        return '정연학원 · 중고등학생 포털';
      default:
        return '정연학원 · 매니저 포털';
    }
  };

  const getDisplayManager = () => {
    if (role === 'supporter') return '루틴 서포터';
    if (role === 'student-elem' || role === 'student-midhigh') return '학생 본인';
    return managerName;
  };

  return (
    <header className="w-full bg-[#FAF9F6] pt-6 pb-2 border-b border-[#E5E1DA] no-print">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        {/* 좌측 영역 */}
        <div className="flex flex-col">
          <Link href="/" className="text-xs text-slate-400 font-normal hover:text-slate-650 transition-colors">
            {getPortalLabel()}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <LayoutDashboard className="w-5 h-5 text-slate-800" strokeWidth={1.5} />
            <h1 className="text-xl md:text-2xl font-medium text-slate-900 leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* 우측 영역 */}
        <div className="flex items-center gap-4 self-start md:self-end">
          <div className="flex flex-col md:items-end text-left md:text-right">
            <span className="text-base font-medium text-slate-900">
              {getDisplayManager()}
            </span>
            <span className="text-xs text-slate-400 font-normal mt-0.5">
              {role === 'student-elem' || role === 'student-midhigh'
                ? dateString
                : `담당 ${studentCount}명 · ${dateString}`}
            </span>
          </div>

          <Link
            href="/"
            className="p-1.5 bg-white border border-[#E5E1DA] hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-bold text-slate-500 shadow-sm"
            title="역할 다시 선택하기"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">역할 변경</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
