'use client';

import React, { useState, useEffect } from 'react';
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
  Home,
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
  const [coachingMode, setCoachingMode] = useState<'middle-high' | 'elementary'>('middle-high');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (
        pathname.startsWith('/middle-high') ||
        pathname.startsWith('/students') ||
        pathname.startsWith('/reports') ||
        pathname.startsWith('/question-bank') ||
        pathname.startsWith('/performance') ||
        pathname.startsWith('/analysis')
      ) {
        setCoachingMode('middle-high');
        localStorage.setItem('coaching-mode', 'middle-high');
      } else if (
        pathname.startsWith('/elementary') ||
        pathname.startsWith('/english') ||
        pathname.startsWith('/debate')
      ) {
        setCoachingMode('elementary');
        localStorage.setItem('coaching-mode', 'elementary');
      } else if (pathname.startsWith('/workshop')) {
        const stored = localStorage.getItem('coaching-mode');
        if (stored === 'elementary') {
          setCoachingMode('elementary');
        } else {
          setCoachingMode('middle-high');
        }
      }
    }
  }, [pathname]);

  const allItems: NavItem[] = [
    { label: '포털 홈', href: '/', icon: Home },
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

  // 필터링된 메뉴 아이템 구성
  const navItems = allItems.filter(item => {
    // 포털 홈과 워크샵은 양쪽 모두 노출
    if (item.href === '/' || item.href === '/workshop') return true;

    if (coachingMode === 'middle-high') {
      // 중고등 전용 메뉴 리스트
      return [
        '/middle-high',
        '/students',
        '/reports',
        '/question-bank',
        '/performance',
        '/analysis'
      ].includes(item.href);
    } else {
      // 초등 전용 메뉴 리스트
      return [
        '/elementary',
        '/elementary/input',
        '/english/review',
        '/debate/review'
      ].includes(item.href);
    }
  });

  return (
    <nav className="w-full bg-[#FAF9F6] py-3 no-print">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* 가로 스크롤 가능한 알약 스타일 탭 컨테이너 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {navItems.map((item) => {
            // 활성화 상태 결정 (홈, 중고등 대시보드, 초등 대시보드는 exact 매칭, 그 외에는 prefix 매칭)
            const isActive = (item.href === '/' || item.href === '/middle-high' || item.href === '/elementary')
              ? pathname === item.href
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

