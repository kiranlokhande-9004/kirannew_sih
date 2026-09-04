import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export default function Spinner({ label, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      {label && <p className="text-sm text-text-muted">{label}</p>}
    </div>
  );
}
