interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'red' | 'green' | 'orange' | 'yellow' | 'violet' | 'gray';
  className?: string;
}

const colorMap: Record<string, string> = {
  blue: 'bg-brand-blue/15 text-brand-blue border-brand-blue/30',
  red: 'bg-brand-red/15 text-brand-red border-brand-red/30',
  green: 'bg-brand-green/15 text-brand-green border-brand-green/30',
  orange: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  yellow: 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30',
  violet: 'bg-brand-violet/15 text-brand-violet border-brand-violet/30',
  gray: 'bg-white/8 text-text-muted border-white/15',
};

export default function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  );
}
