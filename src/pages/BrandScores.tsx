import { useEffect, useState } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import ScoreBar from '@/components/ScoreBar';
import Spinner from '@/components/Spinner';
import { Search, ChevronRight, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BrandRow {
  id: string;
  brand_name: string;
  category: string | null;
  compliance_score: number;
  total_violations: number;
  status: string;
}

const statusBadgeMap: Record<string, { color: 'green' | 'orange' | 'red'; label: string }> = {
  compliant: { color: 'green', label: 'Compliant' },
  watchlist: { color: 'orange', label: 'Watch List' },
  priority: { color: 'red', label: 'Priority Inspection' },
};

export default function BrandScores() {
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const { data } = await supabase
        .from('brands')
        .select('id, brand_name, category, compliance_score, total_violations, status')
        .order('compliance_score', { ascending: false });
      setBrands((data ?? []) as BrandRow[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const filtered = brands.filter((b) => b.brand_name.toLowerCase().includes(search.toLowerCase()));

  const summary = {
    compliant: brands.filter((b) => b.status === 'compliant').length,
    watchlist: brands.filter((b) => b.status === 'watchlist').length,
    priority: brands.filter((b) => b.status === 'priority').length,
  };

  const summaryCards = [
    { label: 'Fully Compliant', value: summary.compliant, glow: 'green' as const },
    { label: 'Watch List', value: summary.watchlist, glow: 'orange' as const },
    { label: 'Priority Inspection', value: summary.priority, glow: 'red' as const },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#111827]">Brand Scores</h2>
        <p className="text-sm font-medium text-[#6B7280]">Compliance scoring across registered brands</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((s) => (
          <GlassCard key={s.label} glow={s.glow} className="p-5">
            <p className="font-display text-3xl font-bold text-[#111827]">
              {s.value}
            </p>
            <p className="mt-1 text-sm font-medium text-[#1F2937]">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brand or product..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Brand list */}
      <div className="space-y-3">
        {loading ? (
          <Spinner label="Loading brand scores..." />
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm font-medium text-[#6B7280]">
            {search ? `No brands found matching "${search}"` : 'No brands found'}
          </div>
        ) : (
          filtered.map((b) => {
            const badge = statusBadgeMap[b.status] ?? statusBadgeMap.compliant;
            return (
              <GlassCard key={b.id} className="p-4 border border-gray-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Brand info */}
                  <div className="flex items-center gap-3 sm:w-56">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <ShoppingBag className="h-5 w-5 text-[#4B5563]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#111827]">{b.brand_name}</p>
                      <p className="truncate text-xs font-medium text-[#4B5563]">{b.category ?? '—'}</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1F2937]">Compliance Score</span>
                      <span className="text-sm font-bold text-[#111827]">
                        {b.compliance_score}/100
                      </span>
                    </div>
                    <ScoreBar score={b.compliance_score} />
                  </div>

                  {/* Violations + status */}
                  <div className="flex items-center gap-3 sm:w-auto">
                    <span className="text-xs font-medium text-[#4B5563]">{b.total_violations} violations</span>
                    <Badge color={badge.color}>{badge.label}</Badge>
                    <button className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] transition-colors hover:bg-gray-50">
                      View Details
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
