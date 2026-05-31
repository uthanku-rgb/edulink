import React, { useState, useEffect, useRef } from 'react';
import type { PreworkModuleProps } from '@/lib/prework/types';
import type { FocusStimulus } from '@/lib/prework/adapters/focusAdapter';

export function RuleGameModule({ stimulus, difficulty, onComplete }: PreworkModuleProps) {
  const focusStim = stimulus as FocusStimulus;
  const { instruction, signal, expected_action } = focusStim.content_payload;
  
  const [phase, setPhase] = useState<'preview' | 'play' | 'feedback'>('preview');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const playStartRef = useRef<number>(0);

  // Map signal name to visual emojis/colors
  const signalVisual = React.useMemo(() => {
    const s = signal.toLowerCase();
    if (s.includes('green') || s.includes('초록')) return { emoji: '🟢', label: '초록 신호', color: 'text-emerald-500' };
    if (s.includes('red') || s.includes('빨간')) return { emoji: '🔴', label: '빨간 신호', color: 'text-rose-500' };
    if (s.includes('yellow') || s.includes('노란')) return { emoji: '🟡', label: '노란 신호', color: 'text-amber-500' };
    return { emoji: '🚦', label: '신호등', color: 'text-slate-500' };
  }, [signal]);

  useEffect(() => {
    if (phase === 'preview') {
      const timer = setTimeout(() => {
        setPhase('play');
        playStartRef.current = Date.now();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleAction = (action: 'press' | 'no_response') => {
    if (phase !== 'play') return;
    const rt = Date.now() - playStartRef.current;
    
    const isCorrect = action === expected_action;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPhase('feedback');
    
    setTimeout(() => {
      onComplete({
        stimulusId: focusStim.id,
        domain: 'X',
        secondaryDomains: ['P'],
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
          <div className="text-sm font-semibold text-amber-700 bg-[#FBF1DD] border border-[#C9962F] px-4 py-1.5 rounded-full">
            인지 제어 / 억제 놀이 🎮
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
            {instruction}
          </h3>
          <div className="text-xs text-slate-400 font-medium">신호를 신속하고 정확하게 판정하세요!</div>
          <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full animate-shrink-width" style={{ animationDuration: '2000ms' }} />
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
          <div className="text-xs font-bold text-[#C9962F] bg-[#FBF1DD] px-3 py-1 rounded-full">
            🚦 규칙: {instruction}
          </div>
          
          <div className="flex flex-col items-center bg-white border border-[#E5E1DA] rounded-3xl p-8 w-full shadow-sm my-2">
            <span className="text-7xl md:text-8xl animate-pulse">{signalVisual.emoji}</span>
            <span className={`text-sm font-bold mt-3 ${signalVisual.color}`}>{signalVisual.label} 출현!</span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => handleAction('press')}
              className="py-4 bg-[#E8F1EA] hover:bg-[#5E9E7E] hover:text-white border border-[#5E9E7E]/30 text-[#2F5C46] font-bold rounded-2xl transition-all shadow-sm text-sm active:scale-95"
            >
              👉 터치하기 (Press)
            </button>
            <button
              onClick={() => handleAction('no_response')}
              className="py-4 bg-[#FBEAE3] hover:bg-[#D98B6F] hover:text-white border border-[#D98B6F]/30 text-[#8A4B36] font-bold rounded-2xl transition-all shadow-sm text-sm active:scale-95"
            >
              🛑 대기하기 (Wait)
            </button>
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
