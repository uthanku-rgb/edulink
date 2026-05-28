'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import { getStudents } from '../../lib/storage';
import { Student } from '../../types';
import { 
  BarChart3, 
  Search, 
  Plus, 
  X
} from 'lucide-react';

interface QuestionAnalysis {
  questionNo: number;
  topic: string;
  isCorrect: boolean;
  errorType: '개념미흡' | '단순실수' | '난이도장벽' | '시간부족' | '해당없음';
}

interface ExamAnalysisRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  school: string;
  subject: string;
  examType: '중간' | '기말' | '모의';
  score: number;
  gradeRank: number; // 등급
  incorrectBreakdown: QuestionAnalysis[];
  managerConsultation: string;
  prescriptionDirection: string;
  dateCreated: string;
}

const initialAnalyses: ExamAnalysisRecord[] = [
  {
    id: 'an_01',
    studentId: 'stu_01',
    studentName: '김민준',
    grade: '중3',
    school: '신라중학교',
    subject: '수학',
    examType: '중간',
    score: 82,
    gradeRank: 3,
    incorrectBreakdown: [
      { questionNo: 14, topic: '이차방정식의 해와 계수', isCorrect: false, errorType: '단순실수' },
      { questionNo: 17, topic: '이차함수의 최대최소 활용', isCorrect: false, errorType: '난이도장벽' },
      { questionNo: 20, topic: '인수분해 공식의 변형', isCorrect: false, errorType: '개념미흡' },
      { questionNo: 21, topic: '이차방정식 근의 판별', isCorrect: false, errorType: '시간부족' }
    ],
    managerConsultation: '계산실수 1개 발생함. 킬러 문항에 시간을 뺏겨 마지막 서술형 문제를 다 풀지 못해 시간 관리가 아쉬웠던 시험.',
    prescriptionDirection: '이차방정식 단원 개념 복습 1회독 완료 및 고난이도 문항 타임어택 훈련 10회 분량 처방.',
    dateCreated: '2026-05-15'
  },
  {
    id: 'an_02',
    studentId: 'stu_02',
    studentName: '이서연',
    grade: '고1',
    school: '영동고등학교',
    subject: '영어',
    examType: '중간',
    score: 95,
    gradeRank: 1,
    incorrectBreakdown: [
      { questionNo: 29, topic: '어법상 어색한 표현 고르기', isCorrect: false, errorType: '단순실수' }
    ],
    managerConsultation: '어법 1문항 외에 전체 독해 지문을 고르게 맞춤. 고득점을 유지하고 있으며 평소 집중력을 잘 발휘함.',
    prescriptionDirection: '오답 문항의 어법 원리 분석 및 단권화 노트 정리 유도.',
    dateCreated: '2026-05-16'
  }
];

export default function AnalysisPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [analyses, setAnalyses] = useState<ExamAnalysisRecord[]>(initialAnalyses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);

  // 모달 입력 폼 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('수학');
  const [examType, setExamType] = useState<'중간' | '기말' | '모의'>('중간');
  const [score, setScore] = useState(80);
  const [gradeRank, setGradeRank] = useState(3);
  const [managerConsultation, setManagerConsultation] = useState('');
  const [prescriptionDirection, setPrescriptionDirection] = useState('');
  
  // 문항 오답 분석 상태
  const [questionNo, setQuestionNo] = useState(1);
  const [topic, setTopic] = useState('');
  const [errorType, setErrorType] = useState<'개념미흡' | '단순실수' | '난이도장벽' | '시간부족' | '해당없음'>('단순실수');
  const [incorrectList, setIncorrectList] = useState<QuestionAnalysis[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedStudents = await getStudents();
        setStudents(loadedStudents);

        const saved = localStorage.getItem('edulink_exam_analyses');
        if (saved) {
          setAnalyses(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to load exam analyses:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveAnalyses = (updated: ExamAnalysisRecord[]) => {
    setAnalyses(updated);
    localStorage.setItem('edulink_exam_analyses', JSON.stringify(updated));
  };

  const handleAddIncorrect = () => {
    if (!topic) {
      alert('오답 문항의 단원/토픽을 입력해 주세요.');
      return;
    }
    const newIncorrect: QuestionAnalysis = {
      questionNo,
      topic,
      isCorrect: false,
      errorType
    };
    setIncorrectList([...incorrectList, newIncorrect]);
    setQuestionNo(questionNo + 1);
    setTopic('');
  };

  const handleRemoveIncorrect = (index: number) => {
    const updated = [...incorrectList];
    updated.splice(index, 1);
    setIncorrectList(updated);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !managerConsultation || !prescriptionDirection) {
      alert('필수 분석 항목을 작성해 주세요.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const newRecord: ExamAnalysisRecord = {
      id: `an_${Date.now()}`,
      studentId: selectedStudentId,
      studentName: student.name,
      grade: student.grade,
      school: student.school,
      subject,
      examType,
      score,
      gradeRank,
      incorrectBreakdown: incorrectList,
      managerConsultation,
      prescriptionDirection,
      dateCreated: new Date().toISOString().split('T')[0]
    };

    const updated = [newRecord, ...analyses];
    saveAnalyses(updated);
    setIsModalOpen(false);

    // 폼 초기화
    setSelectedStudentId('');
    setIncorrectList([]);
    setQuestionNo(1);
    setManagerConsultation('');
    setPrescriptionDirection('');
    alert('시험 오답 분석 리포트가 생성되었습니다.');
  };

  const handleDeleteRecord = (id: string) => {
    if (!confirm('해당 시험 분석 기록을 삭제하시겠습니까?')) return;
    const updated = analyses.filter(a => a.id !== id);
    saveAnalyses(updated);
  };

  const filteredAnalyses = analyses.filter(a => {
    return a.studentName.includes(searchQuery) || a.subject.includes(searchQuery) || a.school.includes(searchQuery);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        시험 분석 데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header title="시험 분석" studentCount={students.length} />
      <SectionNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-4 text-xs font-normal">
        {/* 상단 액션바 */}
        <div className="flex items-center justify-between mb-4 bg-white border border-[#E5E1DA] rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="학생명, 과목, 학교 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-[#FAF9F6] text-slate-800 font-normal w-56"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>시험 분석 입력</span>
          </button>
        </div>

        {/* 시험 분석 목록 카드 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAnalyses.length === 0 ? (
            <div className="lg:col-span-2 bg-white border border-[#E5E1DA] rounded-xl p-8 text-center text-slate-400">
              분석된 시험 기록이 없습니다. 우측 상단의 &apos;시험 분석 입력&apos; 버튼을 통해 새로 추가해 주세요.
            </div>
          ) : (
            filteredAnalyses.map((rec) => {
              // 오답 유형 카운팅
              const counts = { 개념미흡: 0, 단순실수: 0, 난이도장벽: 0, 시간부족: 0, 해당없음: 0 };
              rec.incorrectBreakdown.forEach(item => {
                counts[item.errorType] = (counts[item.errorType] || 0) + 1;
              });

              return (
                <div key={rec.id} className="bg-white border border-[#E5E1DA] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    {/* 카드 헤더 */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <div>
                        <span className="text-base font-medium text-slate-900">{rec.studentName}</span>
                        <span className="text-[10px] text-slate-450 ml-1.5">{rec.school} · {rec.grade}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{rec.dateCreated} 작성</span>
                    </div>

                    {/* 시험 점수 정보 */}
                    <div className="grid grid-cols-3 gap-2 bg-[#FAF9F6] border border-slate-200 rounded-lg p-3 mb-4">
                      <div>
                        <span className="text-slate-400 block text-[10px]">과목/종류</span>
                        <span className="font-medium text-slate-800 text-xs mt-0.5 block">{rec.subject} ({rec.examType})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">획득 점수</span>
                        <span className="font-medium text-slate-800 text-xs mt-0.5 block">{rec.score}점</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">추정 등급</span>
                        <span className="font-medium text-slate-800 text-xs mt-0.5 block">{rec.gradeRank}등급</span>
                      </div>
                    </div>

                    {/* 오답 문항 분석 */}
                    <div className="mb-4">
                      <span className="font-medium text-slate-800 block mb-2">오답 취약 원인 분석</span>
                      {rec.incorrectBreakdown.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic">등록된 오답 문항이 없습니다.</div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {rec.incorrectBreakdown.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5">
                              <span className="font-medium text-slate-700">Q.{item.questionNo} <span className="font-normal text-slate-550 ml-1">{item.topic}</span></span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                item.errorType === '단순실수' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                item.errorType === '난이도장벽' ? 'bg-red-50 text-red-800 border border-red-200' :
                                item.errorType === '개념미흡' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {item.errorType}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 오답 유형별 차트 분석(간이 텍스트) */}
                    {rec.incorrectBreakdown.length > 0 && (
                      <div className="mb-4 p-2 bg-purple-50/50 border border-purple-100/50 rounded-lg text-[10px] text-purple-900">
                        <span className="font-medium block mb-1">오답 요인 요약:</span>
                        실수: {counts.단순실수}건 | 난이도 장벽: {counts.난이도장벽}건 | 개념 미흡: {counts.개념미흡}건 | 시간 부족: {counts.시간부족}건
                      </div>
                    )}

                    {/* 종합 평 및 클리닉 방향 */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                      <div>
                        <span className="font-medium text-slate-800 block">매니저 종합 분석 피드백</span>
                        <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">{rec.managerConsultation}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-800 block">약점 극복을 위한 처방 및 대비 방향</span>
                        <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">{rec.prescriptionDirection}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-red-500 hover:underline text-[11px] font-normal"
                    >
                      기록 삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 시험 분석 신규 등록 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#E5E1DA] rounded-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 font-medium text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4">
                <BarChart3 className="w-4 h-4 text-slate-600" />
                <span>시험 분석 보고서 신규 작성</span>
              </div>

              <form onSubmit={handleAddRecord} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">대상 학생 선택 *</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    >
                      <option value="">학생 선택</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.school})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">과목명 *</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="예: 수학, 영어, 국어"
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">시험 종류</label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value as '중간' | '기말' | '모의')}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    >
                      <option value="중간">중간고사</option>
                      <option value="기말">기말고사</option>
                      <option value="모의">모의고사</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">점수 (0~100) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">예상 등급 (1~9)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={9}
                      value={gradeRank}
                      onChange={(e) => setGradeRank(Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    />
                  </div>
                </div>

                {/* 오답 개별 입력 위젯 */}
                <div className="border border-slate-200 rounded-xl p-3 bg-purple-50/20">
                  <span className="font-medium text-slate-800 block mb-2">오답 문항 개별 등록</span>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      placeholder="번호"
                      value={questionNo}
                      onChange={(e) => setQuestionNo(Number(e.target.value))}
                      className="w-16 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none bg-[#FAF9F6]"
                    />
                    <input
                      type="text"
                      placeholder="단원명 또는 세부 유형 (예: 삼각함수의 덧셈정리)"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none bg-[#FAF9F6]"
                    />
                    <select
                      value={errorType}
                      onChange={(e) => setErrorType(e.target.value as '개념미흡' | '단순실수' | '난이도장벽' | '시간부족' | '해당없음')}
                      className="w-28 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none bg-[#FAF9F6]"
                    >
                      <option value="단순실수">단순실수</option>
                      <option value="개념미흡">개념미흡</option>
                      <option value="난이도장벽">난이도장벽</option>
                      <option value="시간부족">시간부족</option>
                      <option value="해당없음">해당없음</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddIncorrect}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium px-3 rounded-lg"
                    >
                      추가
                    </button>
                  </div>

                  {/* 추가된 오답 리스트 */}
                  {incorrectList.length > 0 && (
                    <div className="flex flex-col gap-1 max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-lg p-2">
                      {incorrectList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-slate-50 py-1 last:border-b-0">
                          <span className="text-[11px] text-slate-700">Q.{item.questionNo} - {item.topic} ({item.errorType})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIncorrect(idx)}
                            className="text-red-500 hover:underline"
                          >
                            제거
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-medium">매니저 시험 총평 분석 *</label>
                  <textarea
                    required
                    value={managerConsultation}
                    onChange={(e) => setManagerConsultation(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] h-16 resize-none"
                    placeholder="실수 빈도, 시간 안배, 개념 부족 등 종합적인 분석을 입력해 주세요."
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-medium">처방 및 오답 극복 지침 *</label>
                  <textarea
                    required
                    value={prescriptionDirection}
                    onChange={(e) => setPrescriptionDirection(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6] h-16 resize-none"
                    placeholder="취약 단원 보강 훈련 계획 또는 문제 은행 처방 방향을 입력해 주세요."
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 w-full bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  시험 분석 저장
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
