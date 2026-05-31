/**
 * Speed 모듈용 자극 어댑터.
 *
 * C3 메타데이터 스키마를 따르는 Stimulus 객체를
 * 기존 SpeedTapModule 컴포넌트가 기대하는 SpeedLevel 형식으로 변환합니다.
 */

// ─────────────────────────────────────────────────────────────
// 타입 정의 (C3 스키마 부분 발췌)
// ─────────────────────────────────────────────────────────────

export interface SpeedTarget {
  shape: string;
  color: string;
  emoji: string;
}

export interface SpeedStimulus {
  id: string;
  domain: 'Speed';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  module_level: number;
  grade_track: 'low' | 'high';
  is_trap: boolean;
  rt_expected_ms: number;
  stimulus_format: 'tap_target';
  skill_tags: string[];
  content_payload: {
    instruction: string;
    targets: SpeedTarget[];
    distractors: SpeedTarget[];
  };
}

export interface SpeedLevelCurve {
  difficulty: number;
  duration_ms: number;
  spawn_rate_ms: number;
  lifespan_ms: number;
  category: string;
}

export interface SpeedBank {
  module_id: string;
  module_name: string;
  primary_domain: 'Speed';
  grade_track: 'low' | 'high';
  version: string;
  level_curve: Record<string, SpeedLevelCurve>;
  stimuli: SpeedStimulus[];
}

// 기존 컴포넌트가 기대하는 형식
export interface SpeedLevel {
  instruction: string;
  targets: string[];          // ShapeType 키: 예 "star_yellow"
  distractors: string[];      // ShapeType 키
  duration: number;            // ms
  spawnRate: number;           // ms
  lifespan: number;            // ms
}

// ─────────────────────────────────────────────────────────────
// 타겟/디스트랙터를 ShapeType 키로 변환
// ─────────────────────────────────────────────────────────────

function targetToShapeType(t: SpeedTarget): string {
  // 예: { shape: 'star', color: 'yellow' } → 'star_yellow'
  return `${t.shape}_${t.color}`;
}

// ─────────────────────────────────────────────────────────────
// 어댑터: Stimulus + LevelCurve → 컴포넌트 props
// ─────────────────────────────────────────────────────────────

export function stimulusToSpeedLevel(
  s: SpeedStimulus,
  curve: SpeedLevelCurve
): SpeedLevel {
  return {
    instruction: s.content_payload.instruction,
    targets: s.content_payload.targets.map(targetToShapeType),
    distractors: s.content_payload.distractors.map(targetToShapeType),
    duration: curve.duration_ms,
    spawnRate: curve.spawn_rate_ms,
    lifespan: curve.lifespan_ms,
  };
}

// ─────────────────────────────────────────────────────────────
// 출제 헬퍼
// ─────────────────────────────────────────────────────────────

export function pickSpeedStimulus(
  bank: SpeedBank,
  studentLevel: number,
  seed?: number
): SpeedStimulus {
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

export function pickSpeedStimuliBatch(
  bank: SpeedBank,
  studentLevel: number,
  count: number,
  seed?: number
): SpeedStimulus[] {
  const candidates = bank.stimuli.filter(s => s.module_level === studentLevel);
  if (candidates.length === 0) return [];

  const startIdx = seed !== undefined ? seed % candidates.length : 0;
  const result: SpeedStimulus[] = [];
  for (let i = 0; i < count; i++) {
    result.push(candidates[(startIdx + i) % candidates.length]);
  }
  return result;
}

/**
 * 학생의 현재 레벨에 맞는 level_curve를 가져옵니다.
 */
export function getLevelCurve(
  bank: SpeedBank,
  studentLevel: number
): SpeedLevelCurve {
  const key = `L${studentLevel}`;
  return bank.level_curve[key] || bank.level_curve['L1'];
}
