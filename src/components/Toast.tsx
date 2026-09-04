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
  success: 'text-semantic-success border-semantic-success/25',
  error: 'text-semantic-error border-semantic-error/25',
  info: 'text-brand-blue border-brand-blue/25',
};

export default function Toast({ toast, onClose }: ToastProps) {
  const Icon = iconMap[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className={`card flex items-center gap-3 border px-4 py-3 animate-slide-up`}>
      <Icon className={`h-5 w-5 shrink-0 ${toast.type === 'success' ? 'text-semantic-success' : toast.type === 'error' ? 'text-semantic-error' : 'text-brand-blue'}`} />
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="text-text-secondary hover:text-text-primary">
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
