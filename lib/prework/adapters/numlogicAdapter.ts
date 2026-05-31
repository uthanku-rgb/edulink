/**
 * NumLogic(수 또는 말) 모듈용 자극 어댑터.
 *
 * C3 메타데이터 스키마를 따르는 NumLogicStimulus 객체를
 * 기존 NumberWordModule 컴포넌트가 기대하는 NumQ 형식으로 변환합니다.
 */

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

export interface NumLogicStimulus {
  id: string;
  domain: 'NumLogic';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  module_level: number;
  grade_track: 'low' | 'high';
  is_trap: boolean;
  rt_expected_ms: number;
  stimulus_format: 'select_one';
  skill_tags: string[];
  content_payload: {
    instruction: string;
    type_emoji: string;
    options: string[];
    correct_index: number;
    hint?: string;
  };
}

export interface NumLogicBank {
  module_id: string;
  module_name: string;
  primary_domain: 'NumLogic';
  grade_track: 'low' | 'high';
  version: string;
  stimuli: NumLogicStimulus[];
}

// 기존 컴포넌트가 기대하는 형식
export interface NumQ {
  type: string;      // 이모지 타입: 🔢, ➕, 📝, etc.
  question: string;
  hint?: string;
  options: string[];
  ans: number;       // correct option index
}

// ─────────────────────────────────────────────────────────────
// 어댑터
// ─────────────────────────────────────────────────────────────

export function stimulusToNumQ(s: NumLogicStimulus): NumQ {
  return {
    type: s.content_payload.type_emoji,
    question: s.content_payload.instruction,
    hint: s.content_payload.hint,
    options: s.content_payload.options,
    ans: s.content_payload.correct_index,
  };
}

// ─────────────────────────────────────────────────────────────
// 출제 헬퍼
// ─────────────────────────────────────────────────────────────

export function pickNumLogicStimulus(
  bank: NumLogicBank,
  studentLevel: number,
  seed?: number
): NumLogicStimulus {
  const candidates = bank.stimuli.filter(s => s.module_level === studentLevel);

  if (candidates.length === 0) {
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
 * 여러 레벨에서 문제를 순서대로 뽑아 세션을 구성합니다.
 * 각 레벨에서 questionsPerLevel개씩 순서대로 반환.
 */
export function buildNumLogicSession(
  bank: NumLogicBank,
  startLevel: number,
  endLevel: number,
  questionsPerLevel: number = 1,
  seed?: number
): NumLogicStimulus[] {
  const session: NumLogicStimulus[] = [];
  for (let lvl = startLevel; lvl <= endLevel; lvl++) {
    const candidates = bank.stimuli.filter(s => s.module_level === lvl);
    if (candidates.length === 0) continue;

    const startIdx = seed !== undefined ? seed % candidates.length : 0;
    for (let i = 0; i < questionsPerLevel; i++) {
      session.push(candidates[(startIdx + i) % candidates.length]);
    }
  }
  return session;
}
