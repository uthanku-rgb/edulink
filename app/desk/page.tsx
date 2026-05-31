'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  Search, 
  Shield,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import { getStudents } from '../../lib/storage';
import { getEnrollments, toggleProgramEnrollment } from '../../lib/reportDb';
import { Student } from '../../types';
import { Enrollment } from '../../lib/report-engine-spec';

export default function DeskConsolePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const studentData = await getStudents();
      const enrollmentData = await getEnrollments();
      
      setStudents(studentData);
      setEnrollments(enrollmentData);
    } catch (err) {
      console.error('Failed to load Desk Console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePrework = async (studentId: string, currentActive: boolean) => {
    setUpdatingId(`${studentId}_prework`);
    try {
      const nextActive = !currentActive;
      const success = await toggleProgramEnrollment(studentId, 'prework', nextActive);
      
      if (success) {
        // Update local state
        setEnrollments(prev => {
          const filtered = prev.filter(e => !(e.studentId === studentId && e.programId === 'prework'));
          return [
            ...filtered,
            {
              studentId,
              programId: 'prework',
              active: nextActive,
              billing: 'addon',
              startedAt: new Date().toISOString(),
              endedAt: nextActive ? null : new Date().toISOString()
            }
          ];
        });
      } else {
        alert('등록 상태 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12 font-sans text-slate-800">
      <Header title="데스크 전용 관리 콘솔" studentCount={students.length} />
      <SectionNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 mt-4">
        {/* 뒤로가기 및 타이틀 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-normal align-self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            대시보드로 돌아가기
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 text-slate-500 hover:text-slate-700 border border-slate-200 bg-white rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>동기화 새로고침</span>
            </button>
          </div>
        </div>

        {/* 상단 안내 정보 배너 */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 mb-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-indigo-400">
              <Shield className="w-4 h-4" />
              데스크 권한 전용 수신 등록 관리
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              추가과금 프로그램인 <strong>프리워크 (Prework)</strong>의 학생별 수강 상태를 등록/해제합니다. 
              여기서 토글을 해제하면 향후 해당 학생은 프리워크 리포트 수신 대상에서 자동으로 제외됩니다.
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[10px] text-slate-300 font-mono self-start sm:self-center shrink-0">
            🔒 <strong>보안 수칙</strong>: 리포트 검수, 처방 기능은 코치 권한 영역입니다.
          </div>
        </div>

        {/* 검색 및 필터 바 */}
        <div className="bg-white border border-[#E5E1DA] rounded-xl p-4 mb-6 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름, 학교, 학년으로 검색..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50 font-normal"
            />
          </div>
        </div>

        {/* 학생 리스트 테이블 */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
            학생 데이터와 수신 정보 동기화 중...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white border border-[#E5E1DA] rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
            검색 결과에 맞는 학생이 없습니다.
          </div>
        ) : (
          <div className="bg-white border border-[#E5E1DA] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-normal">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-3 px-5">학생 이름</th>
                    <th className="py-3 px-4">학교 / 학년</th>
                    <th className="py-3 px-4">기본 학습 (core)</th>
                    <th className="py-3 px-4 text-center">프리워크 (prework) 등록 토글</th>
                    <th className="py-3 px-5 text-right">상태 업데이트 정보</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => {
                    const preworkEnroll = enrollments.find(
                      e => e.studentId === student.id && e.programId === 'prework'
                    );

                    const isPreworkActive = preworkEnroll ? preworkEnroll.active : false;
                    const isUpdating = updatingId === `${student.id}_prework`;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* 학생 명 */}
                        <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                            {student.name.substring(0, 2)}
                          </div>
                          <span>{student.name}</span>
                        </td>
                        
                        {/* 학교 / 학년 */}
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {student.school} · {student.grade}
                        </td>

                        {/* 기본 학습 등록 여부 */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-600">
                            <CheckCircle className="w-3 h-3" />
                            기본 포함
                          </span>
                        </td>

                        {/* 프리워크 등록 토글 버튼 */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleTogglePrework(student.id, isPreworkActive)}
                            disabled={isUpdating}
                            className="focus:outline-none transition-transform active:scale-95 inline-flex items-center justify-center"
                          >
                            {isPreworkActive ? (
                              <ToggleRight className={`w-10 h-6 text-emerald-500 ${isUpdating ? 'opacity-50' : ''}`} />
                            ) : (
                              <ToggleLeft className={`w-10 h-6 text-slate-300 ${isUpdating ? 'opacity-50' : ''}`} />
                            )}
                          </button>
                        </td>

                        {/* 업데이트 시간 정보 */}
                        <td className="py-3.5 px-5 text-right text-slate-400 font-mono text-[10px]">
                          {preworkEnroll ? (
                            isPreworkActive ? (
                              <span className="text-emerald-600 font-semibold">
                                ON (시작: {new Date(preworkEnroll.startedAt).toLocaleDateString()})
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                OFF (종료: {preworkEnroll.endedAt ? new Date(preworkEnroll.endedAt).toLocaleDateString() : ''})
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 flex items-center gap-0.5 justify-end">
                              미등록
                              <span title="토글을 켜면 신규 등록됩니다.">
                                <HelpCircle className="w-3 h-3 text-slate-350" />
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
