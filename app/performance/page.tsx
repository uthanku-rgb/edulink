'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import { getStudents } from '../../lib/storage';
import { Student } from '../../types';
import { getToday } from '../../lib/dateService';
import { useToast } from '../../components/ToastProvider';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  X
} from 'lucide-react';

interface PerformanceTask {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  school: string;
  subject: string;
  title: string;
  dueDate: string;
  status: '대기' | '진행중' | '완료';
  step: '주제선정' | '자료수집' | '초안작성' | '피드백' | '최종제출';
  managerComment: string;
}

const initialPerformanceTasks: PerformanceTask[] = [
  {
    id: 'perf_01',
    studentId: 'stu_01',
    studentName: '김민준',
    grade: '중3',
    school: '신라중학교',
    subject: '영어',
    title: '나의 진로 관련 영작 에세이 제출',
    dueDate: '2026-06-03',
    status: '진행중',
    step: '초안작성',
    managerComment: '1차 초안 작성 중 어색한 표현 첨삭 진행함. 서론 수정 필요.'
  },
  {
    id: 'perf_02',
    studentId: 'stu_02',
    studentName: '이서연',
    grade: '고1',
    school: '영동고등학교',
    subject: '통합과학',
    title: '신재생 에너지 탐구 포스터 제작',
    dueDate: '2026-06-05',
    status: '대기',
    step: '자료수집',
    managerComment: '아직 자료 조사가 미흡함. 수소 연료 전지 관련 자료집 전달 필요.'
  },
  {
    id: 'perf_03',
    studentId: 'stu_04',
    studentName: '최유나',
    grade: '고1',
    school: '영동고등학교',
    subject: '국어',
    title: '현대 소설 등장인물 심리 분석 보고서',
    dueDate: '2026-05-30',
    status: '완료',
    step: '최종제출',
    managerComment: '등장인물의 갈등 원인을 심리학 이론과 연계하여 매우 완성도 높게 제출함.'
  },
  {
    id: 'perf_04',
    studentId: 'stu_05',
    studentName: '정하린',
    grade: '고2',
    school: '대진고등학교',
    subject: '수학I',
    title: '삼각함수를 활용한 생체 바이오리듬 모델링',
    dueDate: '2026-06-08',
    status: '진행중',
    step: '피드백',
    managerComment: '그래프 스케일링 오차 확인 후 수정 유도함. 결과 기술 보완 필요.'
  }
];

export default function PerformancePage() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<PerformanceTask[]>(initialPerformanceTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'전체' | '대기' | '진행중' | '완료'>('전체');
  const [loading, setLoading] = useState(true);

  // 모달 입력 폼 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [subject, setSubject] = useState('수학');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'대기' | '진행중' | '완료'>('대기');
  const [step, setStep] = useState<'주제선정' | '자료수집' | '초안작성' | '피드백' | '최종제출'>('주제선정');
  const [managerComment, setManagerComment] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedStudents = await getStudents();
        setStudents(loadedStudents);
        
        // localStorage 백업 로드
        const saved = localStorage.getItem('edulink_performance_tasks');
        if (saved) {
          setTasks(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to load performance page data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveTasks = (updatedTasks: PerformanceTask[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('edulink_performance_tasks', JSON.stringify(updatedTasks));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title || !dueDate) {
      toast.info('필수 입력 항목을 채워주세요.');
      return;
    }

    const matchedStudent = students.find(s => s.id === selectedStudentId);
    if (!matchedStudent) return;

    const newTask: PerformanceTask = {
      id: `perf_${Date.now()}`,
      studentId: selectedStudentId,
      studentName: matchedStudent.name,
      grade: matchedStudent.grade,
      school: matchedStudent.school,
      subject,
      title,
      dueDate,
      status,
      step,
      managerComment
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setIsModalOpen(false);

    // 폼 리셋
    setSelectedStudentId('');
    setTitle('');
    setDueDate('');
    setStatus('대기');
    setStep('주제선정');
    setManagerComment('');
    toast.success('수행평가 일정이 성공적으로 등록되었습니다.');
  };

  const handleDeleteTask = (id: string) => {
    if (!confirm('해당 수행평가 일정을 삭제하시겠습니까?')) return;
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  const handleStatusChange = (id: string, newStatus: '대기' | '진행중' | '완료') => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        let newStep = t.step;
        if (newStatus === '완료') newStep = '최종제출';
        else if (newStatus === '진행중' && t.status === '대기') newStep = '초안작성';
        return { ...t, status: newStatus, step: newStep };
      }
      return t;
    });
    saveTasks(updated);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.studentName.includes(searchQuery) || t.subject.includes(searchQuery) || t.title.includes(searchQuery);
    const matchesStatus = statusFilter === '전체' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        수행평가 일정 로딩 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header title="수행평가 관리" studentCount={students.length} />
      <SectionNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-4 text-xs font-normal">
        {/* 필터 및 조작 바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white border border-[#E5E1DA] rounded-xl p-4">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['전체', '대기', '진행중', '완료'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all whitespace-nowrap ${
                  statusFilter === filter
                    ? 'bg-slate-800 border-slate-800 text-white font-medium'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="학생명, 과목, 주제 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800 font-normal w-48"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>수행평가 추가</span>
            </button>
          </div>
        </div>

        {/* 메인 테이블 목록 */}
        <div className="bg-white border border-[#E5E1DA] rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm border-b border-slate-100 pb-3 mb-4">
            <GraduationCap className="w-4 h-4 text-slate-600" />
            <span>수행평가 대비 리스트</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-normal text-[11px]">
                  <th className="py-2.5 px-2">학생명</th>
                  <th className="py-2.5 px-2">학년/학교</th>
                  <th className="py-2.5 px-2">과목</th>
                  <th className="py-2.5 px-2">평가 주제 / 과제명</th>
                  <th className="py-2.5 px-2">제출 마감일</th>
                  <th className="py-2.5 px-2">진행 단계</th>
                  <th className="py-2.5 px-2">상태 변경</th>
                  <th className="py-2.5 px-2">매니저 관찰 및 첨삭 피드백</th>
                  <th className="py-2.5 px-2 text-center w-12">삭제</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-normal">
                      대비 또는 진행 중인 수행평가 일정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    // 마감일 D-Day 계산
                    const today = getToday();
                    const due = new Date(task.dueDate);
                    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={task.id} className="border-b border-slate-100 text-slate-700 hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-2 font-medium text-slate-900">{task.studentName}</td>
                        <td className="py-3 px-2 text-slate-450">{task.grade} · {task.school.replace('학교', '')}</td>
                        <td className="py-3 px-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-650 font-medium">{task.subject}</span>
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-800">{task.title}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{task.dueDate}</span>
                            <span className={`text-[10px] mt-0.5 ${
                              diffDays < 0 ? 'text-slate-400' :
                              diffDays <= 2 ? 'text-red-500 font-medium' :
                              diffDays <= 5 ? 'text-amber-500 font-medium' : 'text-slate-400'
                            }`}>
                              {diffDays < 0 ? '제출 완료' : diffDays === 0 ? 'D-Day' : `D-${diffDays}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            task.step === '최종제출' ? 'bg-green-50 text-green-700 border border-green-200' :
                            task.step === '피드백' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            task.step === '초안작성' ? 'bg-[#FEF3C7] text-[#92400E] border border-amber-200' :
                            'bg-slate-50 text-slate-550 border border-slate-200'
                          }`}>
                            {task.step}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as '대기' | '진행중' | '완료')}
                            className="bg-white border border-slate-200 rounded px-1.5 py-1 text-[11px] focus:outline-none"
                          >
                            <option value="대기">대기</option>
                            <option value="진행중">진행중</option>
                            <option value="완료">완료</option>
                          </select>
                        </td>
                        <td className="py-3 px-2 text-slate-500 max-w-[200px] truncate" title={task.managerComment}>
                          {task.managerComment || '-'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-slate-350 hover:text-red-500 transition-colors"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 새 수행평가 등록 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#E5E1DA] rounded-xl max-w-md w-full p-6 relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 font-medium text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4">
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <span>수행평가 등록</span>
              </div>

              <form onSubmit={handleAddTask} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-medium">대상 학생 선택 *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    <option value="">학생을 선택해 주세요</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.school} · {s.grade})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">과목 *</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    >
                      <option value="수학">수학</option>
                      <option value="국어">국어</option>
                      <option value="영어">영어</option>
                      <option value="과학">과학</option>
                      <option value="사회">사회</option>
                      <option value="역사">역사</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">제출 마감일 *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-medium">수행평가 주제 및 내용 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 영어 찬반 에세이 제출"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">진행 상태</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as '대기' | '진행중' | '완료')}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    >
                      <option value="대기">대기</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">세부 진행 단계</label>
                    <select
                      value={step}
                      onChange={(e) => setStep(e.target.value as '주제선정' | '자료수집' | '초안작성' | '피드백' | '최종제출')}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    >
                      <option value="주제선정">주제선정</option>
                      <option value="자료수집">자료수집</option>
                      <option value="초안작성">초안작성</option>
                      <option value="피드백">피드백</option>
                      <option value="최종제출">최종제출</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-medium">매니저 첨삭 코멘트</label>
                  <textarea
                    value={managerComment}
                    onChange={(e) => setManagerComment(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] h-16 resize-none"
                    placeholder="의견 및 첨삭 상태 기재..."
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 py-2.5 w-full bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  수행평가 추가
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
