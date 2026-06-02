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
  Home,
  Target,
  Timer,
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
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('user-role');
      setRole(storedRole);
    }
  }, [pathname]);

  // 학생 또는 데스크일 경우 네비게이션을 렌더링하지 않음
  if (role === 'student-elem' || role === 'student-midhigh' || role === 'desk') {
    return null;
  }

  const allItems: NavItem[] = [
    // 공용
    { label: '포털 홈', href: '/', icon: Home },
    
    // 코치(중고등) 관련
    { label: '대시보드(중고등)', href: '/middle-high', icon: Gauge },
    { label: '학생 관리', href: '/students', icon: Users, count: 28 },
    { label: '학부모 리포트', href: '/reports', icon: MessageSquare },
    { label: '리포트 검수 큐', href: '/reports/review', icon: ClipboardCheck },
    { label: '문제 은행', href: '/question-bank', icon: BookOpen },
    { label: '수행평가', href: '/performance', icon: GraduationCap },
    { label: '시험 분석', href: '/analysis', icon: BarChart3 },

    // 서포터(초등) 관련
    { label: '대시보드(초등)', href: '/elementary', icon: Calendar },
    { label: '루틴 일일 입력', href: '/elementary/input', icon: ClipboardCheck },
    { label: '영어 피드백', href: '/english/review', icon: BookOpen },
    { label: '토론 피드백', href: '/debate/review', icon: MessageSquare },
    { label: '완전학습 점검', href: '/mastery', icon: Target },
    { label: '라이브 워크숍', href: '/workshop', icon: Timer },
  ];

  // 역할별 필터링
  const navItems = allItems.filter(item => {
    if (item.href === '/') return true;

    if (role === 'coach') {
      return [
        '/middle-high',
        '/students',
        '/reports',
        '/reports/review',
        '/question-bank',
        '/performance',
        '/analysis'
      ].includes(item.href);
    } else if (role === 'supporter') {
      return [
        '/elementary',
        '/elementary/input',
        '/english/review',
        '/debate/review',
        '/mastery',
        '/workshop'
      ].includes(item.href);
    }
    
    // 그 외(역할 미지정 시) 통합 포탈에 해당하는 라우트 노출
    return true;
  });

  return (
    <nav className="w-full bg-[#FAF9F6] py-3 no-print">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {navItems.map((item) => {
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

