// 에듀링크 리포트 엔진 — 데이터 스펙 v0.1
// 핵심: "주간리포트 하나"가 아니라 리포트 "타입"을 여러 개 굴린다.
// 학습 주간 = core.weekly, 프리워크 = prework.monthly.pwi.
// 같은 발송 엔진 + 같은 검수 큐 위에 타입만 추가된다.

// ─────────────────────────────────────────────
// 1. 프로그램 / 등록 플래그  — 데스크 토글의 데이터 주인
// ─────────────────────────────────────────────
// "이 학생이 무엇을 받느냐"를 켜고 끄는 자리. 학습은 기본 포함,
// 프리워크는 추가과금. 데스크 콘솔의 ON/OFF가 active를 바꾼다.

export type ProgramId = "core" | "prework";

export interface Enrollment {
  studentId: string;
  programId: ProgramId;
  active: boolean;                      // 데스크 토글 ON/OFF
  billing: "included" | "addon";        // core=included, prework=addon
  startedAt: string;                    // ISO date
  endedAt: string | null;
}

// 한 학생이 받는 리포트 = active한 프로그램에 묶인 리포트 타입 전부.
// 토글을 켜는 순간 ① 과금 시작 ② 학생 화면 활성 ③ 리포트 수신 대상 자동 편입.

// ─────────────────────────────────────────────
// 2. 리포트 타입 레지스트리  — 새 리포트는 여기 한 줄 추가로 끝
// ─────────────────────────────────────────────
export type Cadence = "weekly" | "monthly";
export type Channel = "kakao" | "print";
export type ReviewMode = "full" | "exception"; // 학습=전수 코멘트, PWI=예외만

export interface ReportType {
  id: string;                  // "core.weekly" | "prework.monthly.pwi"
  name: string;
  programId: ProgramId;        // 수신 대상 = 이 프로그램 active 학생
  cadence: Cadence;
  channel: Channel;
  reviewMode: ReviewMode;
  sendDayOfWeek: number;       // 0=일 … 6=토. 타입끼리 엇갈리게 둔다.
  templateId: string;          // 발송 엔진은 템플릿 무관 — 참조만 한다.
}

export const REPORT_TYPES: ReportType[] = [
  {
    id: "core.weekly",
    name: "학습 주간 리포트",
    programId: "core",
    cadence: "weekly",
    channel: "kakao",
    reviewMode: "full",        // 코치가 한 명씩 한 줄 코멘트 후 승인
    sendDayOfWeek: 5,          // 금요일
    templateId: "tpl_core_weekly",
  },
  {
    id: "prework.monthly.pwi",
    name: "프리워크 PWI 월간 리포트",
    programId: "prework",
    cadence: "monthly",
    channel: "kakao",
    reviewMode: "exception",   // 예외 큐만 코치 확인, 나머지 자동
    sendDayOfWeek: 1,          // 월요일 — core.weekly와 엇갈림
    templateId: "tpl_prework_pwi",
  },
];
// 프리워크를 "붙인다" = 사실상 위 배열에 객체 하나 추가하는 일.

// ─────────────────────────────────────────────
// 3. 리포트 인스턴스  — 생성 → 검수 → 발송
// ─────────────────────────────────────────────
export type ReviewStatus =
  | "auto_ready"     // 플래그 없음 → 발송 대기 (exception 모드는 자동 통과)
  | "hold"           // 데이터 불량 → 발송 차단, 코치 처리 필요
  | "needs_review"   // 코치 확인 필요 (full 모드는 항상 여기서 시작)
  | "approved"       // 코치 승인 완료
  | "sent";

export interface ReportInstance {
  id: string;
  reportTypeId: string;
  studentId: string;
  periodStart: string;
  periodEnd: string;
  status: ReviewStatus;
  flags: ReviewFlag[];               // 비어 있으면 데이터 정상
  coachComment: string | null;       // full 모드에서만 사용
  generatedAt: string;
  sentAt: string | null;
}

// ─────────────────────────────────────────────
// 4. 검수 게이트  — PWI 예외 큐 규칙
// ─────────────────────────────────────────────
export type FlagKind =
  | "insufficient_sessions"   // 유효 세션 부족        → hold
  | "invalid_responses"       // 무효 응답(버튼 연타)  → hold
  | "sharp_change"            // 직전월 대비 급변동     → review
  | "low_condition"           // 컨디션 교란           → review
  | "no_baseline";            // 첫 달, 추세선 없음     → review

export type FlagAction = "hold" | "review";

export interface ReviewFlag {
  kind: FlagKind;
  action: FlagAction;
  detail: string;
}

// 임계값 — 운영하며 튜닝하는 유일한 손잡이.
export const PWI_GATE = {
  minValidSessions: 8,        // 월 유효 세션 8회 미만이면 표본 부족
  invalidResponseFloorMs: 400, // 이보다 빠른 응답 비율이 높으면 세션 무효
  invalidRatioMax: 0.3,       // 한 세션 무효 응답 30% 넘으면 그 세션 폐기
  sharpChangePct: 15,         // 직전월 대비 ±15% 이상 변동
  lowConditionMax: 2,         // 월 평균 컨디션 2/5 이하 (에듀링크 일일 입력)
};

export interface PwiPeriodMetrics {
  validSessions: number;
  pwiThisMonth: number;
  pwiLastMonth: number | null;   // null = 첫 달
  avgCondition: number;          // 1~5
}

export function evaluateGate(m: PwiPeriodMetrics): ReviewFlag[] {
  const flags: ReviewFlag[] = [];

  if (m.validSessions < PWI_GATE.minValidSessions) {
    flags.push({
      kind: "insufficient_sessions",
      action: "hold",
      detail: `유효 세션 ${m.validSessions}회 (기준 ${PWI_GATE.minValidSessions}회)`,
    });
  }

  if (m.pwiLastMonth === null) {
    flags.push({
      kind: "no_baseline",
      action: "review",
      detail: "첫 달 — 추세선 없음, 기대치 세팅 필요",
    });
  } else {
    const pct = Math.abs((m.pwiThisMonth - m.pwiLastMonth) / m.pwiLastMonth) * 100;
    if (pct >= PWI_GATE.sharpChangePct) {
      flags.push({
        kind: "sharp_change",
        action: "review",
        detail: `직전월 대비 ${Math.round(pct)}% 변동`,
      });
    }
  }

  if (m.avgCondition <= PWI_GATE.lowConditionMax) {
    flags.push({
      kind: "low_condition",
      action: "review",
      detail: `월 평균 컨디션 ${m.avgCondition.toFixed(1)}/5`,
    });
  }

  return flags;
}

// 플래그 + 검수 모드 → 초기 상태 결정
export function resolveStatus(flags: ReviewFlag[], mode: ReviewMode): ReviewStatus {
  if (flags.some((f) => f.action === "hold")) return "hold";
  if (mode === "full") return "needs_review";           // 학습: 항상 코치 거침
  if (flags.some((f) => f.action === "review")) return "needs_review";
  return "auto_ready";                                  // PWI: 깨끗하면 자동
}

// ─────────────────────────────────────────────
// 5. 발송 엔진  — 템플릿 무관, 채널만 안다
// ─────────────────────────────────────────────
// "템플릿 4종 하드코딩"이 아니라 templateId를 받아서 굴린다.
// PWI 리포트가 추가돼도 이 함수는 손대지 않는다.

export interface SendResult {
  ok: boolean;
  sentAt: string | null;
  error?: string;
}

export async function dispatch(
  instance: ReportInstance,
  type: ReportType,
): Promise<SendResult> {
  if (instance.status !== "auto_ready" && instance.status !== "approved") {
    return { ok: false, sentAt: null, error: "검수 미통과" };
  }
  // 채널 어댑터로 위임 (kakao 알림톡 API / 인쇄 PDF).
  // templateId + 학생 데이터만 넘긴다 — 타입별 분기 없음.
  // return await channelAdapter[type.channel].send(type.templateId, instance);
  return { ok: true, sentAt: new Date().toISOString() };
}
