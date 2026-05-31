import React, { useState, useEffect, useRef } from 'react';
import type { PreworkModuleProps } from '@/lib/prework/types';
import type { SpeedStimulus } from '@/lib/prework/adapters/speedAdapter';

export function SpeedTapModule({ stimulus, difficulty, onComplete }: PreworkModuleProps) {
  const speedStim = stimulus as SpeedStimulus;
  const { instruction, targets, distractors } = speedStim.content_payload;
  
  const [phase, setPhase] = useState<'preview' | 'play' | 'feedback'>('preview');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const playStartRef = useRef<number>(0);
  
  // Ruffle/shuffle items to present
  const items = React.useMemo(() => {
    // Combine target and distractors
    const all = [
      ...targets.map(t => ({ ...t, isTarget: true })),
      ...distractors.map(d => ({ ...d, isTarget: false }))
    ];
    // Shuffle deterministically based on difficulty & stimulus id length
    return all.sort((a, b) => (a.emoji.charCodeAt(0) + difficulty) % 3 - (b.emoji.charCodeAt(0) + difficulty) % 3);
  }, [targets, distractors, difficulty]);

  useEffect(() => {
    if (phase === 'preview') {
      const timer = setTimeout(() => {
        setPhase('play');
        playStartRef.current = Date.now();
      }, 2000); // 2 seconds preview
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleTap = (isTarget: boolean) => {
    if (phase !== 'play') return;
    const rt = Date.now() - playStartRef.current;
    setFeedback(isTarget ? 'correct' : 'wrong');
    setPhase('feedback');
    
    setTimeout(() => {
      onComplete({
        stimulusId: speedStim.id,
        domain: 'S',
        secondaryDomains: ['F'],
        difficulty: difficulty,
        isCorrect: isTarget,
        responseTimeMs: rt,
      });
    }, 600); // 0.6 second feedback duration
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-br from-[#FAF9F6] to-[#FAF9F6]">
      {phase === 'preview' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="text-sm font-semibold text-[#1E40AF] bg-[#EBF3FF] border border-[#B8D4FF] px-4 py-1.5 rounded-full">
            주의 분산 집중 워밍업 ⚡
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
            {instruction}
          </h3>
          <div className="text-xs text-slate-400 font-medium">잠시 후 시작됩니다. 준비하세요!</div>
          <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-shrink-width" style={{ animationDuration: '2000ms' }} />
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-md animate-fade-in">
          <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">
            {instruction}
          </h3>
          
          <div className="grid grid-cols-3 gap-4 w-full justify-items-center">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleTap(item.isTarget)}
                className="w-20 h-20 md:w-24 md:h-24 bg-white border border-[#E5E1DA] hover:border-indigo-400 hover:shadow-md active:scale-95 text-3xl md:text-4xl rounded-2xl flex items-center justify-center transition-all shadow-sm"
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="flex flex-col items-center justify-center animate-scale-up">
          {feedback === 'correct' ? (
            <div className="w-24 h-24 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-5xl text-emerald-600 font-bold">✓</span>
            </div>
          ) : (
            <div className="w-24 h-24 bg-rose-100 border border-rose-300 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-5xl text-rose-600 font-bold">✗</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrinkWidth linear forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes scaleUp {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
