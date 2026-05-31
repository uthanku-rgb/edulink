'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ExpressionItem, 
  EnglishOutput, 
  EnglishProgress 
} from '@/types';
import { mockElementaryStudents } from '@/data/mockData';
import { 
  getExpressionItems, 
  getEnglishOutputs, 
  saveEnglishOutputs,
  seedEnglishMockDataIfEmpty 
} from '@/lib/storage';
import { getAudio } from '@/lib/audioStore';
import { 
  Award, 
  Pause, 
  Printer, 
  Volume2, 
  Check, 
  Mic, 
  Edit, 
  Globe, 
  Info
} from 'lucide-react';

// STAGE_MAP: 리틀팍스 레벨 → 코호트 '우리 단계' 매핑 테이블
const STAGE_MAP: Record<string, { stage: number; name: string; desc: string; nextGuide: string }> = {
  '1': { stage: 1, name: '귀 트기', desc: '영어 소리에 익숙해지는 시기', nextGuide: '리틀팍스 Level 2로 넘어가며 재미있는 소리를 듣고 한두 단어씩 흉내 내 말하는 훈련을 시작해요!' },
  '2': { stage: 2, name: '따라 말하기', desc: '들었던 걸 흉내 내 발화 시작', nextGuide: '단어/표현 줍기 활동으로 어휘 주머니를 채우고, 섀도잉 양을 늘려 Level 3 도전을 준비해요!' },
  '3': { stage: 3, name: '표현 줍기', desc: '표현을 능동적으로 모으고 씀', nextGuide: '단어들을 결합해 나만의 문장을 만드는 영작 훈련과 쉬운 리텔링을 연습해요!' },
  '4': { stage: 4, name: '내 말로 말하기', desc: '리텔링·프리토킹으로 출력', nextGuide: '줄거리를 요약해 막힘없이 스토리텔링하며 영작문의 디테일을 다듬어 유창성을 높여요!' },
  '5': { stage: 4, name: '내 말로 말하기', desc: '리텔링·프리토킹으로 출력', nextGuide: '줄거리를 요약해 막힘없이 스토리텔링하며 영작문의 디테일을 다듬어 유창성을 높여요!' },
  '6': { stage: 4, name: '내 말로 말하기', desc: '리텔링·프리토킹으로 출력', nextGuide: '줄거리를 요약해 막힘없이 스토리텔링하며 영작문의 디테일을 다듬어 유창성을 높여요!' },
  '7': { stage: 4, name: '내 말로 말하기', desc: '리텔링·프리토킹으로 출력', nextGuide: '줄거리를 요약해 막힘없이 스토리텔링하며 영작문의 디테일을 다듬어 유창성을 높여요!' },
  '8': { stage: 4, name: '내 말로 말하기', desc: '리텔링·프리토킹으로 출력', nextGuide: '줄거리를 요약해 막힘없이 스토리텔링하며 영작문의 디테일을 다듬어 유창성을 높여요!' },
  '9': { stage: 4, name: '내 말로 말하기', desc: '리텔링·프리토킹으로 출력', nextGuide: '최고 단계입니다! 다양한 원서 독서 및 고급 토픽 토론 연계로 생각을 확장해요!' },
};

const STAGE_INFOS = [
  { stage: 1, name: '1단계: 귀 트기', desc: '영어 소리에 익숙해지는 시기', color: 'border-[#C3ECE7] bg-[#E8F6F4] text-[#2C9C8F]' },
  { stage: 2, name: '2단계: 따라 말하기', desc: '들었던 걸 흉내 내 발화 시작', color: 'border-[#FFE9C9] bg-[#FFF3E0] text-[#D99B2B]' },
  { stage: 3, name: '3단계: 표현 줍기', desc: '표현을 능동적으로 모으고 씀', color: 'border-[#FFDAD1] bg-[#FFF0ED] text-[#E8765A]' },
  { stage: 4, name: '4단계: 내 말로 말하기', desc: '리텔링·프리토킹으로 출력', color: 'border-[#E8DCF7] bg-[#F4EFFB] text-[#9F7AEA]' }
];

export default function EnglishCoachReviewPage() {
  const [mounted, setMounted] = useState(false);


  // 데이터 상태
  const [expressionItems, setExpressionItems] = useState<ExpressionItem[]>([]);
  const [englishOutputs, setEnglishOutputs] = useState<EnglishOutput[]>([]);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'review'>('roadmap');

  // 필터 및 선택 상태
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'unsubmitted' | 'no_recording' | 'no_writing'>('all');
  
  // 피드백 관련 상태
  const [coachNoteInput, setCoachNoteInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 오디오 컨트롤 관련

  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      seedEnglishMockDataIfEmpty();
      
      setExpressionItems(getExpressionItems());
      setEnglishOutputs(getEnglishOutputs());
    }
  }, []);

  // 오늘 날짜 문자열 계산
  const getTodayString = () => {
    // 시안 기준일: 2026-05-30
    return '2026-05-30';
  };

  const todayStr = getTodayString();

  // 학생별 동적 EnglishProgress 계산 함수
  const getStudentProgress = (studentId: string): EnglishProgress => {
    const studentOutputs = englishOutputs.filter(o => o.studentId === studentId);
    const studentExprs = expressionItems.filter(e => e.studentId === studentId);

    // 가장 최근 레벨 확인 (정렬)
    const sortedOutputs = [...studentOutputs].sort((a, b) => b.date.localeCompare(a.date));
    const latestLevel = sortedOutputs[0]?.level || '1';

    const stageInfo = STAGE_MAP[latestLevel] || { stage: 1 };

    // 누적 실적 계산
    const booksCumulative = studentOutputs.length;
    const expressionsCount = studentExprs.length;
    const recordingsCount = studentOutputs.filter(o => o.hasRecording).length;
    const writingsCount = studentOutputs.filter(o => o.writing && o.writing.trim().length > 0).length;

    // 이번 주 학습 시간 합 (2026-05-25 ~ 2026-05-31 주간 가정)
    const startOfWeek = new Date('2026-05-25');
    const endOfWeek = new Date('2026-05-31T23:59:59');

    const weekOutputs = studentOutputs.filter(o => {
      const d = new Date(o.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
    const weekMinutes = weekOutputs.reduce((sum, o) => sum + o.minutes, 0);

    return {
      studentId,
      littlefoxLevel: latestLevel,
      ourStage: stageInfo.stage,
      booksCumulative,
      expressionsCount,
      recordingsCount,
      writingsCount,
      weekMinutes
    };
  };

  // 모든 학생의 Progress 맵 계산
  const progressMap = mockElementaryStudents.reduce((acc, curr) => {
    acc[curr.id] = getStudentProgress(curr.id);
    return acc;
  }, {} as Record<string, EnglishProgress>);

  // 학생의 오늘 아웃풋
  const getStudentTodayOutput = (studentId: string): EnglishOutput | undefined => {
    return englishOutputs.find(o => o.studentId === studentId && o.date === todayStr);
  };

  // 피드백 저장
  const handleSaveFeedback = (studentId: string, outputId: string) => {
    const updated = englishOutputs.map(o => {
      if (o.id === outputId) {
        return { ...o, coachNote: coachNoteInput.trim() || undefined };
      }
      return o;
    });

    saveEnglishOutputs(updated);
    setEnglishOutputs(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // IndexedDB 오디오 로드 및 재생
  const handlePlayRecording = async (recordingId: string) => {
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    try {
      const blob = await getAudio(recordingId);
      if (!blob) {
        alert('녹음 파일을 불러올 수 없습니다. 파일이 손상되었거나 삭제되었을 수 있습니다.');
        return;
      }
      const url = URL.createObjectURL(blob);

      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(url);
        audioPlayerRef.current.onended = () => setIsPlaying(false);
      } else {
        audioPlayerRef.current.src = url;
      }

      audioPlayerRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('녹음 로드 실패:', err);
      alert('오디오 재생 중 오류가 발생했습니다.');
    }
  };

  // Selected Student Details for Roadmap Tab
  const selectedRoadmapStudent = activeTab === 'roadmap' && selectedStudentId 
    ? mockElementaryStudents.find(s => s.id === selectedStudentId) 
    : null;
  const selectedRoadmapProgress = selectedRoadmapStudent 
    ? progressMap[selectedRoadmapStudent.id] 
    : null;

  // Filters for Coach Review Tab
  const filteredStudents = mockElementaryStudents.filter(student => {
    const todayOutput = getStudentTodayOutput(student.id);
    
    if (reviewFilter === 'unsubmitted') {
      return !todayOutput;
    }
    if (reviewFilter === 'no_recording') {
      return todayOutput && !todayOutput.hasRecording;
    }
    if (reviewFilter === 'no_writing') {
      return todayOutput && !todayOutput.writing;
    }
    return true; // all
  });

  // Selected Student for Coach Review Tab
  const selectedReviewStudent = activeTab === 'review' && selectedStudentId
    ? mockElementaryStudents.find(s => s.id === selectedStudentId)
    : null;
  const selectedReviewOutput = selectedReviewStudent
    ? getStudentTodayOutput(selectedReviewStudent.id)
    : null;
  const selectedReviewExpressions = selectedReviewStudent && selectedReviewOutput
    ? expressionItems.filter(e => e.studentId === selectedReviewStudent.id && e.date === todayStr)
    : [];

  // Update coachNote text input when selecting a student
  useEffect(() => {
    if (selectedReviewOutput) {
      setCoachNoteInput(selectedReviewOutput.coachNote || '');
    } else {
      setCoachNoteInput('');
    }
    // Stop any playing audio
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId, activeTab]);

  // Clean print handler
  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#3a3230] flex flex-col pb-12 font-gowun selection:bg-[#FFE9C9]">
      
      {/* Print CSS Injector */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-card, .print-card * {
            visibility: visible;
          }
          .print-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            padding: 30px !important;
            background: white !important;
            border-radius: 12px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Coach Navigation */}
      <header className="bg-white shadow-sm border-b border-[#FFF0E0] px-4 md:px-8 py-3 sticky top-0 z-40 no-print">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F6F4] text-[#2C9C8F] flex items-center justify-center text-xl shadow-sm">
              👩‍🏫
            </div>
            <div>
              <span className="font-gaegu text-xl md:text-2xl font-bold text-[#2C9C8F]">정수진 코치</span>
              <span className="text-xs text-stone-500 ml-1">초등 리틀팍스 영어 관리자</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-stone-100 p-1 rounded-full border border-stone-200/50">
              <button
                onClick={() => {
                  setActiveTab('roadmap');
                  setSelectedStudentId(null);
                }}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                  activeTab === 'roadmap'
                    ? 'bg-[#2C9C8F] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                🗺️ 진도 로드맵
              </button>
              <button
                onClick={() => {
                  setActiveTab('review');
                  setSelectedStudentId(mockElementaryStudents[0]?.id || null);
                }}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                  activeTab === 'review'
                    ? 'bg-[#2C9C8F] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                📋 오늘 코치 점검판
              </button>
            </div>
            <Link 
              href="/elementary"
              className="text-xs font-bold text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-lg transition-colors"
            >
              초등 대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </header>

      {/* Main Console */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 mt-6 no-print">
        
        {/* Quick overall summaries */}
        <section className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border-2 border-[#FFF0E0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="bg-[#E8F6F4] text-[#2C9C8F] rounded-xl p-2.5 shrink-0 text-xl">
              🎓
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">참여 초등학생</span>
              <span className="text-base font-bold text-stone-800">{mockElementaryStudents.length}명</span>
            </div>
          </div>

          <div className="bg-white border-2 border-[#FFF0E0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="bg-[#FFF3E0] text-[#D99B2B] rounded-xl p-2.5 shrink-0 text-xl">
              ⏱️
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">이번 주 평균 영어</span>
              <span className="text-base font-bold text-stone-800">
                {Math.round(
                  Object.values(progressMap).reduce((sum, p) => sum + p.weekMinutes, 0) /
                  mockElementaryStudents.length
                )}분
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-[#FFF0E0] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="bg-[#FFF0ED] text-[#E8765A] rounded-xl p-2.5 shrink-0 text-xl">
              🪙
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">수집한 표현 총합</span>
              <span className="text-base font-bold text-stone-800">
                {Object.values(progressMap).reduce((sum, p) => sum + p.expressionsCount, 0)}개
              </span>
            </div>
          </div>
        </section>

        {/* --- TAB A: PROGRESS ROADMAP --- */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            
            {/* The Horizontal Roadmap Tracks */}
            <div className="bg-white border-2 border-[#FFF0E0] rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-5 h-5 text-[#2C9C8F]" />
                <h3 className="text-base font-bold text-stone-800">
                  코호트 영어 성장 로드맵 (리틀팍스 연계) 🗺️
                </h3>
              </div>

              {/* 가로 카드 그리드 (단계) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {STAGE_INFOS.map((stageInfo) => {
                  // Students currently in this stage
                  const stageStudents = mockElementaryStudents.filter(
                    s => progressMap[s.id]?.ourStage === stageInfo.stage
                  );

                  return (
                    <div 
                      key={stageInfo.stage}
                      className={`rounded-2xl border-2 p-4 flex flex-col justify-between h-[280px] shadow-sm relative ${stageInfo.color}`}
                    >
                      <div>
                        <h4 className="font-gaegu text-xl font-bold block mb-1">{stageInfo.name}</h4>
                        <p className="text-[10px] opacity-85 leading-tight font-medium mb-4">
                          {stageInfo.desc}
                        </p>
                      </div>

                      {/* Avatars on this stage */}
                      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                        {stageStudents.map((student) => {
                          const isSelected = selectedStudentId === student.id;
                          return (
                            <button
                              key={student.id}
                              onClick={() => setSelectedStudentId(student.id)}
                              className={`w-full p-2.5 rounded-xl border-2 text-left flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                                isSelected
                                  ? 'border-stone-800 bg-white/40 ring-1 ring-stone-800 shadow-md font-bold'
                                  : 'border-white/50 bg-white/70 hover:bg-white hover:border-white shadow-sm font-medium'
                              }`}
                            >
                              <span className="text-lg shrink-0">
                                {student.id.endsWith('1') || student.id.endsWith('4') || student.id.endsWith('6') ? '👦' : '👧'}
                              </span>
                              <div className="overflow-hidden">
                                <span className="text-xs text-stone-800 block leading-tight">{student.name}</span>
                                <span className="text-[9px] text-stone-400 font-medium block mt-0.5">L{progressMap[student.id]?.littlefoxLevel} 레벨</span>
                              </div>
                            </button>
                          );
                        })}
                        {stageStudents.length === 0 && (
                          <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400/70 italic">
                            비어 있음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Student Roadmap Progress Details */}
            {selectedRoadmapStudent && selectedRoadmapProgress && (
              <div className="bg-white border-2 border-[#FFF0E0] rounded-[24px] p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                
                {/* 1. Left Student profile card */}
                <div className="md:col-span-1 border-r border-[#FFF0E0] pr-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-[#FFF3E0] flex items-center justify-center text-3xl shadow-sm">
                        {selectedRoadmapStudent.id.endsWith('1') || selectedRoadmapStudent.id.endsWith('4') || selectedRoadmapStudent.id.endsWith('6') ? '👦' : '👧'}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-stone-800">{selectedRoadmapStudent.name}</h4>
                        <span className="text-xs text-stone-500 font-medium">{selectedRoadmapStudent.school} · {selectedRoadmapStudent.grade}</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-400 font-medium">현재 리틀팍스 레벨</span>
                        <span className="font-bold text-[#2C9C8F]">L{selectedRoadmapProgress.littlefoxLevel} 레벨</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/50">
                        <span className="text-stone-400 font-medium">우리 코스 단계</span>
                        <span className="font-bold text-[#E8765A]">
                          {STAGE_MAP[selectedRoadmapProgress.littlefoxLevel]?.name || '귀 트기'} ({selectedRoadmapProgress.ourStage}단계)
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentId(null)}
                    className="w-full mt-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl text-xs transition-all"
                  >
                    로드맵 상세 닫기
                  </button>
                </div>

                {/* 2. Middle Cumulative Metrics */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-1">
                      <Award className="w-4 h-4 text-[#F4B942]" />
                      {selectedRoadmapStudent.name} 친구의 누적 영어 보물창고
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#FFFBF7] border border-[#FFF0E0] p-3 rounded-xl text-center">
                        <span className="text-slate-400 text-[10px] block font-bold">📖 읽은 책 수</span>
                        <span className="text-base font-bold text-stone-800 mt-1 block">{selectedRoadmapProgress.booksCumulative}권</span>
                      </div>
                      <div className="bg-[#FFFBF7] border border-[#FFF0E0] p-3 rounded-xl text-center">
                        <span className="text-slate-400 text-[10px] block font-bold">🪙 모은 단어/표현</span>
                        <span className="text-base font-bold text-stone-800 mt-1 block">{selectedRoadmapProgress.expressionsCount}개</span>
                      </div>
                      <div className="bg-[#FFFBF7] border border-[#FFF0E0] p-3 rounded-xl text-center">
                        <span className="text-slate-400 text-[10px] block font-bold">🎤 녹음 제출</span>
                        <span className="text-base font-bold text-stone-800 mt-1 block">{selectedRoadmapProgress.recordingsCount}회</span>
                      </div>
                      <div className="bg-[#FFFBF7] border border-[#FFF0E0] p-3 rounded-xl text-center">
                        <span className="text-slate-400 text-[10px] block font-bold">📝 영작 제출</span>
                        <span className="text-base font-bold text-stone-800 mt-1 block">{selectedRoadmapProgress.writingsCount}회</span>
                      </div>
                    </div>
                  </div>

                  {/* Guide to next stage */}
                  <div className="mt-6 bg-[#FFFDF5] border border-[#F4B942]/30 rounded-2xl p-4">
                    <span className="text-xs font-bold text-[#E8765A] block mb-1 flex items-center gap-1">
                      💡 다음 성장 단계를 위한 코칭 가이드
                    </span>
                    <p className="text-xs text-stone-600 leading-relaxed font-normal">
                      {STAGE_MAP[selectedRoadmapProgress.littlefoxLevel]?.nextGuide || '지정된 가이드가 없습니다.'}
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* --- TAB B: COACH REVIEW DASHBOARD --- */}
        {activeTab === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Student List Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Filter selections */}
              <div className="bg-white border-2 border-[#FFF0E0] rounded-2xl p-4 shadow-sm space-y-3">
                <span className="text-xs font-bold text-stone-400 block">📋 아웃풋 제출 상태 필터</span>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'all', label: '모두 보기' },
                    { key: 'unsubmitted', label: '오늘 미제출' },
                    { key: 'no_recording', label: '오늘 녹음 없음' },
                    { key: 'no_writing', label: '오늘 영작 없음' }
                  ] as const).map(f => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setReviewFilter(f.key);
                        setSelectedStudentId(null);
                      }}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all text-center ${
                        reviewFilter === f.key
                          ? 'bg-[#2C9C8F] border-[#2C9C8F] text-white shadow-sm'
                          : 'bg-[#FFFBF7] border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Rows */}
              <div className="bg-white border-2 border-[#FFF0E0] rounded-[24px] p-4 shadow-sm space-y-2 max-h-[500px] overflow-y-auto">
                <span className="text-xs font-bold text-stone-400 block px-1 mb-2">학생 목록 ({filteredStudents.length}명)</span>
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudentId === student.id;
                  const todayOutput = getStudentTodayOutput(student.id);

                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`w-full p-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-center justify-between ${
                        isSelected
                          ? 'border-stone-800 bg-[#FFFDF5] shadow-sm font-bold'
                          : 'border-stone-100 bg-white hover:border-stone-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">
                          {student.id.endsWith('1') || student.id.endsWith('4') || student.id.endsWith('6') ? '👦' : '👧'}
                        </span>
                        <div>
                          <span className="text-xs text-stone-800 block">
                            {student.name} <span className="font-normal text-[10px] text-stone-400">({student.school} · {student.grade})</span>
                          </span>
                          
                          {/* Submission info summary */}
                          {todayOutput ? (
                            <div className="flex items-center gap-2 mt-1.5">
                              {/* Recording submission indicator */}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-0.5 ${
                                todayOutput.hasRecording 
                                  ? 'bg-[#E8F6F4] text-[#2C9C8F] border-[#2C9C8F]/30' 
                                  : 'bg-stone-50 text-stone-400 border-stone-200'
                              }`}>
                                <Mic className="w-2.5 h-2.5" />
                                {todayOutput.hasRecording ? '완료' : '없음'}
                              </span>

                              {/* Writing submission indicator */}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-0.5 ${
                                todayOutput.writing
                                  ? 'bg-[#F4EFFB] text-[#9F7AEA] border-[#9F7AEA]/30'
                                  : 'bg-stone-50 text-stone-400 border-stone-200'
                              }`}>
                                <Edit className="w-2.5 h-2.5" />
                                {todayOutput.writing ? '완료' : '없음'}
                              </span>

                              {/* Expressions count */}
                              {expressionItems.filter(e => e.studentId === student.id && e.date === todayStr).length > 0 && (
                                <span className="text-[9px] bg-[#FFF3E0] text-[#D99B2B] font-bold px-1.5 py-0.5 rounded border border-[#FFE9C9]">
                                  🪙 {expressionItems.filter(e => e.studentId === student.id && e.date === todayStr).length}개
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-400 bg-stone-50 border border-stone-200/50 px-2 py-0.5 rounded-full inline-block mt-1 font-medium select-none">
                              ⏳ 아직 안 했어요
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Completion check badge */}
                      {todayOutput && (
                        <span className="bg-[#EBF3FF] text-[#1E40AF] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#B8D4FF] uppercase select-none">
                          제출완료
                        </span>
                      )}
                    </button>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <p className="text-xs text-stone-400 italic text-center py-10 select-none">조건에 부합하는 학생이 없습니다.</p>
                )}
              </div>

            </div>

            {/* Student Review Detailed Card panel */}
            <div className="lg:col-span-2">
              
              {!selectedReviewStudent ? (
                <div className="bg-white border-2 border-[#FFF0E0] rounded-[24px] p-12 text-center text-slate-400 text-xs italic shadow-sm flex flex-col items-center justify-center h-full min-h-[300px]">
                  <Info className="w-8 h-8 text-stone-300 mb-2.5" />
                  좌측 리스트에서 점검하고자 하는 학생 이름을 선택해주세요.
                </div>
              ) : !selectedReviewOutput ? (
                <div className="bg-white border-2 border-[#FFF0E0] rounded-[24px] p-12 text-center text-slate-400 text-xs italic shadow-sm flex flex-col items-center justify-center h-full min-h-[300px]">
                  <Info className="w-8 h-8 text-stone-300 mb-2.5" />
                  <span className="font-bold text-stone-700 block mb-1">{selectedReviewStudent.name} 친구는 오늘 학습을 제출하지 않았습니다.</span>
                  선생님 또는 학부모 점검 전, 학생이 위저드를 진행할 수 있도록 독려해주세요.
                </div>
              ) : (
                <div className="bg-white border-2 border-[#FFF0E0] rounded-[24px] p-6 shadow-md space-y-6 relative animate-in fade-in duration-200 print-card">
                  
                  {/* Card top details */}
                  <div className="flex justify-between items-start border-b border-[#FFF0E0] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#E8F6F4] text-[#2C9C8F] flex items-center justify-center text-2xl shadow-sm">
                        {selectedReviewStudent.id.endsWith('1') || selectedReviewStudent.id.endsWith('4') || selectedReviewStudent.id.endsWith('6') ? '👦' : '👧'}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-stone-800">
                          {selectedReviewStudent.name} <span className="text-xs text-stone-500 font-medium">({selectedReviewStudent.school} · {selectedReviewStudent.grade})</span>
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] bg-slate-50 text-slate-400 border border-slate-200 px-2 py-0.5 rounded font-bold">
                            Level {selectedReviewOutput.level}
                          </span>
                          <span className="text-[10px] bg-[#E8F6F4] text-[#2C9C8F] px-2 py-0.5 rounded font-bold">
                            📖 {selectedReviewOutput.book}
                          </span>
                          <span className="text-[10px] bg-[#FFF3E0] text-[#D99B2B] px-2 py-0.5 rounded font-bold">
                            ⏱️ {selectedReviewOutput.minutes}분 학습
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 no-print">
                      <button
                        onClick={handlePrint}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-2.5 rounded-xl text-xs flex items-center gap-1 transition-all border border-slate-200/50"
                        title="영작과 표현 리포트 카드 인쇄"
                      >
                        <Printer className="w-4 h-4" />
                        인쇄하기
                      </button>
                    </div>
                  </div>

                  {/* Print-only title */}
                  <div className="hidden print:block border-b-2 border-stone-800 pb-2 mb-6">
                    <h2 className="text-2xl font-bold text-stone-800">에듀링크 초등 영어 아웃풋 리포트</h2>
                    <p className="text-xs text-stone-400 mt-1">출력일자: {todayStr.replace(/-/g, '.')} | 작성학생: {selectedReviewStudent.name} ({selectedReviewStudent.school} · {selectedReviewStudent.grade})</p>
                  </div>

                  {/* 1. Today expressions gathered */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-stone-500 flex items-center gap-1">
                      🪙 오늘 수집한 단어와 표현 보석 ({selectedReviewExpressions.length}개)
                    </h5>
                    
                    {selectedReviewExpressions.length === 0 ? (
                      <p className="text-xs text-stone-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100 leading-normal">오늘 담은 영어 표현이 없습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedReviewExpressions.map(e => (
                          <div 
                            key={e.id}
                            className="bg-[#FFFDF9] border border-[#FFDAD1] p-3 rounded-2xl flex items-center gap-2 shadow-sm"
                          >
                            <span className="text-xs font-bold text-[#E8765A]">{e.text}</span>
                            {e.meaning && (
                              <span className="text-[10px] text-stone-500 bg-[#FFF0ED] px-1.5 py-0.5 rounded font-normal">
                                = {e.meaning}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Today's Writing */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-stone-500 flex justify-between items-center">
                      <span>📝 오늘의 한 줄 영작</span>
                      {selectedReviewOutput.writingType && (
                        <span className="text-[10px] bg-[#F4EFFB] text-[#9F7AEA] font-bold px-2 py-0.5 rounded border border-[#E8DCF7]">
                          {selectedReviewOutput.writingType === 'diary' ? '한 줄 일기' : '북리포트'}
                        </span>
                      )}
                    </h5>
                    
                    {selectedReviewOutput.writing ? (
                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm leading-relaxed text-[#3a3230] font-normal whitespace-pre-wrap">
                        {selectedReviewOutput.writing}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">오늘 입력된 영작이 없습니다.</p>
                    )}
                  </div>

                  {/* 3. Retelling audio (No print) */}
                  <div className="space-y-2 no-print">
                    <h5 className="text-xs font-bold text-stone-500">🎤 다시 말하기(리텔링) 녹음본</h5>
                    
                    {selectedReviewOutput.hasRecording ? (
                      <div className="bg-[#FFFBF7] border border-[#FFF0E0] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-[#2C9C8F] block">🎙️ 학생 음성 아카이빙 완료</span>
                          {selectedReviewOutput.retellNote && (
                            <p className="text-[10px] text-stone-500 font-medium">
                              <span className="font-bold text-stone-400 mr-1">말하기 전 키워드:</span>
                              {selectedReviewOutput.retellNote}
                            </p>
                          )}
                        </div>

                        {selectedReviewOutput.recordingId ? (
                          <button
                            onClick={() => handlePlayRecording(selectedReviewOutput.recordingId!)}
                            className="bg-[#2C9C8F] hover:bg-[#207f74] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-4 h-4 fill-white" />
                                재생 일시정지
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4" />
                                음성 녹음 재생
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="bg-[#E8F1EA] text-[#2F5C46] border border-[#5E9E7E]/30 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shrink-0">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            직접 읽고 제출함 (수동 완료)
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">오늘 제출된 오디오 녹음이 없습니다.</p>
                    )}
                  </div>

                  {/* 4. Coach Comments feedback (No print) */}
                  <div className="space-y-3 pt-3 border-t border-[#FFF0E0] no-print">
                    <label className="block text-xs font-bold text-stone-500">💬 코치의 격려와 칭찬 코멘트</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={coachNoteInput}
                        onChange={(e) => setCoachNoteInput(e.target.value)}
                        placeholder="예: 단어 보석을 글 속에 아주 자연스럽게 녹였네! 발음도 또박또박 칭찬해요 👍"
                        className="flex-1 rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-xs p-3.5 border focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveFeedback(selectedReviewStudent.id, selectedReviewOutput.id)}
                        className="bg-[#2C9C8F] hover:bg-[#207f74] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        {saveSuccess ? (
                          <>
                            <Check className="w-4 h-4" strokeWidth={3} />
                            저장 완료
                          </>
                        ) : (
                          '피드백 저장'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Print-only coach feedback field */}
                  {selectedReviewOutput.coachNote && (
                    <div className="hidden print:block border-t border-dashed border-stone-300 pt-4 mt-6">
                      <h4 className="text-xs font-bold text-stone-400 mb-1">💬 코치 피드백 한 마디</h4>
                      <p className="text-xs text-stone-700 leading-normal font-semibold italic bg-stone-50 p-3 rounded-xl">
                        &ldquo;{selectedReviewOutput.coachNote}&rdquo;
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
