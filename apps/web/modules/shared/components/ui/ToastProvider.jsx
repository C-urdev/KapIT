'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-[#eef6ee] dark:bg-[#1a2e1f]',
    border: 'border-[#a3b18a] dark:border-[#3a5a40]',
    iconColor: 'text-[#3a5a40] dark:text-[#82ad86]',
    textColor: 'text-[#2f4e35] dark:text-[#d0ddd2]',
  },
  error: {
    icon: XCircle,
    bg: 'bg-[#fef2f2] dark:bg-[#2a1a1a]',
    border: 'border-[#e5a0a0] dark:border-[#7c3434]',
    iconColor: 'text-[#bc4749] dark:text-[#e57373]',
    textColor: 'text-[#7c2d2d] dark:text-[#f5c6c6]',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-[#fefce8] dark:bg-[#2a2517]',
    border: 'border-[#e5d38a] dark:border-[#7c6a2e]',
    iconColor: 'text-[#92700c] dark:text-[#f0c766]',
    textColor: 'text-[#78590a] dark:text-[#f5e0a0]',
  },
  info: {
    icon: Info,
    bg: 'bg-[#eff6ff] dark:bg-[#1a2233]',
    border: 'border-[#93b5e0] dark:border-[#2d4a6f]',
    iconColor: 'text-[#2563eb] dark:text-[#7cb3f5]',
    textColor: 'text-[#1e3a5f] dark:text-[#c6dcf5]',
  },
};

const DEFAULT_DURATION = 4000;

function ToastItem({ toast, onDismiss }) {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const startExit = useCallback(() => {
    setExiting(true);
    window.setTimeout(() => onDismiss(toast.id), 280);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (toast.duration === Infinity) return undefined;
    timerRef.current = window.setTimeout(startExit, toast.duration || DEFAULT_DURATION);
    return () => window.clearTimeout(timerRef.current);
  }, [startExit, toast.duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex w-full max-w-[min(92vw,420px)] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl shadow-black/10 backdrop-blur-sm transition-all duration-280 ease-out dark:shadow-black/30 ${config.bg} ${config.border} ${
        exiting
          ? 'translate-x-[110%] opacity-0 sm:translate-x-[110%]'
          : 'translate-x-0 opacity-100'
      }`}
      style={{ animation: exiting ? undefined : 'toast-slide-in 0.3s ease-out' }}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} />
      <p className={`flex-1 text-sm font-medium leading-relaxed ${config.textColor}`}>{toast.message}</p>
      <button
        type="button"
        onClick={() => startExit()}
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md opacity-50 transition-opacity hover:opacity-100 ${config.textColor}`}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration) => {
    const id = ++toastIdCounter;
    setToasts((current) => [...current.slice(-4), { id, type, message, duration: duration ?? DEFAULT_DURATION }]);
    return id;
  }, []);

  const api = useMemo(() => ({
    success: (message, duration) => addToast('success', message, duration),
    error: (message, duration) => addToast('error', message, duration),
    warning: (message, duration) => addToast('warning', message, duration),
    info: (message, duration) => addToast('info', message, duration),
    dismiss,
  }), [addToast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast container */}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col-reverse items-center gap-2.5 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:bottom-auto sm:right-0 sm:top-0 sm:flex-col sm:items-end sm:px-5 sm:pb-0 sm:pt-20"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>

      {/* Keyframe animation injected once */}
      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(40%) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @media (max-width: 639px) {
          @keyframes toast-slide-in {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
