import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SessionRecord, AttemptResult, Domain } from '@/lib/prework/types';

// Load Banks
import speedBankLow from '@/lib/prework/banks/speed.low.json';
import memoryBankLow from '@/lib/prework/banks/memory.low.json';
import memoryBankHigh from '@/lib/prework/banks/memory.high.json';
import focusBankLow from '@/lib/prework/banks/focus.low.json';
import numlogicBankLow from '@/lib/prework/banks/numlogic.low.json';
import metaBankLow from '@/lib/prework/banks/meta.low.json';

// Load Adapters
import { pickSpeedStimulus } from '@/lib/prework/adapters/speedAdapter';
import { pickMemoryStimulus } from '@/lib/prework/adapters/memoryAdapter';
import { pickFocusStimuli } from '@/lib/prework/adapters/focusAdapter';
import { pickNumLogicStimulus } from '@/lib/prework/adapters/numlogicAdapter';
import { pickMetaStimuli } from '@/lib/prework/adapters/metaAdapter';

// Load Components
import { SpeedTapModule } from './modules/SpeedTapModule';
import { MemoryModulePreworkAdapter } from './modules/MemoryModulePreworkAdapter';
import { RuleGameModule } from './modules/RuleGameModule';
import { NumberWordModule } from './modules/NumberWordModule';
import { MetaReflectionModule } from './modules/MetaReflectionModule';

interface PreworkRunnerProps {
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  gradeTrack?: 'low' | 'high';
  difficulty?: 1 | 2 | 3 | 4 | 5;
  onSessionComplete?: (record: SessionRecord) => void;
  onExit?: () => void;
}

// 5-Slot Configuration
const SLOTS_CONFIG = [
  { slotIndex: 0, name: '별 모양 찾기', domain: 'S' as Domain, secondary: ['F' as Domain] },
  { slotIndex: 1, name: '사라진 그림 찾기', domain: 'M' as Domain, secondary: ['P' as Domain] },
  { slotIndex: 2, name: '신호등 판정 놀이', domain: 'X' as Domain, secondary: ['P' as Domain] },
  { slotIndex: 3, name: '수 또는 말 퍼즐', domain: 'N' as Domain, secondary: ['L' as Domain] },
  { slotIndex: 4, name: '오늘의 한 컷', domain: 'T' as Domain, secondary: [] as Domain[] }
];

// Helper: Hashing string to seed number
function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function PreworkRunner({
  studentId,
  studentName,
  date,
  gradeTrack = 'low',
  difficulty = 1,
  onSessionComplete,
  onExit
}: PreworkRunnerProps) {
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  const sessionStartRef = useRef<string>('');
  
  // Initialize start time once on mount
  useEffect(() => {
    sessionStartRef.current = new Date().toISOString();
  }, []);

  // Deterministically select stimuli for each of the 5 slots
  const selectedStimuli = useMemo(() => {
    return SLOTS_CONFIG.map((cfg) => {
      // seed = studentId:date:slotIndex
      const seedStr = `${studentId}:${date}:${cfg.slotIndex}`;
      const seed = hashStringToSeed(seedStr);
      
      // Select appropriate bank and pick stimulus
      switch (cfg.slotIndex) {
        case 0:
          return pickSpeedStimulus(speedBankLow as any, difficulty, seed);
        case 1: {
          const bank = gradeTrack === 'high' ? memoryBankHigh : memoryBankLow;
          return pickMemoryStimulus(bank as any, difficulty, seed);
        }
        case 2:
          return pickFocusStimuli(focusBankLow as any, difficulty, 1, seed)[0];
        case 3:
          return pickNumLogicStimulus(numlogicBankLow as any, difficulty, seed);
        case 4:
          return pickMetaStimuli(metaBankLow as any, 1, seed)[0];
        default:
          return null;
      }
    });
  }, [studentId, date, gradeTrack, difficulty]);

  // Complete a slot, record attempt, and advance
  const handleSlotComplete = (result: Omit<AttemptResult, 'slotIndex' | 'presentedAt'>) => {
    const attempt: AttemptResult = {
      ...result,
      slotIndex: currentSlotIndex,
      presentedAt: new Date().toISOString()
    };

    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);

    if (currentSlotIndex < 4) {
      setCurrentSlotIndex(prev => prev + 1);
    } else {
      // Completed all 5 slots!
      const endedAt = new Date().toISOString();
      const sessionRecord: SessionRecord = {
        sessionId: `pw_sess_${studentId}_${date.replace(/-/g, '')}`,
        studentId,
        date,
        gradeTrack,
        startedAt: sessionStartRef.current,
        endedAt,
        attempts: newAttempts,
        completionStatus: 'completed',
        formulaVersion: 'v0.1'
      };

      // Emit results (both console.log and callback)
      console.log('--- Prework Warmup Completed ---');
      console.log('Session Record:', JSON.stringify(sessionRecord, null, 2));

      if (onSessionComplete) {
        onSessionComplete(sessionRecord);
      }
      setIsFinished(true);
    }
  };

  const currentSlotConfig = SLOTS_CONFIG[currentSlotIndex];
  const currentStimulus = selectedStimuli[currentSlotIndex];

  // Render the corresponding module component for the active slot
  const renderActiveModule = () => {
    if (!currentStimulus) return <div className="p-6 text-center text-xs text-slate-400">자극을 로드하는 중...</div>;

    const commonProps = {
      stimulus: currentStimulus,
      difficulty,
      onComplete: handleSlotComplete
    };

    switch (currentSlotIndex) {
      case 0:
        return <SpeedTapModule {...commonProps} />;
      case 1:
        return <MemoryModulePreworkAdapter {...commonProps} />;
      case 2:
        return <RuleGameModule {...commonProps} />;
      case 3:
        return <NumberWordModule {...commonProps} />;
      case 4:
        return <MetaReflectionModule {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col font-sans select-none pb-12">
      {/* Top Header & Progress bar */}
      {!isFinished && (
        <div className="mb-6 bg-[#FAF9F6] border border-[#E5E1DA] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-655">
            <span className="text-[#1E40AF] font-bold">
              {currentSlotConfig.name} <span className="text-slate-400 font-normal">({currentSlotIndex + 1}/5)</span>
            </span>
            <span className="text-slate-400">{studentName} 학생</span>
          </div>
          
          {/* 5-segmented Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 h-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-full rounded-full transition-all duration-300 ${
                  i < currentSlotIndex
                    ? 'bg-[#1E40AF]' // completed
                    : i === currentSlotIndex
                      ? 'bg-[#3B82F6] animate-pulse' // active
                      : 'bg-slate-200' // waiting
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Module Area / Final complete screen */}
      <div className="bg-white border border-[#E5E1DA] rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[440px]">
        {!isFinished ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-slate-50 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute inset-0 flex flex-col">
                {renderActiveModule()}
              </div>
            </div>
          </div>
        ) : (
          /* Finished State: encouraging message with NO score statistics */
          <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-emerald-150">
              <span className="text-4xl">🌟</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">워밍업 완료!</h2>
            <p className="text-xs text-slate-400 font-medium mb-4">{studentName} 학생</p>
            <p className="text-sm text-slate-655 font-medium leading-relaxed max-w-sm">
              오늘의 두뇌 예열을 기분 좋게 끝마쳤습니다.<br />
              이 활기찬 에너지를 담아 오늘의 진짜 학습을 멋지게 시작해 볼까요?
            </p>
            
            <div className="mt-8 flex gap-3 w-full max-w-xs">
              {onExit && (
                <button
                  onClick={onExit}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                >
                  완료하고 돌아가기
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
