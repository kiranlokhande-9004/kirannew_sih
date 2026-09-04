interface ScoreBarProps {
  score: number;
  max?: number;
  height?: string;
}

export default function ScoreBar({ score, max = 100, height = 'h-2' }: ScoreBarProps) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className={`w-full ${height} rounded-full bg-[#E5E7EB] overflow-hidden`}>
      <div
        className={`${height} rounded-full bg-[#0F172A] transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
