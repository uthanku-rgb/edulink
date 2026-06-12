'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import StudentStatusList from '../../components/StudentStatusList';
import { getStudentStatuses } from '../../lib/storage';
import { StudentStatus } from '../../types';

export default function StudentsPage() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<StudentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedStatuses = await getStudentStatuses();
        setStatuses(loadedStatuses);
      } catch (err) {
        console.error('Failed to load student list:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      <Header title="학생 관리" studentCount={statuses.length} />
      <SectionNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-4">
        {/* 상단 액션바 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-normal"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            대시보드로 돌아가기
          </button>
          
          <button
            onClick={() => router.push('/students/new')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>신규 학생 등록</span>
          </button>
        </div>

        {/* 학생 목록 테이블 (정렬/검색 포함) */}
        {statuses.length === 0 ? (
          <div className="bg-white border border-[#E5E1DA] rounded-xl p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500 leading-relaxed">
              등록된 학생이 없습니다. 학생 등록 페이지에서 신규 등록하거나, 관리자 페이지에서 데모 데이터를 시딩하세요.
            </p>
          </div>
        ) : (
          <StudentStatusList initialStatuses={statuses} />
        )}
      </main>
    </div>
  );
}
