interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'red' | 'green' | 'orange' | 'yellow' | 'violet' | 'gray';
  className?: string;
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-900 border-blue-200',
  red: 'bg-red-50 text-red-900 border-red-200',
  green: 'bg-emerald-50 text-emerald-950 border-emerald-200',
  orange: 'bg-orange-50 text-orange-950 border-orange-200',
  yellow: 'bg-amber-50 text-amber-950 border-amber-300',
  violet: 'bg-purple-50 text-purple-950 border-purple-200',
  gray: 'bg-gray-100 text-gray-900 border-gray-200',
};

export default function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  );
}
