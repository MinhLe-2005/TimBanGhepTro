import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "success" | "info" | "warning";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "info"
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const typeStyles = {
    danger: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      buttonBg: "bg-red-600 hover:bg-red-700",
      icon: AlertCircle
    },
    success: {
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
      icon: CheckCircle
    },
    info: {
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200",
      iconColor: "text-sky-600",
      iconBg: "bg-sky-100",
      buttonBg: "bg-sky-600 hover:bg-sky-700",
      icon: Info
    },
    warning: {
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
      buttonBg: "bg-amber-600 hover:bg-amber-700",
      icon: AlertTriangle
    }
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      {/* Dialog */}
      <div 
        className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Content */}
        <div className="p-7 space-y-5">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${style.iconBg} ${style.iconColor} flex items-center justify-center mx-auto shadow-sm border border-white`}>
            <Icon className="h-8 w-8 stroke-[2.5px]" />
          </div>

          {/* Title & Message */}
          <div className="space-y-2">
            <h3 className="text-[20px] font-black text-slate-800 text-center tracking-tight">
              {title}
            </h3>
            <p className="text-[14px] font-medium text-slate-500 text-center leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[14px] transition-all duration-200 active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3.5 px-4 rounded-[16px] text-white font-bold text-[14px] transition-all duration-200 active:scale-95 shadow-md ${style.buttonBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
