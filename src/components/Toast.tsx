import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: number) => void;
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'text-emerald-800 border-emerald-300 bg-white',
  error: 'text-red-800 border-red-300 bg-white',
  info: 'text-blue-800 border-blue-300 bg-white',
};

export default function Toast({ toast, onClose }: ToastProps) {
  const Icon = iconMap[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className={`flex items-center gap-3 rounded-xl border ${colorMap[toast.type]} px-4 py-3 shadow-md animate-slide-up`}>
      <Icon className={`h-5 w-5 shrink-0 ${toast.type === 'success' ? 'text-emerald-700' : toast.type === 'error' ? 'text-red-700' : 'text-blue-700'}`} />
      <p className="flex-1 text-sm font-medium text-[#111827]">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="text-[#6B7280] hover:text-[#111827]">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}
