import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'blue' | 'red' | 'green' | 'orange' | 'violet' | 'none';
  hover?: boolean;
}

export default function GlassCard({ children, className = '', glow = 'none', hover = true }: GlassCardProps) {
  const hoverClass = hover ? 'card-hover' : '';
  return (
    <div className={`card ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
