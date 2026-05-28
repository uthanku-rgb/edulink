'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert } from '../types';

interface CrisisAlertsProps {
  alerts: Alert[];
}

export default function CrisisAlerts({ alerts = [] }: CrisisAlertsProps) {
  const router = useRouter();

  const openAlerts = alerts.filter(a => a.severity === 'crisis' && a.status === 'open');

  if (openAlerts.length === 0) return null;

  return (
    <div className="w-full bg-[#FDF2F2] border border-[#F5D0D0] rounded-xl p-4 mb-4">
      {/* 알림 헤더 */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F9D5D5] mb-2">
        <div className="flex items-center gap-2 text-[#9B1C1C] font-medium text-sm">
          <AlertCircle className="w-4 h-4" strokeWidth={2} />
          <span>위기 시그널 {openAlerts.length}건</span>
        </div>
        <span className="text-[10px] text-[#C93B3B] font-medium bg-red-100 px-1.5 py-0.5 rounded">
          즉시 대응
        </span>
      </div>

      {/* 알림 항목 리스트 */}
      <div className="flex flex-col">
        {openAlerts.map((alert, index) => (
          <div
            key={alert.id}
            onClick={() => router.push(`/students/${alert.studentId}`)}
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 text-xs font-normal cursor-pointer text-[#9B1C1C] hover:bg-[#FBE8E8] rounded px-1.5 -mx-1.5 transition-colors ${
              index < openAlerts.length - 1 ? 'border-b border-[#F9D5D5]/40' : ''
            }`}
          >
            {/* 좌측 컨텍스트 */}
            <span className="font-medium">
              {alert.context}
            </span>
            {/* 우측 디테일 */}
            <span className="text-slate-500 sm:text-right mt-0.5 sm:mt-0 font-normal">
              {alert.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
