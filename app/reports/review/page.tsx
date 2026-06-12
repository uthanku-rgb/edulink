'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  MessageSquare, 
  Calendar,
  User,
  ShieldCheck,
  Play
} from 'lucide-react';
import Header from '../../../components/Header';
import SectionNav from '../../../components/SectionNav';
import { 
  getReportInstances, 
  updateReportInstance, 
  dispatchReportInstance 
} from '../../../lib/reportDb';
import { runReportGenerationJob } from '../../../lib/generate-job';
import { ReportInstance } from '../../../lib/report-engine-spec';
import { getThisWeekRange } from '../../../lib/dateService';
import { useToast } from '../../../components/ToastProvider';

export default function CoachReviewQueuePage() {
  const router = useRouter();
  const toast = useToast();
  const [instances, setInstances] = useState<(ReportInstance & { student?: { name: string; grade: string; school: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'queue' | 'approved' | 'sent'>('queue');
  const [comments, setComments] = useState<Record<string, string>>({});
  
  // Kakao dispatch logs
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);

  const loadInstances = async () => {
    setLoading(true);
    try {
      const data = await getReportInstances();
      setInstances(data);
      
      // Initialize comments state
      const initialComments: Record<string, string> = {};
      data.forEach(inst => {
        if (inst.coachComment) {
          initialComments[inst.id] = inst.coachComment;
        }
      });
      setComments(initialComments);
    } catch (err) {
      console.error('Failed to load report instances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const handleGenerateMock = async () => {
    setGenerating(true);
    setDispatchLogs([]);
    try {
      // Run generation job for this week (dynamic)
      const range = getThisWeekRange();
      const startStr = range.start.toISOString().split('T')[0];
      const endStr = range.end.toISOString().split('T')[0];
      const result = await runReportGenerationJob(startStr, endStr);
      if (result.success) {
        toast.success(`배치 잡 실행 완료: ${result.count}개의 리포트 인스턴스가 생성되었습니다.`);
        await loadInstances();
      } else {
        toast.error('리포트 생성 배치 잡 실행 실패.');
      }
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCommentChange = (id: string, text: string) => {
    setComments(prev => ({
      ...prev,
      [id]: text
    }));
  };

  const handleApprove = async (id: string) => {
    const coachComment = comments[id] || '';
    if (!coachComment.trim()) {
      toast.info('코치 한 줄 의견을 입력해 주세요.');
      return;
    }

    try {
      const success = await updateReportInstance(id, {
        status: 'approved',
        coachComment
      });
      
      if (success) {
        setInstances(prev => 
          prev.map(inst => 
            inst.id === id 
              ? { ...inst, status: 'approved', coachComment } 
              : inst
          )
        );
      } else {
        toast.error('승인 처리에 실패했습니다.');
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleSingleDispatch = async (id: string) => {
    try {
      const result = await dispatchReportInstance(id);
      if (result.ok) {
        const inst = instances.find(i => i.id === id);
        const name = inst?.student?.name || '학생';
        const type = inst?.reportTypeId || '';
        
        setDispatchLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ✔ ${name} (${type}) 발송 성공! status -> sent`,
          ...prev
        ]);
        await loadInstances();
      } else {
        toast.error(`발송 실패: ${result.error}`);
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
    }
  };

  const handleBulkDispatch = async () => {
    const readyInstances = instances.filter(
      inst => inst.status === 'auto_ready' || inst.status === 'approved'
    );

    if (readyInstances.length === 0) {
      toast.info('발송 대기(auto_ready) 또는 승인완료(approved) 상태인 리포트가 없습니다.');
      return;
    }

    setDispatching(true);
    const logs: string[] = [];
    try {
      for (const inst of readyInstances) {
        const name = inst.student?.name || '학생';
        const type = inst.reportTypeId;
        
        logs.push(`[${new Date().toLocaleTimeString()}] 🚀 ${name} (${type}) 발송 시작...`);
        setDispatchLogs([...logs]);
        
        const result = await dispatchReportInstance(inst.id);
        if (result.ok) {
          logs.push(`[${new Date().toLocaleTimeString()}] ✔ ${name} (${type}) 알림톡 발송 완료 (Status: sent)`);
        } else {
          logs.push(`[${new Date().toLocaleTimeString()}] ❌ ${name} (${type}) 발송 실패: ${result.error}`);
        }
        setDispatchLogs([...logs]);
      }
      await loadInstances();
    } catch (err) {
      console.error('Bulk dispatch failed:', err);
    } finally {
      setDispatching(false);
    }
  };

  // Filter instances
  const filteredInstances = instances.filter(inst => {
    if (filter === 'all') return true;
    if (filter === 'queue') return inst.status === 'needs_review' || inst.status === 'hold';
    if (filter === 'approved') return inst.status === 'approved' || inst.status === 'auto_ready';
    if (filter === 'sent') return inst.status === 'sent';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12 font-sans text-slate-800">
      <Header title="코치 리포트 검수 큐" studentCount={instances.length} />
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

          {/* 제어판 버튼 모음 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateMock}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
            >
              <Play className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>리포트 생성 잡 모의 실행 (batch)</span>
            </button>

            <button
              onClick={handleBulkDispatch}
              disabled={dispatching || instances.filter(i => i.status === 'auto_ready' || i.status === 'approved').length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-350 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>전체 발송 실행 (Kakao/Print)</span>
            </button>

            <button
              onClick={loadInstances}
              className="p-1.5 text-slate-500 hover:text-slate-700 border border-slate-200 bg-white rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 발송 로그 콘솔 */}
        {dispatchLogs.length > 0 && (
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 mb-6 font-mono text-xs max-h-48 overflow-y-auto border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                발송 파이프라인 모의 로그
              </span>
              <button 
                onClick={() => setDispatchLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
              >
                로그 비우기
              </button>
            </div>
            <div className="space-y-1">
              {dispatchLogs.map((log, idx) => (
                <div key={idx} className={log.includes('❌') ? 'text-rose-400' : log.includes('✔') ? 'text-emerald-400' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 탭 필터 */}
        <div className="flex border-b border-slate-200 mb-6 font-medium text-xs">
          {[
            { id: 'queue', label: '검수 대기 큐', count: instances.filter(i => i.status === 'needs_review' || i.status === 'hold').length },
            { id: 'approved', label: '발송 대기 (승인완료)', count: instances.filter(i => i.status === 'approved' || i.status === 'auto_ready').length },
            { id: 'sent', label: '발송 완료', count: instances.filter(i => i.status === 'sent').length },
            { id: 'all', label: '전체 보기', count: instances.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as 'all' | 'queue' | 'approved' | 'sent')}
              className={`pb-2.5 px-4 -mb-px transition-colors flex items-center gap-1.5 border-b-2 ${
                filter === tab.id
                  ? 'border-slate-800 text-slate-950 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 검수 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
            리포트 목록을 불러오는 중...
          </div>
        ) : filteredInstances.length === 0 ? (
          <div className="bg-white border border-[#E5E1DA] rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
            표시할 리포트 인스턴스가 없습니다. 배치 잡을 실행해 보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInstances.map(inst => {
              // Status Badge color
              let badgeClass = '';
              let statusLabel = '';
              if (inst.status === 'hold') {
                badgeClass = 'bg-rose-50 border-rose-200 text-rose-600';
                statusLabel = '보류 (Hold)';
              } else if (inst.status === 'needs_review') {
                badgeClass = 'bg-amber-50 border-amber-200 text-amber-600';
                statusLabel = '검수 대기';
              } else if (inst.status === 'auto_ready') {
                badgeClass = 'bg-emerald-50 border-emerald-250 text-emerald-600';
                statusLabel = '자동 통과 (Ready)';
              } else if (inst.status === 'approved') {
                badgeClass = 'bg-blue-50 border-blue-200 text-blue-600';
                statusLabel = '승인 완료';
              } else if (inst.status === 'sent') {
                badgeClass = 'bg-slate-100 border-slate-200 text-slate-600';
                statusLabel = '발송 성공';
              }

              return (
                <div 
                  key={inst.id}
                  className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-150 relative ${
                    inst.status === 'hold' ? 'border-rose-100 bg-rose-50/5' : 'border-[#E5E1DA]'
                  }`}
                >
                  <div>
                    {/* 상단: 헤더 */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 tracking-wider uppercase">
                          {inst.reportTypeId === 'core.weekly' ? '학습 주간 리포트' : '프리워크 PWI 월간 리포트'}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {inst.student?.name || '알 수 없는 학생'}
                          <span className="text-xs text-slate-400 font-normal">
                            ({inst.student?.grade || ''} · {inst.student?.school || ''})
                          </span>
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* 날짜 */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mb-4">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>분석 기간: {inst.periodStart} ~ {inst.periodEnd}</span>
                    </div>

                    {/* 게이트 플래그 경고창 */}
                    {inst.flags.length > 0 && (
                      <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                        <span className="font-bold text-slate-600 flex items-center gap-1 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          검출된 플래그 ({inst.flags.length})
                        </span>
                        <div className="space-y-1">
                          {inst.flags.map((flag, idx) => (
                            <div key={idx} className="flex items-start justify-between">
                              <span className="text-slate-600 font-medium">• {flag.detail}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                flag.action === 'hold' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {flag.action === 'hold' ? '보류 사유' : '코치 점검'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hold 인스턴스 사유 고지 */}
                    {inst.status === 'hold' && (
                      <div className="mt-2 mb-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3.5 text-xs font-normal leading-relaxed">
                        ⚠️ <strong>발송 차단됨 (Hold)</strong>: 데이터 불량 등 치명적인 조건 미달 상태입니다. 아래 사유를 해결하기 전에는 코치 승인이 불가합니다.
                        <ul className="list-disc pl-4 mt-1.5 space-y-1 text-rose-700">
                          {inst.flags.filter(f => f.action === 'hold').map((f, idx) => (
                            <li key={idx}>{f.detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 승인 완료 / 발송 완료 코멘트 고정 노출 */}
                    {(inst.status === 'approved' || inst.status === 'sent') && inst.coachComment && (
                      <div className="mb-4 bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 text-xs">
                        <span className="font-semibold text-blue-600 flex items-center gap-1.5 mb-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          기록된 코치 피드백
                        </span>
                        <p className="text-slate-700 italic font-medium">&quot;{inst.coachComment}&quot;</p>
                      </div>
                    )}
                  </div>

                  {/* 하단: 액션 부분 */}
                  <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-2">
                    {inst.status === 'needs_review' && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-400 font-bold block">
                          학부모 전송용 코치 의견 작성 (ReviewMode: Full)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={comments[inst.id] || ''}
                            onChange={(e) => handleCommentChange(inst.id, e.target.value)}
                            placeholder="이번 주 학생의 학습 성과 및 가이드를 한 줄로 작성하세요."
                            className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50 font-normal"
                          />
                          <button
                            onClick={() => handleApprove(inst.id)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 hover:shadow-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>승인</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {inst.status === 'hold' && (
                      <button
                        disabled
                        className="w-full py-1.5 bg-slate-100 border border-slate-200 text-slate-350 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                        <span>보류 해제 전 승인 불가</span>
                      </button>
                    )}

                    {(inst.status === 'approved' || inst.status === 'auto_ready') && (
                      <button
                        onClick={() => handleSingleDispatch(inst.id)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors hover:shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>즉시 발송 (Dispatch)</span>
                      </button>
                    )}

                    {inst.status === 'sent' && (
                      <div className="text-[11px] text-slate-400 text-right flex items-center justify-end gap-1.5 font-mono">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>발송 완료일시: {inst.sentAt ? new Date(inst.sentAt).toLocaleString() : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
