'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  Printer, 
  Sparkles,
  FileText,
  ArrowLeft
} from 'lucide-react';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import { getStudents, getDailyRecords, getExams, getCycles, getMasteryChecks, getGaps } from '../../lib/storage';
import { Student } from '../../types';

export default function ReportsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportType, setReportType] = useState<'weekly' | 'season'>('weekly');
  
  // 생성된 데이터 결과물
  const [generated, setGenerated] = useState(false);
  const [totalStudyMin, setTotalStudyMin] = useState(0);
  const [completedPlanRate, setCompletedPlanRate] = useState(0);
  const [avgCondition, setAvgCondition] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState({ total: 0, present: 0, absent: 0 });
  const [latestReviewStage, setLatestReviewStage] = useState(1);
  const [dDayStr, setDDayStr] = useState('');
  const [masteryStats, setMasteryStats] = useState({
    blankTestCount: 0,
    avgRecallRate: 0,
    peerExplainCount: 0,
    closedGapsCount: 0,
    openGapsCount: 0,
    summary: ''
  });
  
  // 편집 입력란
  const [managerComment, setManagerComment] = useState('');
  const [nextWeekGoal, setNextWeekGoal] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const loadedStudents = await getStudents();
        setStudents(loadedStudents);
        if (loadedStudents.length > 0) {
          setSelectedStudentId(loadedStudents[0].id);
        }
      } catch (err) {
        console.error('Failed to load students in Reports:', err);
      }
    };
    loadStudents();
  }, []);

  // 리포트 생성 연산 핸들러
  const handleGenerateReport = async () => {
    if (!selectedStudentId) return;

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const allRecords = await getDailyRecords();
    const studentRecords = allRecords.filter(r => r.studentId === selectedStudentId);
    
    // 최근 7일 필터링 (주간 리포트 기준 - 동적 baseDate 설정)
    let baseDate = new Date('2026-05-27');
    if (studentRecords.length > 0) {
      const sortedRecords = [...studentRecords].sort((a, b) => b.date.localeCompare(a.date));
      const latestDateStr = sortedRecords[0].date;
      const parsedDate = new Date(latestDateStr);
      if (!isNaN(parsedDate.getTime())) {
        baseDate = parsedDate;
      }
    }

    const recentDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const weeklyRecords = studentRecords.filter(r => recentDates.includes(r.date));

    // 통계 연산
    const totalMinutes = weeklyRecords.reduce((acc, cur) => acc + cur.studyMinutes, 0);
    const presentRecords = weeklyRecords.filter(r => r.attendance !== '결석');
    const planCompletedRecords = presentRecords.filter(r => r.completedPlan);
    const planRate = presentRecords.length > 0 
      ? Math.round((planCompletedRecords.length / presentRecords.length) * 100)
      : 100;
    
    const totalCond = presentRecords.reduce((acc, cur) => acc + cur.condition, 0);
    const avgCond = presentRecords.length > 0 
      ? Math.round((totalCond / presentRecords.length) * 10) / 10
      : 3;
    
    const totalCount = weeklyRecords.length;
    const absentCount = weeklyRecords.filter(r => r.attendance === '결석').length;
    const presentCount = totalCount - absentCount;

    // 회독 단계
    const sorted = [...studentRecords].sort((a, b) => b.date.localeCompare(a.date));
    const latestStage = sorted[0] ? sorted[0].reviewStage : 1;

    // D-Day 정보 로드
    const exams = await getExams();
    const cycles = await getCycles();
    const exam = exams.find(e => e.studentId === selectedStudentId);
    const cycle = cycles.find(c => c.studentId === selectedStudentId);
    let dDayString = '';
    if (exam) {
      const examDate = new Date(exam.examDate);
      const diff = Math.ceil((examDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
      dDayString = cycle?.phase === 'Autopsy' ? `Autopsy (시험후 T+${Math.abs(diff)}일)` : `${cycle?.phase || 'Build'} 단계 (시험대비 D-${diff}일)`;
    }

    // 완전학습 (Mastery Learning) 통계 계산
    const studentChecks = getMasteryChecks().filter(c => c.studentId === selectedStudentId);
    const weeklyChecks = studentChecks.filter(c => recentDates.includes(c.date));
    const blankTestCount = weeklyChecks.length;
    const avgRecallRate = blankTestCount > 0
      ? Math.round(weeklyChecks.reduce((acc, cur) => acc + cur.retrievalScore, 0) / blankTestCount)
      : 0;
    const peerExplainCount = weeklyChecks.filter(c => c.method === 'peer_explain').length;

    const studentGaps = getGaps().filter(g => g.studentId === selectedStudentId);
    const closedGapsCount = studentGaps.filter(
      g => g.status === 'closed' && g.closedDate && recentDates.includes(g.closedDate)
    ).length;
    const openGapsCount = studentGaps.filter(g => g.status === 'open').length;

    let totalPoints = 0;
    let totalRecalled = 0;
    weeklyChecks.forEach(c => {
      totalPoints += c.results.length;
      totalRecalled += c.results.filter(r => r.recalled).length;
    });

    const masterySummary = `이번 주 핵심 개념 ${totalPoints}개 중 ${totalRecalled}개를 완전히 체득했고, 남은 ${openGapsCount}개는 다음 주에 다시 점검합니다.`;

    setTotalStudyMin(totalMinutes);
    setCompletedPlanRate(planRate);
    setAvgCondition(avgCond);
    setAttendanceCount({ total: totalCount, present: presentCount, absent: absentCount });
    setLatestReviewStage(latestStage);
    setDDayStr(dDayString);
    setMasteryStats({
      blankTestCount,
      avgRecallRate,
      peerExplainCount,
      closedGapsCount,
      openGapsCount,
      summary: masterySummary
    });

    // 자동 추천 목표 작성
    setNextWeekGoal(`${student.name} 학생의 다음 주 목표:\n1. 시험 과목별 2회독 문제 풀이 전원 완료\n2. 취약한 오답 노트 분석 100% 정리\n3. 학습 계획 완수율 90% 이상 유지`);
    setManagerComment(`${student.name} 학생은 이번 주 총 ${Math.round(totalMinutes/60)}시간의 자기주도 학습을 성실하게 수행했습니다. 피로도가 다소 누적되어 컨디션 관리에 주의가 필요하나, 계획 완수도가 높고 전반적으로 몰입도가 아주 우수합니다.`);
    
    setGenerated(true);
  };

  // 복사할 텍스트 템플릿 구성 (학부모 카카오톡 공유용)
  const getShareText = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return '';

    return `[정연학원 - 에듀링크 주간 리포트]

■ 학생명: ${student.name} (${student.grade} / ${student.school})
■ 분석 단계: ${dDayStr}

1. 이번 주 출결 및 학습 요약
 - 등원일수: ${attendanceCount.present}일 출석 (결석 ${attendanceCount.absent}일)
 - 누적 학습 시간: 총 ${totalStudyMin}분 (약 ${Math.round(totalStudyMin / 60)}시간)
 - 학습 계획 완수율: ${completedPlanRate}%
 - 평균 집중도/컨디션: ${avgCondition} / 5점

2. 현재 회독 수준: ${latestReviewStage}회독 진행 중

3. 이번 주 완전학습 (Mastery Learning)
 - 백지 테스트: ${masteryStats.blankTestCount}회 실시 (평균 인출률 ${masteryStats.avgRecallRate}%)
 - 또래설명 완료: ${masteryStats.peerExplainCount}회
 - 이번 주 메운 구멍(결손): ${masteryStats.closedGapsCount}개
 - 남은 구멍(재테스트 예정): ${masteryStats.openGapsCount}개
 - 완전학습 요약: ${masteryStats.summary}

4. 매니저 주간 코멘트
${managerComment}

5. 다음 주 주요 학습 방향
${nextWeekGoal}

※ 에듀링크 시스템을 통해 관리자가 매일 면밀히 점검하고 있습니다. 문의사항은 학원으로 연락 주세요.`;
  };

  // 클립보드 복사 기능
  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText());
    alert('리포트 내용이 클립보드에 복사되었습니다! 카카오톡 대화방에 붙여넣어 전송하세요.');
  };

  // 인쇄 기능
  const handlePrint = () => {
    window.print();
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header title="학부모 리포트" />
      <SectionNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 mt-4">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-normal mb-4 no-print"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          대시보드로 돌아가기
        </button>

        {/* 리포트 설정부 */}
        <div className="bg-white border border-[#E5E1DA] rounded-xl p-4 mb-4 no-print">
          <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm mb-3 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>학습 리포트 생성 설정</span>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3 text-xs font-normal">
            <div className="flex flex-col gap-1 w-full sm:w-48">
              <label className="text-slate-500">학생 선택</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setGenerated(false);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-36">
              <label className="text-slate-500">분석 기간</label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as 'weekly' | 'season');
                  setGenerated(false);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
              >
                <option value="weekly">최근 7일 (주간)</option>
                <option value="season">시즌 누적 (종합)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={!selectedStudentId}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>학습 리포트 자동 생성</span>
            </button>
          </div>
        </div>

        {/* 결과물 출력부 */}
        {generated && selectedStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 좌측: 리포트 정보 및 입력 편집란 */}
            <div className="lg:col-span-1 flex flex-col gap-4 no-print">
              <div className="bg-white border border-[#E5E1DA] rounded-xl p-4">
                <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">리포트 편집 및 코멘트</span>
                
                <div className="flex flex-col gap-3 text-xs font-normal">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">학부모 코멘트 (매니저 피드백)</label>
                    <textarea
                      value={managerComment}
                      onChange={(e) => setManagerComment(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] h-32 resize-none leading-relaxed"
                      placeholder="학부모에게 발송할 매니저 평가 작성"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">다음 주 방향 및 목표 설정</label>
                    <textarea
                      value={nextWeekGoal}
                      onChange={(e) => setNextWeekGoal(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] h-28 resize-none leading-relaxed"
                      placeholder="다음 주 계획 및 취약 극복 가이드 라인"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 리포트 미리보기 뷰 (프린트 및 복사용) */}
            <div className="lg:col-span-2 flex flex-col gap-3 print-area">
              {/* 제어 바 */}
              <div className="flex items-center justify-between no-print bg-slate-100 border border-slate-200 rounded-lg p-2.5">
                <span className="text-[10px] text-slate-500">아래 리포트 내용을 전송하거나 인쇄할 수 있습니다.</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-250 text-slate-650 hover:bg-slate-50 rounded"
                  >
                    <Copy className="w-3 h-3" />
                    <span>카톡용 텍스트 복사</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-white hover:bg-slate-700 rounded"
                  >
                    <Printer className="w-3 h-3" />
                    <span>인쇄하기</span>
                  </button>
                </div>
              </div>

              {/* 리포트 카드 레이아웃 */}
              <div className="bg-white border border-[#E5E1DA] rounded-xl p-6 flex flex-col gap-6 text-slate-800 text-xs font-normal">
                {/* 상단 타이틀 */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="text-lg font-medium text-slate-900 tracking-wide">
                    정연학원 에듀링크 학습 분석 리포트
                  </h2>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    인증 코드: {selectedStudent.id.toUpperCase()} · 리포트 종류: {reportType === 'weekly' ? '주간 학습 일지' : '시즌 종합 보고서'}
                  </span>
                </div>

                {/* 학생 요약 */}
                <div className="grid grid-cols-2 gap-4 bg-[#FAF9F6] border border-slate-200 rounded-lg p-3">
                  <div className="flex flex-col gap-1 border-r border-slate-200">
                    <span className="text-[10px] text-slate-400">학습 대상자</span>
                    <span className="text-sm font-medium text-slate-900">
                      {selectedStudent.name} ({selectedStudent.grade} / {selectedStudent.school})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pl-4">
                    <span className="text-[10px] text-slate-400">학습 현재 단계</span>
                    <span className="text-sm font-medium text-slate-800">{dDayStr}</span>
                  </div>
                </div>

                {/* 이번 주 통계 요약 */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-slate-900 border-l-2 border-slate-750 pl-2 mb-1">
                    1. 주간 학습 성취 지표 (최근 7일 기준)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-450 block">누적 학습 시간</span>
                      <span className="text-base font-medium text-slate-900 mt-1 block">{totalStudyMin}분</span>
                      <span className="text-[9px] text-slate-400 block scale-90">약 {Math.round(totalStudyMin / 60)}시간</span>
                    </div>
                    <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-450 block">등원 출석일수</span>
                      <span className="text-base font-medium text-slate-900 mt-1 block">{attendanceCount.present}일</span>
                      <span className="text-[9px] text-slate-400 block scale-90">총 {attendanceCount.total}일 중</span>
                    </div>
                    <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-450 block">계획 완수율</span>
                      <span className="text-base font-medium text-slate-900 mt-1 block">{completedPlanRate}%</span>
                      <span className="text-[9px] text-slate-400 block scale-90">일일 플랜 대비</span>
                    </div>
                    <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-450 block">집중 집중도</span>
                      <span className="text-base font-medium text-slate-900 mt-1 block">{avgCondition} / 5</span>
                      <span className="text-[9px] text-slate-400 block scale-90">5점 만점 기준</span>
                    </div>
                  </div>
                </div>

                {/* 현재 회독 */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-slate-900 border-l-2 border-slate-750 pl-2 mb-1">
                    2. 현재 학습 회독 단계
                  </h3>
                  <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">대비 핵심 교과 수준</span>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white ${
                        latestReviewStage === 1 ? 'bg-amber-500' :
                        latestReviewStage === 2 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}>
                        {latestReviewStage}회독 진행 중
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({latestReviewStage === 1 ? '개념 정독 및 핵심 공식 암기' : 
                          latestReviewStage === 2 ? '응용 문제집 풀이 및 유형 학습' : 
                          '오답 정리 및 최종 수능/기출 단권화'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 이번 주 완전학습 */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-slate-900 border-l-2 border-slate-750 pl-2 mb-1">
                    3. 이번 주 완전학습 (Mastery Learning)
                  </h3>
                  <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="bg-white border border-slate-150 rounded p-2">
                        <span className="text-[10px] text-slate-400 block">백지테스트 횟수</span>
                        <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{masteryStats.blankTestCount}회</span>
                      </div>
                      <div className="bg-white border border-slate-150 rounded p-2">
                        <span className="text-[10px] text-slate-400 block">평균 인출률</span>
                        <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{masteryStats.avgRecallRate}%</span>
                      </div>
                      <div className="bg-white border border-slate-150 rounded p-2">
                        <span className="text-[10px] text-slate-400 block">또래설명 횟수</span>
                        <span className="text-xs font-semibold text-slate-800 mt-0.5 block">{masteryStats.peerExplainCount}회</span>
                      </div>
                      <div className="bg-white border border-slate-150 rounded p-2">
                        <span className="text-[10px] text-slate-400 block">메운 / 남은 구멍</span>
                        <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
                          <span className="text-[#2C9C8F]">{masteryStats.closedGapsCount}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className={masteryStats.openGapsCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                            {masteryStats.openGapsCount}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-150 rounded p-2.5 text-slate-700 leading-relaxed">
                      <span className="text-[10px] text-slate-400 block mb-0.5">완전학습 요약 리포트</span>
                      <p className="text-xs font-medium text-slate-800">{masteryStats.summary}</p>
                    </div>
                  </div>
                </div>

                {/* 코멘트 */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-slate-900 border-l-2 border-slate-750 pl-2 mb-1">
                    4. 매니저 관찰 종합 의견
                  </h3>
                  <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 min-h-[80px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {managerComment}
                  </div>
                </div>

                {/* 다음 주 주요 지침 */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-slate-900 border-l-2 border-slate-750 pl-2 mb-1">
                    5. 다음 주 집중 극복 처방
                  </h3>
                  <div className="bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 min-h-[80px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {nextWeekGoal}
                  </div>
                </div>

                {/* 하단 푸터 */}
                <div className="text-center text-[10px] text-slate-450 border-t border-slate-100 pt-4 mt-2">
                  정연학원 관독학원운영시스템 · 에듀링크 v1 콘솔
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
