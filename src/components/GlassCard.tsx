import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'blue' | 'red' | 'green' | 'orange' | 'violet' | 'none';
  hover?: boolean;
}

export default function GlassCard({ children, className = '', glow = 'none', hover = true }: GlassCardProps) {
  const glowClass = glow !== 'none' ? `glow-${glow}` : '';
  const hoverClass = hover ? 'glass-hover' : '';
  return (
    <div className={`glass rounded-2xl ${glowClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
