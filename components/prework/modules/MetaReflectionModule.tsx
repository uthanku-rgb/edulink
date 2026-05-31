import React, { useState, useEffect, useRef } from 'react';
import type { PreworkModuleProps } from '@/lib/prework/types';
import type { MetaStimulus } from '@/lib/prework/adapters/metaAdapter';

export function MetaReflectionModule({ stimulus, difficulty, onComplete }: PreworkModuleProps) {
  const metaStim = stimulus as MetaStimulus;
  const { instruction, options } = metaStim.content_payload;
  
  const [phase, setPhase] = useState<'preview' | 'play' | 'feedback'>('preview');
  
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

  const handleSelect = (optionId: string) => {
    if (phase !== 'play') return;
    const rt = Date.now() - playStartRef.current;
    
    // Map choice to engagement rating (0.0 to 1.0)
    let engagement = 0.5;
    if (optionId === 'a') engagement = 1.0;
    else if (optionId === 'b') engagement = 0.75;
    else if (optionId === 'c') engagement = 0.5;
    else if (optionId === 'd') engagement = 0.25;

    setPhase('feedback');
    
    setTimeout(() => {
      onComplete({
        stimulusId: metaStim.id,
        domain: 'T',
        secondaryDomains: [], // No secondary domain for Meta
        difficulty: difficulty,
        isCorrect: null, // MetaReflection is always null
        engagement: engagement,
        responseTimeMs: rt,
      });
    }, 600); // 0.6 second feedback duration
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-br from-[#FAF9F6] to-[#FAF9F6]">
      {phase === 'preview' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="text-sm font-semibold text-pink-700 bg-pink-50 border border-pink-200 px-4 py-1.5 rounded-full flex items-center gap-1.5">
            <span>💭</span>
            <span>오늘의 성찰</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
            오늘 나의 마음과 태도를 돌아보는 시간입니다.
          </h3>
          <div className="text-xs text-slate-400 font-medium">부담 없이 솔직하게 선택해 주세요.</div>
          <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500 rounded-full animate-shrink-width" style={{ animationDuration: '2000ms' }} />
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md animate-fade-in">
          <div className="text-sm font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full flex items-center gap-1">
            <span>💭</span>
            <span>자기보고 성찰</span>
          </div>
          
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 w-full shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-slate-800 leading-relaxed text-center">
              {instruction}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5E1DA] hover:border-pink-400 rounded-2xl transition-all shadow-sm active:scale-95 text-center min-h-[100px] gap-2"
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="text-xs font-bold text-slate-700 leading-snug">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="flex flex-col items-center justify-center animate-scale-up">
          <div className="w-24 h-24 bg-pink-50 border border-pink-200 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-5xl">❤️</span>
          </div>
          <p className="text-sm font-bold text-pink-600 mt-4">오늘도 성장을 향해 나아갑니다!</p>
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
