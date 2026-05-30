'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SectionNav from '../components/SectionNav';
import CrisisAlerts from '../components/CrisisAlerts';
import TodayTasks from '../components/TodayTasks';
import StudentStatusList from '../components/StudentStatusList';
import WeekStats from '../components/WeekStats';
import PendingDraftQueue from '../components/PendingDraftQueue';
import { 
  getAlerts, 
  getStudentStatuses, 
  seedMockDataIfEmpty,
  getStudents,
  getDailyRecords,
  saveDailyRecords
} from '../lib/storage';
import { mockTodayTasks } from '../data/mockData';
import { Alert, StudentStatus, DailyRecord, Student } from '../types';

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statuses, setStatuses] = useState<StudentStatus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      await seedMockDataIfEmpty();
      const loadedAlerts = await getAlerts();
      const loadedStatuses = await getStudentStatuses();
      const loadedStudents = await getStudents();
      const loadedRecords = await getDailyRecords();
      
      setAlerts(loadedAlerts);
      setStatuses(loadedStatuses);
      setStudents(loadedStudents);
      setDailyRecords(loadedRecords);
    } catch (err) {
      console.error('Failed to load storage data in Dashboard:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadDashboardData();
      setLoading(false);
    };
    init();
  }, []);

  const handleConfirm = async (recordId: string) => {
    try {
      const allRecords = await getDailyRecords();
      const updated = allRecords.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'confirmed' as const,
            confirmedAt: new Date().toISOString()
          };
        }
        return r;
      });
      await saveDailyRecords(updated);
      await loadDashboardData();
      alert('승인되었습니다.');
    } catch (err) {
      console.error('Failed to confirm draft record:', err);
      alert('승인 처리에 실패했습니다.');
    }
  };

  const handleSaveAndConfirm = async (updatedRecord: DailyRecord) => {
    try {
      const allRecords = await getDailyRecords();
      const filtered = allRecords.filter(r => r.id !== updatedRecord.id);
      const updated = [updatedRecord, ...filtered];
      await saveDailyRecords(updated);
      await loadDashboardData();
      alert('수정 및 승인이 완료되었습니다.');
    } catch (err) {
      console.error('Failed to edit and confirm record:', err);
      alert('저장 처리에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        데이터 로드 중...
      </div>
    );
  }

  // 대시보드 "기록 확인 대기" 계산
  const pendingRecords = dailyRecords.filter(r => r.status === 'draft' && r.submittedBy === 'student');
  const pendingCount = pendingRecords.length;

  // 동적 위크 스탯 연산
  const totalStudents = statuses.length;
  const avgProgressPercent = totalStudents > 0
    ? statuses.reduce((acc, cur) => acc + cur.progressPercent, 0) / totalStudents
    : 0;
  const avgAttendancePercent = totalStudents > 0
    ? statuses.reduce((acc, cur) => acc + cur.attendance7d, 0) / totalStudents
    : 0;
  const crisisCount = statuses.filter(s => s.state === 'crisis').length;

  const dynamicWeekStats = {
    totalStudents,
    avgProgressPercent,
    avgAttendancePercent,
    crisisCount
  };

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
        <TodayTasks tasks={mockTodayTasks} pendingCount={pendingCount} />

        {/* 2.5 기록 확인 대기 큐 */}
        <PendingDraftQueue
          pendingRecords={pendingRecords}
          students={students}
          onConfirm={handleConfirm}
          onSaveAndConfirm={handleSaveAndConfirm}
        />

        {/* 3. 담당 학생 현황 (상태별 카드 & 테이블 토글) */}
        <StudentStatusList initialStatuses={statuses} />

        {/* 4. 이번 주 통계 */}
        <WeekStats stats={dynamicWeekStats} />
      </main>
    </div>
  );
}
