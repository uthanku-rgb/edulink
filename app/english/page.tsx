'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ExpressionItem, 
  EnglishOutput, 
  ElementaryStudent, 
  WritingType, 
  DailyCard 
} from '@/types';
import { mockElementaryStudents } from '@/data/mockData';
import { 
  getExpressionItems, 
  saveExpressionItems, 
  getEnglishOutputs, 
  saveEnglishOutputs,
  seedEnglishMockDataIfEmpty,
  getDailyCards,
  saveDailyCards,
  getPillarSchedule
} from '@/lib/storage';
import { saveAudio, getAudio, deleteAudio } from '@/lib/audioStore';
import { useToast } from '../../components/ToastProvider';
import { 
  Sparkles, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Check, 
  RotateCcw, 
  RefreshCw, 
  BookMarked, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  Filter,
  CheckCircle
} from 'lucide-react';

const LITTLEFOX_FLOW = [
  { step: '① 듣기', time: '0–15분', desc: '오늘 책을 소리로 먼저 듣기', emoji: '🎧', bg: 'bg-[#E8F6F4] text-[#2C9C8F] border-[#C3ECE7]' },
  { step: '② 따라 읽기', time: '15–30분', desc: '자막 켜고 소리 내어 섀도잉', emoji: '🗣️', bg: 'bg-[#FFF3E0] text-[#D99B2B] border-[#FFE9C9]' },
  { step: '③ 표현 줍기', time: '30–40분', desc: '마음에 든 표현·단어를 은행에 담기', emoji: '🪙', bg: 'bg-[#FFF0ED] text-[#E8765A] border-[#FFDAD1]' },
  { step: '④ 아웃풋', time: '40–60분', desc: '다시 말하기(녹음) + 한 줄 쓰기', emoji: '🎤', bg: 'bg-[#F4EFFB] text-[#9F7AEA] border-[#E8DCF7]' }
];

export default function EnglishModulePage() {
  const toast = useToast();
  // SSR Hydration Guard
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core Data State
  const [selectedStudent, setSelectedStudent] = useState<ElementaryStudent | null>(null);
  const [expressionItems, setExpressionItems] = useState<ExpressionItem[]>([]);
  const [englishOutputs, setEnglishOutputs] = useState<EnglishOutput[]>([]);
  const [activeTab, setActiveTab] = useState<'study' | 'bank'>('study');

  // Wizard States (STEP 1 ~ STEP 4)
  const [step, setStep] = useState<number>(1);
  const [bookTitle, setBookTitle] = useState('');
  const [level, setLevel] = useState('3');
  const [studyMinutes, setStudyMinutes] = useState(40);

  // Step 2 specific states
  const [exprText, setExprText] = useState('');
  const [exprMeaning, setExprMeaning] = useState('');
  const [todayExpressions, setTodayExpressions] = useState<ExpressionItem[]>([]);

  // Step 3 specific states (Recording)
  const [retellNote, setRetellNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingId, setRecordingId] = useState<string | undefined>(undefined);
  const [hasRecording, setHasRecording] = useState(false);
  const [useFallbackRecording, setUseFallbackRecording] = useState(false);

  // Step 4 specific states (Writing)
  const [writingType, setWritingType] = useState<WritingType>('diary');
  const [writingText, setWritingText] = useState('');

  // Expression Bank Tab states
  const [bankFilter, setBankFilter] = useState<'all' | 'unreviewed'>('all');
  const [showMeanings, setShowMeanings] = useState<Record<string, boolean>>({});

  // MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Completion Overlay
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationP3Synced, setCelebrationP3Synced] = useState(false);

  // Load and seed initial mock data
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      seedEnglishMockDataIfEmpty();
      
      const loadedExprs = getExpressionItems();
      const loadedOutputs = getEnglishOutputs();
      setExpressionItems(loadedExprs);
      setEnglishOutputs(loadedOutputs);

      // Auto-login active student if set
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

  // Sync state changes with local storage
  const updateExpressionItems = (newItems: ExpressionItem[]) => {
    setExpressionItems(newItems);
    saveExpressionItems(newItems);
  };

  const updateEnglishOutputs = (newOutputs: EnglishOutput[]) => {
    setEnglishOutputs(newOutputs);
    saveEnglishOutputs(newOutputs);
  };

  // Student Select Handler
  const handleSelectStudent = (student: ElementaryStudent) => {
    setSelectedStudent(student);
    localStorage.setItem('edulink_active_student_id', student.id);
    resetWizardState();
  };

  // Student Logout/Switch Handler
  const handleLogoutStudent = () => {
    setSelectedStudent(null);
    localStorage.removeItem('edulink_active_student_id');
    resetWizardState();
  };

  // Reset wizard data for new study session
  const resetWizardState = () => {
    setStep(1);
    setBookTitle('');
    setLevel('3');
    setStudyMinutes(40);
    setExprText('');
    setExprMeaning('');
    setTodayExpressions([]);
    setRetellNote('');
    setIsRecording(false);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingId(undefined);
    setHasRecording(false);
    setUseFallbackRecording(false);
    setWritingType('diary');
    setWritingText('');
  };

  // Increase/Decrease minutes by 5
  const adjustMinutes = (amount: number) => {
    setStudyMinutes(prev => Math.max(5, prev + amount));
  };

  // STEP 2: Add Expression to Today's basket
  const handleAddTodayExpression = () => {
    if (!selectedStudent || !exprText.trim() || !bookTitle.trim()) return;

    const newExpr: ExpressionItem = {
      id: `exp_${selectedStudent.id}_${Date.now()}`,
      studentId: selectedStudent.id,
      date: new Date().toISOString().split('T')[0],
      text: exprText.trim(),
      meaning: exprMeaning.trim() || undefined,
      sourceBook: bookTitle.trim(),
      reviewed: false
    };

    const updatedToday = [...todayExpressions, newExpr];
    setTodayExpressions(updatedToday);
    
    // Clear inputs
    setExprText('');
    setExprMeaning('');
  };

  // STEP 2: Delete added expression
  const handleDeleteTodayExpression = (id: string) => {
    setTodayExpressions(todayExpressions.filter(item => item.id !== id));
  };

  // STEP 3: Audio Recording Start
  const startRecording = async () => {
    if (typeof window === 'undefined') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recId = `rec_${selectedStudent?.id || 'temp'}_${Date.now()}`;
        
        await saveAudio(recId, blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingId(recId);
        setHasRecording(true);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setUseFallbackRecording(false);
    } catch (err) {
      console.error('녹음 마이크 접근 권한 실패 또는 오류:', err);
      toast.error('마이크를 열지 못했어요. 마이크 권한을 확인해주세요.');
    }
  };

  // STEP 3: Audio Recording Stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // STEP 3: Play/Pause Recorded Audio
  const togglePlayAudio = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(audioUrl);
        audioPlayerRef.current.onended = () => setIsPlaying(false);
      } else {
        audioPlayerRef.current.src = audioUrl;
      }
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  // STEP 3: Reset/Redo Recording
  const resetRecording = async () => {
    if (recordingId) {
      await deleteAudio(recordingId);
    }
    setAudioUrl(null);
    setRecordingId(undefined);
    setHasRecording(false);
    setIsPlaying(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  };

  // STEP 4: Insert Expression chip into Writing text
  const handleInsertExprChip = (text: string) => {
    setWritingText(prev => {
      const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return `${prev}${space}${text} `;
    });
  };

  // STEP 4: Submit & Save output
  const handleSubmitOutput = async () => {
    if (!selectedStudent || !bookTitle.trim()) {
      toast.info('책 제목을 입력해주세요!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Create and Save EnglishOutput
    const newOutput: EnglishOutput = {
      id: `out_${selectedStudent.id}_${Date.now()}`,
      studentId: selectedStudent.id,
      date: todayStr,
      book: bookTitle.trim(),
      minutes: studyMinutes,
      level: level,
      retellNote: retellNote.trim() || undefined,
      hasRecording: hasRecording || useFallbackRecording,
      recordingId: hasRecording ? recordingId : undefined,
      writing: writingText.trim() || undefined,
      writingType: writingText.trim() ? writingType : undefined
    };

    const updatedOutputs = [newOutput, ...englishOutputs];
    updateEnglishOutputs(updatedOutputs);

    // 2. Append Today's gathered expressions to Central Bank
    if (todayExpressions.length > 0) {
      const updatedExprs = [...todayExpressions, ...expressionItems];
      updateExpressionItems(updatedExprs);
    }

    // 3. P3 DailyCard Sync Check
    let synced = false;
    const cards = await getDailyCards();
    const pillarSchedule = getPillarSchedule();

    // Determine current day's weekday
    const dayMap: Record<number, '월'|'화'|'수'|'목'|'금'> = {
      1: '월', 2: '화', 3: '수', 4: '목', 5: '금'
    };
    const currentDay = new Date().getDay();
    const currentWeekday = dayMap[currentDay] || '금';
    const pillarToday = pillarSchedule.byWeekday[currentWeekday] || '수학';

    if (pillarToday === '영어') {
      const updatedCards = [...cards];
      const cardIndex = updatedCards.findIndex(
        c => c.studentId === selectedStudent.id && c.date === todayStr
      );

      if (cardIndex >= 0) {
        updatedCards[cardIndex] = {
          ...updatedCards[cardIndex],
          phasesDone: {
            ...updatedCards[cardIndex].phasesDone,
            P3: true // P3 complete!
          }
        };
      } else {
        const cardId = `dc_${selectedStudent.id}_${todayStr.replace(/-/g, '')}`;
        const newCard: DailyCard = {
          id: cardId,
          studentId: selectedStudent.id,
          date: todayStr,
          attendance: '정상',
          phasesDone: {
            P1: false, P2: false, P3: true, P4: false
          },
          pillarToday: '영어',
          helpPoints: [],
          condition: 4
        };
        updatedCards.push(newCard);
      }
      await saveDailyCards(updatedCards);
      synced = true;
    }

    setCelebrationP3Synced(synced);
    setShowCelebration(true);
  };

  // Play audio from past list (indexedDB)
  const handlePlayPastAudio = async (recId: string) => {
    try {
      const blob = await getAudio(recId);
      if (!blob) {
        toast.error('녹음 파일을 찾을 수 없어요.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error('오디오 재생 실패:', err);
    }
  };

  // Toggle Reviewed status of expression bank
  const handleToggleReviewed = (id: string) => {
    const updated = expressionItems.map(item => {
      if (item.id === id) {
        return { ...item, reviewed: !item.reviewed };
      }
      return item;
    });
    updateExpressionItems(updated);
  };

  // Toggle meaning visibility
  const toggleMeaningVisibility = (id: string) => {
    setShowMeanings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center font-gowun text-[#3a3230]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2C9C8F] mx-auto mb-4"></div>
          <p className="text-lg font-bold">에듀링크 영어나라 문을 열고 있어요...</p>
        </div>
      </div>
    );
  }

  // --- 1. STUDENT SELECTION PAGE ---
  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-gowun text-[#3a3230] p-6 md:p-12 selection:bg-[#FFE9C9]">
        <div className="max-w-xl w-full mx-auto my-auto">
          <div className="text-center mb-8">
            <h1 className="font-gaegu text-4xl md:text-5xl text-[#2C9C8F] font-bold mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-[#F4B942] animate-bounce" />
              에듀링크 초등 영어 아카이브
              <Sparkles className="w-8 h-8 text-[#F4B942] animate-bounce" />
            </h1>
            <p className="text-sm md:text-base text-stone-600 font-medium">반가워요! 오늘은 어떤 친구가 신나는 영어 여행을 떠나볼까요?</p>
          </div>

          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-md border-2 border-[#FFF0E0]">
            <h2 className="text-lg md:text-xl font-bold mb-6 text-center text-[#3a3230]">
              내 예쁜 이름표를 콕! 눌러주세요 👦👧
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {mockElementaryStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className="p-4 bg-[#FFFBF7] border-2 border-[#FFF0E0] hover:border-[#F4B942] hover:bg-[#FFFDFB] rounded-[20px] text-center transition-all duration-200 active:scale-95 group shadow-sm"
                >
                  <div className="w-14 h-14 rounded-full bg-[#FFF3E0] flex items-center justify-center mx-auto mb-2 text-3xl group-hover:scale-110 transition-transform">
                    {student.id.endsWith('1') || student.id.endsWith('4') || student.id.endsWith('6') ? '👦' : '👧'}
                  </div>
                  <div className="font-bold text-lg text-stone-800">{student.name}</div>
                  <div className="text-xs text-stone-500 mt-1">{student.grade} · {student.school}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-6">
            <Link 
              href="/"
              className="text-xs text-stone-400 hover:text-stone-600 underline font-medium"
            >
              통합포탈로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered lists for the active student
  const studentExprs = expressionItems.filter(item => item.studentId === selectedStudent.id);
  const studentOutputs = englishOutputs.filter(out => out.studentId === selectedStudent.id);

  // Expression Bank grouping & filter
  const bankFilteredExprs = bankFilter === 'all' 
    ? studentExprs 
    : studentExprs.filter(item => !item.reviewed);

  // Group expression items by book
  const groupedExprs = bankFilteredExprs.reduce((acc, curr) => {
    const book = curr.sourceBook || '기타 도서';
    if (!acc[book]) acc[book] = [];
    acc[book].push(curr);
    return acc;
  }, {} as Record<string, ExpressionItem[]>);

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col font-gowun text-[#3a3230] pb-16 selection:bg-[#FFE9C9]">
      
      {/* Top Navigation Header */}
      <header className="bg-white shadow-sm border-b border-[#FFF0E0] px-4 md:px-8 py-3 sticky top-0 z-40">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center text-xl shadow-sm">
              {selectedStudent.id.endsWith('1') || selectedStudent.id.endsWith('4') || selectedStudent.id.endsWith('6') ? '👦' : '👧'}
            </div>
            <div>
              <span className="font-gaegu text-xl md:text-2xl font-bold text-[#2C9C8F]">{selectedStudent.name}</span>
              <span className="text-xs text-stone-500 ml-1">친구의 영어 놀이터</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'study' ? 'bank' : 'study')}
              className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                activeTab === 'bank'
                  ? 'bg-[#E8F6F4] text-[#2C9C8F] border-[#2C9C8F]'
                  : 'bg-[#FFFBF7] text-stone-600 border-stone-200 hover:border-[#2C9C8F]'
              }`}
            >
              {activeTab === 'study' ? '📔 표현 은행 바로가기' : '✏️ 영어 쓰러 가기'}
            </button>
            <button 
              onClick={handleLogoutStudent}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-[#E8765A] border border-stone-200 hover:border-[#E8765A] px-3 py-2 rounded-full transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              이름 바꾸기
            </button>
            <Link 
              href="/"
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 px-3 py-2 rounded-full transition-all"
            >
              대시보드 나가기
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 mt-6">
        
        {/* --- LITTLEFOX_FLOW ALWAYS SHOWN (학생 안내용) --- */}
        <section className="bg-white rounded-[24px] p-5 shadow-sm border border-[#FFF0E0] mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="w-5 h-5 text-[#2C9C8F]" />
            <h2 className="text-base font-bold text-stone-800">
              오늘 영어 60분, 이렇게 알차게 보내요! 🗺️
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {LITTLEFOX_FLOW.map((flow, index) => (
              <div 
                key={index}
                className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between ${flow.bg} transition-all duration-200 hover:shadow-sm`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">{flow.step}</span>
                    <span className="text-lg">{flow.emoji}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium leading-tight mb-2">
                    {flow.desc}
                  </p>
                </div>
                <span className="text-[10px] font-bold block self-start bg-white/60 px-2 py-0.5 rounded-full mt-1">
                  ⏰ {flow.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* --- TAB CONTENT: STUDY WIZARD --- */}
        {activeTab === 'study' && (
          <div className="space-y-6">
            
            {/* PROGRESS WIZARD BAR */}
            <div className="bg-white rounded-[22px] p-5 shadow-sm border border-[#FFF0E0]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-stone-500">오늘의 성장 여정</span>
                <span className="text-sm font-bold text-[#2C9C8F]">{step} / 4 단계</span>
              </div>
              
              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-100 -translate-y-1/2 rounded-full -z-10"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-[#2C9C8F] -translate-y-1/2 rounded-full transition-all duration-300 -z-10"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>
                
                <div className="flex justify-between">
                  {[
                    { n: 1, label: '책 고르기' },
                    { n: 2, label: '표현 줍기' },
                    { n: 3, label: '다시 말하기' },
                    { n: 4, label: '한 줄 쓰기' }
                  ].map((s) => (
                    <button
                      key={s.n}
                      disabled={s.n > step && !bookTitle.trim()}
                      onClick={() => setStep(s.n)}
                      className={`flex flex-col items-center group relative`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        s.n < step 
                          ? 'bg-[#2C9C8F] text-white' 
                          : s.n === step 
                            ? 'bg-[#F4B942] text-[#3a3230] ring-4 ring-[#FFF3E0]' 
                            : 'bg-stone-200 text-stone-500'
                      }`}>
                        {s.n < step ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : s.n}
                      </div>
                      <span className={`text-[11px] mt-2 font-bold ${
                        s.n === step ? 'text-[#3a3230]' : 'text-stone-400'
                      }`}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 1: 오늘 들은 책 정보 */}
            {step === 1 && (
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-md border-2 border-[#FFF0E0] space-y-6">
                <div className="text-center">
                  <span className="text-3xl">📖</span>
                  <h2 className="font-gaegu text-3xl font-bold text-stone-800 mt-2 mb-1">오늘 들은 리틀팍스 책은 무엇인가요?</h2>
                  <p className="text-xs text-stone-500">재미있게 들은 책의 정보와 시간을 차근차근 적어볼까요?</p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  {/* Book Title Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1.5">📖 책 제목</label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="예: Peter Pan (단어 검색 및 수집 시 활용됩니다)"
                      className="w-full rounded-2xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-4 border focus:outline-none"
                    />
                  </div>

                  {/* Level select and studyMinutes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 mb-1.5">🌟 리틀팍스 레벨</label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full rounded-2xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-sm p-4 border focus:outline-none bg-white font-gowun"
                      >
                        {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={String(n)}>Level {n}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 mb-1.5">⏱️ 학습 시간 (분)</label>
                      <div className="flex items-center rounded-2xl border border-stone-200 overflow-hidden bg-white p-1">
                        <button
                          type="button"
                          onClick={() => adjustMinutes(-5)}
                          className="w-10 h-10 flex items-center justify-center font-bold text-stone-500 hover:bg-stone-50 active:bg-stone-100 rounded-lg text-lg"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-bold text-sm text-stone-700">
                          {studyMinutes}분
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustMinutes(5)}
                          className="w-10 h-10 flex items-center justify-center font-bold text-stone-500 hover:bg-stone-50 active:bg-stone-100 rounded-lg text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Next Action Button */}
                  <button
                    type="button"
                    disabled={!bookTitle.trim()}
                    onClick={() => setStep(2)}
                    className="w-full bg-[#2C9C8F] hover:bg-[#207f74] disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md mt-6 flex items-center justify-center gap-1 text-sm"
                  >
                    다음 단계로 넘어가기
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: 표현 줍기 🪙 */}
            {step === 2 && (
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-md border-2 border-[#FFF0E0] space-y-6">
                <div className="text-center">
                  <span className="text-3xl">🪙</span>
                  <h2 className="font-gaegu text-3xl font-bold text-stone-800 mt-2 mb-1">책에서 멋진 보석 표현을 주워봐요!</h2>
                  <p className="text-xs text-stone-500">책을 보면서 마음에 들었거나 기억하고 싶은 단어와 표현을 내 보석 주머니에 담아보세요. (2~3개 추천!)</p>
                </div>

                <div className="bg-[#FFFBF7] rounded-[20px] p-5 border border-[#FFF0E0] max-w-lg mx-auto space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 mb-1">✏️ 영어 표현 / 단어</label>
                      <input
                        type="text"
                        value={exprText}
                        onChange={(e) => setExprText(e.target.value)}
                        placeholder="예: once upon a time"
                        className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-xs p-3 border focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 mb-1">📌 뜻 (선택)</label>
                      <input
                        type="text"
                        value={exprMeaning}
                        onChange={(e) => setExprMeaning(e.target.value)}
                        placeholder="예: 옛날 옛적에"
                        className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-xs p-3 border focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!exprText.trim()}
                    onClick={handleAddTodayExpression}
                    className="w-full flex items-center justify-center gap-1 bg-[#F4B942] hover:bg-[#e0a733] disabled:opacity-50 text-[#3a3230] text-xs font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    표현 주머니에 주워 담기 🪙
                  </button>
                </div>

                {/* Gathered Items display */}
                <div className="max-w-lg mx-auto border-t border-dashed border-[#FFF0E0] pt-6">
                  <h3 className="text-xs font-bold text-stone-500 mb-3 flex items-center gap-1">
                    👜 내 주머니 속 보석 표현들 ({todayExpressions.length}개)
                  </h3>
                  
                  {todayExpressions.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-xs italic">
                      아직 주머니에 넣은 표현이 없어요. 위의 검색창으로 단어를 주워보세요!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {todayExpressions.map((item) => (
                        <div 
                          key={item.id}
                          className="bg-[#FFFDF9] border border-[#FFDAD1] rounded-2xl p-4 flex items-start justify-between shadow-sm hover:scale-[1.01] transition-transform"
                        >
                          <div>
                            <span className="text-sm font-bold text-[#E8765A] block">
                              {item.text}
                            </span>
                            {item.meaning && (
                              <span className="text-xs text-stone-500 mt-1 block">
                                = {item.meaning}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTodayExpression(item.id)}
                            className="text-stone-300 hover:text-[#E8765A] p-1 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Wizard Nav buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-1 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      이전 단계
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 bg-[#2C9C8F] hover:bg-[#207f74] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1 text-sm"
                    >
                      다음 단계
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: 다시 말하기 🎤 */}
            {step === 3 && (
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-md border-2 border-[#FFF0E0] space-y-6">
                <div className="text-center">
                  <span className="text-3xl">🎤</span>
                  <h2 className="font-gaegu text-3xl font-bold text-stone-800 mt-2 mb-1">책 내용을 영어로 다시 속삭여볼까요?</h2>
                  <p className="text-xs text-stone-500">들은 이야기를 내 말로 자신 있게 다시 말해봐요. (2단계에서 담은 단어 보석을 사용하면 더 멋져요!)</p>
                </div>

                <div className="max-w-lg mx-auto space-y-6">
                  
                  {/* Helper checklist chips */}
                  {todayExpressions.length > 0 && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <span className="text-[11px] font-bold text-slate-400 block mb-2">💡 말할 때 사용하면 좋은 내 보석 단어:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {todayExpressions.map(e => (
                          <span key={e.id} className="bg-[#FFF3E0] text-[#D99B2B] text-xs font-bold px-2.5 py-1 rounded-full border border-[#FFE9C9]">
                            {e.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Retell Notes (Keywords memo before speaking) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1.5">
                      ✍️ 리텔링 준비 메모 (말하기 전 키워드)
                    </label>
                    <input
                      type="text"
                      value={retellNote}
                      onChange={(e) => setRetellNote(e.target.value)}
                      placeholder="예: Peter, Wendy, Captain Hook, fly, Wendy's home (말할 키워드를 적어봐요)"
                      className="w-full rounded-xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-xs p-3.5 border focus:outline-none"
                    />
                  </div>

                  {/* Recording Interface */}
                  <div className="bg-[#FFFBF7] rounded-[24px] border border-[#FFF0E0] p-6 flex flex-col items-center justify-center text-center shadow-sm relative">
                    
                    {!hasRecording && !useFallbackRecording ? (
                      // 1. Mic recording idle / recording
                      <div className="space-y-4">
                        <span className="text-xs text-stone-500 font-bold block">
                          {isRecording ? '🔴 신나게 말하는 목소리를 담고 있어요...' : '🎤 아래 마이크 단추를 누르면 녹음이 시작돼요'}
                        </span>
                        
                        <div className="relative">
                          {isRecording && (
                            <div className="absolute inset-0 bg-[#E8765A]/20 rounded-full animate-ping scale-150"></div>
                          )}
                          <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
                              isRecording 
                                ? 'bg-[#E8765A] hover:bg-[#c95b41]' 
                                : 'bg-[#2C9C8F] hover:bg-[#207f74]'
                            }`}
                          >
                            {isRecording ? (
                              <Square className="w-8 h-8 fill-white" />
                            ) : (
                              <Mic className="w-8 h-8 fill-white" />
                            )}
                          </button>
                        </div>
                        
                        <span className={`text-xs font-bold block ${isRecording ? 'text-[#E8765A] animate-pulse' : 'text-slate-400'}`}>
                          {isRecording ? '녹음 정지하려면 클릭하세요' : '녹음 시작'}
                        </span>
                      </div>
                    ) : hasRecording ? (
                      // 2. Playback / Reset
                      <div className="space-y-4">
                        <span className="text-xs text-[#2C9C8F] font-bold block flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          목소리가 예쁘게 담겼어요!
                        </span>
                        
                        <div className="flex gap-3 justify-center">
                          {/* Play button */}
                          <button
                            type="button"
                            onClick={togglePlayAudio}
                            className="w-14 h-14 rounded-full bg-[#2C9C8F] hover:bg-[#207f74] text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
                          >
                            {isPlaying ? (
                              <Pause className="w-6 h-6 fill-white" />
                            ) : (
                              <Play className="w-6 h-6 fill-white translate-x-0.5" />
                            )}
                          </button>

                          {/* Redo button */}
                          <button
                            type="button"
                            onClick={resetRecording}
                            className="w-14 h-14 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center shadow-sm transition-transform active:scale-95 border border-stone-200"
                            title="다시 녹음하기"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        </div>

                        <span className="text-[11px] text-stone-400 font-bold block">
                          [다시 듣기] 또는 [새로 녹음하기] 버튼을 누를 수 있어요.
                        </span>
                      </div>
                    ) : (
                      // 3. Fallback manually checked
                      <div className="space-y-4 py-3">
                        <span className="text-xs text-[#E8765A] font-bold block">
                          📢 &ldquo;녹음 완료&rdquo; 수동 체크가 활성화되었어요!
                        </span>
                        <p className="text-[11px] text-stone-400 leading-normal max-w-xs mx-auto">
                          부모님 앞에서 직접 큰소리로 말했거나, 기기 사정으로 녹음이 안 되는 상황일 때 체크하면 루틴에 온전히 반영돼요.
                        </p>
                        <button
                          type="button"
                          onClick={() => setUseFallbackRecording(false)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                        >
                          마이크 녹음으로 돌아가기
                        </button>
                      </div>
                    )}

                    {/* Fallback Check toggle (visible when not recording) */}
                    {!isRecording && !hasRecording && (
                      <div className="mt-6 pt-5 border-t border-stone-100 w-full flex justify-center">
                        <label className="flex items-center gap-2 cursor-pointer group select-none">
                          <input
                            type="checkbox"
                            checked={useFallbackRecording}
                            onChange={(e) => setUseFallbackRecording(e.target.checked)}
                            className="w-4.5 h-4.5 rounded border-stone-300 text-[#2C9C8F] focus:ring-[#E8F6F4]"
                          />
                          <span className="text-xs font-bold text-stone-500 group-hover:text-stone-700 transition-colors">
                            🎤 녹음했어요! (직접 큰 소리로 다 읽어 제출하기)
                          </span>
                        </label>
                      </div>
                    )}

                  </div>

                  {/* Wizard Nav buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-1 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      이전 단계
                    </button>
                    <button
                      type="button"
                      disabled={!hasRecording && !useFallbackRecording}
                      onClick={() => setStep(4)}
                      className="flex-1 bg-[#2C9C8F] hover:bg-[#207f74] disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1 text-sm"
                    >
                      다음 단계
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 4: 한 줄 쓰기 ✏️ */}
            {step === 4 && (
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-md border-2 border-[#FFF0E0] space-y-6">
                <div className="text-center">
                  <span className="text-3xl">✏️</span>
                  <h2 className="font-gaegu text-3xl font-bold text-stone-800 mt-2 mb-1">오늘의 한 줄 느낌을 영어로 써봐요!</h2>
                  <p className="text-xs text-stone-500">오늘 들은 소중한 책의 후기나 느낌을 내 영어 힘을 다해 한 줄 영작으로 채워보아요.</p>
                </div>

                <div className="max-w-lg mx-auto space-y-5">
                  
                  {/* Select writing type */}
                  <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1.5">📝 영작 기록 방식</label>
                    <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/50">
                      <button
                        type="button"
                        onClick={() => setWritingType('diary')}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                          writingType === 'diary'
                            ? 'bg-[#2C9C8F] text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        📔 한 줄 일기형
                      </button>
                      <button
                        type="button"
                        onClick={() => setWritingType('bookreport')}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                          writingType === 'bookreport'
                            ? 'bg-[#2C9C8F] text-white shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        📖 미니 북리포트형
                      </button>
                    </div>
                  </div>

                  {/* Textarea for writing */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-stone-500">✍️ 내 멋진 영작 공간</label>
                      <span className="text-[10px] text-slate-400 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50">
                        💡 어려우면 한국어로 먼저 써도 괜찮아요
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={writingText}
                      onChange={(e) => setWritingText(e.target.value)}
                      placeholder={
                        writingType === 'diary' 
                          ? "예: Today I read Peter Pan. Flying to Neverland was very exciting and magical!" 
                          : "예: The book was Cinderella. I liked when she danced with the prince. It was wonderful."
                      }
                      className="w-full rounded-2xl border-stone-200 focus:border-[#2C9C8F] focus:ring-[#E8F6F4] text-xs p-4 border focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Expression Insertion Helper (Tab to insert) */}
                  {todayExpressions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-stone-400 block">
                        🪙 보석 칩을 탭하면 본문에 쏙 들어가요!
                      </span>
                      <div className="flex flex-wrap gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                        {todayExpressions.map(expr => (
                          <button
                            key={expr.id}
                            type="button"
                            onClick={() => handleInsertExprChip(expr.text)}
                            className="bg-[#FFFBF7] hover:bg-[#FFF3E0] text-[#E8765A] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#FFDAD1] transition-all hover:scale-[1.03] active:scale-[0.98] shadow-sm flex items-center gap-1"
                          >
                            <span>{expr.text}</span>
                            <span className="text-[9px] bg-[#FFF0ED] text-[#E8765A] px-1 rounded font-normal">+{expr.meaning || '뜻'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wizard Nav buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-1 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      이전 단계
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitOutput}
                      className="flex-1 bg-[#2C9C8F] hover:bg-[#207f74] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm"
                    >
                      <Trophy className="w-4.5 h-4.5 fill-white/10" />
                      오늘 공부 마무리하기
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* --- TAB CONTENT: EXPRESSION BANK (복습) --- */}
        {activeTab === 'bank' && (
          <div className="space-y-6">
            
            {/* Header info & Filter board */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#FFF0E0] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-800 flex items-center gap-1.5">
                  💼 {selectedStudent.name} 친구의 표현 금고
                </h2>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                  지금까지 공부하며 차곡차곡 모아둔 영어 표현 보물들입니다.
                </p>
              </div>

              {/* Filtering Controls */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-400" />
                <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200/50">
                  <button
                    type="button"
                    onClick={() => setBankFilter('all')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      bankFilter === 'all'
                        ? 'bg-white text-stone-800 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    전체 보기 ({studentExprs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankFilter('unreviewed')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      bankFilter === 'unreviewed'
                        ? 'bg-white text-[#E8765A] shadow-sm'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    미복습만 보기 ({studentExprs.filter(item => !item.reviewed).length})
                  </button>
                </div>
              </div>
            </div>

            {/* List Grouped by Books */}
            {Object.keys(groupedExprs).length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 shadow-sm border border-[#FFF0E0] text-center text-stone-400 text-xs italic">
                금고가 비었어요! 위저드로 돌아가 영어 책을 읽고 첫 표현 보석을 주워보세요.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedExprs).map(([bookName, items]) => (
                  <div key={bookName} className="bg-white rounded-[24px] p-5 shadow-sm border border-[#FFF0E0] space-y-4">
                    
                    {/* Book Header */}
                    <div className="flex justify-between items-center border-b border-[#FFF0E0] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F6F4] text-[#2C9C8F] flex items-center justify-center text-sm font-bold">
                          📖
                        </div>
                        <span className="font-bold text-sm text-stone-800">{bookName}</span>
                      </div>
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold">
                        단어 {items.length}개
                      </span>
                    </div>

                    {/* Expression Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {items.map((item) => {
                        const showMeaning = showMeanings[item.id];
                        return (
                          <div 
                            key={item.id}
                            className={`p-4 rounded-[18px] border-2 transition-all flex flex-col justify-between h-36 ${
                              item.reviewed 
                                ? 'bg-[#F2F7F4]/60 border-[#5E9E7E]/30' 
                                : 'bg-[#FFFDF9] border-[#FFF0E0] hover:border-[#F4B942]'
                            }`}
                          >
                            {/* Text / Meaning */}
                            <div className="space-y-1">
                              <span className="text-xs text-stone-400 block font-bold">{item.date}</span>
                              <span className="text-base font-bold text-stone-800 block truncate" title={item.text}>
                                {item.text}
                              </span>
                              
                              {/* Click-to-flip/toggle meaning helper */}
                              {item.meaning && (
                                <div className="mt-1">
                                  {showMeaning ? (
                                    <button 
                                      type="button"
                                      onClick={() => toggleMeaningVisibility(item.id)}
                                      className="text-xs text-stone-600 block bg-slate-100 px-2 py-0.5 rounded hover:bg-slate-200 transition-colors"
                                    >
                                      = {item.meaning}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleMeaningVisibility(item.id)}
                                      className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded hover:bg-slate-100 font-medium transition-colors"
                                    >
                                      👁️ 뜻 보기
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Review toggle button */}
                            <div className="pt-2 border-t border-stone-100/50 flex justify-between items-center mt-auto">
                              <button
                                type="button"
                                onClick={() => handleToggleReviewed(item.id)}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${
                                  item.reviewed
                                    ? 'bg-[#5E9E7E] text-white'
                                    : 'bg-stone-50 border border-stone-200 text-stone-500 hover:border-[#5E9E7E] hover:text-[#5E9E7E]'
                                }`}
                              >
                                {item.reviewed ? (
                                  <>
                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    복습 완료
                                  </>
                                ) : (
                                  '복습 체크'
                                )}
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* English Outputs List (History) */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#FFF0E0] space-y-4">
              <h3 className="text-sm font-bold text-[#2C9C8F] flex items-center gap-1.5">
                📁 최근 제출한 영어 아웃풋 내역 ({studentOutputs.length}건)
              </h3>
              
              {studentOutputs.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center py-6">최근 제출한 아웃풋이 없어요.</p>
              ) : (
                <div className="space-y-3">
                  {studentOutputs.map((out) => (
                    <div 
                      key={out.id}
                      className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs bg-[#E8F6F4] text-[#2C9C8F] font-bold px-2 py-0.5 rounded-full">
                            {out.book}
                          </span>
                          <span className="text-[10px] text-stone-400 font-bold">{out.date}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">Level {out.level}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{out.minutes}분 학습</span>
                        </div>
                        
                        {out.retellNote && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            <span className="font-bold text-slate-400 mr-1">리텔링 노트:</span>
                            {out.retellNote}
                          </p>
                        )}

                        {out.writing && (
                          <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs leading-relaxed text-[#3a3230] mt-1.5 font-normal">
                            <span className="font-bold text-[#9F7AEA] text-[10px] uppercase block mb-1">
                              📝 {out.writingType === 'diary' ? '한 줄 일기' : '북리포트'}
                            </span>
                            {out.writing}
                          </div>
                        )}
                      </div>

                      {/* Playing recording if hasRecording */}
                      {out.hasRecording && (
                        <div className="shrink-0 flex items-center gap-2">
                          {out.recordingId ? (
                            <button
                              type="button"
                              onClick={() => handlePlayPastAudio(out.recordingId!)}
                              className="bg-[#2C9C8F]/10 hover:bg-[#2C9C8F]/20 text-[#2C9C8F] text-[11px] font-bold px-3 py-2 rounded-xl border border-[#2C9C8F]/20 flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              녹음 듣기
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#5E9E7E] bg-[#E8F1EA] px-2.5 py-1.5 rounded-xl border border-[#5E9E7E]/30 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" strokeWidth={3} />
                              수동 완료
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Confetti & Sync completion modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl text-center border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 bg-[#FFF3E0] text-[#F4B942] rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-9 h-9 fill-[#F4B942]/10" />
            </div>

            <h3 className="font-gaegu text-3xl text-stone-800 mb-2">
              오늘 영어 완성! 🎉
            </h3>
            
            <p className="text-xs text-stone-500 font-medium leading-relaxed mb-6">
              오늘 공부 내역과 수집한 보석 표현이<br />
              <strong>표현 주머니</strong>와 <strong>영어 금고</strong>에 예쁘게 저장되었어요!<br />
              {celebrationP3Synced ? (
                <span className="text-[#2C9C8F] font-bold block mt-2">
                  ✨ 오늘은 영어 요일이라 루틴 P3(메인) 미션이 자동으로 완수 처리되었습니다! (/elementary에서 확인 가능)
                </span>
              ) : (
                <span className="text-stone-400 block mt-2">
                  (오늘은 다른 학습 요일이라 루틴 자동 완수는 진행되지 않았습니다.)
                </span>
              )}
            </p>

            <button
              onClick={() => {
                setShowCelebration(false);
                resetWizardState();
                setActiveTab('bank'); // transition to bank tab
              }}
              className="w-full bg-[#2C9C8F] hover:bg-[#207f74] text-white py-3.5 px-4 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              내 보물창고(금고) 확인하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
