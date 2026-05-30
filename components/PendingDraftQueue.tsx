'use client';

import React, { useState } from 'react';
import { ClipboardList, Check, Edit2, X, Save, Smile } from 'lucide-react';
import { DailyRecord, Student, Attendance } from '../types';

interface PendingDraftQueueProps {
  pendingRecords: DailyRecord[];
  students: Student[];
  onConfirm: (recordId: string) => Promise<void>;
  onSaveAndConfirm: (updatedRecord: DailyRecord) => Promise<void>;
}

export default function PendingDraftQueue({ 
  pendingRecords, 
  students, 
  onConfirm, 
  onSaveAndConfirm 
}: PendingDraftQueueProps) {
  // 인라인 수정 중인 record ID
  const [editingId, setEditingId] = useState<string | null>(null);

  // 수정 중인 필드 값들
  const [editAtt, setEditAtt] = useState<Attendance>('정상');
  const [editMinutes, setEditMinutes] = useState<number>(0);
  const [editStage, setEditStage] = useState<1 | 2 | 3>(1);
  const [editCompleted, setEditCompleted] = useState<boolean>(true);
  const [editCondition, setEditCondition] = useState<number>(3);
  const [editNote, setEditNote] = useState<string>('');

  const getStudentInfo = (studentId: string) => {
    return students.find(s => s.id === studentId) || { name: '알 수 없음', grade: '-', school: '-' };
  };

  const startEdit = (rec: DailyRecord) => {
    setEditingId(rec.id);
    setEditAtt(rec.attendance || '정상');
    setEditMinutes(rec.studyMinutes);
    setEditStage(rec.reviewStage);
    setEditCompleted(rec.completedPlan);
    setEditCondition(rec.condition);
    setEditNote(rec.managerNote || ''); // 한 줄 메모
  };

  const handleSave = async (rec: DailyRecord) => {
    const updated: DailyRecord = {
      ...rec,
      attendance: editAtt,
      studyMinutes: editAtt === '결석' ? 0 : editMinutes,
      reviewStage: editStage,
      completedPlan: editAtt === '결석' ? false : editCompleted,
      condition: editCondition as 1 | 2 | 3 | 4 | 5,
      managerNote: editNote,
      status: 'confirmed',
      submittedBy: 'student', // 제출 주체는 원래 student
      confirmedAt: new Date().toISOString()
    };
    await onSaveAndConfirm(updated);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  if (pendingRecords.length === 0) return null;

  return (
    <div id="pending-queue" className="w-full bg-white border border-[#E5E1DA] rounded-xl p-4 mb-4 scroll-mt-20">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm mb-3 pb-2 border-b border-slate-100">
        <ClipboardList className="w-4 h-4 text-slate-650" strokeWidth={1.8} />
        <span>기록 확인 대기 목록</span>
        <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold">
          {pendingRecords.length}건 대기 중
        </span>
      </div>

      {/* 테이블 목록 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-normal">
              <th className="py-2.5 px-2">학생정보</th>
              <th className="py-2.5 px-2">날짜</th>
              <th className="py-2.5 px-2">학생 제출 내용</th>
              <th className="py-2.5 px-2">한 줄 메모</th>
              <th className="py-2.5 px-2 text-center w-36">작업</th>
            </tr>
          </thead>
          <tbody>
            {pendingRecords.map((rec) => {
              const student = getStudentInfo(rec.studentId);
              const isEditing = editingId === rec.id;

              return (
                <React.Fragment key={rec.id}>
                  {/* 일반 정보 행 */}
                  <tr className={`border-b border-slate-100 text-slate-800 font-normal transition-colors ${
                    isEditing ? 'bg-slate-50/50' : 'hover:bg-slate-50/40'
                  }`}>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-slate-900">{student.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {student.school} · {student.grade}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium text-slate-500">{rec.date}</td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-medium">
                          {rec.studyMinutes}분
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-medium">
                          {rec.reviewStage}회독
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          rec.completedPlan ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-red-50 text-red-700 border border-red-150'
                        }`}>
                          {rec.completedPlan ? '계획완수' : '계획미달'}
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 flex items-center gap-0.5">
                          <Smile className="w-3 h-3 text-slate-500" />
                          <span>{rec.condition}/5</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 max-w-[200px] truncate text-slate-600 italic" title={rec.managerNote}>
                      {rec.managerNote ? `"${rec.managerNote}"` : '-'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {!isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onConfirm(rec.id)}
                            className="flex items-center gap-0.5 px-2 py-1 bg-slate-800 text-white rounded text-[11px] font-medium hover:bg-slate-750 transition-all active:scale-[0.97]"
                          >
                            <Check className="w-3 h-3" />
                            <span>승인</span>
                          </button>
                          <button
                            onClick={() => startEdit(rec)}
                            className="flex items-center gap-0.5 px-2 py-1 bg-white border border-slate-250 text-slate-650 rounded text-[11px] font-medium hover:bg-slate-50 transition-all"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>수정 후 승인</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500">수정 중...</span>
                      )}
                    </td>
                  </tr>

                  {/* 인라인 수정 폼 행 */}
                  {isEditing && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={5} className="p-3">
                        <div className="flex flex-col gap-3 max-w-3xl border border-slate-200 rounded-lg p-3 bg-white">
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {student.name} 학생 기록 수정 ({rec.date})
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-normal">
                            {/* 출결 */}
                            <div className="flex flex-col gap-1">
                              <label className="text-slate-400">출결 상태</label>
                              <select
                                value={editAtt}
                                onChange={(e) => setEditAtt(e.target.value as Attendance)}
                                className="px-2 py-1 border border-slate-250 rounded focus:outline-none focus:border-slate-450 bg-[#FAF9F6] text-slate-800"
                              >
                                <option value="정상">정상 등원</option>
                                <option value="지각">지각 등원</option>
                                <option value="외출">외출/조퇴</option>
                                <option value="결석">결석</option>
                              </select>
                            </div>

                            {/* 학습시간 */}
                            <div className="flex flex-col gap-1">
                              <label className="text-slate-400">학습 시간 (분)</label>
                              <input
                                type="number"
                                value={editMinutes}
                                disabled={editAtt === '결석'}
                                onChange={(e) => setEditMinutes(Number(e.target.value))}
                                className="px-2 py-1 border border-slate-250 rounded focus:outline-none focus:border-slate-450 bg-[#FAF9F6] text-slate-850 disabled:opacity-40"
                              />
                            </div>

                            {/* 회독 */}
                            <div className="flex flex-col gap-1">
                              <label className="text-slate-400">회독 단계</label>
                              <select
                                value={editStage}
                                disabled={editAtt === '결석'}
                                onChange={(e) => setEditStage(Number(e.target.value) as 1 | 2 | 3)}
                                className="px-2 py-1 border border-slate-250 rounded focus:outline-none focus:border-slate-450 bg-[#FAF9F6] text-slate-800 disabled:opacity-40"
                              >
                                <option value={1}>1회독 (개념)</option>
                                <option value={2}>2회독 (문제)</option>
                                <option value={3}>3회독 (암기)</option>
                              </select>
                            </div>

                            {/* 계획완수 */}
                            <div className="flex flex-col gap-1 justify-center">
                              <span className="text-slate-450 mb-1">계획 완수</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editCompleted && editAtt !== '결석'}
                                  disabled={editAtt === '결석'}
                                  onChange={(e) => setEditCompleted(e.target.checked)}
                                  className="w-4 h-4 rounded text-slate-800 accent-slate-800 focus:ring-0 disabled:opacity-40"
                                  id={`edit-comp-${rec.id}`}
                                />
                                <label htmlFor={`edit-comp-${rec.id}`} className="text-slate-700 cursor-pointer disabled:opacity-40">
                                  오늘 계획 완료
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-normal">
                            {/* 컨디션 */}
                            <div className="flex flex-col gap-1">
                              <label className="text-slate-400">컨디션 ({editCondition}/5)</label>
                              <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 border border-slate-200 rounded max-w-xs">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setEditCondition(i + 1)}
                                    className={`p-1 rounded transition-colors ${
                                      editCondition === i + 1 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-200'
                                    }`}
                                  >
                                    <Smile className="w-3.5 h-3.5" />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 매니저 관찰/메모 */}
                            <div className="flex flex-col gap-1">
                              <label className="text-slate-400">피드백 코멘트 / 관찰 메모</label>
                              <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                className="px-3 py-1 border border-slate-250 rounded focus:outline-none focus:border-slate-450 bg-[#FAF9F6] text-slate-800"
                                placeholder="코멘트 추가 가능"
                              />
                            </div>
                          </div>

                          {/* 저장/취소 버튼 */}
                          <div className="flex justify-end gap-1.5 mt-2 border-t border-slate-100 pt-2">
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-0.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              <span>취소</span>
                            </button>
                            <button
                              onClick={() => handleSave(rec)}
                              className="flex items-center gap-0.5 px-3 py-1.5 bg-slate-800 text-white rounded text-[11px] font-semibold hover:bg-slate-750 transition-colors"
                            >
                              <Save className="w-3 h-3" />
                              <span>저장 및 승인</span>
                            </button>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
