'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SectionNav from '../components/SectionNav';
import CrisisAlerts from '../components/CrisisAlerts';
import TodayTasks from '../components/TodayTasks';
import StudentStatusList from '../components/StudentStatusList';
import WeekStats from '../components/WeekStats';
import { getAlerts, getStudentStatuses, seedMockDataIfEmpty } from '../lib/storage';
import { mockTodayTasks, mockWeekStats } from '../data/mockData';
import { Alert, StudentStatus } from '../types';

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statuses, setStatuses] = useState<StudentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지 데이터 로드 (클라이언트 사이드 전용)
    const loadDashboardData = async () => {
      try {
        await seedMockDataIfEmpty();
        const loadedAlerts = await getAlerts();
        const loadedStatuses = await getStudentStatuses();
        setAlerts(loadedAlerts);
        setStatuses(loadedStatuses);
      } catch (err) {
        console.error('Failed to load storage data in Dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        데이터 로드 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      {/* 헤더 */}
      <Header 
        title="대시보드" 
        studentCount={statuses.length} 
        managerName="정수진" 
        dateString="2026.05.27 (월)" 
      />
      
      {/* 탭 네비게이션 */}
      <SectionNav />
      
      {/* 대시보드 주요 콘텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-4">
        {/* 1. 위기 시그널 알림 카드 */}
        <CrisisAlerts alerts={alerts} />

        {/* 2. 오늘 할 일 */}
        <TodayTasks tasks={mockTodayTasks} />

        {/* 3. 담당 학생 현황 (상태별 카드 & 테이블 토글) */}
        <StudentStatusList initialStatuses={statuses} />

        {/* 4. 이번 주 통계 */}
        <WeekStats stats={mockWeekStats} />
      </main>
    </div>
  );
}
