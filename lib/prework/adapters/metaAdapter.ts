/**
 * Meta(메타인지) 모듈용 자극 어댑터.
 *
 * C3 메타데이터 스키마를 따르는 MetaStimulus 객체를
 * 기존 MetaReflectionModule 컴포넌트가 기대하는 MetaQ 형식으로 변환합니다.
 */

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

export interface MetaOption {
  id: string;
  emoji: string;
  label: string;
}

export interface MetaStimulus {
  id: string;
  domain: 'Meta';
  difficulty_level: number;
  module_level: number;       // step (1=자기평가, 2=전략선택, 3=다짐)
  grade_track: 'low' | 'high';
  is_trap: boolean;
  rt_expected_ms: number;
  stimulus_format: 'select_image';
  skill_tags: string[];
  content_payload: {
    instruction: string;
    options: MetaOption[];
  };
  answer_payload: {
    type: 'self_report';
    scoring: 'log_only';
  };
}

export interface MetaBank {
  module_id: string;
  module_name: string;
  primary_domain: 'Meta';
  grade_track: 'low' | 'high';
  version: string;
  stimuli: MetaStimulus[];
}

// 기존 컴포넌트가 기대하는 형식
export interface MetaQ {
  question: string;
  options: { emoji: string; label: string }[];
}

// ─────────────────────────────────────────────────────────────
// 어댑터
// ─────────────────────────────────────────────────────────────

export function stimulusToMetaQ(s: MetaStimulus): MetaQ {
  return {
    question: s.content_payload.instruction,
    options: s.content_payload.options.map(o => ({
      emoji: o.emoji,
      label: o.label,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// 출제 헬퍼
// ─────────────────────────────────────────────────────────────

/**
 * 메타인지 세션을 구성합니다.
 * Step 1 (자기평가), Step 2 (전략선택), Step 3 (다짐) 각각에서
 * 1개씩 랜덤 선택하여 3문항의 세션을 반환합니다.
 *
 * @param bank 메타인지 뱅크 (meta.low.json 로드 결과)
 * @param seed 결정적 선택용 시드 (보통 학생ID + 날짜)
 */
export function buildMetaSession(
  bank: MetaBank,
  seed?: number
): MetaStimulus[] {
  const session: MetaStimulus[] = [];

  for (let step = 1; step <= 3; step++) {
    const candidates = bank.stimuli.filter(s => s.module_level === step);
    if (candidates.length === 0) continue;

    const idx = seed !== undefined
      ? (seed + step) % candidates.length
      : Math.floor(Math.random() * candidates.length);
    session.push(candidates[idx]);
  }

  return session;
}

/**
 * 전체 메타인지 자극(전 step)에서 원하는 수만큼 뽑습니다.
 */
export function pickMetaStimuli(
  bank: MetaBank,
  count: number,
  seed?: number
): MetaStimulus[] {
  if (bank.stimuli.length === 0) return [];

  const startIdx = seed !== undefined ? seed % bank.stimuli.length : 0;
  const result: MetaStimulus[] = [];
  for (let i = 0; i < count; i++) {
    result.push(bank.stimuli[(startIdx + i) % bank.stimuli.length]);
  }
  return result;
}
