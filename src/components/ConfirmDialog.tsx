import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

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
  if (!isOpen) return null;

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

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      {/* Dialog */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${style.iconBg} ${style.iconColor} flex items-center justify-center mx-auto`}>
            <Icon className="h-7 w-7" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-slate-800 text-center tracking-tight">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-slate-600 text-center leading-relaxed">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all duration-200 active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all duration-200 active:scale-95 shadow-lg ${style.buttonBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
