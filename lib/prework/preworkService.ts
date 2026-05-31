/**
 * EduLink LMS 프리워크 최소 서비스 정의 (타입 호환용)
 */

export interface StimulusResponse {
  stimulus_id: string;
  domain: string;
  module_level: number;
  difficulty_level: number;
  correct: boolean;
  rt_ms: number;
  rt_expected_ms: number;
  selected_answer?: string | string[];
  is_trap?: boolean;
  timestamp: number;
}
