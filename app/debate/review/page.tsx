'use client';

import React, { useState, useEffect } from 'react';
import { DebatePrep, ElementaryStudent, DebateTopic } from '@/types';
import { mockElementaryStudents } from '@/data/mockData';
import { debateTopics } from '@/data/debateTopics';
import { getDebatePreps, seedDebatePrepsIfEmpty } from '@/lib/storage';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Printer, 
  FileText, 
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function CoachReviewPage() {
  const [preps, setPreps] = useState<DebatePrep[]>([]);
  const [selectedPrep, setSelectedPrep] = useState<DebatePrep | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'done'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      seedDebatePrepsIfEmpty();
      const loaded = getDebatePreps();
      setPreps(loaded);
      
      // Auto-select the first prep if available
      if (loaded.length > 0) {
        setSelectedPrep(loaded[0]);
      }
      setLoading(false);
    }
  }, []);

  // Helpers to resolve student and topic
  const getStudentInfo = (studentId: string): ElementaryStudent => {
    const defaultStudent: ElementaryStudent = { id: studentId, name: '알 수 없음', grade: '초등', school: '기타' };
    return mockElementaryStudents.find(s => s.id === studentId) || defaultStudent;
  };

  const getTopicInfo = (topicId: string): DebateTopic => {
    const defaultTopic: DebateTopic = { 
      id: topicId, 
      q: '알 수 없는 주제', 
      values: ['찬성', '반대'], 
      desc: '', 
      questions: [], 
      keywords: [] 
    };
    return debateTopics.find(t => t.id === topicId) || defaultTopic;
  };

  // Filter logic
  const filteredPreps = preps.filter(prep => {
    const student = getStudentInfo(prep.studentId);
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prep.status === statusFilter;
    const matchesTopic = topicFilter === 'all' || prep.topicId === topicFilter;
    
    return matchesSearch && matchesStatus && matchesTopic;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-gowun text-stone-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2C9C8F] mx-auto mb-4"></div>
          <p className="text-sm">토론 준비 현황을 불러오고 있어요...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-gowun text-stone-850">
      
      {/* Top Banner Header */}
      <header className="bg-white shadow-sm border-b border-stone-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C9C8F]/10 flex items-center justify-center text-[#2C9C8F]">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800">토론 도우미 코치 관찰판</h1>
              <p className="text-xs text-stone-500 mt-0.5">학생들의 토론 준비 현황을 점검하고 피드백 리포트에 활용할 수 있습니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/debate"
              className="text-xs font-bold text-[#2C9C8F] border border-[#2C9C8F] hover:bg-[#2C9C8F]/5 px-4 py-2 rounded-lg transition-colors"
            >
              학생 화면 테스트하기
            </Link>
            <Link 
              href="/elementary"
              className="text-xs font-bold text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-lg transition-colors"
            >
              초등 대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Filter and Master List */}
        <div className="w-full md:w-[420px] flex flex-col shrink-0 gap-4">
          
          {/* Filtering Controls Card */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="학생 이름 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-stone-200 focus:border-[#2C9C8F] focus:ring-1 focus:ring-[#2C9C8F]/10"
              />
            </div>

            {/* Topic & Status Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">토론 주제</label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full text-xs rounded-lg border border-stone-200 p-2 bg-stone-50 focus:border-[#2C9C8F]"
                >
                  <option value="all">모든 주제</option>
                  {debateTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.q.length > 15 ? t.q.substring(0, 15) + '...' : t.q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">작성 상태</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'in_progress' | 'done')}
                  className="w-full text-xs rounded-lg border border-stone-200 p-2 bg-stone-50 focus:border-[#2C9C8F]"
                >
                  <option value="all">모든 상태</option>
                  <option value="in_progress">진행 중</option>
                  <option value="done">작성 완료</option>
                </select>
              </div>
            </div>

          </div>

          {/* List Card */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            <div className="p-3 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <span className="text-xs font-bold text-stone-500">목록 ({filteredPreps.length}개)</span>
            </div>

            {filteredPreps.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs italic">
                조건에 맞는 토론 준비 내역이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredPreps.map(prep => {
                  const student = getStudentInfo(prep.studentId);
                  const topic = getTopicInfo(prep.topicId);
                  const isSelected = selectedPrep?.id === prep.id;
                  
                  return (
                    <button
                      key={prep.id}
                      onClick={() => setSelectedPrep(prep)}
                      className={`w-full text-left p-4 hover:bg-stone-50 transition-colors flex flex-col gap-2 relative ${
                        isSelected ? 'bg-[#E8F6F4]/50 border-l-4 border-[#2C9C8F]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800 text-sm">{student.name}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                            {student.grade}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          prep.status === 'done'
                            ? 'bg-[#E8F6F4] text-[#2C9C8F]'
                            : 'bg-[#FFF9E6] text-[#b38600]'
                        }`}>
                          {prep.status === 'done' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              완료
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              진행 중
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 font-medium">
                        Q. {topic.q}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span>날짜: {prep.date}</span>
                        {prep.side ? (
                          <span className={`font-bold ${
                            prep.side === '찬성' ? 'text-[#2C9C8F]' : 'text-[#E8765A]'
                          }`}>
                            입장: {prep.side}
                          </span>
                        ) : (
                          <span>입장 미정</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Read-Only view of Selected DebatePrep */}
        <div className="flex-1 bg-white rounded-xl border border-stone-200 shadow-sm p-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {selectedPrep ? (
            (() => {
              const student = getStudentInfo(selectedPrep.studentId);
              const topic = getTopicInfo(selectedPrep.topicId);
              
              return (
                <div className="space-y-6">
                  {/* Detailed Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg font-bold text-stone-850">{student.name} 학생의 생각</span>
                        <span className="text-xs text-stone-500">
                          {student.school} · {student.grade}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-[#2C9C8F] leading-tight">
                        {topic.q}
                      </h2>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-stone-400">최근 업데이트: {selectedPrep.date}</div>
                      <div className="mt-1.5">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${
                          selectedPrep.side === '찬성' ? 'bg-[#2C9C8F]' : selectedPrep.side === '반대' ? 'bg-[#E8765A]' : 'bg-stone-300'
                        }`}>
                          {selectedPrep.side ? `${selectedPrep.side} 입장` : '입장 선택 보류'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1. Stance & Values Info */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">토론 주제 정보</span>
                      <p className="text-stone-600 font-normal leading-relaxed">{topic.desc}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">핵심 가치 구도</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-[#2C9C8F]/10 text-[#2C9C8F] font-bold px-2 py-0.5 rounded">
                          {topic.values[0]}
                        </span>
                        <span className="text-stone-400 text-[10px]">VS</span>
                        <span className="bg-[#E8765A]/10 text-[#E8765A] font-bold px-2 py-0.5 rounded">
                          {topic.values[1]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Evidence Box */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-stone-400" />
                      모은 근거 리스트 ({selectedPrep.evidence.length}개)
                    </h3>
                    
                    {selectedPrep.evidence.length === 0 ? (
                      <div className="bg-stone-50 border border-dashed border-stone-200 p-6 text-center text-xs text-stone-400 italic rounded-xl">
                        학생이 모은 근거 자료가 아직 없습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedPrep.evidence.map(item => (
                          <div 
                            key={item.id} 
                            className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 text-xs ${
                              item.side === '찬성' 
                                ? 'border-[#2C9C8F]/20 bg-[#2C9C8F]/5' 
                                : 'border-[#E8765A]/20 bg-[#E8765A]/5'
                            }`}
                          >
                            <p className="text-stone-700 leading-relaxed font-normal">{item.content}</p>
                            <div className="flex justify-between items-center text-[10px] text-stone-400 pt-1.5 border-t border-stone-100">
                              <span>출처: {item.source}</span>
                              <span className={`font-bold ${
                                item.side === '찬성' ? 'text-[#2C9C8F]' : 'text-[#E8765A]'
                              }`}>
                                {item.side} 측 근거
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Written Essay */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-stone-400" />
                      작성한 토론글
                    </h3>
                    
                    <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 text-xs">
                      <div className="p-4 bg-stone-50/30">
                        <span className="text-[10px] font-bold text-stone-400 block mb-1">시작하는 글 (서론)</span>
                        <p className="text-stone-700 font-normal leading-relaxed whitespace-pre-line">
                          {selectedPrep.essay.intro || <span className="text-stone-300 italic">아직 작성되지 않았습니다.</span>}
                        </p>
                      </div>

                      <div className="p-4 bg-stone-50/30">
                        <span className="text-[10px] font-bold text-stone-400 block mb-1">중심이 되는 글 (본론)</span>
                        <p className="text-stone-700 font-normal leading-relaxed whitespace-pre-line">
                          {selectedPrep.essay.body || <span className="text-stone-300 italic">아직 작성되지 않았습니다.</span>}
                        </p>
                      </div>

                      <div className="p-4 bg-stone-50/30">
                        <span className="text-[10px] font-bold text-stone-400 block mb-1">끝맺는 글 (결론)</span>
                        <p className="text-stone-700 font-normal leading-relaxed whitespace-pre-line">
                          {selectedPrep.essay.concl || <span className="text-stone-300 italic">아직 작성되지 않았습니다.</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Rebuttals */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-stone-400" />
                      예상 질문과 답변 전략
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-[#FFF0ED] p-4 rounded-xl border border-[#E8765A]/15">
                        <span className="text-[10px] font-bold text-[#E8765A] block mb-1.5">상대방의 예상 공격/반박</span>
                        <p className="text-stone-700 font-normal leading-relaxed">
                          {selectedPrep.rebuttal.their || <span className="text-stone-300 italic">아직 작성되지 않았습니다.</span>}
                        </p>
                      </div>

                      <div className="bg-[#E8F6F4] p-4 rounded-xl border border-[#2C9C8F]/15">
                        <span className="text-[10px] font-bold text-[#2C9C8F] block mb-1.5">나의 재반박/방어 대답</span>
                        <p className="text-stone-700 font-normal leading-relaxed">
                          {selectedPrep.rebuttal.mine || <span className="text-stone-300 italic">아직 작성되지 않았습니다.</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Print Action in Review */}
                  <div className="pt-4 border-t border-stone-100 flex justify-end">
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          // Standard window print or direct printing support
                          window.print();
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-stone-600 border border-stone-300 hover:border-stone-400 px-4 py-2 rounded-lg bg-white shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      이 보고서 인쇄하기
                    </button>
                  </div>

                </div>
              );
            })()
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8 text-stone-400 text-xs italic">
              왼쪽 목록에서 피드백할 학생의 토론지를 선택해주세요.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
