'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  BookOpen, 
  MessageSquare, 
  Timer, 
  CheckSquare, 
  PieChart, 
  FileBarChart, 
  Database, 
  Award, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Shield,
  User,
  GraduationCap,
  Calendar,
  Gauge,
  Calculator,
  Target,
  ClipboardCheck,
  Smile
} from 'lucide-react';
import { mockStudents, mockElementaryStudents } from '@/data/mockData';
import { seedMockDataIfEmpty, seedElementaryMockDataIfEmpty } from '../../lib/storage';
import { useToast } from '../../components/ToastProvider';

export default function AdminPage() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [selectedStuId, setSelectedStuId] = useState('stu_01');
  const [selectedElemStuId, setSelectedElemStuId] = useState('estu_01');
  const [seedingMiddleHigh, setSeedingMiddleHigh] = useState(false);
  const [seedingElementary, setSeedingElementary] = useState(false);

  const handleSeedMiddleHigh = async () => {
    if (!window.confirm('정말 시딩하시겠습니까?')) return;
    setSeedingMiddleHigh(true);
    try {
      await seedMockDataIfEmpty();
      toast.success('중고등 데모 데이터가 시딩되었습니다.');
    } catch {
      toast.error('중고등 데모 데이터 시딩에 실패했습니다.');
    } finally {
      setSeedingMiddleHigh(false);
    }
  };

  const handleSeedElementary = async () => {
    if (!window.confirm('정말 시딩하시겠습니까?')) return;
    setSeedingElementary(true);
    try {
      await seedElementaryMockDataIfEmpty();
      toast.success('초등 데모 데이터가 시딩되었습니다.');
    } catch {
      toast.error('초등 데모 데이터 시딩에 실패했습니다.');
    } finally {
      setSeedingElementary(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-100">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                에듀링크 전체 라우트 맵
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">ADMIN</span>
              </h1>
              <p className="text-xs text-slate-500">에듀링크의 모든 페이지 및 학생 전용 포털을 손쉽게 탐색하는 전체 바로가기 콘솔</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            >
              대시보드 바로가기
            </Link>
          </div>
        </div>
      </header>

      {/* Main Console */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Announcement */}
        <section className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg shadow-indigo-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <h2 className="text-lg font-bold">에듀링크 페이지 네비게이터</h2>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-xs border border-white/10 shrink-0 font-mono">
            💡 로컬 포트에서 이동 시 편리하게 사용 가능합니다.
          </div>
        </section>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* 1. 중고등 코칭 & 관리 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. 중고등 코칭 & 관리</h3>
            </div>

            <div className="space-y-3">
              {[
                { path: '/middle-high', label: '중고등 코칭 대시보드', desc: '중고등 학생 현황, 기록 승인 대기 큐, 위기 알림', icon: Gauge, color: 'text-violet-600 bg-violet-50 border-violet-100' },
                { path: '/students', label: '전체 학생 목록', desc: '중고등 담당 학생 검색 및 프로필 리스트', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                { path: '/students/new', label: '신규 학생 등록', desc: '학생 정보 추가 및 시험 계획 템플릿 자동 세팅', icon: UserPlus, color: 'text-sky-600 bg-sky-50 border-sky-100' },
                { path: '/reports', label: '학습 보고서 센터 (Reports)', desc: '주간/시즌 통계 자동 합산 및 카톡 전송/인쇄', icon: Award, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
                { path: '/reports/review', label: '리포트 검수 큐 (Coach Review Queue)', desc: 'needs_review/hold 인스턴스 코치 의견 기입 및 알림톡 발송', icon: ClipboardCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                { path: '/desk', label: '데스크 등록 콘솔 (Desk Console)', desc: '학생별 프리워크 수강 ON/OFF 등록 및 데이터베이스 동기화', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { path: '/analysis', label: '시험 오답 분석 (Analysis)', desc: '내신/모의고사 정오답 분류 및 취약 분석 리포트', icon: PieChart, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                { path: '/performance', label: '수행평가 대비 (Performance)', desc: '학교별 수행평가 마감일 및 단계별 진행/피드백', icon: FileBarChart, color: 'text-violet-600 bg-violet-50 border-violet-100' },
                { path: '/question-bank', label: '내신 대비 문제 은행', desc: '학원 기출 자료 필터링 검색 및 맞춤 학습 처방', icon: Database, color: 'text-pink-650 bg-pink-50 border-pink-100' },
              ].map(route => {
                const Icon = route.icon;
                return (
                  <Link 
                    key={route.path}
                    href={route.path}
                    className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors group-hover:scale-105 ${route.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors">{route.label}</span>
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5 truncate">{route.desc}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 self-center transition-colors" />
                    </div>
                  </Link>
                );
              })}

              {/* Coach Student Management Detail Jumper */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-500 block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-505" />
                  코치용 학생 상세 정보 숏컷 (`/students/[id]`)
                </span>
                <div className="space-y-2">
                  <select 
                    value={selectedStuId}
                    onChange={(e) => setSelectedStuId(e.target.value)}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium bg-slate-50"
                  >
                    {mockStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.grade} · {student.school})
                      </option>
                    ))}
                  </select>
                  <Link 
                    href={`/students/${selectedStuId}`}
                    className="w-full py-2.5 bg-purple-650 hover:bg-purple-750 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-sm shadow-purple-100"
                  >
                    상세 프로필 보기
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* 2. 초등 루틴 & 전문 피드백 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. 초등 루틴 & 전문 피드백</h3>
            </div>

            <div className="space-y-3">
              {[
                { path: '/elementary', label: '초등 루틴 대시보드', desc: '초등 코호트 주간 기둥 현황 및 케어 시그널 확인', icon: Calendar, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { path: '/elementary/input', label: '초등 루틴 수동 입력', desc: '코호트 등원 출결 체크 및 루틴 단계 체크 모달', icon: CheckSquare, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                { path: '/english/review', label: '초등 영어 코치 점검판 (전용 도구)', desc: '리틀팍스 결과물 확인, 피드백 및 리포트 인쇄', icon: BookOpen, color: 'text-emerald-600 bg-[#E8F6F4]/50 border-emerald-100' },
                { path: '/debate/review', label: '초등 토론 코치 점검판 (전용 도구)', desc: '디베이트 개요서 및 제출 에세이 피드백 작성', icon: MessageSquare, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                { path: '/math/review', label: '초등 수학 스토리텔링 (전용 도구 · 준비 중)', desc: '수학 논리력 진단 및 서술형 피드백 점검판', icon: Calculator, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                { path: '/workshop', label: '초등 라이브 워크숍 진행 (전용 도구)', desc: '세션 선택, 타이머 제어 및 P2 완료 연동', icon: Timer, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                { path: '/mastery', label: '초등 완전학습 점검판 (전용 도구)', desc: '핵심 개념 등록, 백지 인출 채점 및 결손(구멍) 케어', icon: Target, color: 'text-indigo-600 bg-[#EEEDFC]/50 border-indigo-100' },
              ].map(route => {
                const Icon = route.icon;
                return (
                  <Link 
                    key={route.path}
                    href={route.path}
                    className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors group-hover:scale-105 ${route.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block group-hover:text-emerald-600 transition-colors">{route.label}</span>
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5 truncate">{route.desc}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 self-center transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 3. 학생용 포털 & 통합 포털 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. 학생용 포털 & 통합 포털</h3>
            </div>

            <div className="space-y-3">
              {[
                { path: '/', label: '통합 포탈 (Unified Portal)', desc: '초등 루틴 센터 및 중고등 코칭 센터의 통합 진입로', icon: Shield, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                { path: '/my/elementary', label: '초등학생 홈 포털 (Elementary Student Home)', desc: '초등학생 루틴 퀘스트 보드 및 학습 링크 연결 판넬', icon: Smile, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { path: '/english', label: '초등 리틀팍스 영어 학습', desc: '듣기 -> 섀도잉 -> 표현 줍기 -> 아웃풋 제출 4단계', icon: Sparkles, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                { path: '/debate', label: '디베이트 준비 도우미', desc: '찬반 입장 정하기, 자료 수집, 글쓰기 및 반박 6단계', icon: MessageSquare, color: 'text-orange-600 bg-orange-50 border-orange-100' },
              ].map(route => {
                const Icon = route.icon;
                return (
                  <Link 
                    key={route.path}
                    href={route.path}
                    className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors group-hover:scale-105 ${route.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block group-hover:text-purple-600 transition-colors">{route.label}</span>
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5 truncate">{route.desc}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 self-center transition-colors" />
                    </div>
                  </Link>
                );
              })}

              {/* Dynamic Elementary Student Portal Jumper */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-500 block flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-emerald-500" />
                  초등학생 전용 포털 바로가기 (`/my/elementary?studentId=[id]`)
                </span>
                <div className="space-y-2">
                  <select 
                    value={selectedElemStuId}
                    onChange={(e) => setSelectedElemStuId(e.target.value)}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium bg-slate-50"
                  >
                    {mockElementaryStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.grade} · {student.school})
                      </option>
                    ))}
                  </select>
                  <Link 
                    href={`/my/elementary?studentId=${selectedElemStuId}`}
                    className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-750 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-sm shadow-emerald-100"
                  >
                    포털 진입하기
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Dynamic Student Portal Jumper */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-500 block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  개별 학생 전용 포털 바로가기 (`/my/[id]`)
                </span>
                <div className="space-y-2">
                  <select 
                    value={selectedStuId}
                    onChange={(e) => setSelectedStuId(e.target.value)}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium bg-slate-50"
                  >
                    {mockStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.grade} · {student.school})
                      </option>
                    ))}
                  </select>
                  <Link 
                    href={`/my/${selectedStuId}`}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-sm shadow-indigo-100"
                  >
                    포털 진입하기
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 데모 데이터 관리 */}
        <section className="mt-12 bg-white border border-[#E5E1DA] rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
            🗂️ 데모 데이터 관리
          </h4>
          <p className="text-[11px] text-amber-600 font-medium mb-3">
            ⚠️ 데모/시연 환경 전용 — 실사용 환경에서는 사용하지 마세요.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSeedMiddleHigh}
              disabled={seedingMiddleHigh}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seedingMiddleHigh ? '시딩 중...' : '중고등 데모 데이터 시딩'}
            </button>
            <button
              onClick={handleSeedElementary}
              disabled={seedingElementary}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seedingElementary ? '시딩 중...' : '초등 데모 데이터 시딩'}
            </button>
          </div>
        </section>

        {/* Secondary Info Block */}
        <section className="mt-8 bg-slate-100 border border-slate-200/50 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
            📢 가이드 참고 사항
          </h4>
          <ul className="text-[11px] text-slate-500 list-disc pl-4 space-y-1.5 leading-relaxed font-medium">
            <li>초등학생 영어 위저드(`english`)의 경우, 학생 이름 선택을 진행하면 학습을 시작할 수 있습니다.</li>
            <li>디베이트와 워크숍 등의 중고등 기둥은 해당 라우트 내에서 실시간 세션과 오버레이가 완벽하게 작동합니다.</li>
            <li>로컬 저장소(localStorage) 기반 데이터 구조로, 동작 결과는 브라우저 간에 공유되며 초기 Mock 데이터로 자유롭게 복원할 수 있습니다.</li>
          </ul>
        </section>

      </main>
    </div>
  );
}
