/**
 * Focus(RuleGame) 모듈용 자극 어댑터.
 *
 * C3 메타데이터 스키마를 따르는 FocusStimulus 객체를
 * 기존 RuleGameModule 컴포넌트가 기대하는 FocusLevel 형식으로 변환합니다.
 */

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

export interface FocusStimulus {
  id: string;
  domain: 'Focus';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  module_level: number;
  grade_track: 'low' | 'high';
  is_trap: boolean;
  rt_expected_ms: number;
  stimulus_format: 'click' | 'none_response';
  skill_tags: string[];
  content_payload: {
    instruction: string;
    signal: string;
    expected_action: 'press' | 'no_response';
    rule_change?: boolean;
  };
}

export interface FocusBank {
  module_id: string;
  module_name: string;
  primary_domain: 'Focus';
  grade_track: 'low' | 'high';
  version: string;
  stimuli: FocusStimulus[];
}

// 기존 컴포넌트가 기대하는 형식
export interface FocusRound {
  instruction: string;
  signal: string;               // 신호 종류: 'green', 'red', 'yellow', ...
  expectedAction: 'press' | 'no_response';
  isTrap: boolean;
  ruleChange?: boolean;
}

// ─────────────────────────────────────────────────────────────
// 어댑터
// ─────────────────────────────────────────────────────────────

export function stimulusToFocusRound(s: FocusStimulus): FocusRound {
  return {
    instruction: s.content_payload.instruction,
    signal: s.content_payload.signal,
    expectedAction: s.content_payload.expected_action,
    isTrap: s.is_trap,
    ruleChange: s.content_payload.rule_change,
  };
}

// ─────────────────────────────────────────────────────────────
// 출제 헬퍼
// ─────────────────────────────────────────────────────────────

export function pickFocusStimuli(
  bank: FocusBank,
  studentLevel: number,
  count: number,
  seed?: number
): FocusStimulus[] {
  const candidates = bank.stimuli.filter(s => s.module_level === studentLevel);
  if (candidates.length === 0) {
    // 폴백: 가장 높은 레벨
    const maxLevel = Math.max(...bank.stimuli.map(s => s.module_level));
    return bank.stimuli.filter(s => s.module_level === maxLevel).slice(0, count);
  }

  const startIdx = seed !== undefined ? seed % candidates.length : 0;
  const result: FocusStimulus[] = [];
  for (let i = 0; i < count; i++) {
    result.push(candidates[(startIdx + i) % candidates.length]);
  }
  return result;
}

/**
 * 한 세션에서 여러 레벨의 라운드를 순서대로 출제하는 헬퍼.
 * 레벨 1~maxLevel에서 각 roundsPerLevel개씩 뽑아서 순서대로 반환.
 */
export function buildFocusSession(
  bank: FocusBank,
  startLevel: number,
  endLevel: number,
  roundsPerLevel: number = 2,
  seed?: number
): FocusStimulus[] {
  const session: FocusStimulus[] = [];
  for (let lvl = startLevel; lvl <= endLevel; lvl++) {
    const rounds = pickFocusStimuli(bank, lvl, roundsPerLevel, seed);
    session.push(...rounds);
  }
  return session;
}
