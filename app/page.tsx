'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Smile, 
  Settings, 
  Sparkles,
  ChevronRight,
  MessageSquare,
  User,
  Smartphone,
  Info,
  X,
  ExternalLink,
  MessageCircle,
  Users
} from 'lucide-react';
import { getStudents, seedMockDataIfEmpty } from '../lib/storage';
import { mockElementaryStudents } from '../data/mockData';
import { Student } from '../types';

export default function PortalLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [selectedElementaryId, setSelectedElementaryId] = useState<string>('');
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await seedMockDataIfEmpty();
        const loadedStudents = await getStudents();
        setStudents(loadedStudents);
        if (loadedStudents.length > 0) {
          setSelectedSecondaryId(loadedStudents[0].id);
        }
        if (mockElementaryStudents.length > 0) {
          setSelectedElementaryId(mockElementaryStudents[0].id);
        }
      } catch (err) {
        console.error('Failed to load portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRoleSelection = (role: string, targetPath: string) => {
    localStorage.setItem('user-role', role);
    router.push(targetPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-normal text-xs text-slate-400">
        에듀링크 포털 초기화 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex flex-col relative overflow-hidden font-sans">
      {/* Decorative background gradients (soft light mode) */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Main container */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl w-full mx-auto px-6 py-12 z-10">
        
        {/* Logo and Greeting */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 text-[11px] font-bold mb-3 shadow-sm select-none">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            EduLink Unified Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            에듀링크 통합 포털 게이트웨이
          </h1>
          <p className="text-xs text-slate-500 mt-2.5 max-w-lg mx-auto leading-relaxed">
            화면을 보시는 사용자의 역할에 따라 전용 시스템 포털로 진입하십시오.<br />
            각 역할별로 최적화된 전용 화면 구성과 메뉴 제어가 제공됩니다.
          </p>
        </div>

        {/* Roles Grid - 5 Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          
          {/* Card 1: 초등학생 포털 */}
          <div className="bg-white border border-[#E5E1DA] hover:border-emerald-400 rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between h-[250px] shadow-sm hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Smile className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 tracking-wider">STUDENT (ELEM)</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">초등학생 포털</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                오늘 나의 루틴 퀘스트 점검 및 과목 전용 피드백 도구(영어 리틀팍스, 디베이트 도우미, 뇌 예열 게임)에 안전하게 접속합니다.
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <select
                value={selectedElementaryId}
                onChange={(e) => setSelectedElementaryId(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs p-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                {mockElementaryStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.school} · {s.grade})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleRoleSelection('student-elem', `/my/elementary?studentId=${selectedElementaryId}`)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shrink-0 transition-all font-sans"
              >
                진입
              </button>
            </div>
          </div>

          {/* Card 2: 중고등학생 포털 */}
          <div className="bg-white border border-[#E5E1DA] hover:border-blue-400 rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between h-[250px] shadow-sm hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 tracking-wider">STUDENT (SEC)</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">중고등학생 포털</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                오늘의 순공 학습 시간 및 회독 단계, 집중도 셀프 체크 입력과 나의 D-21 플래너, 수행평가 마감일을 확인합니다.
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <select
                value={selectedSecondaryId}
                onChange={(e) => setSelectedSecondaryId(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs p-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.school} · {s.grade})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleRoleSelection('student-midhigh', `/my/${selectedSecondaryId}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl text-xs shrink-0 transition-all font-sans"
              >
                진입
              </button>
            </div>
          </div>

          {/* Card 3: 코치 포털 */}
          <div className="bg-white border border-[#E5E1DA] hover:border-indigo-400 rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between h-[250px] shadow-sm hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 tracking-wider">COACH</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">코치 포털</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                중고등 역산 계획 검토, 오답 취약점 분석, 문제 처방 및 주간/시즌 리포트 검수·발송을 관리하는 코칭 전문 콘솔로 진입합니다.
              </p>
            </div>
            <button
              onClick={() => handleRoleSelection('coach', '/middle-high')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
            >
              코칭 대시보드 진입
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 4: 서포터 포털 */}
          <div className="bg-white border border-[#E5E1DA] hover:border-teal-400 rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between h-[250px] shadow-sm hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 tracking-wider">SUPPORTER</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">서포터 포털</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                초등학생 등원 출결 체크, 일일 공부 습관 루틴 입력, 과목별 피드백 기입 및 완전학습 점검을 전담하는 운영 콘솔로 진입합니다.
              </p>
            </div>
            <button
              onClick={() => handleRoleSelection('supporter', '/elementary')}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-550 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
            >
              서포터 대시보드 진입
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 5: 데스크 포털 (격리됨) */}
          <div className="bg-white border border-[#E5E1DA] hover:border-[#2C9C8F] rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between h-[250px] shadow-sm hover:shadow-md">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8F6F4] text-[#2C9C8F] flex items-center justify-center border border-[#BDE0D9]/50">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-[#2C9C8F] bg-[#E8F6F4] px-2.5 py-0.5 rounded-full border border-[#BDE0D9]/50 tracking-wider">DESK</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">데스크 관리 포털</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                추가과금 서비스인 프리워크(Prework)의 학생별 수강 상태 ON/OFF 제어 및 데이터베이스 동기화를 제어합니다.
              </p>
            </div>
            <button
              onClick={() => handleRoleSelection('desk', '/desk')}
              className="w-full py-2.5 bg-[#2C9C8F] hover:bg-[#238176] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
            >
              데스크 콘솔 진입
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Bottom Parent Quick link */}
        <div className="mt-8 text-center bg-white border border-[#E5E1DA] rounded-2xl p-4 max-w-5xl w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                학부모용 알림톡 채널 (No Screen)
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                학부모님 포털 화면은 없으며, 매주 코치가 승인한 리포트가 카카오톡 알림톡으로 자동 발송됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsParentModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold rounded-xl text-xs transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <MessageCircle className="w-4 h-4 text-slate-950" />
            알림톡 양식 확인하기
          </button>
        </div>

      </main>

      {/* KakaoTalk Notification Mockup Modal */}
      {isParentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full relative overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#FAF9F6]">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-650" />
                <span className="text-xs font-bold text-slate-800">학부모 카카오 알림톡 예시</span>
              </div>
              <button
                onClick={() => setIsParentModalOpen(false)}
                className="p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-700 transition-all hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* KakaoTalk Background Simulator */}
            <div className="bg-[#BACBDB] px-4 py-6 h-[480px] overflow-y-auto font-sans flex flex-col justify-start">
              {/* Date Stamp */}
              <div className="mx-auto bg-black/10 rounded-full px-3 py-1 text-[9px] text-white/95 select-none font-medium mb-4">
                2026년 5월 27일 월요일
              </div>

              {/* Kakao Message Bubble */}
              <div className="max-w-[280px] bg-white rounded-2xl shadow-sm text-slate-800 overflow-hidden relative self-start">
                
                {/* Yellow Kakao Alert Banner */}
                <div className="bg-[#FFE600] px-3.5 py-1.5 text-[9px] font-bold text-slate-950 flex items-center gap-1">
                  <span>알림톡 도착</span>
                </div>

                <div className="p-3.5 space-y-3">
                  {/* Sender Profile */}
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-[10px] font-extrabold font-serif">
                      JY
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-900">정연학원 코칭 센터</h4>
                      <p className="text-[8px] text-slate-400 font-medium">에듀링크 공식 알림톡</p>
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div>
                    <h5 className="text-[11px] font-bold text-indigo-650 mb-1">
                      [정연학원 에듀링크] 주간 리포트 발송
                    </h5>
                    <p className="text-[10px] text-slate-600 leading-normal">
                      안녕하세요, 김민준 학생 학부모님.<br />
                      금주 민준이의 에듀링크 개별 밀착 코칭 및 공부 루틴 보고서를 전달드립니다.
                    </p>
                  </div>

                  {/* Report Details Card */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[9px] space-y-1.5 font-normal text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-400 block mb-0.5">■ 출석 및 학습 시간</span>
                      <p className="font-semibold text-slate-800 text-[10px]">
                        출석률 <span className="text-emerald-600">95%</span> · 총 순공 <span className="text-indigo-600">1,240분</span> (일 평균 약 4.1h)
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block mb-0.5">■ 일일 계획 완수율</span>
                      <p className="font-semibold text-slate-800 text-[10px]">
                        수행 완료도 <span className="text-indigo-600">88%</span> (총 22개 계획 중 19개 완수)
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block mb-0.5">■ 회독 완료 패턴</span>
                      <p className="font-semibold text-slate-800 text-[10px]">
                        수학I: 2회독 완료 (쎈수학 오답 분석)<br />
                        영어: 1회독 개념 정리 진행 중 (수능특강 Light)
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block mb-0.5">■ 코치 격려 한마디</span>
                      <p className="text-[9px] leading-relaxed text-slate-700 italic">
                        &quot;이번 주 민준이는 수학 백지 테스트에서 평균 인출율 85%를 달성하며 훌륭히 역산 계획을 이행했습니다. 다소 오답률이 높은 이차함수 파트 위주로 유형 변형문제를 2차 처방하여 결손을 보완 중입니다.&quot;
                      </p>
                    </div>
                  </div>

                  {/* Notification Footer Notice */}
                  <p className="text-[8px] text-slate-400 leading-normal font-medium">
                    ※ 상세 내용은 아래 버튼을 클릭하여 학부모 전용 리포트 간이 열람 페이지에서 실시간 확인 및 파일 다운로드가 가능합니다.
                  </p>
                </div>

                {/* Call To Action Buttons */}
                <div className="border-t border-slate-100 divide-y divide-slate-100 flex flex-col text-[10px] font-bold text-indigo-650">
                  <button className="py-2.5 hover:bg-slate-50 active:bg-slate-100 w-full transition-colors flex items-center justify-center gap-1 text-indigo-750">
                    <span>리포트 상세 페이지 열기</span>
                    <ExternalLink className="w-3 h-3 text-indigo-600" />
                  </button>
                  <button className="py-2.5 hover:bg-slate-50 active:bg-slate-100 w-full transition-colors text-slate-500">
                    카카오톡 채널 가기
                  </button>
                </div>

              </div>
            </div>

            {/* Modal Bottom note */}
            <div className="p-4 border-t border-slate-100 bg-[#FAF9F6] text-[10px] text-slate-450 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-normal">
                학부모 리포트는 코치가 검수한 후 알림톡 발송 모듈을 통해 학부모의 카카오톡으로 전송되며 별도의 학부모 로그인 프로세스는 요구되지 않습니다.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
