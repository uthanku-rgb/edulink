'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, ArrowUpDown, LayoutGrid, Table } from 'lucide-react';
import { StudentStatus, StudentState } from '../types';
import StudentCard from './shared/StudentCard';

interface StudentStatusListProps {
  initialStatuses: StudentStatus[];
}

type FilterType = 'all' | StudentState;
type SortColumn = 'name' | 'dDay' | 'progress' | 'alerts';
type SortOrder = 'asc' | 'desc';

export default function StudentStatusList({ initialStatuses = [] }: StudentStatusListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<SortColumn>('dDay');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 필터 칩 목록
  const filterChips = [
    { label: '전체', value: 'all', count: initialStatuses.length },
    { label: '위기', value: 'crisis', count: initialStatuses.filter(s => s.state === 'crisis').length, bg: 'bg-[#FDF2F2] text-[#9B1C1C]' },
    { label: '주의', value: 'warning', count: initialStatuses.filter(s => s.state === 'warning').length, bg: 'bg-[#FEF3C7] text-[#92400E]' },
    { label: '정상', value: 'normal', count: initialStatuses.filter(s => s.state === 'normal').length, bg: 'bg-[#ECFDF5] text-[#065F46]' },
    { label: '회고', value: 'autopsy', count: initialStatuses.filter(s => s.state === 'autopsy').length, bg: 'bg-[#EFF6FF] text-[#1E40AF]' },
  ];

  // 정렬 처리 함수
  const handleSort = (column: SortColumn) => {
    if (sortCol === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(column);
      setSortOrder('asc');
    }
  };

  // 필터링 및 검색, 정렬 연산
  const filteredAndSortedStatuses = useMemo(() => {
    let result = [...initialStatuses];

    // 1. 상태 필터링
    if (activeFilter !== 'all') {
      result = result.filter(s => s.state === activeFilter);
    }

    // 2. 이름/학교 검색 필터링
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => s.studentName.toLowerCase().includes(q) || s.school.toLowerCase().includes(q)
      );
    }

    // 3. 정렬 적용
    result.sort((a, b) => {
      let comparison = 0;
      if (sortCol === 'name') {
        comparison = a.studentName.localeCompare(b.studentName);
      } else if (sortCol === 'dDay') {
        comparison = a.dDay - b.dDay;
      } else if (sortCol === 'progress') {
        comparison = a.progressPercent - b.progressPercent;
      } else if (sortCol === 'alerts') {
        comparison = a.alertCount - b.alertCount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [initialStatuses, activeFilter, searchQuery, sortCol, sortOrder]);

  // 카드 뷰에서 보여줄 학생 (김민준, 최유나, 정하린, 서지윤 고정)
  const featuredStudents = useMemo(() => {
    const featuredStudentIds = ['stu_01', 'stu_04', 'stu_05', 'stu_06'];
    return featuredStudentIds
      .map(id => initialStatuses.find(s => s.studentId === id))
      .filter((s): s is StudentStatus => !!s);
  }, [initialStatuses]);

  // 상태 배지 표시 헬퍼
  const getStateBadge = (state: StudentState) => {
    switch (state) {
      case 'crisis': return <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>;
      case 'warning': return <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>;
      case 'normal': return <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>;
      case 'autopsy': return <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>;
      default: return null;
    }
  };

  return (
    <div className="w-full bg-white border border-[#E5E1DA] rounded-xl p-4 mb-4">
      {/* 헤더 및 컨트롤 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm">
          <Users className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
          <span>담당 학생 ({activeFilter === 'all' ? '전체' : filterChips.find(c => c.value === activeFilter)?.label})</span>
        </div>

        {/* 뷰 전환 및 정렬 정보 */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <span className="text-[10px] text-slate-400 font-normal">
            진척률/D-Day 기준 정렬
          </span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1 rounded ${viewMode === 'card' ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="카드 뷰"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="테이블 뷰"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* 필터 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => {
                setActiveFilter(chip.value as FilterType);
                if (viewMode === 'card') setViewMode('table'); // 전체 필터링을 편하게 보기 위해 테이블 뷰로 자동 전환
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all whitespace-nowrap ${
                activeFilter === chip.value
                  ? 'bg-slate-800 border-slate-800 text-white font-medium'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span>{chip.label}</span>
              <span className={`text-[10px] px-1 rounded-full ${
                activeFilter === chip.value ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {chip.count}
              </span>
            </button>
          ))}
        </div>

        {/* 검색 창 */}
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="이름 또는 학교 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800 font-normal"
          />
        </div>
      </div>

      {/* 뷰 내용 */}
      {viewMode === 'card' && searchQuery === '' && activeFilter === 'all' ? (
        // 시안 모방 카드 그리드 (4인)
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {featuredStudents.map(student => (
              <StudentCard key={student.studentId} status={student} />
            ))}
          </div>
          
          <button
            onClick={() => setViewMode('table')}
            className="w-full py-2.5 text-center text-xs font-medium text-slate-500 bg-[#F5F5F4] hover:bg-[#EBEBE9] border border-slate-200 rounded-lg transition-colors"
          >
            + 학생 {initialStatuses.length - featuredStudents.length}명 더보기 (테이블 목록)
          </button>
        </div>
      ) : (
        // 1024px 스캔 요구사항용 컴팩트 테이블 뷰
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-normal">
                <th className="py-2.5 px-2 text-center w-8">상태</th>
                <th className="py-2.5 px-2 cursor-pointer hover:text-slate-700" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    학생명 <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th className="py-2.5 px-2">학년</th>
                <th className="py-2.5 px-2">학교</th>
                <th className="py-2.5 px-2">시즌단계</th>
                <th className="py-2.5 px-2 cursor-pointer hover:text-slate-700" onClick={() => handleSort('dDay')}>
                  <div className="flex items-center gap-1">
                    D-Day <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th className="py-2.5 px-2 cursor-pointer hover:text-slate-700" onClick={() => handleSort('progress')}>
                  <div className="flex items-center gap-1">
                    진척률 <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th className="py-2.5 px-2">회독</th>
                <th className="py-2.5 px-2">출석률(7일)</th>
                <th className="py-2.5 px-2 cursor-pointer hover:text-slate-700" onClick={() => handleSort('alerts')}>
                  <div className="flex items-center gap-1">
                    알림 <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStatuses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-normal">
                    조건에 해당하는 학생이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredAndSortedStatuses.map((student) => (
                  <tr
                    key={student.studentId}
                    onClick={() => router.push(`/students/${student.studentId}`)}
                    className="border-b border-slate-100 hover:bg-[#FAF9F6] cursor-pointer text-slate-800 transition-colors font-normal"
                  >
                    <td className="py-2 px-2 text-center">
                      {getStateBadge(student.state)}
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-900">
                      {student.studentName}
                    </td>
                    <td className="py-2 px-2 text-slate-500">{student.grade}</td>
                    <td className="py-2 px-2 text-slate-500">{student.school}</td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        student.phase === 'Build' ? 'bg-slate-100 text-slate-600' :
                        student.phase === 'Race' ? 'bg-[#FEF3C7] text-[#92400E]' :
                        student.phase === 'Battle' ? 'bg-[#FDF2F2] text-[#9B1C1C]' :
                        'bg-[#EFF6FF] text-[#1E40AF]'
                      }`}>
                        {student.phase}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium">
                      {student.phase === 'Autopsy' ? `T+${Math.abs(student.dDay)}` : `D-${student.dDay}`}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              student.state === 'crisis' ? 'bg-red-500' :
                              student.state === 'warning' ? 'bg-amber-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${student.progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {student.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-slate-500">
                      {student.reviewStage}회독
                    </td>
                    <td className="py-2 px-2 text-slate-500">
                      {student.attendance7d}%
                    </td>
                    <td className="py-2 px-2 text-center">
                      {student.alertCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-medium">
                          {student.alertCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
