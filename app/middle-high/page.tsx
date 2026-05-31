'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import CrisisAlerts from '../../components/CrisisAlerts';
import TodayTasks from '../../components/TodayTasks';
import StudentStatusList from '../../components/StudentStatusList';
import WeekStats from '../../components/WeekStats';
import PendingDraftQueue from '../../components/PendingDraftQueue';
import { 
  getAlerts, 
  getStudentStatuses, 
  seedMockDataIfEmpty,
  getStudents,
  getDailyRecords,
  saveDailyRecords,
  getMasteryChecks,
  getGaps
} from '../../lib/storage';
import { mockTodayTasks } from '../../data/mockData';
import { Alert, StudentStatus, DailyRecord, Student, MasteryCheck, Gap } from '../../types';

export default function MiddleHighDashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statuses, setStatuses] = useState<StudentStatus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [masteryChecks, setMasteryChecks] = useState<MasteryCheck[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      await seedMockDataIfEmpty();
      const loadedAlerts = await getAlerts();
      const loadedStatuses = await getStudentStatuses();
      const loadedStudents = await getStudents();
      const loadedRecords = await getDailyRecords();
      const loadedChecks = getMasteryChecks();
      const loadedGaps = getGaps();
      
      setAlerts(loadedAlerts);
      setStatuses(loadedStatuses);
      setStudents(loadedStudents);
      setDailyRecords(loadedRecords);
      setMasteryChecks(loadedChecks);
      setGaps(loadedGaps);
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

  // === 완전학습 메트릭 연산 (중고등) ===
  const middleHighStudentIds = students.map(s => s.id);
  const todayStr = '2026-05-27';
  
  // 1. 반 평균 인출률: 중고등 학생들의 모든 MasteryCheck의 retrievalScore 평균
  const mhChecks = masteryChecks.filter(c => middleHighStudentIds.includes(c.studentId));
  const classAvgRecall = mhChecks.length > 0
    ? Math.round(mhChecks.reduce((acc, cur) => acc + cur.retrievalScore, 0) / mhChecks.length)
    : 0;

  // 2. 구멍 누적 탑 학생: 중고등 학생들 중 open 상태인 Gap이 가장 많은 학생
  const mhOpenGaps = gaps.filter(g => g.status === 'open' && middleHighStudentIds.includes(g.studentId));
  
  // Count open gaps per student
  const gapCounts: Record<string, number> = {};
  middleHighStudentIds.forEach(id => {
    gapCounts[id] = 0;
  });
  mhOpenGaps.forEach(g => {
    gapCounts[g.studentId] = (gapCounts[g.studentId] || 0) + 1;
  });

  let topGapStudentId = '';
  let maxGapsCount = 0;
  Object.entries(gapCounts).forEach(([studentId, count]) => {
    if (count > maxGapsCount) {
      maxGapsCount = count;
      topGapStudentId = studentId;
    }
  });

  const topGapStudentName = topGapStudentId
    ? students.find(s => s.id === topGapStudentId)?.name || '알 수 없음'
    : '';

  // 3. 오늘 백지 테스트 미실시: 중고등 학생 수 (28) - 오늘 MasteryCheck가 등록된 중고등 학생 수
  const todayTestedStudentIds = new Set(
    mhChecks.filter(c => c.date === todayStr).map(c => c.studentId)
  );
  const todayUntestedCount = Math.max(0, students.length - todayTestedStudentIds.size);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      {/* 헤더 */}
      <Header 
        title="중고등 대시보드" 
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

        {/* 3.5 완전학습 (Mastery Learning) 현황 위젯 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>🎯</span>
              <span>완전학습 (Mastery Learning) 현황</span>
            </h2>
            <Link 
              href="/mastery"
              className="text-xs text-[#4F46E5] hover:underline font-semibold flex items-center gap-0.5"
            >
              완전학습 관리관 가기 &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-normal">
            <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
              <span className="text-slate-500 text-[10px] font-medium block">반 평균 인출률</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-slate-900">{classAvgRecall}%</span>
                <span className="text-[9px] text-slate-400 font-medium">중고등 평균</span>
              </div>
            </div>

            <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
              <span className="text-slate-500 text-[10px] font-medium block">구멍 누적 학생 (케어 신호)</span>
              <div className="flex items-baseline mt-1">
                {maxGapsCount > 0 ? (
                  <Link 
                    href="/mastery"
                    className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                  >
                    ⚠️ {topGapStudentName} ({maxGapsCount}개 구멍)
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-[#2C9C8F]">✅ 없음 (순항 중)</span>
                )}
              </div>
            </div>

            <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
              <span className="text-slate-500 text-[10px] font-medium block">오늘 백지 테스트 미실시</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-lg font-bold ${todayUntestedCount > 0 ? 'text-amber-600' : 'text-[#2C9C8F]'}`}>
                  {todayUntestedCount}명
                </span>
                <span className="text-[9px] text-slate-400 font-medium">/ 총 {students.length}명</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 이번 주 통계 */}
        <WeekStats stats={dynamicWeekStats} />
      </main>
    </div>
  );
}
