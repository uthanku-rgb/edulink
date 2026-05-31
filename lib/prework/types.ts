/**
 * EduLink LMS 프리워크 타입 정의
 */

export type Domain = 'F' | 'M' | 'S' | 'X' | 'P' | 'L' | 'N' | 'T';

export interface AttemptResult {
  slotIndex: number;            // 0..4
  stimulusId: string;
  domain: Domain;               // primary
  secondaryDomains: Domain[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  isCorrect: boolean | null;    // MetaReflection은 null
  engagement?: number;          // MetaReflection 전용, 0..1
  responseTimeMs: number;
  presentedAt: string;          // ISO
}

export interface SessionRecord {
  sessionId: string;
  studentId: string;
  date: string;                 // YYYY-MM-DD
  gradeTrack: 'low' | 'high';   // 기본 'low'
  startedAt: string;
  endedAt: string;
  attempts: AttemptResult[];    // 길이 5
  completionStatus: 'completed' | 'abandoned';
  formulaVersion: string;       // 예: 'v0.1'
}

export interface PreworkModuleProps {
  stimulus: unknown;            // 어댑터가 모듈별 형식으로 변환
  difficulty: 1 | 2 | 3 | 4 | 5;
  onComplete: (r: Omit<AttemptResult, 'slotIndex' | 'presentedAt'>) => void;
}
