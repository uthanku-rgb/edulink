import { supabase } from './supabaseClient';
import { Enrollment, ReportInstance, ReviewStatus, ReviewFlag, REPORT_TYPES, dispatch } from './report-engine-spec';

// Helper to map DB enrollment to TS enrollment
function mapDbEnrollment(row: any): Enrollment {
  return {
    studentId: row.student_id,
    programId: row.program_id,
    active: row.active,
    billing: row.billing,
    startedAt: row.started_at,
    endedAt: row.ended_at
  };
}

// Helper to map TS enrollment to DB enrollment
function mapTsEnrollment(enrollment: Enrollment) {
  return {
    student_id: enrollment.studentId,
    program_id: enrollment.programId,
    active: enrollment.active,
    billing: enrollment.billing,
    started_at: enrollment.startedAt,
    ended_at: enrollment.endedAt
  };
}

// Helper to map DB report instance to TS report instance
function mapDbReportInstance(row: any): ReportInstance & { student?: { name: string; grade: string; school: string } } {
  return {
    id: row.id,
    reportTypeId: row.report_type_id,
    studentId: row.student_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status as ReviewStatus,
    flags: (row.flags || []) as ReviewFlag[],
    coachComment: row.coach_comment,
    generatedAt: row.generated_at,
    sentAt: row.sent_at,
    student: row.student ? {
      name: row.student.name,
      grade: row.student.grade,
      school: row.student.school
    } : undefined
  };
}

// Helper to map TS report instance to DB
function mapTsReportInstance(inst: ReportInstance) {
  return {
    id: inst.id,
    report_type_id: inst.reportTypeId,
    student_id: inst.studentId,
    period_start: inst.periodStart,
    period_end: inst.periodEnd,
    status: inst.status,
    flags: JSON.stringify(inst.flags),
    coach_comment: inst.coachComment,
    generated_at: inst.generatedAt,
    sent_at: inst.sentAt
  };
}

// 1. Enrollments Operations
export async function getEnrollments(): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*');
  
  if (error) {
    console.error('Failed to get enrollments from Supabase:', error);
    return [];
  }
  
  return (data || []).map(mapDbEnrollment);
}

export async function getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId);
  
  if (error) {
    console.error(`Failed to get enrollments for student ${studentId}:`, error);
    return [];
  }
  
  return (data || []).map(mapDbEnrollment);
}

export async function upsertEnrollment(enrollment: Enrollment): Promise<boolean> {
  const payload = mapTsEnrollment(enrollment);
  const { error } = await supabase
    .from('enrollments')
    .upsert(payload);
  
  if (error) {
    console.error('Failed to upsert enrollment:', error);
    return false;
  }
  return true;
}

export async function toggleProgramEnrollment(studentId: string, programId: 'core' | 'prework', active: boolean): Promise<boolean> {
  // Check if exists
  const { data, error: fetchError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId)
    .eq('program_id', programId)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to fetch enrollment status:', fetchError);
    return false;
  }

  const enrollment: Enrollment = data 
    ? mapDbEnrollment(data)
    : {
        studentId,
        programId,
        active,
        billing: programId === 'core' ? 'included' : 'addon',
        startedAt: new Date().toISOString(),
        endedAt: null
      };
  
  enrollment.active = active;
  if (!active) {
    enrollment.endedAt = new Date().toISOString();
  } else {
    enrollment.endedAt = null;
  }

  return await upsertEnrollment(enrollment);
}

// 2. Report Instances Operations
export async function getReportInstances(): Promise<(ReportInstance & { student?: { name: string; grade: string; school: string } })[]> {
  const { data, error } = await supabase
    .from('report_instances')
    .select('*, student:student_id(name, grade, school)')
    .order('generated_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get report instances:', error);
    return [];
  }
  
  return (data || []).map(mapDbReportInstance);
}

export async function insertReportInstances(instances: ReportInstance[]): Promise<boolean> {
  const payload = instances.map(mapTsReportInstance);
  const { error } = await supabase
    .from('report_instances')
    .insert(payload);
  
  if (error) {
    console.error('Failed to insert report instances:', error);
    return false;
  }
  return true;
}

export async function updateReportInstance(id: string, updates: Partial<ReportInstance>): Promise<boolean> {
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.coachComment !== undefined) dbUpdates.coach_comment = updates.coachComment;
  if (updates.flags !== undefined) dbUpdates.flags = JSON.stringify(updates.flags);
  if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;

  const { error } = await supabase
    .from('report_instances')
    .update(dbUpdates)
    .eq('id', id);
  
  if (error) {
    console.error(`Failed to update report instance ${id}:`, error);
    return false;
  }
  return true;
}

// 3. Dispatch and Send Operations
export async function dispatchReportInstance(instanceId: string): Promise<{ ok: boolean; error?: string }> {
  // Get report instance
  const { data, error } = await supabase
    .from('report_instances')
    .select('*')
    .eq('id', instanceId)
    .single();
  
  if (error || !data) {
    console.error(`Failed to fetch report instance ${instanceId} for dispatch:`, error);
    return { ok: false, error: '인스턴스를 찾을 수 없습니다.' };
  }

  const instance = mapDbReportInstance(data);
  const reportType = REPORT_TYPES.find(t => t.id === instance.reportTypeId);
  
  if (!reportType) {
    return { ok: false, error: `리포트 타입 '${instance.reportTypeId}'을(를) 찾을 수 없습니다.` };
  }

  // Call the core spec dispatch
  const result = await dispatch(instance, reportType);
  
  if (result.ok && result.sentAt) {
    // Update status in DB to 'sent'
    const success = await updateReportInstance(instanceId, {
      status: 'sent',
      sentAt: result.sentAt
    });
    if (!success) {
      return { ok: false, error: '발송 상태 데이터베이스 업데이트 실패' };
    }
  } else {
    return { ok: false, error: result.error || '발송 실패' };
  }

  return { ok: true };
}

// 4. Auto-seeding helper
export async function seedEnrollmentsIfEmpty() {
  try {
    const { count, error: countErr } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });
    
    if (countErr) throw countErr;
    
    if (count === 0) {
      console.log('Seeding default core enrollments for existing students...');
      // Get all students
      const { data: students, error: studErr } = await supabase
        .from('students')
        .select('id');
      
      if (studErr) throw studErr;
      
      if (students && students.length > 0) {
        const enrollsToInsert: Enrollment[] = students.flatMap(student => [
          {
            studentId: student.id,
            programId: 'core' as const,
            active: true,
            billing: 'included' as const,
            startedAt: new Date().toISOString(),
            endedAt: null
          },
          {
            studentId: student.id,
            programId: 'prework' as const,
            active: student.id === 'stu_01' || student.id === 'stu_02' || student.id === 'stu_03', // Seed a few active preworks
            billing: 'addon' as const,
            startedAt: new Date().toISOString(),
            endedAt: null
          }
        ]);
        
        const payload = enrollsToInsert.map(mapTsEnrollment);
        const { error: insertErr } = await supabase
          .from('enrollments')
          .insert(payload);
        
        if (insertErr) throw insertErr;
        console.log('Seeded enrollments successfully!');
      }
    }
  } catch (err) {
    console.error('Error seeding enrollments:', err);
  }
}
