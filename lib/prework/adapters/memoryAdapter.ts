/**
 * Memory 모듈용 자극 어댑터.
 *
 * C3 메타데이터 스키마를 따르는 Stimulus 객체를
 * 기존 MemoryModule 컴포넌트가 기대하는 MemoryLevel 형식으로 변환합니다.
 *
 * 페이지/모듈 컴포넌트는 수정하지 않고, 이 어댑터 한 층만으로 뱅크 연결 가능.
 */

// ─────────────────────────────────────────────────────────────
// 타입 정의 (C3 스키마 부분 발췌)
// ─────────────────────────────────────────────────────────────

export interface MemoryStimulus {
  id: string;
  domain: 'Memory';
  difficulty_level: 1 | 2 | 3 | 4 | 5;       // C3 표준 (PWI 계산용)
  module_level: number;                       // 1~8 모듈 내부 진행도
  grade_track: 'low' | 'high';
  is_trap: boolean;
  rt_expected_ms: number;
  stimulus_format: 'multi_select';
  skill_tags: string[];
  content_payload: {
    instruction: string;
    preview_items: string[];
    preview_duration_ms: number;
    options: string[];
  };
  answer_payload: {
    type: 'multi_select';
    correct: string[];
  };
}

export interface MemoryBank {
  module_id: 'memory_disappeared';
  module_name: string;
  primary_domain: 'Memory';
  grade_track: 'low' | 'high';
  version: string;
  stimuli: MemoryStimulus[];
}

// 기존 컴포넌트가 기대하는 형식 (MemoryModule.tsx 참조)
export interface MemoryLevel {
  instruction: string;
  previewItems: string[];
  previewDuration: number;
  removedItems: string[];
  options: string[];
}

// ─────────────────────────────────────────────────────────────
// 어댑터: Stimulus → 컴포넌트 props
// ─────────────────────────────────────────────────────────────

export function stimulusToMemoryLevel(s: MemoryStimulus): MemoryLevel {
  return {
    instruction: s.content_payload.instruction,
    previewItems: s.content_payload.preview_items,
    previewDuration: s.content_payload.preview_duration_ms,
    removedItems: s.answer_payload.correct,
    options: s.content_payload.options,
  };
}

// ─────────────────────────────────────────────────────────────
// 출제 헬퍼: 학생 레벨 + 시드로 자극 선택
// ─────────────────────────────────────────────────────────────

/**
 * 학생의 현재 module_level에서 자극 1개를 선택.
 * 같은 레벨에 여러 variant가 있으면 seed로 분기 (같은 학생이 같은 날 같은 슬롯에 같은 문제 반복 방지).
 *
 * @param bank 모듈 자극 뱅크 (memory.low.json 로드 결과)
 * @param studentLevel 학생의 현재 module_level (1~8)
 * @param seed 결정적 선택용 시드 (보통 학생ID + 날짜 + 슬롯). 없으면 랜덤.
 */
export function pickMemoryStimulus(
  bank: MemoryBank,
  studentLevel: number,
  seed?: number
): MemoryStimulus {
  // 학생 레벨에 맞는 자극들 필터
  const candidates = bank.stimuli.filter(s => s.module_level === studentLevel);

  if (candidates.length === 0) {
    // 폴백: 가장 높은 레벨로 (학생이 max를 넘어선 경우)
    const maxLevel = Math.max(...bank.stimuli.map(s => s.module_level));
    const fallback = bank.stimuli.filter(s => s.module_level === maxLevel);
    const idx = seed !== undefined
      ? seed % fallback.length
      : Math.floor(Math.random() * fallback.length);
    return fallback[idx];
  }

  const idx = seed !== undefined
    ? seed % candidates.length
    : Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

/**
 * 한 세션에서 같은 모듈을 N회 풀게 할 때, 같은 레벨에서 서로 다른 variant를 뽑는 헬퍼.
 * variant가 모자라면 순환.
 */
export function pickMemoryStimuliBatch(
  bank: MemoryBank,
  studentLevel: number,
  count: number,
  seed?: number
): MemoryStimulus[] {
  const candidates = bank.stimuli.filter(s => s.module_level === studentLevel);
  if (candidates.length === 0) return [];

  const startIdx = seed !== undefined ? seed % candidates.length : 0;
  const result: MemoryStimulus[] = [];
  for (let i = 0; i < count; i++) {
    result.push(candidates[(startIdx + i) % candidates.length]);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// 사용 예시 (참고용 — 실제 코드에는 포함 X)
// ─────────────────────────────────────────────────────────────
//
// import bank from '@/lib/prework/banks/memory.low.json';
// import { pickMemoryStimulus, stimulusToMemoryLevel } from '@/lib/prework/adapters/memoryAdapter';
//
// // 컴포넌트 마운트 시
// const studentLevel = await getStudentModuleLevel(studentId, 'memory_disappeared');
// const seed = hashSeed(studentId, todayDate, slotIndex);
// const stimulus = pickMemoryStimulus(bank as MemoryBank, studentLevel, seed);
// const level = stimulusToMemoryLevel(stimulus);
//
// // <MemoryModule levels={[level]} /> 같은 식으로 전달
//
// // 응답 기록 시
// recordResponse({
//   stimulus_id: stimulus.id,
//   correct: userAnswerEquals(stimulus.answer_payload.correct),
//   rt_ms: actualRT,
//   student_id: studentId,
// });
