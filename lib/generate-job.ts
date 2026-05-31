import { supabase } from './supabaseClient';
import { ReportInstance, evaluateGate, resolveStatus } from './report-engine-spec';
import { getEnrollments, insertReportInstances } from './reportDb';

/**
 * 모의 리포트 생성 잡 (주 1회 실행 배치 모사)
 * program_id='core'이고 active=true인 학생들의 core.weekly 리포트를 생성하고,
 * prework 프로그램이 active인 학생들의 prework.monthly.pwi 리포트도 같이 생성하여 
 * hold, needs_review, auto_ready 상태가 모두 재현되도록 합니다.
 */
export async function runReportGenerationJob(
  periodStart: string = '2026-05-24',
  periodEnd: string = '2026-05-30'
): Promise<{ success: boolean; count: number }> {
  try {
    // 1. 등록 현황 조회
    const enrollments = await getEnrollments();
    
    const activeCoreEnrollments = enrollments.filter(e => e.programId === 'core' && e.active);
    const activePreworkEnrollments = enrollments.filter(e => e.programId === 'prework' && e.active);

    const newInstances: ReportInstance[] = [];

    // 2. core.weekly 생성 (학습 주간 리포트 - reviewMode: "full")
    for (const enrollment of activeCoreEnrollments) {
      const studentId = enrollment.studentId;

      // 실제 Supabase daily_records 테이블에서 해당 기간의 기록 조회
      const { data: records, error: recordsErr } = await supabase
        .from('daily_records')
        .select('attendance, condition')
        .eq('student_id', studentId)
        .gte('date', periodStart)
        .lte('date', periodEnd);
      
      let validSessions = 0;
      let totalCondition = 0;
      let sessionsWithCondition = 0;

      if (!recordsErr && records) {
        records.forEach(r => {
          if (r.attendance !== '결석') {
            validSessions++;
            if (r.condition) {
              totalCondition += r.condition;
              sessionsWithCondition++;
            }
          }
        });
      }

      const avgCondition = sessionsWithCondition > 0 ? totalCondition / sessionsWithCondition : 3.0;

      // 다양한 게이트 규칙 재현을 위한 학생별 모의 세팅
      let finalValidSessions = validSessions;
      let finalAvgCondition = avgCondition;
      let mockPwiThis = 75;
      let mockPwiLast: number | null = 80;

      // 특정 학생 ID별로 hold, needs_review 상태가 골고루 생성되도록 분기
      if (studentId === 'stu_03') {
        // 유효 세션 부족 -> hold
        finalValidSessions = 5; 
      } else if (studentId === 'stu_04') {
        // 첫 달, 추세선 없음 -> review
        mockPwiLast = null; 
      } else if (studentId === 'stu_05') {
        // 평균 컨디션 저하 -> review
        finalAvgCondition = 1.8; 
      }

      // 게이트 검수
      const flags = evaluateGate({
        validSessions: finalValidSessions,
        pwiThisMonth: mockPwiThis,
        pwiLastMonth: mockPwiLast,
        avgCondition: finalAvgCondition
      });

      // core.weekly는 reviewMode: "full" 이므로 플래그가 없어도 needs_review, hold 플래그가 있다면 hold가 됩니다.
      const status = resolveStatus(flags, "full");

      newInstances.push({
        id: `rep_${studentId}_core_weekly_${periodStart.replace(/-/g, '')}`,
        reportTypeId: 'core.weekly',
        studentId,
        periodStart,
        periodEnd,
        status,
        flags,
        coachComment: null,
        generatedAt: new Date().toISOString(),
        sentAt: null
      });
    }

    // 3. prework.monthly.pwi 생성 (프리워크 리포트 - reviewMode: "exception")
    // PWI 지표가 없는 학생도 있으므로 데스크에서 토글이 켜진(active) 학생만 생성 처리
    for (const enrollment of activePreworkEnrollments) {
      const studentId = enrollment.studentId;

      let validSessions = 10;
      let pwiThisMonth = 80;
      let pwiLastMonth: number | null = 85;
      let avgCondition = 4.0;

      // exception 모드에서 hold, needs_review, auto_ready가 골고루 발생하도록 시뮬레이션
      if (studentId === 'stu_01') {
        // 깨끗함 -> auto_ready
        validSessions = 12;
        pwiThisMonth = 80;
        pwiLastMonth = 83;
        avgCondition = 4.2;
      } else if (studentId === 'stu_02') {
        // 직전월 대비 급변동 (+50%) -> needs_review
        validSessions = 10;
        pwiThisMonth = 120;
        pwiLastMonth = 80;
        avgCondition = 3.8;
      } else if (studentId === 'stu_03') {
        // 유효 세션 부족 -> hold
        validSessions = 4;
        pwiThisMonth = 70;
        pwiLastMonth = 72;
        avgCondition = 4.0;
      }

      const flags = evaluateGate({
        validSessions,
        pwiThisMonth,
        pwiLastMonth,
        avgCondition
      });

      // prework.monthly.pwi는 reviewMode: "exception" 이므로 깨끗하면 auto_ready, review 플래그 시 needs_review, hold 플래그 시 hold가 됩니다.
      const status = resolveStatus(flags, "exception");

      newInstances.push({
        id: `rep_${studentId}_prework_pwi_${periodStart.replace(/-/g, '')}`,
        reportTypeId: 'prework.monthly.pwi',
        studentId,
        periodStart,
        periodEnd,
        status,
        flags,
        coachComment: null,
        generatedAt: new Date().toISOString(),
        sentAt: null
      });
    }

    // 4. 기존 중복 인스턴스 삭제 및 신규 삽입
    if (newInstances.length > 0) {
      for (const inst of newInstances) {
        await supabase
          .from('report_instances')
          .delete()
          .eq('id', inst.id);
      }

      const success = await insertReportInstances(newInstances);
      return { success, count: newInstances.length };
    }

    return { success: true, count: 0 };
  } catch (err) {
    console.error('Failed to run report generation job:', err);
    return { success: false, count: 0 };
  }
}
