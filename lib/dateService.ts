/**
 * 에듀링크 중앙 날짜 서비스
 *
 * NEXT_PUBLIC_DEMO_DATE 환경변수가 설정되면 해당 날짜를 "오늘"로 사용 (데모/시연 모드).
 * 미설정 시 시스템 실시간 날짜를 사용 (실사용 모드).
 *
 * 예) .env.local 에 NEXT_PUBLIC_DEMO_DATE=2026-05-27 설정 → 앱 전체가 5/27 기준 동작
 */

const WEEKDAY_KO_FULL = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** "오늘"에 해당하는 Date 객체를 반환한다. */
export function getToday(): Date {
  const demo = process.env.NEXT_PUBLIC_DEMO_DATE;
  if (demo) {
    const d = new Date(demo + 'T00:00:00');
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** "오늘"을 YYYY-MM-DD 형식 문자열로 반환한다. */
export function getTodayStr(): string {
  const d = getToday();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/** "오늘"의 한국어 요일을 반환한다. 토/일요일은 '금'으로 대체 (수업 기준). */
export function getWeekdayKo(): '월' | '화' | '수' | '목' | '금' {
  const d = getToday();
  const day = d.getDay();
  const map: Record<number, '월' | '화' | '수' | '목' | '금'> = {
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
  };
  return map[day] || '금';
}

/** Header 표시용 문자열을 반환한다. 예: "2026.05.27 (월)" */
export function getDisplayDateStr(): string {
  const todayStr = getTodayStr();
  const weekday = WEEKDAY_KO_FULL[getToday().getDay()];
  return `${todayStr.replace(/-/g, '.')} (${weekday})`;
}

/** 이번 주 월~일 범위를 반환한다 (리포트, 영어 주간 집계 등에 사용). */
export function getThisWeekRange(): { start: Date; end: Date } {
  const today = getToday();
  const day = today.getDay(); // 0=일, 1=월, ..., 6=토
  const diffToMon = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}
