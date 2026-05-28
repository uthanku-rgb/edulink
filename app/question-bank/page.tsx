'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Search, 
  Upload, 
  ClipboardList, 
  FolderPlus,
  Send,
  Trash2,
  FileText,
  ArrowLeft
} from 'lucide-react';
import Header from '../../components/Header';
import SectionNav from '../../components/SectionNav';
import { getStudents, getQuestions, getPrescriptions, saveQuestions, savePrescriptions } from '../../lib/storage';
import { Student, QuestionBankItem, Prescription, Grade } from '../../types';

export default function QuestionBankPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  
  // UI 탭 상태
  const [activeTab, setActiveTab] = useState<'search' | 'register' | 'history'>('search');
  
  // 검색 및 필터 상태
  const [filterSubject, setFilterSubject] = useState('전체');
  const [filterGrade, setFilterGrade] = useState('전체');
  const [filterType, setFilterType] = useState('전체');
  const [filterLevel, setFilterLevel] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // 처방 작성 상태 (장바구니)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [prescriptionCart, setPrescriptionCart] = useState<QuestionBankItem[]>([]);

  // 문제 등록 폼 상태
  const [regFilename, setRegFilename] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regGrade, setRegGrade] = useState<Grade>('고1');
  const [regSemester, setRegSemester] = useState('1학기 중간');
  const [regSubject, setRegSubject] = useState('수학');
  const [regUnit, setRegUnit] = useState('');
  const [regType, setRegType] = useState('빈출');
  const [regLevel, setRegLevel] = useState(3);
  const [regYear, setRegYear] = useState(new Date().getFullYear());
  const [regSource, setRegSource] = useState('학교기출');
  const [regAccuracy, setRegAccuracy] = useState(70);

  useEffect(() => {
    setStudents(getStudents());
    setQuestions(getQuestions());
    setPrescriptions(getPrescriptions());
    
    const loadedStudents = getStudents();
    if (loadedStudents.length > 0) {
      setSelectedStudentId(loadedStudents[0].id);
    }
  }, []);

  // 1. 문제 등록 핸들러
  const handleRegisterQuestion = (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFilename) {
      alert('PDF 파일명을 입력해 주세요.');
      return;
    }

    const newQuestion: QuestionBankItem = {
      id: `q_${Date.now()}`,
      filename: regFilename.endsWith('.pdf') ? regFilename : `${regFilename}.pdf`,
      school: regSchool || '공통',
      grade: regGrade,
      semester: regSemester,
      subject: regSubject,
      unit: regUnit || '기타',
      type: regType,
      level: regLevel,
      year: regYear,
      source: regSource,
      accuracy: regAccuracy,
    };

    try {
      const updated = [newQuestion, ...questions];
      saveQuestions(updated);
      setQuestions(updated);
      
      // 폼 리셋
      setRegFilename('');
      setRegSchool('');
      setRegUnit('');
      alert('문제 은행에 PDF 파일이 등록되었습니다.');
      setActiveTab('search');
    } catch (err) {
      console.error('Failed to register question:', err);
    }
  };

  // 2. 검색 필터 적용 연산
  const filteredQuestions = questions.filter(q => {
    if (filterSubject !== '전체' && q.subject !== filterSubject) return false;
    if (filterGrade !== '전체' && q.grade !== filterGrade) return false;
    if (filterType !== '전체' && q.type !== filterType) return false;
    if (filterLevel !== '전체' && q.level !== Number(filterLevel)) return false;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        q.filename.toLowerCase().includes(query) ||
        q.school.toLowerCase().includes(query) ||
        q.unit.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // 3. 처방 장바구니 관리
  const addToCart = (question: QuestionBankItem) => {
    if (prescriptionCart.some(q => q.id === question.id)) {
      alert('이미 처방 목록에 추가되어 있습니다.');
      return;
    }
    setPrescriptionCart([...prescriptionCart, question]);
  };

  const removeFromCart = (id: string) => {
    setPrescriptionCart(prescriptionCart.filter(q => q.id !== id));
  };

  // 4. 처방 제출 핸들러
  const handlePrescribe = () => {
    if (!selectedStudentId) {
      alert('처방받을 학생을 선택해 주세요.');
      return;
    }
    if (prescriptionCart.length === 0) {
      alert('처방할 문제를 문제 은행 검색 결과에서 선택해 주세요.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const newPrescription: Prescription = {
      id: `pre_${Date.now()}`,
      studentId: selectedStudentId,
      studentName: student.name,
      managerId: 'mgr_01',
      questionIds: prescriptionCart.map(q => q.id),
      prescriptionDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    try {
      const updated = [newPrescription, ...prescriptions];
      savePrescriptions(updated);
      setPrescriptions(updated);
      
      // 장바구니 비우기 및 알림
      setPrescriptionCart([]);
      alert(`${student.name} 학생에게 ${newPrescription.questionIds.length}개의 맞춤 문제 처방이 완료되었습니다.`);
      setActiveTab('history');
    } catch (err) {
      console.error('Failed to save prescription:', err);
    }
  };

  // 문제 정보 헬퍼
  const getQuestionFilenameById = (id: string) => {
    const q = questions.find(item => item.id === id);
    return q ? q.filename : '삭제된 파일';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col pb-12">
      <Header title="문제 은행" />
      <SectionNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-4">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-normal mb-4 no-print"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          대시보드로 돌아가기
        </button>

        {/* 탭 헤더 컨트롤바 */}
        <div className="flex border-b border-[#E5E1DA] mb-4 gap-1 no-print">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1 px-4 py-2.5 text-xs font-normal border-b-2 -mb-[2px] transition-all ${
              activeTab === 'search'
                ? 'border-slate-800 text-slate-850 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>문제 은행 검색 및 처방</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1 px-4 py-2.5 text-xs font-normal border-b-2 -mb-[2px] transition-all ${
              activeTab === 'register'
                ? 'border-slate-800 text-slate-850 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>신규 문제 등록</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 px-4 py-2.5 text-xs font-normal border-b-2 -mb-[2px] transition-all ${
              activeTab === 'history'
                ? 'border-slate-800 text-slate-850 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>처방 이력 조회</span>
          </button>
        </div>

        {/* 탭 본문 내용 */}
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 좌측/중앙: 검색 필터 및 리스트 */}
            <div className="lg:col-span-2 bg-white border border-[#E5E1DA] rounded-xl p-4">
              <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">문제 은행 데이터 검색</span>

              {/* 필터 세트 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs font-normal">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 scale-90 origin-left">과목</label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded bg-[#FAF9F6]"
                  >
                    <option value="전체">전체 과목</option>
                    <option value="수학">수학</option>
                    <option value="영어">영어</option>
                    <option value="국어">국어</option>
                    <option value="과학">과학</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 scale-90 origin-left">학년</label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded bg-[#FAF9F6]"
                  >
                    <option value="전체">전체 학년</option>
                    <option value="중1">중1</option>
                    <option value="중2">중2</option>
                    <option value="중3">중3</option>
                    <option value="고1">고1</option>
                    <option value="고2">고2</option>
                    <option value="고3">고3</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 scale-90 origin-left">유형</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded bg-[#FAF9F6]"
                  >
                    <option value="전체">전체 유형</option>
                    <option value="개념">개념</option>
                    <option value="적용">적용</option>
                    <option value="서술형">서술형</option>
                    <option value="실수형">실수형</option>
                    <option value="고난도">고난도</option>
                    <option value="빈출">빈출</option>
                    <option value="오답다발">오답다발</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 scale-90 origin-left">난이도</label>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded bg-[#FAF9F6]"
                  >
                    <option value="전체">전체 난이도</option>
                    <option value="1">난이도 1</option>
                    <option value="2">난이도 2</option>
                    <option value="3">난이도 3</option>
                    <option value="4">난이도 4</option>
                    <option value="5">난이도 5</option>
                  </select>
                </div>
              </div>

              {/* 검색창 */}
              <div className="relative mb-4 text-xs">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="파일명, 학교명, 출처 등으로 자료 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                />
              </div>

              {/* 문제 리스트 */}
              <div className="overflow-y-auto max-h-[360px] border border-slate-100 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-normal bg-slate-50">
                      <th className="py-2 px-2">과목/학년</th>
                      <th className="py-2 px-2">자료 파일명</th>
                      <th className="py-2 px-2">기출정보</th>
                      <th className="py-2 px-2">유형</th>
                      <th className="py-2 px-2">난이도</th>
                      <th className="py-2 px-2 text-center w-16">선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-normal">
                          검색 조건에 일치하는 문제 자료가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredQuestions.map((q) => (
                        <tr key={q.id} className="border-b border-slate-100 hover:bg-[#FAF9F6] text-slate-700 font-normal">
                          <td className="py-2 px-2 font-medium">
                            {q.subject} · {q.grade}
                          </td>
                          <td className="py-2 px-2 max-w-[200px] truncate" title={q.filename}>
                            <div className="flex items-center gap-1 text-slate-800 font-medium">
                              <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span>{q.filename}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-slate-500">
                            {q.school} · {q.year}년 ({q.source})
                          </td>
                          <td className="py-2 px-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">
                              {q.type}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-medium text-amber-600">
                            {'★'.repeat(q.level)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => addToCart(q)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] rounded"
                            >
                              추가
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 우측: 처방 정보 작성 및 장바구니 */}
            <div className="lg:col-span-1 bg-white border border-[#E5E1DA] rounded-xl p-4">
              <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">맞춤 문제 처방 처방기</span>

              <div className="flex flex-col gap-3 text-xs font-normal">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">처방 대상 학생 선택</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.grade} / {s.school})</option>
                    ))}
                  </select>
                </div>

                <div className="border border-slate-200 rounded-lg p-2.5 bg-[#FAF9F6]">
                  <span className="font-medium text-slate-700 block mb-2">선택된 처방 문제집 ({prescriptionCart.length}개)</span>
                  
                  {prescriptionCart.length === 0 ? (
                    <span className="text-[10px] text-slate-400 block text-center py-6">
                      왼쪽 리스트에서 추가를 눌러 처방 세트를 작성하세요.
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                      {prescriptionCart.map((q) => (
                        <div key={q.id} className="flex items-center justify-between bg-white border border-slate-200 rounded p-1.5">
                          <span className="font-medium text-[10px] truncate max-w-[150px]">{q.filename}</span>
                          <button
                            onClick={() => removeFromCart(q.id)}
                            className="text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePrescribe}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1 mt-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>맞춤 학습 처방 완료</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto bg-white border border-[#E5E1DA] rounded-xl p-5">
            <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>기출 PDF 및 문제집 등록</span>
            </span>

            <form onSubmit={handleRegisterQuestion} className="flex flex-col gap-3.5 text-xs font-normal">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500">PDF 파일명 *</label>
                <input
                  type="text"
                  required
                  value={regFilename}
                  onChange={(e) => setRegFilename(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  placeholder="예: 2026_영동고_1학년1학기_중간고사_수학"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">출처 학원/학교명</label>
                  <input
                    type="text"
                    value={regSchool}
                    onChange={(e) => setRegSchool(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    placeholder="예: 영동고등학교"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">대상 학년</label>
                  <select
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value as Grade)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    <option value="중1">중1</option>
                    <option value="중2">중2</option>
                    <option value="중3">중3</option>
                    <option value="고1">고1</option>
                    <option value="고2">고2</option>
                    <option value="고3">고3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">대상 과목</label>
                  <select
                    value={regSubject}
                    onChange={(e) => setRegSubject(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    <option value="수학">수학</option>
                    <option value="영어">영어</option>
                    <option value="국어">국어</option>
                    <option value="과학">과학</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">대상 학기/시즌</label>
                  <input
                    type="text"
                    value={regSemester}
                    onChange={(e) => setRegSemester(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                    placeholder="예: 1학기 중간"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500">대단원 - 중단원 분류</label>
                <input
                  type="text"
                  value={regUnit}
                  onChange={(e) => setRegUnit(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  placeholder="예: 방정식과 부등식 - 이차함수"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">유형 태그</label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    <option value="개념">개념</option>
                    <option value="적용">적용</option>
                    <option value="서술형">서술형</option>
                    <option value="실수형">실수형</option>
                    <option value="고난도">고난도</option>
                    <option value="빈출">빈출</option>
                    <option value="오답다발">오답다발</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">난이도 (1~5)</label>
                  <select
                    value={regLevel}
                    onChange={(e) => setRegLevel(Number(e.target.value))}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    <option value={1}>1 (쉬움)</option>
                    <option value={2}>2</option>
                    <option value={3}>3 (보통)</option>
                    <option value={4}>4</option>
                    <option value={5}>5 (어려움)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">기출년도</label>
                  <input
                    type="number"
                    value={regYear}
                    onChange={(e) => setRegYear(Number(e.target.value))}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">문제 종류/출처</label>
                  <select
                    value={regSource}
                    onChange={(e) => setRegSource(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  >
                    <option value="학교기출">학교기출</option>
                    <option value="모의고사">모의고사</option>
                    <option value="시중문제집">시중문제집</option>
                    <option value="자체제작">자체제작</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500">학원 평균 정답률 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={regAccuracy}
                    onChange={(e) => setRegAccuracy(Number(e.target.value))}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-[#FAF9F6]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 text-center text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                문제 데이터베이스 저장
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white border border-[#E5E1DA] rounded-xl p-4">
            <span className="font-medium text-slate-800 text-xs block border-b border-slate-100 pb-2 mb-3">맞춤 학습 처방 이력 목록</span>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-normal">
                    <th className="py-2.5 px-2">처방 날짜</th>
                    <th className="py-2.5 px-2">학생명</th>
                    <th className="py-2.5 px-2">처방 PDF 리소스 목록</th>
                    <th className="py-2.5 px-2 text-center w-24">처방 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-normal">
                        아직 발행된 처방전이 존재하지 않습니다.
                      </td>
                    </tr>
                  ) : (
                    prescriptions.map((pre) => (
                      <tr key={pre.id} className="border-b border-slate-100 text-slate-700 font-normal">
                        <td className="py-3 px-2 font-medium">{pre.prescriptionDate}</td>
                        <td className="py-3 px-2 font-medium text-slate-900">{pre.studentName}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col gap-1">
                            {pre.questionIds.map((qId, index) => (
                              <div key={index} className="flex items-center gap-1 text-[10px] text-slate-600">
                                <FileText className="w-3 h-3 text-red-400 shrink-0" />
                                <span>{getQuestionFilenameById(qId)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            pre.status === 'completed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {pre.status === 'completed' ? '제출/채점완료' : '오답 풀이 대기'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
