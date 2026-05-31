/**
 * MemoryModule — "기억 게임 (사라진 그림 찾기)"
 *
 * memory.low.json 뱅크 + memoryAdapter 기반.
 * 세션 당 레벨 1→8 순차 진행, 레벨별 랜덤 variant 선택.
 * 각 레벨에서 정답을 맞추면 다음 레벨로, 틀리면 재시도.
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import memoryBankLow from '@/lib/prework/banks/memory.low.json';
import memoryBankHigh from '@/lib/prework/banks/memory.high.json';
import type { StimulusResponse } from '@/lib/prework/preworkService';
import {
  pickMemoryStimulus,
  stimulusToMemoryLevel,
  type MemoryBank,
  type MemoryStimulus,
  type MemoryLevel,
} from '@/lib/prework/adapters/memoryAdapter';

// ─── Props ───────────────────────────────────────────
interface PreWorkModuleProps {
  isPlaying: boolean;
  onProgress: (progress: number) => void;
  onComplete: () => void;
  onResponseLog?: (response: StimulusResponse) => void;
  gradeTrack?: 'low' | 'high';
  startLevel?: number;
}

// ─── 상수 ───────────────────────────────────────────
const TOTAL_LEVELS = 8;
// 고정 시드 대신 마운트 시점 타임스탬프 기반 시드 (같은 세션 재방문 시 문제 유지)
const SESSION_SEED = Date.now();

// ─── 컴포넌트 ─────────────────────────────────────────
export function MemoryModule({ isPlaying, onProgress, onComplete, onResponseLog, gradeTrack = 'low', startLevel = 1 }: PreWorkModuleProps) {
  const bank = useMemo(() => (gradeTrack === 'high' ? memoryBankHigh : memoryBankLow) as unknown as MemoryBank, [gradeTrack]);
  const recallStartRef = useRef<number>(0);

  // ─ 레벨 진행 상태
  const [currentModuleLevel, setCurrentModuleLevel] = useState(startLevel);
  const [phase, setPhase] = useState<'preview' | 'hidden' | 'recall'>('preview');
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ─ 현재 자극 선택 (레벨 변경 시마다)
  const currentStimulus: MemoryStimulus = useMemo(
    () => pickMemoryStimulus(bank, currentModuleLevel, SESSION_SEED + currentModuleLevel),
    [bank, currentModuleLevel],
  );

  // ─ 어댑터로 변환
  const level: MemoryLevel = useMemo(
    () => stimulusToMemoryLevel(currentStimulus),
    [currentStimulus],
  );

  // ─ 카테고리 라벨 (level_curve에서)
  const categoryLabel = useMemo(() => {
    const key = `L${currentModuleLevel}`;
    const curve = ((bank as any).level_curve as Record<string, { category?: string }>)?.[key];
    return curve?.category ?? '';
  }, [currentModuleLevel, bank]);

  // ─ 프리뷰 → 히든 → 리콜 자동 전환
  useEffect(() => {
    if (!isPlaying) return;

    if (phase === 'preview') {
      const timer = setTimeout(() => setPhase('hidden'), level.previewDuration);
      return () => clearTimeout(timer);
    }

    if (phase === 'hidden') {
      const timer = setTimeout(() => {
        setPhase('recall');
        recallStartRef.current = Date.now();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, phase, level.previewDuration]);

  // ─ 선택 토글
  const toggleSelection = useCallback((opt: string) => {
    setSelectedAnswers(prev =>
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt],
    );
  }, []);


  // ─ 정답 확인
  const checkAnswer = useCallback(() => {
    const isCorrect =
      selectedAnswers.length === level.removedItems.length &&
      selectedAnswers.every(ans => level.removedItems.includes(ans));

    const rtMs = Date.now() - recallStartRef.current;

    setFeedback(isCorrect ? 'correct' : 'wrong');

    // 응답 로그 기록
    if (onResponseLog) {
      onResponseLog({
        stimulus_id: currentStimulus.id,
        domain: 'Memory',
        module_level: currentStimulus.module_level,
        difficulty_level: currentStimulus.difficulty_level,
        correct: isCorrect,
        rt_ms: rtMs,
        rt_expected_ms: currentStimulus.rt_expected_ms,
        selected_answer: selectedAnswers,
        is_trap: false,
        timestamp: Date.now(),
      });
    }

    setTimeout(() => {
      setFeedback(null);

      if (isCorrect) {
        const nextLevel = currentModuleLevel + 1;
        onProgress((currentModuleLevel / TOTAL_LEVELS) * 100);

        if (nextLevel > TOTAL_LEVELS) {
          onComplete();
        } else {
          setCurrentModuleLevel(nextLevel);
          setPhase('preview');
          setSelectedAnswers([]);
          setRetryCount(0);
        }
      } else {
        // 틀린 경우 — 선택 초기화, 재시도 카운트 증가
        setSelectedAnswers([]);
        setRetryCount(c => c + 1);
      }
    }, 1500);
  }, [selectedAnswers, level.removedItems, currentModuleLevel, currentStimulus, onProgress, onComplete, onResponseLog]);

  // ─ 자동 정답 확인
  useEffect(() => {
    if (phase === 'recall' && selectedAnswers.length === level.removedItems.length && feedback === null) {
      checkAnswer();
    }
  }, [selectedAnswers, level.removedItems.length, phase, feedback, checkAnswer]);

  // ─── 렌더 ─────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col relative bg-gradient-to-br from-slate-50 to-purple-50/30 p-6 md:p-8 items-center justify-center">
      {/* 레벨 인디케이터 */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < currentModuleLevel - 1
                  ? 'bg-indigo-500'
                  : i === currentModuleLevel - 1
                    ? 'bg-indigo-400 ring-2 ring-indigo-300 ring-offset-1 scale-125'
                    : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-slate-500 ml-1">
          L{currentModuleLevel}/{TOTAL_LEVELS}
        </span>
      </div>

      {/* 카테고리 뱃지 */}
      {categoryLabel && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-xs font-bold text-purple-600 border border-purple-200 shadow-sm">
          🏷️ {categoryLabel}
        </div>
      )}

      {/* 인스트럭션 */}
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 text-center">
        {level.instruction}
      </h2>

      {/* 일시정지 오버레이 */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
          <p className="text-2xl font-bold text-slate-500">⏸ 일시 정지</p>
        </div>
      )}

      {/* 피드백 토스트 */}
      {feedback && (
        <div
          className={`absolute top-16 px-8 py-4 rounded-2xl text-white font-bold text-xl z-30 shadow-lg transition-transform ${
            feedback === 'correct'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 animate-bounce'
              : 'bg-gradient-to-r from-red-500 to-rose-500 animate-pulse'
          }`}
        >
          {feedback === 'correct' ? '정답입니다! 🎉' : '다시 생각해보세요 🤔'}
        </div>
      )}

      {/* ─── 프리뷰 페이즈 ─── */}
      {phase === 'preview' && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center max-w-2xl">
            {level.previewItems.map((item, i) => (
              <div
                key={i}
                className="bg-white px-6 py-5 md:px-8 md:py-6 rounded-2xl shadow-sm border border-slate-200 text-2xl md:text-3xl font-medium"
                style={{ animation: `fadeInUp 0.4s ease ${i * 0.08}s both` }}
              >
                {item}
              </div>
            ))}
          </div>
          {/* 프리뷰 타이머 바 */}
          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-indigo-400 rounded-full"
              style={{
                animation: `shrinkWidth ${level.previewDuration}ms linear forwards`,
              }}
            />
          </div>
          <p className="text-sm text-slate-400 font-medium">잘 기억하세요!</p>
        </div>
      )}

      {/* ─── 히든 페이즈 ─── */}
      {phase === 'hidden' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl animate-pulse">🙈</div>
          <p className="text-slate-400 font-bold text-lg">기억을 떠올려보세요...</p>
        </div>
      )}

      {/* ─── 리콜 페이즈 ─── */}
      {phase === 'recall' && (
        <div className="w-full flex flex-col items-center gap-6">
          {/* 남은 아이템 + 빈 슬롯 */}
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center max-w-2xl">
            {level.previewItems
              .filter(i => !level.removedItems.includes(i))
              .map((item, i) => (
                <div
                  key={i}
                  className="bg-white px-6 py-5 md:px-8 md:py-6 rounded-2xl shadow-sm border border-slate-200 text-2xl md:text-3xl font-medium opacity-50"
                >
                  {item}
                </div>
              ))}

            {level.removedItems.map((_, i) => (
              <div
                key={`missing-${i}`}
                className="bg-gradient-to-br from-slate-100 to-slate-200 px-6 py-5 md:px-8 md:py-6 rounded-2xl border-2 border-dashed border-indigo-300 text-2xl md:text-3xl font-medium flex items-center justify-center"
              >
                <span className="text-indigo-300 text-2xl">❓</span>
              </div>
            ))}
          </div>

          {/* 선택 패널 */}
          <div className="w-full max-w-xl bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-bold mb-4 text-center text-sm md:text-base">
              사라진 것을 모두 골라주세요 ({level.removedItems.length}개)
              {retryCount > 0 && (
                <span className="ml-2 text-amber-500 text-xs">재시도 {retryCount}회</span>
              )}
            </p>

            <div className="flex flex-wrap gap-2.5 md:gap-3 justify-center mb-5">
              {level.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => toggleSelection(opt)}
                  disabled={feedback !== null}
                  className={`px-4 py-3 md:px-6 md:py-4 rounded-xl text-lg md:text-xl font-medium transition-all border-2 ${
                    selectedAnswers.includes(opt)
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-700 shadow-sm scale-105'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {opt}
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 인라인 키프레임 (CSS 모듈 없이) */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
