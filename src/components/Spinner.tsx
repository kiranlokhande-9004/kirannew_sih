import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export default function Spinner({ label, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      {label && <p className="text-sm font-medium text-[#4B5563]">{label}</p>}
    </div>
  );
}
