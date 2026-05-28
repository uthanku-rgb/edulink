'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Save } from 'lucide-react';
import Header from '../../../components/Header';
import SectionNav from '../../../components/SectionNav';
import { getStudents, getExams, getCycles, getD21Plans, getReviewTrackers, saveStudents, saveExams, saveCycles, saveD21Plans, saveReviewTrackers } from '../../../lib/storage';
import { Student, Exam, Cycle, D21Plan, ReviewTracker, Grade, ExamType, Phase } from '../../../types';

export default function NewStudentPage() {
  const router = useRouter();

  // 폼 필드 상태
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>('고1');
  const [school, setSchool] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [memo, setMemo] = useState('');
  const [examType, setExamType] = useState<ExamType>('기말');
  const [examDate, setExamDate] = useState('2026-06-17'); // 기본값 예시
  const [subjectsString, setSubjectsString] = useState('국어, 영어, 수학, 과학');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !school || !examDate) {
      alert('필수 정보를 입력해 주세요.');
      return;
    }

    const studentId = `stu_${Date.now()}`;
    const examId = `ex_${Date.now()}`;
    const cycleId = `cy_${Date.now()}`;
    const planId = `pl_${Date.now()}`;
    const trackerId = `rt_${Date.now()}`;

    // 1. Student 객체 생성
    const newStudent: Student = {
      id: studentId,
      name,
      grade,
      school,
      parentContact,
      enrolledAt: new Date().toISOString().split('T')[0],
      memo,
    };

    // 과목 분할
    const subjects = subjectsString.split(',').map(s => s.trim()).filter(Boolean);

    // 2. Exam 객체 생성
    const newExam: Exam = {
      id: examId,
      studentId,
      school,
      subjects,
      examDate,
      type: examType,
    };

    // D-Day 및 학습 단계(Phase) 계산 (기준일: 2026-05-27)
    const today = new Date('2026-05-27');
    const examD = new Date(examDate);
    const diffTime = examD.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let phase: Phase = 'Build';
    if (diffDays < 0 && diffDays >= -7) {
      phase = 'Autopsy';
    } else if (diffDays === 0) {
      phase = 'Battle';
    } else if (diffDays > 0 && diffDays <= 21) {
      phase = 'Race';
    } else {
      phase = 'Build';
    }

    // 3. Cycle 객체 생성
    const newCycle: Cycle = {
      id: cycleId,
      examId,
      studentId,
      phase,
      startDate: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: examDate,
    };

    // 4. D-21 역산 플래너 격자(22개 셀) 생성
    const cells = Array.from({ length: 22 }, (_, i) => {
      const dDay = 21 - i;
      const cellD = new Date(examD.getTime() - dDay * 24 * 60 * 60 * 1000);
      return {
        dDay,
        date: cellD.toISOString().split('T')[0],
        subjects: subjects.slice(0, 2), // 초기에는 과목 2개 분배 예시
        task: `${subjects[i % subjects.length] || '공통'} 개념 및 문제 풀이`,
        reviewStage: null as 1 | 2 | 3 | null,
        done: false,
      };
    });

    const newD21Plan: D21Plan = {
      id: planId,
      studentId,
      examId,
      cells,
    };

    // 5. N회독 트래커 생성
    const newTracker: ReviewTracker = {
      id: trackerId,
      studentId,
      examId,
      items: subjects.map(sub => ({
        subject: sub,
        material: `${sub} 교과서 및 핵심 자료`,
        stage1Done: false,
        stage2Done: false,
        stage3Done: false,
      })),
    };

    // 로컬 스토리지 데이터 로드 및 추가 저장
    try {
      const students = await getStudents();
      const exams = await getExams();
      const cycles = await getCycles();
      const plans = await getD21Plans();
      const trackers = await getReviewTrackers();

      await saveStudents([newStudent, ...students]);
      await saveExams([newExam, ...exams]);
      await saveCycles([newCycle, ...cycles]);
      await saveD21Plans([newD21Plan, ...plans]);
      await saveReviewTrackers([newTracker, ...trackers]);

      alert('학생이 성공적으로 등록되었습니다.');
      router.push('/students');
    } catch (error) {
      console.error('Failed to save new student:', error);
      alert('오류가 발생하여 등록에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header title="학생 등록" />
      <SectionNav />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 mt-6">
        <button
          onClick={() => router.push('/students')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-normal mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          목록으로 돌아가기
        </button>

        <div className="bg-white border border-[#E5E1DA] rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-800 font-medium text-sm border-b border-slate-100 pb-3 mb-5">
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>신규 학생 등록 폼</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-normal">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500">이름 *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
                  placeholder="예: 홍길동"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500">학년 *</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
                >
                  <option value="중1">중학교 1학년</option>
                  <option value="중2">중학교 2학년</option>
                  <option value="중3">중학교 3학년</option>
                  <option value="고1">고등학교 1학년</option>
                  <option value="고2">고등학교 2학년</option>
                  <option value="고3">고등학교 3학년</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500">학교 *</label>
                <input
                  type="text"
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
                  placeholder="예: 영동고등학교"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500">학부모 연락처 (알림톡용)</label>
                <input
                  type="text"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
                  placeholder="예: 010-1234-5678"
                />
              </div>
            </div>

            {/* 시험 설정 */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <span className="font-medium text-slate-700 block mb-3 text-xs">시험 정보 설정</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">시험 종류</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as ExamType)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
                  >
                    <option value="중간">중간고사</option>
                    <option value="기말">기말고사</option>
                    <option value="모의">모의고사 / 수능</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">시험일 (D-Day 기준일) *</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-3">
                <label className="text-slate-500">대비 과목 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={subjectsString}
                  onChange={(e) => setSubjectsString(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800"
                  placeholder="국어, 영어, 수학, 과학"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
              <label className="text-slate-500">메모 및 특이사항</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800 h-20 resize-none"
                placeholder="학생의 성향이나 관리 시 유의할 점을 기재하세요."
              />
            </div>

            <button
              type="submit"
              className="mt-4 flex items-center justify-center gap-1.5 w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>학생 저장 및 초기 세팅</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
