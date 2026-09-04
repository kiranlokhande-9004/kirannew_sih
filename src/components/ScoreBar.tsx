interface ScoreBarProps {
  score: number;
  max?: number;
  height?: string;
}

export default function ScoreBar({ score, max = 100, height = 'h-2' }: ScoreBarProps) {
  const pct = Math.min((score / max) * 100, 100);
  const color = score > 70 ? 'bg-brand-green' : score >= 40 ? 'bg-brand-orange' : 'bg-brand-red';
  return (
    <div className={`w-full ${height} rounded-full bg-white/8 overflow-hidden`}>
      <div
        className={`${height} rounded-full ${color} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
