'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
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
  Gauge
} from 'lucide-react';
import { mockStudents } from '@/data/mockData';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedStuId, setSelectedStuId] = useState('stu_01');

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
            <p className="text-sm text-indigo-100 font-medium">원하는 대상(코치/학생)과 도메인(루틴/영어/디베이트/워크숍)에 따라 빠르게 이동해 보세요.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-xs border border-white/10 shrink-0 font-mono">
            💡 로컬 포트에서 이동 시 편리하게 사용 가능합니다.
          </div>
        </section>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* 1. 코치 / 관리자용 페이지 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. 코치 / 관리자용 대시보드</h3>
            </div>

            <div className="space-y-3">
              {[
                { path: '/', label: '통합 포탈 (Unified Portal)', desc: '초등 루틴 센터 및 중고등 코칭 센터의 통합 진입로', icon: Shield, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                { path: '/middle-high', label: '중고등 코칭 대시보드', desc: '중고등 학생 현황, 기록 승인 대기 큐, 위기 알림', icon: Gauge, color: 'text-violet-600 bg-violet-50 border-violet-100' },
                { path: '/elementary', label: '초등 루틴 대시보드', desc: '초등 코호트 주간 기둥 현황 및 케어 시그널 확인', icon: Calendar, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { path: '/elementary/input', label: '초등 루틴 수동 입력', desc: '코호트 등원 출결 체크 및 루틴 단계 체크 모달', icon: CheckSquare, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                { path: '/students', label: '전체 학생 목록', desc: '중고등 담당 학생 검색 및 프로필 리스트', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                { path: '/students/new', label: '신규 학생 등록', desc: '학생 정보 추가 및 시험 계획 템플릿 자동 세팅', icon: UserPlus, color: 'text-sky-600 bg-sky-50 border-sky-100' },
                { path: '/english/review', label: '초등 영어 코치 점검판', desc: '리틀팍스 결과물 확인, 피드백 및 리포트 인쇄', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { path: '/debate/review', label: '디베이트 코치 점검판', desc: '찬반 개요서 및 제출 문서 확인, 피드백', icon: MessageSquare, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                { path: '/workshop', label: '워크숍 선택 및 진행', desc: '라이브 세션 타이머, 오버레이 제어 및 P2 완료 연동', icon: Timer, color: 'text-purple-600 bg-purple-50 border-purple-100' },
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
            </div>
          </div>

          {/* 2. 학생용 페이지 & 개별 포털 바로가기 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. 학생 루틴 / 자기주도 학습</h3>
            </div>

            <div className="space-y-3">
              {[
                { path: '/english', label: '초등 리틀팍스 영어 학습', desc: '듣기 -> 섀도잉 -> 표현 줍기 -> 아웃풋 제출 4단계', icon: Sparkles, color: 'text-teal-600 bg-teal-50 border-teal-100' },
                { path: '/debate', label: '디베이트 준비 도우미', desc: '찬반 입장 정하기, 자료 수집, 글쓰기 및 반박 6단계', icon: MessageSquare, color: 'text-orange-600 bg-orange-50 border-orange-100' },
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

          {/* 3. 통계 및 보고서 & 학생 디테일 숏컷 */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. 수행 지표 & 종합 분석</h3>
            </div>

            <div className="space-y-3">
              {[
                { path: '/analysis', label: '시험 오답 분석 (Analysis)', desc: '내신/모의고사 정오답 분류 및 취약 분석 리포트', icon: PieChart, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                { path: '/performance', label: '수행평가 대비 (Performance)', desc: '학교별 수행평가 마감일 및 단계별 진행/피드백', icon: FileBarChart, color: 'text-violet-600 bg-violet-50 border-violet-100' },
                { path: '/reports', label: '학습 보고서 센터 (Reports)', desc: '주간/시즌 통계 자동 합산 및 카톡 전송/인쇄', icon: Award, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
                { path: '/question-bank', label: '내신 대비 문제 은행', desc: '학원 기출 자료 필터링 검색 및 맞춤 학습 처방', icon: Database, color: 'text-pink-600 bg-pink-50 border-pink-100' },
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

              {/* Coach Student Management Detail Jumper */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-500 block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-500" />
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
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-sm shadow-purple-100"
                  >
                    상세 프로필 보기
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Secondary Info Block */}
        <section className="mt-12 bg-slate-100 border border-slate-200/50 rounded-2xl p-5">
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
