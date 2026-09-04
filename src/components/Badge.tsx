interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'red' | 'green' | 'orange' | 'yellow' | 'violet' | 'gray';
  className?: string;
}

const colorMap: Record<string, string> = {
  blue: 'bg-brand-blue-light text-brand-blue border-brand-blue/25',
  red: 'bg-semantic-error-bg text-semantic-error border-semantic-error/25',
  green: 'bg-semantic-success-bg text-semantic-success border-semantic-success/25',
  orange: 'bg-semantic-warning-bg text-semantic-warning border-semantic-warning/25',
  yellow: 'bg-semantic-warning-bg text-semantic-warning border-semantic-warning/25',
  violet: 'bg-brand-blue-light text-brand-navy border-brand-navy/25',
  gray: 'bg-surface-subtle text-text-secondary border-border',
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
