import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DialogType = 'confirm' | 'alert' | 'success' | 'error' | 'warning';

interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
}

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface DialogContextValue {
  confirm: (opts: DialogOptions) => Promise<boolean>;
  alert: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  toast: (message: string, type?: ToastItem['type'], duration?: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons = {
  confirm: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const typeStyles = {
  confirm:  { icon: 'text-blue-500',   bg: 'from-blue-50 to-white',    ring: 'ring-blue-200',   btn: 'bg-blue-600 hover:bg-blue-700' },
  success:  { icon: 'text-emerald-500',bg: 'from-emerald-50 to-white', ring: 'ring-emerald-200',btn: 'bg-emerald-600 hover:bg-emerald-700' },
  error:    { icon: 'text-red-500',    bg: 'from-red-50 to-white',     ring: 'ring-red-200',    btn: 'bg-red-600 hover:bg-red-700' },
  warning:  { icon: 'text-amber-500',  bg: 'from-amber-50 to-white',   ring: 'ring-amber-200',  btn: 'bg-amber-600 hover:bg-amber-700' },
  alert:    { icon: 'text-blue-500',   bg: 'from-blue-50 to-white',    ring: 'ring-blue-200',   btn: 'bg-blue-600 hover:bg-blue-700' },
};

const toastTypeStyles: Record<ToastItem['type'], { bar: string; icon: string; bg: string; text: string }> = {
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-600', bg: 'bg-white',  text: 'text-gray-800' },
  error:   { bar: 'bg-red-500',     icon: 'text-red-600',     bg: 'bg-white',  text: 'text-gray-800' },
  warning: { bar: 'bg-amber-500',   icon: 'text-amber-600',   bg: 'bg-white',  text: 'text-gray-800' },
  info:    { bar: 'bg-blue-500',    icon: 'text-blue-600',    bg: 'bg-white',  text: 'text-gray-800' },
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const style = toastTypeStyles[item.type];

  useEffect(() => {
    // Enter
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-leave
    const duration = item.duration ?? 3500;
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(item.id), 350);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(leaveTimer);
    };
  }, [item.id, item.duration, onRemove]);

  return (
    <div
      className={`
        relative flex items-start gap-3 min-w-[280px] max-w-[360px] rounded-xl shadow-xl
        overflow-hidden border border-gray-100 px-4 py-3 cursor-pointer
        transition-all duration-350 ease-out
        ${style.bg} ${style.text}
        ${visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
      style={{ transition: 'all 0.35s cubic-bezier(.4,0,.2,1)' }}
      onClick={() => { setLeaving(true); setTimeout(() => onRemove(item.id), 350); }}
    >
      {/* Color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar}`} />

      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${style.icon}`}>
        {icons[item.type === 'success' ? 'success' : item.type === 'error' ? 'error' : item.type === 'warning' ? 'warning' : 'info']}
      </span>

      {/* Message */}
      <p className="text-sm font-medium leading-snug flex-1 pr-1">{item.message}</p>

      {/* Close */}
      <button className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Dialog Component ─────────────────────────────────────────────────────────

interface DialogState {
  visible: boolean;
  opts: DialogOptions & { isConfirm: boolean };
  resolve: (val: boolean) => void;
}

function Dialog({ state, onClose }: { state: DialogState; onClose: (val: boolean) => void }) {
  const [entering, setEntering] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const type = state.opts.type || (state.opts.isConfirm ? 'confirm' : 'alert');
  const style = typeStyles[type] || typeStyles.confirm;

  useEffect(() => {
    const t = setTimeout(() => setEntering(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose(false);
    if (e.key === 'Enter') onClose(true);
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300
        ${entering ? 'bg-black/40 backdrop-blur-[2px]' : 'bg-black/0'}`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(false); }}
    >
      <div
        className={`
          relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden
          bg-gradient-to-b ${style.bg}
          ring-1 ${style.ring}
          transition-all duration-300 ease-out
          ${entering ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {/* Header gradient strip */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          type === 'error' ? 'from-red-400 to-red-600' :
          type === 'success' ? 'from-emerald-400 to-emerald-600' :
          type === 'warning' ? 'from-amber-400 to-amber-600' :
          'from-blue-400 to-blue-600'
        }`} />

        <div className="p-6 pt-7">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4
            ${type === 'error' ? 'bg-red-100' :
              type === 'success' ? 'bg-emerald-100' :
              type === 'warning' ? 'bg-amber-100' :
              'bg-blue-100'}
          `}>
            <span className={style.icon}>
              {icons[type === 'confirm' ? 'confirm' : type === 'alert' ? 'info' : type]}
            </span>
          </div>

          {/* Title */}
          {state.opts.title && (
            <h3 className="text-base font-semibold text-gray-900 mb-1">{state.opts.title}</h3>
          )}

          {/* Message */}
          <p className="text-sm text-gray-600 leading-relaxed">{state.opts.message}</p>

          {/* Buttons */}
          <div className="flex gap-2 mt-5">
            {state.opts.isConfirm && (
              <button
                onClick={() => onClose(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200
                  text-gray-600 bg-white hover:bg-gray-50 active:scale-95
                  transition-all duration-150"
              >
                {state.opts.cancelText || 'Hủy'}
              </button>
            )}
            <button
              onClick={() => onClose(true)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                ${style.btn} active:scale-95 transition-all duration-150 shadow-sm`}
            >
              {state.opts.confirmText || (state.opts.isConfirm ? 'Xác nhận' : 'Đóng')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showDialog = useCallback((opts: DialogOptions & { isConfirm: boolean }) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({ visible: true, opts, resolve });
    });
  }, []);

  const handleClose = useCallback((val: boolean) => {
    setDialogState(prev => {
      prev?.resolve(val);
      return null;
    });
  }, []);

  const confirmFn = useCallback((opts: DialogOptions) => {
    return showDialog({ ...opts, isConfirm: true });
  }, [showDialog]);

  const alertFn = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const toastType = type;
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type: toastType }]);
  }, []);

  const toastFn = useCallback((message: string, type: ToastItem['type'] = 'info', duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  return (
    <DialogContext.Provider value={{ confirm: confirmFn, alert: alertFn, toast: toastFn }}>
      {children}

      {/* Toast container - bottom right */}
      <div className="fixed bottom-5 right-5 z-[9998] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem item={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Dialog overlay */}
      {dialogState && (
        <Dialog state={dialogState} onClose={handleClose} />
      )}
    </DialogContext.Provider>
  );
}
