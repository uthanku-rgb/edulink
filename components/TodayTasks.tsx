'use client';

import React from 'react';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { TodayTasks as TodayTasksType } from '../types';
import { useRouter } from 'next/navigation';

interface TodayTasksProps {
  tasks: TodayTasksType;
  pendingCount?: number;
}

export default function TodayTasks({ tasks, pendingCount = 0 }: TodayTasksProps) {
  const router = useRouter();

  const taskList = [
    ...(pendingCount > 0 ? [{ label: '기록 확인 대기', value: `${pendingCount}건`, href: '#pending-queue' }] : []),
    { label: '학부모 리포트 컨펌', value: `${tasks.parentReportsToConfirm}건`, href: '/reports' },
    { label: '일일 코멘트 자동초안', value: `${tasks.dailyCommentsToAdd}명`, href: '/students' },
    { label: '신규 학생 OJT', value: tasks.newStudentOJT, href: '/students/new' },
    { label: '시험 분석 입력', value: `${tasks.examAnalysisToInput}명`, href: '/students' },
    { label: '수행평가 일정 알림', value: `${tasks.performanceTaskAlerts}건`, href: '/' },
    { label: '맞춤 문제 처방', value: `${tasks.prescriptionsPending}명`, href: '/question-bank' },
  ];

  return (
    <div className="w-full bg-white border border-[#E5E1DA] rounded-xl p-4 mb-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm mb-3">
        <CalendarCheck className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
        <span>오늘 할 일</span>
      </div>

      {/* 6개 작업 리스트 (데스크톱/태블릿 2열, 모바일 1열) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {taskList.map((task) => (
          <div
            key={task.label}
            onClick={() => {
              if (task.href.startsWith('#')) {
                const el = document.getElementById(task.href.substring(1));
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                router.push(task.href);
              }
            }}
            className="flex items-center justify-between bg-[#F5F5F4] hover:bg-[#EBEBE9] cursor-pointer rounded-lg px-3 py-2.5 transition-colors duration-150 group"
          >
            {/* 작업 이름 */}
            <span className="text-xs text-slate-500 font-normal">
              {task.label}
            </span>

            {/* 작업 값 */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-900">
                {task.value}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
