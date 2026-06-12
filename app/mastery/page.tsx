'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Activity, 
  ClipboardList, 
  Check
} from 'lucide-react';
import { 
  mockElementaryStudents 
} from '@/data/mockData';
import { 
  getMasteryTopics, 
  saveMasteryTopics, 
  getMasteryChecks, 
  saveMasteryChecks, 
  getGaps, 
  saveGaps, 
  seedMasteryMockDataIfEmpty 
} from '@/lib/storage';
import { 
  MasteryTopic, 
  MasteryCheck, 
  Gap, 
  RecallMethod 
} from '@/types';
import { getTodayStr } from '@/lib/dateService';
import { useToast } from '@/components/ToastProvider';

export default function MasteryPage() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  // 데이터 상태
  const [topics, setTopics] = useState<MasteryTopic[]>([]);
  const [checks, setChecks] = useState<MasteryCheck[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  
  // 탭 제어
  const [activeTab, setActiveTab] = useState<'register' | 'grade' | 'gaps'>('register');

  // Tab A - 신규 토픽 등록 상태
  const [newSubject, setNewSubject] = useState('수학');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newPointText, setNewPointText] = useState('');
  const [newPoints, setNewPoints] = useState<{ id: string; text: string }[]>([]);
  const [regSuccess, setRegSuccess] = useState(false);

  // Tab B - 백지 테스트 채점 상태
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [recallMethod, setRecallMethod] = useState<RecallMethod>('blank_write');
  const [recalledStatus, setRecalledStatus] = useState<Record<string, boolean>>({});
  const [studentDump, setStudentDump] = useState('');
  const [gradingNote, setGradingNote] = useState('');
  const [peerToStudent, setPeerToStudent] = useState('');
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [gradeSuccess, setGradeSuccess] = useState(false);

  // Tab C - 구멍 재테스트 선택 상태
  const [selectedGapIds, setSelectedGapIds] = useState<Record<string, boolean>>({});
  const [retestSuccess, setRetestSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      seedMasteryMockDataIfEmpty();
      
      const loadedTopics = getMasteryTopics();
      setTopics(loadedTopics);
      setChecks(getMasteryChecks());
      setGaps(getGaps());

      if (loadedTopics.length > 0) {
        setSelectedTopicId(loadedTopics[loadedTopics.length - 1].id);
      }
      setSelectedStudentId(mockElementaryStudents[0]?.id || '');
    }
  }, []);

  const todayStr = getTodayStr();

  // Tab A: 핵심 포인트 임시 추가
  const handleAddPoint = () => {
    if (!newPointText.trim()) return;
    const pointId = `kp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setNewPoints([...newPoints, { id: pointId, text: newPointText.trim() }]);
    setNewPointText('');
  };

  // Tab A: 핵심 포인트 삭제
  const handleRemovePoint = (id: string) => {
    setNewPoints(newPoints.filter(p => p.id !== id));
  };

  // Tab A: 토픽 전체 저장
  const handleSaveTopic = () => {
    if (!newTopicTitle.trim()) {
      toast.info('주제/단원명을 입력해주세요.');
      return;
    }
    if (newPoints.length === 0) {
      toast.info('최소 한 개 이상의 핵심 포인트를 등록해주세요.');
      return;
    }

    const newTopic: MasteryTopic = {
      id: `mt_${Date.now()}`,
      date: todayStr,
      subject: newSubject,
      topic: newTopicTitle.trim(),
      keyPoints: newPoints
    };

    const updated = [...topics, newTopic];
    saveMasteryTopics(updated);
    setTopics(updated);
    
    // 채점 대상 토픽 기본값으로 선택
    setSelectedTopicId(newTopic.id);

    // 폼 초기화
    setNewTopicTitle('');
    setNewPoints([]);
    setRegSuccess(true);
    setTimeout(() => setRegSuccess(false), 2000);
  };

  // Tab B: 토픽 선택 시 포인트 초기화
  useEffect(() => {
    const topic = topics.find(t => t.id === selectedTopicId);
    if (topic) {
      const initialStatus: Record<string, boolean> = {};
      topic.keyPoints.forEach(kp => {
        initialStatus[kp.id] = false;
      });
      setRecalledStatus(initialStatus);
      setLatestScore(null);
    }
  }, [selectedTopicId, topics]);

  // Tab B: 인출 토글
  const toggleRecall = (pointId: string) => {
    setRecalledStatus(prev => ({
      ...prev,
      [pointId]: !prev[pointId]
    }));
  };

  // Tab B: 채점 결과 저장
  const handleSaveGrade = () => {
    if (!selectedTopicId) {
      toast.info('토픽을 먼저 선택해주세요.');
      return;
    }
    if (!selectedStudentId) {
      toast.info('학생을 선택해주세요.');
      return;
    }
    if (recallMethod === 'peer_explain' && !peerToStudent.trim()) {
      toast.info('설명 대상을 입력해주세요.');
      return;
    }

    const topic = topics.find(t => t.id === selectedTopicId);
    if (!topic) return;

    const totalPoints = topic.keyPoints.length;
    const recalledPointsCount = topic.keyPoints.filter(kp => recalledStatus[kp.id]).length;
    const score = Math.round((recalledPointsCount / totalPoints) * 100);

    const checkResults = topic.keyPoints.map(kp => ({
      pointId: kp.id,
      recalled: !!recalledStatus[kp.id]
    }));

    // 1. MasteryCheck 저장
    const newCheck: MasteryCheck = {
      id: `mc_${Date.now()}`,
      studentId: selectedStudentId,
      topicId: selectedTopicId,
      date: todayStr,
      method: recallMethod,
      results: checkResults,
      retrievalScore: score,
      studentDump: studentDump.trim() || undefined,
      note: gradingNote.trim() || undefined,
      peerTo: recallMethod === 'peer_explain' ? peerToStudent.trim() || undefined : undefined
    };

    const updatedChecks = [...checks, newCheck];
    saveMasteryChecks(updatedChecks);
    setChecks(updatedChecks);

    // 2. 미인출 포인트 구멍(Gap)으로 자동 등록 (중복 open 방지)
    const currentGaps = [...gaps];
    let gapsAdded = false;

    topic.keyPoints.forEach(kp => {
      const wasRecalled = recalledStatus[kp.id];
      if (!wasRecalled) {
        // 이미 해당 학생에게 동일한 pointId의 'open' 상태인 구멍이 있는지 점검
        const exists = currentGaps.some(
          g => g.studentId === selectedStudentId && g.pointId === kp.id && g.status === 'open'
        );

        if (!exists) {
          const newGap: Gap = {
            id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            studentId: selectedStudentId,
            subject: topic.subject,
            topic: topic.topic,
            pointId: kp.id,
            pointText: kp.text,
            status: 'open',
            createdDate: todayStr,
            sourceTopicId: topic.id
          };
          currentGaps.push(newGap);
          gapsAdded = true;
        }
      }
    });

    if (gapsAdded) {
      saveGaps(currentGaps);
      setGaps(currentGaps);
    }

    setLatestScore(score);
    setStudentDump('');
    setGradingNote('');
    setPeerToStudent('');
    
    // 인출 상태 초기화
    const resetStatus: Record<string, boolean> = {};
    topic.keyPoints.forEach(kp => {
      resetStatus[kp.id] = false;
    });
    setRecalledStatus(resetStatus);

    setGradeSuccess(true);
    setTimeout(() => setGradeSuccess(false), 2500);
  };

  // Tab C: 구멍 다중 재테스트 통과 처리
  const handleResolveGaps = () => {
    const selectedIds = Object.keys(selectedGapIds).filter(id => selectedGapIds[id]);
    if (selectedIds.length === 0) {
      toast.info('재테스트를 완료할 결손(구멍)을 선택해주세요.');
      return;
    }

    const updatedGaps = gaps.map(g => {
      if (selectedIds.includes(g.id)) {
        return {
          ...g,
          status: 'closed' as const,
          closedDate: todayStr
        };
      }
      return g;
    });

    saveGaps(updatedGaps);
    setGaps(updatedGaps);
    setSelectedGapIds({});
    
    setRetestSuccess(true);
    setTimeout(() => setRetestSuccess(false), 2000);
  };

  // Tab C: 특정 구멍 체크 토글
  const toggleGapSelect = (gapId: string) => {
    setSelectedGapIds(prev => ({
      ...prev,
      [gapId]: !prev[gapId]
    }));
  };

  // 학생 이름 맵핑 헬퍼
  const getStudentName = (stuId: string) => {
    return mockElementaryStudents.find(s => s.id === stuId)?.name || '알 수 없음';
  };

  // 학생별 누적 결손 개수 연산
  const getStudentGapStats = (stuId: string) => {
    const studentGaps = gaps.filter(g => g.studentId === stuId);
    const openCount = studentGaps.filter(g => g.status === 'open').length;
    const closedCount = studentGaps.filter(g => g.status === 'closed').length;
    return { openCount, closedCount };
  };

  if (!mounted) return null;

  // 오픈 구멍이 있는 학생 목록 구멍 리스트
  const openGaps = gaps.filter(g => g.status === 'open');

  return (
    <div className="min-h-screen bg-[#F7F6FB] text-[#2D3142] flex flex-col pb-12 font-gowun selection:bg-[#E0DDF5]">
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-[#E8E6F0] px-4 md:px-8 py-3 sticky top-0 z-40">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EEEDFC] text-[#4F46E5] flex items-center justify-center text-xl shadow-sm">
              🎯
            </div>
            <div>
              <span className="font-gaegu text-xl md:text-2xl font-bold text-[#4F46E5]">정수진 코치</span>
              <span className="text-xs text-slate-500 ml-1">초등 완전학습 진단관</span>
            </div>
          </div>
          
          <Link 
            href="/elementary"
            className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            초등 대시보드로 돌아가기
          </Link>
        </div>
      </header>

      {/* Main Console Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 mt-6">
        
        {/* 3 Tabs Selection Bar */}
        <div className="flex border-b border-slate-200 mb-6 bg-white p-1 rounded-2xl border shadow-sm">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-[#4F46E5] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            오늘의 핵심 포인트 등록
          </button>
          
          <button
            onClick={() => setActiveTab('grade')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'grade'
                ? 'bg-[#4F46E5] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            백지 테스트 채점
          </button>

          <button
            onClick={() => setActiveTab('gaps')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'gaps'
                ? 'bg-[#4F46E5] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            구멍(결손) 현황 & 재테스트
            {openGaps.length > 0 && (
              <span className="absolute top-1.5 right-6 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold font-sans animate-pulse">
                {openGaps.length}
              </span>
            )}
          </button>
        </div>

        {/* --- TAB A: 오늘의 핵심 포인트 등록 --- */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 좌측 입력 영역 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  ✨ 새 공부 토픽 및 핵심 포인트 추가
                </h3>

                {/* 과목 & 단원명 입력 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">과목 선택</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:border-[#4F46E5] font-semibold"
                    >
                      <option value="수학">수학</option>
                      <option value="영어">영어</option>
                      <option value="국어">국어</option>
                      <option value="과학">과학</option>
                      <option value="사회">사회</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">단원 / 공부 주제</label>
                    <input
                      type="text"
                      placeholder="예: 일차방정식의 활용, 식물의 호흡 작용"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 핵심 포인트 줄단위 추가 */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400">인출해야 할 핵심 개념 포인트</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="예: 등식의 성질을 이용하여 미지수 x 정리"
                      value={newPointText}
                      onChange={(e) => setNewPointText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPoint()}
                      className="flex-1 text-xs rounded-xl border border-slate-200 p-3 focus:border-[#4F46E5] focus:outline-none"
                    />
                    <button
                      onClick={handleAddPoint}
                      className="bg-indigo-50 text-[#4F46E5] border border-[#EEEDFC] hover:bg-[#EEEDFC] px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      추가
                    </button>
                  </div>
                </div>

                {/* 추가된 핵심 포인트 리스트 */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block">등록 대기 리스트 ({newPoints.length}개)</span>
                  {newPoints.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center select-none">아직 추가된 포인트가 없습니다. 위 입력창에 적고 추가를 누르세요.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
                      {newPoints.map((p, idx) => (
                        <div key={p.id} className="flex justify-between items-center p-3 text-xs">
                          <span className="font-semibold text-slate-700 leading-normal">
                            <strong className="text-[#4F46E5] mr-1.5">{idx + 1}.</strong>
                            {p.text}
                          </span>
                          <button
                            onClick={() => handleRemovePoint(p.id)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 토픽 저장 버튼 */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveTopic}
                    className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-100 cursor-pointer"
                  >
                    오늘의 완전학습 토픽 저장하기
                  </button>
                </div>

                {regSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs text-center font-bold animate-in fade-in duration-200">
                    🎉 핵심 개념 토픽이 성공적으로 등록되었습니다!
                  </div>
                )}
              </div>
            </div>

            {/* 우측 목록 영역 */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                  📅 등록된 토픽 목록
                </h3>

                {topics.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-10 font-normal">오늘 등록된 토픽이 없습니다.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {[...topics].reverse().map(t => (
                      <div 
                        key={t.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${
                            t.subject === '수학' ? 'bg-blue-500' :
                            t.subject === '영어' ? 'bg-[#2C9C8F]' :
                            t.subject === '국어' ? 'bg-amber-500' :
                            t.subject === '과학' ? 'bg-purple-500' : 'bg-slate-500'
                          }`}>
                            {t.subject}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">{t.date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{t.topic}</h4>
                        <div className="text-[10px] text-slate-400 font-medium">
                          포인트 {t.keyPoints.length}개 등록됨
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB B: 백지 테스트 채점 --- */}
        {activeTab === 'grade' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 좌측 채점판 영역 */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  ✅ 학생별 백지 테스트 채점 및 오답 분석
                </h3>

                {/* 1. 토픽 및 학생 선택 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">채점할 공부 주제 선택</label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:border-[#4F46E5] font-semibold"
                    >
                      <option value="" disabled>토픽을 선택하세요</option>
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>[{t.subject}] {t.topic} ({t.date})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">채점 대상 학생 선택</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:border-[#4F46E5] font-semibold"
                    >
                      <option value="" disabled>학생을 선택하세요</option>
                      {mockElementaryStudents.map(student => (
                        <option key={student.id} value={student.id}>{student.name} ({student.school} · {student.grade})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. 인출 방식 선택 */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">테스트 인출 방식</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'blank_write', label: '📝 백지 쓰기' },
                      { key: 'verbal', label: '🗣️ 구술 설명' },
                      { key: 'peer_explain', label: '👥 또래 설명' }
                    ] as const).map(item => (
                      <button
                        key={item.key}
                        onClick={() => setRecallMethod(item.key)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          recallMethod === item.key
                            ? 'bg-[#EEEDFC] border-[#4F46E5] text-[#4F46E5] shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 체크리스트 채점판 */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block">핵심 포인트 인출 여부 채점</span>
                  
                  {!selectedTopicId ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-xl text-center select-none">위에서 채점할 공부 주제를 선택하시면 핵심 체크리스트가 열립니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {topics.find(t => t.id === selectedTopicId)?.keyPoints.map((kp, idx) => {
                        const isRecalled = recalledStatus[kp.id] || false;
                        return (
                          <button
                            key={kp.id}
                            onClick={() => toggleRecall(kp.id)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                              isRecalled
                                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 font-semibold'
                                : 'bg-rose-50/40 border-rose-200 text-rose-800'
                            }`}
                          >
                            <span className="leading-relaxed font-semibold">
                              <strong className="mr-1.5 opacity-70">{idx + 1}.</strong>
                              {kp.text}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isRecalled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isRecalled ? '✓ 인출 완료' : '✗ 미흡 (구멍)'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. 선택 사항: 인출 본문 덤프 & 관찰 노트 */}
                <div className="space-y-3 pt-2">
                  {recallMethod === 'peer_explain' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">
                        설명 대상 (누구에게 설명했나요?) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="예: 박지민 학생, 부모님, 코치 등"
                        value={peerToStudent}
                        onChange={(e) => setPeerToStudent(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-[#4F46E5] focus:outline-none"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">학생이 타이핑한 백지 인출 원문 (선택)</label>
                    <textarea
                      placeholder="학생이 작성한 백지 쓰기 텍스트를 복사하거나 주요 서술을 붙여넣으세요..."
                      value={studentDump}
                      onChange={(e) => setStudentDump(e.target.value)}
                      rows={3}
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">코치 관찰 / 암기 가이드 메모 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 다른 개념은 완벽하나, 괄호 음수 부호 처리에 잦은 실수 발생."
                      value={gradingNote}
                      onChange={(e) => setGradingNote(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveGrade}
                    className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-100 cursor-pointer"
                  >
                    채점 및 분석 저장하기
                  </button>
                </div>

                {gradeSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs text-center font-bold animate-in fade-in duration-200 space-y-1">
                    <div>🎉 채점 데이터가 저장되었고, 미인출 포인트는 자동으로 결손(구멍) 리스트에 등록되었습니다.</div>
                    <div className="text-[10px] text-slate-400">(초등의 경우 오늘 루틴 P1 복습 단계 완료 연동됨)</div>
                  </div>
                )}
              </div>
            </div>

            {/* 우측 채점 피드백 결과 스코어보드 */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm space-y-5 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                {latestScore === null ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center text-2xl mb-2">
                      ?
                    </div>
                    <h4 className="text-xs font-bold text-slate-400">채점 대기 중</h4>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-[180px]">
                      왼쪽 채점판에서 포인트를 체크하고 저장을 누르시면 점수가 여기에 즉시 표시됩니다.
                    </p>
                  </>
                ) : (
                  <div className="space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="w-24 h-24 rounded-full bg-[#EEEDFC] text-[#4F46E5] flex items-center justify-center text-3xl font-bold font-sans mx-auto shadow-sm border border-indigo-100">
                      {latestScore}%
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {getStudentName(selectedStudentId)} 학생 채점 결과
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        인출률 스코어: {latestScore}%
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed font-semibold">
                      {latestScore === 100 ? (
                        <span className="text-[#2C9C8F]">🌟 축하합니다! 완벽하게 모든 개념 포인트를 인출했습니다.</span>
                      ) : (
                        <span>미흡한 부분은 결손 큐에 등록되어 다음 등원 시 재테스트를 거칩니다.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB C: 구멍(결손) 현황 & 재테스트 --- */}
        {activeTab === 'gaps' && (
          <div className="space-y-6">
            
            {/* 상단 통계 큐 요약 */}
            <section className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-[#4F46E5]" />
                    오늘 메울 구멍 큐 (결손 보완 및 재테스트 대기 명단)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-normal">과거에 인출하지 못해 구멍이 생긴 개념 리스트를 모아 재시험을 진행합니다.</p>
                </div>
                
                <button
                  onClick={handleResolveGaps}
                  disabled={Object.keys(selectedGapIds).filter(id => selectedGapIds[id]).length === 0}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-slate-200 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm disabled:shadow-none shrink-0 cursor-pointer"
                >
                  선택한 {Object.keys(selectedGapIds).filter(id => selectedGapIds[id]).length}개 개념 인출 완료 처리
                </button>
              </div>

              {retestSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs text-center font-bold animate-in fade-in duration-200 mb-4 select-none">
                  ✓ 결손 개념이 메워져 완료(Closed) 상태로 변경되었습니다!
                </div>
              )}

              {openGaps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold">현재 남아있는 공부 구멍이 없습니다. 모든 학생이 개념을 잘 완수하고 있습니다!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 학생별로 그룹화하여 렌더링 */}
                  {mockElementaryStudents.map(student => {
                    const studentOpenGaps = openGaps.filter(g => g.studentId === student.id);
                    const stats = getStudentGapStats(student.id);
                    if (studentOpenGaps.length === 0) return null;

                    return (
                      <div 
                        key={student.id} 
                        className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30"
                      >
                        {/* 학생 타이틀 */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{student.name} 학생</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{student.school} · {student.grade}</span>
                          </div>
                          
                          {/* 누적 결손 스코어 */}
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                            오픈 구멍 {stats.openCount}개 / 메운 구멍 {stats.closedCount}개
                          </span>
                        </div>

                        {/* 구멍 포인트 리스트 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {studentOpenGaps.map(gap => {
                            const isChecked = selectedGapIds[gap.id] || false;
                            return (
                              <button
                                key={gap.id}
                                onClick={() => toggleGapSelect(gap.id)}
                                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                                  isChecked 
                                    ? 'bg-[#EEEDFC]/40 border-[#4F46E5] text-[#4F46E5] font-semibold' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                                }`}
                              >
                                <div className="space-y-1 pr-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                                      {gap.subject}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[150px]">
                                      주제: {gap.topic}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold leading-normal text-slate-800">{gap.pointText}</p>
                                  <span className="text-[9px] text-slate-400 font-semibold block">결손발생: {gap.createdDate}</span>
                                </div>

                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-[#4F46E5] border-[#4F46E5] text-white' : 'bg-white border-slate-200'
                                }`}>
                                  {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </div>
  );
}
