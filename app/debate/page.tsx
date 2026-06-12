'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvidenceItem, DebatePrep, ElementaryStudent } from '@/types';
import { mockElementaryStudents } from '@/data/mockData';
import { debateTopics } from '@/data/debateTopics';
import { getDebatePreps, saveDebatePreps, seedDebatePrepsIfEmpty } from '@/lib/storage';
import { useToast } from '../../components/ToastProvider';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Printer, 
  Search, 
  Sparkles, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export default function DebatePrepPage() {
  const toast = useToast();
  // State
  const [selectedStudent, setSelectedStudent] = useState<ElementaryStudent | null>(null);
  const [debatePreps, setDebatePreps] = useState<DebatePrep[]>([]);
  const [activePrep, setActivePrep] = useState<DebatePrep | null>(null);
  const [step, setStep] = useState<number>(1); // 1 to 6
  const [loading, setLoading] = useState(true);

  // Step 3 specific states
  const [evidenceContent, setEvidenceContent] = useState('');
  const [evidenceSource, setEvidenceSource] = useState('');
  const [evidenceSide, setEvidenceSide] = useState<'찬성' | '반대'>('찬성');
  const [activeSearchKeyword, setActiveSearchKeyword] = useState<string | null>(null);

  // Run initial seed and load preps
  useEffect(() => {
    if (typeof window !== 'undefined') {
      seedDebatePrepsIfEmpty();
      const loadedPreps = getDebatePreps();
      setDebatePreps(loadedPreps);
      
      // Auto-load student if saved in session/local storage for convenience
      const savedStudentId = localStorage.getItem('edulink_active_student_id');
      if (savedStudentId) {
        const student = mockElementaryStudents.find(s => s.id === savedStudentId);
        if (student) {
          setSelectedStudent(student);
        }
      }
      setLoading(false);
    }
  }, []);

  // Update localStorage whenever debatePreps changes
  const updatePrepsList = (updated: DebatePrep[]) => {
    setDebatePreps(updated);
    saveDebatePreps(updated);
  };

  // Select student handler
  const handleSelectStudent = (student: ElementaryStudent) => {
    setSelectedStudent(student);
    localStorage.setItem('edulink_active_student_id', student.id);
    
    // Check if student has an active prep in progress
    const studentPreps = debatePreps.filter(p => p.studentId === student.id);
    if (studentPreps.length > 0) {
      // Find the most recent active one, or completed one
      const inProgress = studentPreps.find(p => p.status === 'in_progress');
      if (inProgress) {
        setActivePrep(inProgress);
        // Determine step based on progress
        if (!inProgress.side) setStep(2);
        else if (inProgress.evidence.length === 0) setStep(3);
        else setStep(4);
      } else {
        // Just load the last one
        setActivePrep(studentPreps[studentPreps.length - 1]);
        setStep(1);
      }
    } else {
      setActivePrep(null);
      setStep(1);
    }
  };

  // Change student handler (logout-like)
  const handleLogoutStudent = () => {
    setSelectedStudent(null);
    setActivePrep(null);
    setStep(1);
    localStorage.removeItem('edulink_active_student_id');
  };

  // Topic select handler (Step 1)
  const handleSelectTopic = (topicId: string) => {
    if (!selectedStudent) return;

    // Check if there is already a prep for this topic
    const existing = debatePreps.find(
      p => p.studentId === selectedStudent.id && p.topicId === topicId
    );

    if (existing) {
      setActivePrep(existing);
      // Resume
      if (!existing.side) setStep(2);
      else if (existing.evidence.length === 0) setStep(3);
      else setStep(4);
    } else {
      // Create new
      const newPrep: DebatePrep = {
        id: `dp_${selectedStudent.id}_${topicId}_${Date.now()}`,
        studentId: selectedStudent.id,
        topicId: topicId,
        date: new Date().toISOString().split('T')[0],
        side: null,
        evidence: [],
        essay: { intro: '', body: '', concl: '' },
        rebuttal: { their: '', mine: '' },
        status: 'in_progress'
      };
      const updated = [...debatePreps, newPrep];
      updatePrepsList(updated);
      setActivePrep(newPrep);
      setStep(2);
    }
  };

  // Step change / update handler
  const updateActivePrep = (updates: Partial<DebatePrep>) => {
    if (!activePrep) return;
    const updatedPrep = { ...activePrep, ...updates } as DebatePrep;
    setActivePrep(updatedPrep);
    
    const updatedList = debatePreps.map(p => p.id === activePrep.id ? updatedPrep : p);
    updatePrepsList(updatedList);
  };

  // Add evidence handler (Step 3)
  const handleAddEvidence = () => {
    if (!activePrep || !evidenceContent.trim()) return;

    const newItem: EvidenceItem = {
      id: `ev_${Date.now()}`,
      content: evidenceContent.trim(),
      source: evidenceSource.trim() || '직접 작성',
      side: evidenceSide
    };

    const newEvidence = [...activePrep.evidence, newItem];
    updateActivePrep({ evidence: newEvidence });
    
    // Reset form
    setEvidenceContent('');
    setEvidenceSource('');
  };

  // Delete evidence handler
  const handleDeleteEvidence = (id: string) => {
    if (!activePrep) return;
    const newEvidence = activePrep.evidence.filter(e => e.id !== id);
    updateActivePrep({ evidence: newEvidence });
  };

  // Append evidence text to Essay Body (Step 5)
  const handleAppendEvidenceToBody = (evidence: EvidenceItem) => {
    if (!activePrep) return;
    const appendText = `\n• ${evidence.content} (${evidence.source})`;
    const currentBody = activePrep.essay.body;
    
    updateActivePrep({
      essay: {
        ...activePrep.essay,
        body: currentBody ? `${currentBody}${appendText}` : appendText.trim()
      }
    });
  };

  // Complete prep handler (Step 6)
  const handleCompletePrep = () => {
    updateActivePrep({ status: 'done' });
    toast.success('🎉 멋지게 준비를 마쳤어요! 친구의 생각이 예쁘게 정리되었네요.');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center font-gowun text-[#3a3230]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2C9C8F] mx-auto mb-4"></div>
          <p className="text-lg">따뜻한 토론방을 열고 있어요...</p>
        </div>
      </div>
    );
  }

  // --- 1. STUDENT SELECTION ROUTE ---
  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-gowun text-[#3a3230] p-6 md:p-12">
        <div className="max-w-xl w-full mx-auto my-auto">
          <div className="text-center mb-8">
            <h1 className="font-gaegu text-5xl text-[#2C9C8F] font-bold mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-[#F4B942]" />
              에듀링크 토론 준비 도우미
              <Sparkles className="w-8 h-8 text-[#F4B942]" />
            </h1>
            <p className="text-lg text-stone-600 mt-2">반가워요! 오늘은 어떤 친구가 생각을 정리해볼까요?</p>
          </div>

          <div className="bg-white rounded-[18px] p-6 md:p-8 shadow-md border border-[#FFF0E0]">
            <h2 className="text-xl font-bold mb-6 text-center text-[#3a3230]">내 이름을 콕 눌러주세요 👦👧</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mockElementaryStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className="p-4 bg-[#FFFBF7] border-2 border-[#FFF0E0] hover:border-[#F4B942] hover:bg-[#FFFDFB] rounded-[18px] text-center transition-all duration-200 active:scale-95 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center mx-auto mb-2 text-2xl group-hover:scale-110 transition-transform">
                    {student.id.endsWith('1') || student.id.endsWith('4') || student.id.endsWith('6') ? '👦' : '👧'}
                  </div>
                  <div className="font-bold text-lg">{student.name}</div>
                  <div className="text-xs text-stone-500 mt-1">{student.grade} · {student.school}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-8 space-y-2">
            <p className="text-xs text-stone-400">학습 매니저 전용 대시보드는 다른 주소로 접속해주세요.</p>
            <div>
              <Link 
                href="/"
                className="text-xs text-[#2C9C8F] hover:text-[#207f74] underline font-bold"
              >
                통합포탈로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current active topic details
  const activeTopic = activePrep ? debateTopics.find(t => t.id === activePrep.topicId) : null;

  // Render wizard steps
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-gowun text-[#3a3230] pb-16">
      
      {/* Top Friendly Header */}
      <header className="bg-white shadow-sm border-b border-[#FFF0E0] px-4 md:px-8 py-3 sticky top-0 z-40">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center text-xl">
              {selectedStudent.id.endsWith('1') || selectedStudent.id.endsWith('4') || selectedStudent.id.endsWith('6') ? '👦' : '👧'}
            </div>
            <div>
              <span className="font-gaegu text-2xl font-bold text-[#2C9C8F]">{selectedStudent.name}</span>
              <span className="text-sm text-stone-500 ml-1">친구의 토론 준비방</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogoutStudent}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-[#E8765A] border border-stone-200 hover:border-[#E8765A] px-3 py-1.5 rounded-full transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              이름 바꾸기
            </button>
            <Link 
              href="/"
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 px-3 py-1.5 rounded-full transition-all"
            >
              대시보드 나가기
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 mt-6">
        
        {/* Wizard Progress Bar */}
        {activePrep && (
          <div className="bg-white rounded-[18px] p-4 md:p-6 shadow-sm border border-[#FFF0E0] mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-stone-500">생각 키우기 단계</span>
              <span className="text-sm font-bold text-[#2C9C8F]">{step} / 6 단계</span>
            </div>
            
            {/* Visual Step Progress indicator */}
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-stone-100 -translate-y-1/2 rounded-full -z-10"></div>
              <div 
                className="absolute top-1/2 left-0 h-1.5 bg-[#2C9C8F] -translate-y-1/2 rounded-full transition-all duration-300 -z-10"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              ></div>
              
              <div className="flex justify-between">
                {[
                  { n: 1, label: '주제 고르기' },
                  { n: 2, label: '입장 정하기' },
                  { n: 3, label: '자료 모으기' },
                  { n: 4, label: '근거 정리' },
                  { n: 5, label: '생각 쓰기' },
                  { n: 6, label: '반박과 완성' }
                ].map((s) => (
                  <button
                    key={s.n}
                    disabled={s.n > step && (!activePrep.side && s.n >= 2)} // Allow clicking past steps for easy navigation
                    onClick={() => {
                      // Apply validations if trying to jump forward
                      if (s.n > step) {
                        if (step === 2 && !activePrep.side) {
                          toast.info('입장을 정해셔야 앞으로 나갈 수 있어요!');
                          return;
                        }
                        if (step === 3 && activePrep.evidence.length === 0) {
                          toast.info('근거를 1개 이상 모아주셔야 앞으로 갈 수 있어요!');
                          return;
                        }
                      }
                      setStep(s.n);
                    }}
                    className={`flex flex-col items-center group relative`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      s.n < step 
                        ? 'bg-[#2C9C8F] text-white' 
                        : s.n === step 
                          ? 'bg-[#F4B942] text-[#3a3230] ring-4 ring-[#FFF3E0]' 
                          : 'bg-stone-200 text-stone-500'
                    }`}>
                      {s.n < step ? <CheckCircle2 className="w-5 h-5" /> : s.n}
                    </div>
                    <span className={`text-[10px] md:text-xs mt-2 hidden sm:block font-medium ${
                      s.n === step ? 'text-[#3a3230] font-bold' : 'text-stone-400'
                    }`}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 1: SELECT TOPIC --- */}
        {step === 1 && (
          <div className="bg-white rounded-[18px] p-6 md:p-8 shadow-md border border-[#FFF0E0]">
            <div className="text-center mb-8">
              <h2 className="font-gaegu text-4xl font-bold text-[#3a3230] mb-2">어떤 이야기로 토론을 펼쳐볼까요?</h2>
              <p className="text-stone-500">아래의 가치들이 충돌하는 흥미진진한 4가지 질문 중 마음에 드는 질문을 골라보세요!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {debateTopics.map(topic => {
                const isSelected = activePrep?.topicId === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id)}
                    className={`text-left p-6 rounded-[18px] border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
                      isSelected 
                        ? 'border-[#2C9C8F] bg-[#E8F6F4]' 
                        : 'border-[#FFF0E0] bg-[#FFFBF7]'
                    }`}
                  >
                    <div className="flex gap-2 mb-3">
                      <span className="bg-[#2C9C8F] text-white text-xs px-2.5 py-1 rounded-full font-bold">
                        {topic.values[0]}
                      </span>
                      <span className="text-stone-400 text-xs self-center">VS</span>
                      <span className="bg-[#E8765A] text-white text-xs px-2.5 py-1 rounded-full font-bold">
                        {topic.values[1]}
                      </span>
                    </div>
                    <h3 className="font-gaegu text-2xl font-bold text-[#3a3230] mb-2 leading-tight">
                      {topic.q}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed font-normal">
                      {topic.desc}
                    </p>
                    {isSelected && (
                      <div className="mt-4 text-xs text-[#2C9C8F] font-bold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-4 h-4" />
                        이 주제로 공부를 이어갈게요
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- STEP 2: TOPIC STUDY & SIDE CHOICE --- */}
        {step === 2 && activePrep && activeTopic && (
          <div className="bg-white rounded-[18px] p-6 md:p-8 shadow-md border border-[#FFF0E0]">
            <div className="text-center mb-8">
              <h2 className="font-gaegu text-4xl font-bold text-[#3a3230] mb-2">질문을 탐구하고 내 마음을 정해봐요</h2>
              <p className="text-stone-500">주제 질문을 자세히 살펴보고 찬성/반대 중 끌리는 쪽을 골라보아요.</p>
            </div>

            <div className="bg-[#FFFBF7] rounded-[18px] p-6 border border-[#FFF0E0] mb-8">
              <h3 className="font-gaegu text-3xl text-center text-[#2C9C8F] font-bold mb-4">
                &quot;{activeTopic.q}&quot;
              </h3>
              <p className="text-stone-600 leading-relaxed text-center max-w-xl mx-auto">
                {activeTopic.desc}
              </p>
              
              <div className="mt-6 pt-6 border-t border-dashed border-[#FFF0E0] flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2C9C8F]"></span>
                  <span className="font-bold text-stone-700">{activeTopic.values[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8765A]"></span>
                  <span className="font-bold text-stone-700">{activeTopic.values[1]}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-bold text-center text-stone-700 mb-2">
                &quot;내 생각은 어느 쪽과 더 비슷한가요?&quot;
              </h4>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  onClick={() => updateActivePrep({ side: '찬성' })}
                  className={`p-6 rounded-[18px] border-2 transition-all flex flex-col items-center gap-2 ${
                    activePrep.side === '찬성'
                      ? 'border-[#2C9C8F] bg-[#E8F6F4] text-[#2C9C8F] shadow-inner font-bold scale-[0.98]'
                      : 'border-stone-200 bg-white hover:border-[#2C9C8F] text-stone-600'
                  }`}
                >
                  <ThumbsUp className={`w-8 h-8 ${activePrep.side === '찬성' ? 'fill-current' : ''}`} />
                  <span className="text-xl">👍 찬성해요</span>
                  <span className="text-xs text-stone-500 font-normal">
                    {activeTopic.values[0]} 쪽에 동의해요
                  </span>
                </button>

                <button
                  onClick={() => updateActivePrep({ side: '반대' })}
                  className={`p-6 rounded-[18px] border-2 transition-all flex flex-col items-center gap-2 ${
                    activePrep.side === '반대'
                      ? 'border-[#E8765A] bg-[#FFF0ED] text-[#E8765A] shadow-inner font-bold scale-[0.98]'
                      : 'border-stone-200 bg-white hover:border-[#E8765A] text-stone-600'
                  }`}
                >
                  <ThumbsDown className={`w-8 h-8 ${activePrep.side === '반대' ? 'fill-current' : ''}`} />
                  <span className="text-xl">👎 반대해요</span>
                  <span className="text-xs text-stone-500 font-normal">
                    {activeTopic.values[1]} 쪽에 동의해요
                  </span>
                </button>
              </div>

              <div className="bg-[#FFFDF5] border border-[#F4B942]/30 rounded-xl p-4 text-center max-w-lg mx-auto">
                <p className="text-stone-600 text-sm leading-relaxed">
                  💡 <strong>약속할게요!</strong> 나중에 생각이 정리되면서 입장이 바뀌어도 정말 괜찮아요.
                  의견을 자유롭게 가다듬는 것은 훌륭한 탐구 활동입니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 3: RESEARCH & ADD EVIDENCE --- */}
        {step === 3 && activePrep && activeTopic && (
          <div className="space-y-6">
            
            {/* 1. Research Prompt Questions */}
            <div className="bg-white rounded-[18px] p-6 shadow-md border border-[#FFF0E0]">
              <h3 className="font-gaegu text-3xl font-bold mb-3 flex items-center gap-2">
                <BookOpen className="text-[#2C9C8F]" />
                이런 점들을 찾아보고 생각해보아요
              </h3>
              <ul className="space-y-2 mt-4 pl-1">
                {activeTopic.questions.map((q, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-stone-700 leading-relaxed">
                    <span className="bg-[#FFF3E0] text-[#F4B942] w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Keyword Chips with Multi-Search Tab Selector */}
            <div className="bg-white rounded-[18px] p-6 shadow-md border border-[#FFF0E0]">
              <h3 className="font-gaegu text-3xl font-bold mb-2 flex items-center gap-2">
                <Search className="text-[#F4B942]" />
                검색창에 이런 단어를 입력해보아요
              </h3>
              <p className="text-xs text-stone-500 mb-4">단어 칩을 누르면 어린이들이 읽기 좋은 백과사전으로 바로 가볼 수 있어요.</p>
              
              <div className="flex flex-wrap gap-2.5">
                {activeTopic.keywords.map((kw, i) => {
                  const isActive = activeSearchKeyword === kw;
                  return (
                    <div key={i} className="relative">
                      <button
                        onClick={() => setActiveSearchKeyword(isActive ? null : kw)}
                        className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                          isActive 
                            ? 'bg-[#2C9C8F] text-white border-[#2C9C8F] ring-2 ring-[#E8F6F4]' 
                            : 'bg-[#FFFBF7] text-stone-700 border-stone-200 hover:border-[#2C9C8F]'
                        }`}
                      >
                        🔍 {kw}
                      </button>
                      
                      {/* Search Tooltip / Dropdown */}
                      {isActive && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-[#FFF0E0] p-3 w-64 z-10 animate-fade-in">
                          <p className="text-xs font-bold text-stone-600 mb-2">어디에서 검색해볼까요?</p>
                          <div className="flex flex-col gap-2">
                            <a
                              href={`https://ko.wikipedia.org/w/index.php?search=${encodeURIComponent(kw)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-left px-3 py-2 bg-[#FFFBF7] hover:bg-[#E8F6F4] rounded-lg text-xs font-semibold text-stone-700 flex items-center justify-between border border-stone-100 transition-colors"
                            >
                              <span>🌐 위키백과 사전</span>
                              <span className="text-[10px] text-[#2C9C8F]">새 탭 열기 ↗</span>
                            </a>
                            <a
                              href={`https://terms.naver.com/search.naver?query=${encodeURIComponent(kw)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-left px-3 py-2 bg-[#FFFBF7] hover:bg-[#FFF0ED] rounded-lg text-xs font-semibold text-stone-700 flex items-center justify-between border border-stone-100 transition-colors"
                            >
                              <span>📖 네이버 지식백과</span>
                              <span className="text-[10px] text-[#E8765A]">새 탭 열기 ↗</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Where else to search info box */}
              <div className="mt-6 pt-4 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-500 mr-2">어디에서 자료를 찾을까요?</span>
                <div className="inline-flex flex-wrap gap-2 mt-2">
                  {['위키백과', '네이버 지식백과', '어린이 신문', '책', '부모님·선생님 여쭤보기'].map((src, i) => (
                    <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Evidence Addition Form */}
            <div className="bg-white rounded-[18px] p-6 shadow-md border border-[#FFF0E0]">
              <h3 className="font-gaegu text-3xl font-bold mb-4 text-[#E8765A]">
                ✍️ 나만의 든든한 자료 모으기
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    자료의 핵심 내용을 요약해서 적어보세요
                  </label>
                  <textarea
                    rows={3}
                    value={evidenceContent}
                    onChange={(e) => setEvidenceContent(e.target.value)}
                    placeholder="예: 동물들이 좁은 우리에 갇히면 이상한 버릇이 생기고 스트레스를 많이 받아서 힘들어해요."
                    className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-3 border"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">
                      출처는 어디인가요?
                    </label>
                    <input
                      type="text"
                      value={evidenceSource}
                      onChange={(e) => setEvidenceSource(e.target.value)}
                      placeholder="예: 어린이 동물 뉴스 신문, 과학 5학년 책, 엄마"
                      className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-3 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">
                      이 자료는 어느 입장에 도움이 되나요?
                    </label>
                    <div className="flex bg-stone-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEvidenceSide('찬성')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          evidenceSide === '찬성'
                            ? 'bg-[#2C9C8F] text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        찬성 근거
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvidenceSide('반대')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          evidenceSide === '반대'
                            ? 'bg-[#E8765A] text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        반대 근거
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddEvidence}
                  disabled={!evidenceContent.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#F4B942] hover:bg-[#e0a733] text-[#3a3230] font-bold rounded-xl disabled:opacity-50 disabled:hover:bg-[#F4B942] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  근거 모으기 상자에 넣기
                </button>
              </div>

              {/* Added Evidence List */}
              <div className="mt-8 border-t border-stone-100 pt-6">
                <h4 className="text-sm font-bold text-stone-700 mb-4 flex items-center gap-1.5">
                  📁 지금까지 모은 자료 ({activePrep.evidence.length}개)
                </h4>
                
                {activePrep.evidence.length === 0 ? (
                  <p className="text-sm text-stone-400 italic text-center py-6">
                    아직 모은 자료가 없어요. 위의 검색어와 질문을 활용해 첫 자료를 모아보세요!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activePrep.evidence.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                          item.side === '찬성' 
                            ? 'border-[#2C9C8F]/20 bg-[#2C9C8F]/5' 
                            : 'border-[#E8765A]/20 bg-[#E8765A]/5'
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.side === '찬성' 
                                ? 'bg-[#E8F6F4] text-[#2C9C8F]' 
                                : 'bg-[#FFF0ED] text-[#E8765A]'
                            }`}>
                              {item.side} 근거
                            </span>
                            <span className="text-xs text-stone-500 font-medium">출처: {item.source}</span>
                          </div>
                          <p className="text-sm text-stone-700 leading-relaxed font-normal">{item.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvidence(item.id)}
                          className="text-stone-400 hover:text-[#E8765A] p-1 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 4: EVIDENCE SORTING --- */}
        {step === 4 && activePrep && activeTopic && (
          <div className="bg-white rounded-[18px] p-6 md:p-8 shadow-md border border-[#FFF0E0]">
            <div className="text-center mb-8">
              <h2 className="font-gaegu text-4xl font-bold text-[#3a3230] mb-2">모아놓은 근거를 한눈에 둘러보아요</h2>
              <p className="text-stone-500">찬성하는 근거와 반대하는 근거가 균형을 이루는지 살펴볼까요?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Agree Column */}
              <div className="border border-[#2C9C8F]/20 rounded-2xl bg-[#2C9C8F]/5 p-5">
                <h3 className="font-gaegu text-2xl font-bold text-[#2C9C8F] border-b border-[#2C9C8F]/10 pb-2 mb-4 flex justify-between items-center">
                  <span>👍 찬성하는 근거</span>
                  <span className="text-sm bg-[#2C9C8F] text-white px-2 py-0.5 rounded-full">
                    {activePrep.evidence.filter(e => e.side === '찬성').length}개
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {activePrep.evidence.filter(e => e.side === '찬성').length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-8 text-center">찬성 쪽 근거가 없습니다.</p>
                  ) : (
                    activePrep.evidence.filter(e => e.side === '찬성').map(e => (
                      <div key={e.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-stone-100 text-xs">
                        <p className="text-stone-700 leading-relaxed font-normal mb-1.5">{e.content}</p>
                        <span className="text-[10px] text-stone-400 font-medium">출처: {e.source}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Disagree Column */}
              <div className="border border-[#E8765A]/20 rounded-2xl bg-[#E8765A]/5 p-5">
                <h3 className="font-gaegu text-2xl font-bold text-[#E8765A] border-b border-[#E8765A]/10 pb-2 mb-4 flex justify-between items-center">
                  <span>👎 반대하는 근거</span>
                  <span className="text-sm bg-[#E8765A] text-white px-2 py-0.5 rounded-full">
                    {activePrep.evidence.filter(e => e.side === '반대').length}개
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {activePrep.evidence.filter(e => e.side === '반대').length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-8 text-center">반대 쪽 근거가 없습니다.</p>
                  ) : (
                    activePrep.evidence.filter(e => e.side === '반대').map(e => (
                      <div key={e.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-stone-100 text-xs">
                        <p className="text-stone-700 leading-relaxed font-normal mb-1.5">{e.content}</p>
                        <span className="text-[10px] text-stone-400 font-medium">출처: {e.source}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#FFFDF5] border-2 border-dashed border-[#F4B942]/40 rounded-xl p-5 text-center max-w-xl mx-auto">
              <p className="text-stone-600 text-sm leading-relaxed">
                📢 <strong>생각 더하기:</strong> 상대편 입장의 근거도 함께 살펴보았네요! 입장이 바뀌어도 정말 괜찮아요.
                토론 과정에서는 상대방의 입장을 잘 아는 것도 매우 훌륭한 전략이랍니다.
              </p>
              
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-xs text-stone-500 font-bold">지금 나의 입장 바꿀까요?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateActivePrep({ side: '찬성' })}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activePrep.side === '찬성'
                        ? 'bg-[#2C9C8F] text-white'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    찬성
                  </button>
                  <button
                    onClick={() => updateActivePrep({ side: '반대' })}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activePrep.side === '반대'
                        ? 'bg-[#E8765A] text-white'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    반대
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 5: ESSAY WRITING --- */}
        {step === 5 && activePrep && activeTopic && (
          <div className="bg-white rounded-[18px] p-6 md:p-8 shadow-md border border-[#FFF0E0]">
            <div className="text-center mb-6">
              <h2 className="font-gaegu text-4xl font-bold text-[#3a3230] mb-2">나만의 토론글로 생각을 완성해봐요</h2>
              <p className="text-stone-500">서론, 본론, 결론을 채우며 논리적인 한 편의 토론 글을 써보아요.</p>
            </div>

            <div className="space-y-6">
              {/* 1. Introduction */}
              <div className="space-y-2">
                <h3 className="font-gaegu text-2xl font-bold text-stone-700">
                  🎬 글의 시작 (서론)
                </h3>
                <p className="text-xs text-stone-500 font-normal">왜 이 토론 주제를 생각하게 되었는지, 어떤 현상이 있는지 소개해주세요.</p>
                <textarea
                  rows={3}
                  value={activePrep.essay.intro}
                  onChange={(e) => updateActivePrep({
                    essay: { ...activePrep.essay, intro: e.target.value }
                  })}
                  placeholder="예: 요즘 학교나 집 주변에서 동물원에 대한 찬성과 반대 의견이 많이 들리고 있어요. 동물원은 동물들을 직접 관찰하기 좋은 장소이지만, 동물의 자유도 고려해야 해요."
                  className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-3 border"
                />
              </div>

              {/* 2. Body (with evidence click insertion helper) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-stone-100 pb-2">
                  <h3 className="font-gaegu text-2xl font-bold text-stone-700">
                    💪 글의 중심 (본론)
                  </h3>
                  <span className="text-xs font-bold text-[#2C9C8F]">내 입장: {activePrep.side}</span>
                </div>
                
                {/* Evidence items matching the stance */}
                <div className="bg-[#FFFBF7] rounded-xl p-3 border border-[#FFF0E0]">
                  <p className="text-[11px] font-bold text-stone-500 mb-2">
                    💡 모아둔 <strong>{activePrep.side} 근거</strong>를 아래에서 콕 누르면 본론 글 속으로 쏙 들어갑니다!
                  </p>
                  
                  {activePrep.evidence.filter(e => e.side === activePrep.side).length === 0 ? (
                    <p className="text-xs text-stone-400 italic">모아진 {activePrep.side} 근거 자료가 없습니다. (자료 모으기 단계를 채워주세요)</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activePrep.evidence.filter(e => e.side === activePrep.side).map(e => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => handleAppendEvidenceToBody(e)}
                          className="text-left px-3 py-2 bg-white hover:bg-[#E8F6F4] border border-stone-200 hover:border-[#2C9C8F] rounded-lg text-xs transition-colors shadow-sm max-w-full"
                        >
                          <span className="text-[#2C9C8F] font-bold mr-1">📎 넣기</span>
                          <span className="text-stone-600 truncate inline-block max-w-xs align-bottom">{e.content}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <textarea
                  rows={6}
                  value={activePrep.essay.body}
                  onChange={(e) => updateActivePrep({
                    essay: { ...activePrep.essay, body: e.target.value }
                  })}
                  placeholder="예: 첫째, 동물은 좁은 철창에 가두면 심각한 정신적 스트레스를 받아 우울해합니다. 좁은 곳에 갇힌 동물들이 같은 자리를 맴돌며 힘들어하는 모습을 본 적이 있어요."
                  className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-3 border font-mono"
                />
              </div>

              {/* 3. Conclusion */}
              <div className="space-y-2 pt-2">
                <h3 className="font-gaegu text-2xl font-bold text-stone-700">
                  🏁 글의 마무리 (결론)
                </h3>
                <p className="text-xs text-stone-500 font-normal">나의 주장과 핵심적인 근거 한 가지를 마지막으로 예쁘게 묶어 마무리해요.</p>
                <textarea
                  rows={3}
                  value={activePrep.essay.concl}
                  onChange={(e) => updateActivePrep({
                    essay: { ...activePrep.essay, concl: e.target.value }
                  })}
                  placeholder="예: 결국 동물들의 고통을 줄이고 그들의 생명과 건강을 존중해주기 위해서라도 철장 속 동물원은 점차 없어지고 넓은 자연 보호 구역으로 변화되어야 한다고 확신합니다."
                  className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-3 border"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 6: REBUTTALS & PRINT SUMMARY --- */}
        {step === 6 && activePrep && activeTopic && (
          <div className="space-y-6">
            
            {/* 1. Rebuttal Preparation Inputs */}
            <div className="bg-white rounded-[18px] p-6 shadow-md border border-[#FFF0E0]">
              <h2 className="font-gaegu text-4xl font-bold text-[#3a3230] mb-2 text-center">
                🛡️ 반박 질문 대처하기
              </h2>
              <p className="text-stone-500 mb-6 text-center">상대방이 내 주장에 어떻게 질문할지 생각하고, 방어할 튼튼한 답변을 준비해요.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1 flex items-center gap-1">
                    👥 반대편 입장에서는 나의 말에 무엇이라고 공격/반박할까요?
                  </label>
                  <p className="text-xs text-stone-400 mb-2">내가 찬성이라면 반대편의 생각을, 반대라면 찬성편의 생각을 미리 써보는 거예요.</p>
                  <textarea
                    rows={3}
                    value={activePrep.rebuttal.their}
                    onChange={(e) => updateActivePrep({
                      rebuttal: { ...activePrep.rebuttal, their: e.target.value }
                    })}
                    placeholder="예: 동물원이 사라지면 멸종 위기에 처한 희귀한 동물을 보호할 공간이 없어지고, 생태 교육을 받기도 어려워진다고 할 것입니다."
                    className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-3 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1 flex items-center gap-1">
                    🛡️ 상대방의 반박에 나는 어떻게 다시 답변(재반박)할 것인가요?
                  </label>
                  <p className="text-xs text-stone-400 mb-2">상대방 의견도 중요하지만, 내 주장이 더 타당한 이유를 차분히 대답해봅시다.</p>
                  <textarea
                    rows={3}
                    value={activePrep.rebuttal.mine}
                    onChange={(e) => updateActivePrep({
                      rebuttal: { ...activePrep.rebuttal, mine: e.target.value }
                    })}
                    placeholder="예: 하지만 동물을 보호하기 위해서 넓은 생태 자연 공원을 활용할 수도 있으며, 가상 현실(VR) 기술 등으로 환경을 훼손하지 않는 교육 방법도 있습니다."
                    className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-3 border"
                  />
                </div>
              </div>
            </div>

            {/* 2. Visual Print Summary Card */}
            <div className="bg-white rounded-[18px] p-6 md:p-8 shadow-md border-2 border-[#2C9C8F]/20 print-area" id="debate-summary-print">
              <div className="flex justify-between items-start border-b border-stone-100 pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-stone-400">에듀링크 생각을 펼치는 토론 보고서</span>
                  <h1 className="font-gaegu text-4xl font-bold text-[#2C9C8F] mt-1">{activeTopic.q}</h1>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{selectedStudent.name} ({selectedStudent.grade})</div>
                  <div className="text-xs text-stone-400 mt-0.5">완성 날짜: {activePrep.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-[#FFFBF7] p-4 rounded-xl border border-[#FFF0E0]">
                    <div className="text-xs font-bold text-[#2C9C8F] mb-1">토론 주제 소개</div>
                    <p className="text-xs text-stone-600 leading-relaxed font-normal">{activeTopic.desc}</p>
                  </div>

                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60">
                    <div className="text-xs font-bold text-stone-500 mb-1.5">나의 최종 선택</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold px-3 py-1 rounded-full text-white ${
                        activePrep.side === '찬성' ? 'bg-[#2C9C8F]' : 'bg-[#E8765A]'
                      }`}>
                        {activePrep.side === '찬성' ? '👍 찬성' : '👎 반대'}
                      </span>
                      <span className="text-xs text-stone-500">({activeTopic.values[activePrep.side === '찬성' ? 0 : 1]} 가치 중시)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-500 mb-2">모은 근거 통계</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#2C9C8F]">찬성 근거:</span>
                        <span className="font-bold">{activePrep.evidence.filter(e => e.side === '찬성').length}개</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#E8765A]">반대 근거:</span>
                        <span className="font-bold">{activePrep.evidence.filter(e => e.side === '반대').length}개</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-200/60 text-[11px] text-stone-400 italic">
                    다양한 시각에서 근거들을 골고루 탐색하고 찾아냈어요!
                  </div>
                </div>
              </div>

              {/* Debate Essay Summary */}
              <div className="space-y-4 mb-6">
                <h3 className="font-gaegu text-2xl font-bold text-[#3a3230] border-b border-stone-100 pb-1">
                  📝 완성된 토론 논설글
                </h3>
                
                <div className="space-y-3 font-normal text-sm leading-relaxed text-stone-700">
                  <div className="bg-[#FFFBF7]/50 p-3 rounded-lg border border-[#FFF0E0]/60">
                    <strong className="text-xs text-stone-400 block mb-1">[서론]</strong>
                    {activePrep.essay.intro || <span className="text-stone-300 italic">작성된 서론이 없습니다.</span>}
                  </div>
                  
                  <div className="bg-[#FFFBF7]/50 p-3 rounded-lg border border-[#FFF0E0]/60">
                    <strong className="text-xs text-stone-400 block mb-1">[본론]</strong>
                    {activePrep.essay.body ? (
                      <p className="whitespace-pre-line">{activePrep.essay.body}</p>
                    ) : (
                      <span className="text-stone-300 italic">작성된 본론이 없습니다.</span>
                    )}
                  </div>

                  <div className="bg-[#FFFBF7]/50 p-3 rounded-lg border border-[#FFF0E0]/60">
                    <strong className="text-xs text-stone-400 block mb-1">[결론]</strong>
                    {activePrep.essay.concl || <span className="text-stone-300 italic">작성된 결론이 없습니다.</span>}
                  </div>
                </div>
              </div>

              {/* Rebuttal Summary */}
              <div className="space-y-3">
                <h3 className="font-gaegu text-2xl font-bold text-[#3a3230] border-b border-stone-100 pb-1">
                  🛡️ 예상 질문과 방어 전략
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                    <strong className="text-[#E8765A] block mb-1.5">상대의 예상 반박:</strong>
                    <p className="text-stone-700 font-normal leading-relaxed">
                      {activePrep.rebuttal.their || '작성된 상대방의 반박이 없습니다.'}
                    </p>
                  </div>
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                    <strong className="text-[#2C9C8F] block mb-1.5">나의 지혜로운 대답:</strong>
                    <p className="text-stone-700 font-normal leading-relaxed">
                      {activePrep.rebuttal.mine || '작성된 나의 답변이 없습니다.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Step 6 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#2C9C8F] hover:bg-[#207a6f] text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                🖨️ 예쁜 종이 보고서로 출력하기
              </button>

              {activePrep.status === 'in_progress' ? (
                <button
                  type="button"
                  onClick={handleCompletePrep}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#F4B942] hover:bg-[#e0a733] text-[#3a3230] font-bold rounded-xl shadow-sm transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  토론 준비 완전히 완성하기!
                </button>
              ) : (
                <div className="bg-[#E8F6F4] text-[#2C9C8F] font-bold px-4 py-3 rounded-xl border border-[#2C9C8F]/20 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  토론 준비 작성이 완료되어 보관 중입니다.
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- BOTTOM PREV/NEXT NAVIGATION --- */}
        {activePrep && (
          <div className="flex justify-between items-center mt-6 no-print">
            <button
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold transition-all text-sm ${
                step === 1
                  ? 'text-stone-300 cursor-not-allowed bg-transparent'
                  : 'text-stone-600 bg-white border border-stone-200 hover:border-[#2C9C8F] hover:text-[#2C9C8F]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              이전 단계
            </button>

            {step < 6 ? (
              <button
                onClick={() => {
                  // Validations per step before moving forward
                  if (step === 2 && !activePrep.side) {
                    toast.info('입장(찬성/반대)을 선택하셔야 다음 단계로 가실 수 있어요!');
                    return;
                  }
                  if (step === 3 && activePrep.evidence.length === 0) {
                    toast.info('자료를 1개 이상 모아주셔야 다음 단계로 갈 수 있어요!');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex items-center gap-1.5 px-6 py-3 bg-[#2C9C8F] hover:bg-[#227a6f] text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
              >
                다음 단계로
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-24"></div> // Dummy spacer
            )}
          </div>
        )}

      </main>
    </div>
  );
}
