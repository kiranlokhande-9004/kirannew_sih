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
  success: 'text-brand-green border-brand-green/30',
  error: 'text-brand-red border-brand-red/30',
  info: 'text-brand-blue border-brand-blue/30',
};

export default function Toast({ toast, onClose }: ToastProps) {
  const Icon = iconMap[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className={`glass flex items-center gap-3 rounded-xl border ${colorMap[toast.type]} px-4 py-3 shadow-lg animate-slide-up`}>
      <Icon className={`h-5 w-5 shrink-0 ${toast.type === 'success' ? 'text-brand-green' : toast.type === 'error' ? 'text-brand-red' : 'text-brand-blue'}`} />
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="text-text-muted hover:text-text-primary">
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
