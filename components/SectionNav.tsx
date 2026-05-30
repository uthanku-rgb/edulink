'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Gauge, 
  Users, 
  MessageSquare, 
  BookOpen, 
  GraduationCap, 
  BarChart3,
  Calendar,
  ClipboardCheck,
  Presentation,
  BookMarked,
  LucideIcon
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: number;
}

export default function SectionNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: '대시보드(중고등)', href: '/middle-high', icon: Gauge },
    { label: '학생 28', href: '/students', icon: Users, count: 28 },
    { label: '학부모 리포트', href: '/reports', icon: MessageSquare },
    { label: '문제 은행', href: '/question-bank', icon: BookOpen },
    { label: '수행평가', href: '/performance', icon: GraduationCap },
    { label: '시험 분석', href: '/analysis', icon: BarChart3 },
    { label: '대시보드(초등)', href: '/elementary', icon: Calendar },
    { label: '입력(초등)', href: '/elementary/input', icon: ClipboardCheck },
    { label: '영어 점검(초등)', href: '/english/review', icon: BookMarked },
    { label: '토론 점검(초등)', href: '/debate/review', icon: MessageSquare },
    { label: '워크샵 진행', href: '/workshop', icon: Presentation },
  ];

  return (
    <nav className="w-full bg-[#FAF9F6] py-3 no-print">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* 가로 스크롤 가능한 알약 스타일 탭 컨테이너 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {navItems.map((item) => {
            // 활성화 상태 결정 (대시보드는 exact, 그 외에는 prefix 매칭)
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#EBF3FF] border-[#B8D4FF] text-[#1E40AF] font-medium'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1E40AF]' : 'text-slate-400'}`} strokeWidth={2} />
                <span>
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span className={`text-[10px] ml-0.5 px-1 rounded-full ${
                    isActive ? 'bg-[#1E40AF] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
