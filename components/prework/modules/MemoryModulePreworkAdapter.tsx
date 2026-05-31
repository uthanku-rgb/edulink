import React, { useState } from 'react';
import { MemoryModule } from './MemoryModule';
import type { MemoryStimulus } from '@/lib/prework/adapters/memoryAdapter';
import type { PreworkModuleProps } from '@/lib/prework/types';

export function MemoryModulePreworkAdapter({ stimulus, difficulty, onComplete }: PreworkModuleProps) {
  const [isPlaying] = useState(true);
  const memStimulus = stimulus as MemoryStimulus;
  
  // To ensure onComplete is called only once per slot session
  const [completed, setCompleted] = useState(false);

  const handleResponseLog = (response: any) => {
    if (completed) return;
    setCompleted(true);
    // Wait for the memory module's 1.5s toast animation to finish before proceeding to the next slot
    setTimeout(() => {
      onComplete({
        stimulusId: memStimulus.id,
        domain: 'M',
        secondaryDomains: ['P'],
        difficulty: difficulty,
        isCorrect: response.correct,
        responseTimeMs: response.rt_ms,
      });
    }, 1500);
  };

  return (
    <MemoryModule
      isPlaying={isPlaying}
      onProgress={() => {}}
      onComplete={() => {}}
      onResponseLog={handleResponseLog}
      gradeTrack={memStimulus.grade_track}
      startLevel={memStimulus.module_level}
    />
  );
}
