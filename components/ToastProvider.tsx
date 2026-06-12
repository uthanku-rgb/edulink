'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';

/* ── 타입 ─────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

/* ── Context ──────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ── Provider ─────────────────────────────────────── */

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        // 동시 최대 3개
        return next.length > 3 ? next.slice(-3) : next;
      });

      // success: 2.5초, info: 3초 자동 소멸 / error: 수동 닫기
      if (type !== 'error') {
        const delay = type === 'success' ? 2500 : 3000;
        const timer = setTimeout(() => removeToast(id), delay);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast],
  );

  // 언마운트 시 타이머 정리
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const ctx: ToastContextValue = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    info: (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* ── 토스트 컨테이너 (우하단 고정) ── */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none"
          style={{ maxWidth: 360 }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-sm text-xs font-medium animate-in slide-in-from-right-5 fade-in duration-200 ${
                t.type === 'success'
                  ? 'bg-white border-emerald-200 text-emerald-800'
                  : t.type === 'error'
                    ? 'bg-white border-red-200 text-red-800'
                    : 'bg-white border-[#E5E1DA] text-slate-700'
              }`}
            >
              <span className="shrink-0 mt-px text-sm">
                {t.type === 'success' && '✓'}
                {t.type === 'error' && '✕'}
                {t.type === 'info' && 'ℹ'}
              </span>
              <span className="flex-1 leading-relaxed">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 ml-1 mt-px text-sm leading-none"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
