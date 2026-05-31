import React, { useState, useEffect, useRef } from 'react';
import type { PreworkModuleProps } from '@/lib/prework/types';
import type { NumLogicStimulus } from '@/lib/prework/adapters/numlogicAdapter';

export function NumberWordModule({ stimulus, difficulty, onComplete }: PreworkModuleProps) {
  const numLogicStim = stimulus as NumLogicStimulus;
  const { instruction, type_emoji, options, correct_index, hint } = numLogicStim.content_payload;
  
  const [phase, setPhase] = useState<'preview' | 'play' | 'feedback'>('preview');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const playStartRef = useRef<number>(0);

  useEffect(() => {
    if (phase === 'preview') {
      const timer = setTimeout(() => {
        setPhase('play');
        playStartRef.current = Date.now();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleSelect = (idx: number) => {
    if (phase !== 'play') return;
    const rt = Date.now() - playStartRef.current;
    
    const isCorrect = idx === correct_index;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPhase('feedback');
    
    setTimeout(() => {
      onComplete({
        stimulusId: numLogicStim.id,
        domain: 'N',
        secondaryDomains: ['L'],
        difficulty: difficulty,
        isCorrect: isCorrect,
        responseTimeMs: rt,
      });
    }, 600); // 0.6 second feedback duration
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-br from-[#FAF9F6] to-[#FAF9F6]">
      {phase === 'preview' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full flex items-center gap-1.5">
            <span>{type_emoji || '🔢'}</span>
            <span>수 또는 말 놀이</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
            질문을 잘 읽고 알맞은 정답을 골라보세요.
          </h3>
          <div className="text-xs text-slate-400 font-medium">개념과 추론 능력을 깨우는 시간!</div>
          <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-shrink-width" style={{ animationDuration: '2000ms' }} />
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md animate-fade-in">
          <div className="text-sm font-bold text-blue-600 bg-blue-50/50 px-3 py-1 rounded-full flex items-center gap-1">
            <span>{type_emoji || '🔢'}</span>
            <span>문제 해결하기</span>
          </div>
          
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 w-full shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-slate-800 leading-relaxed text-left">
              {instruction}
            </h3>
            {hint && (
              <p className="text-[11px] text-slate-400 font-medium text-left mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                💡 힌트: {hint}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className="py-4 px-3 bg-white border border-[#E5E1DA] hover:border-blue-400 text-slate-700 font-semibold rounded-xl text-xs md:text-sm transition-all shadow-sm active:scale-95 text-center leading-snug flex items-center justify-center min-h-[56px]"
              >
                {opt}
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
