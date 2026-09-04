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
    { label: 'Fully Compliant', value: summary.compliant, color: 'green' as const },
    { label: 'Watch List', value: summary.watchlist, color: 'orange' as const },
    { label: 'Priority Inspection', value: summary.priority, color: 'red' as const },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">Brand Scores</h2>
        <p className="text-sm text-text-secondary">Compliance scoring across registered brands</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((s) => (
          <GlassCard key={s.label} className="p-5">
            <p className={`font-display text-3xl font-bold ${s.color === 'green' ? 'text-semantic-success' : s.color === 'orange' ? 'text-semantic-warning' : 'text-semantic-error'}`}>
              {s.value}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brand or product..."
          className="w-full rounded-lg border border-border bg-surface-subtle py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
        />
      </div>

      {/* Brand list */}
      <div className="space-y-3">
        {loading ? (
          <Spinner label="Loading brand scores..." />
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-secondary">
            {search ? `No brands found matching "${search}"` : 'No brands found'}
          </div>
        ) : (
          filtered.map((b) => {
            const badge = statusBadgeMap[b.status] ?? statusBadgeMap.compliant;
            return (
              <GlassCard key={b.id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Brand info */}
                  <div className="flex items-center gap-3 sm:w-56">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle">
                      <ShoppingBag className="h-5 w-5 text-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{b.brand_name}</p>
                      <p className="truncate text-xs text-text-secondary">{b.category ?? '—'}</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Compliance Score</span>
                      <span className="text-sm font-bold text-text-primary">
                        {b.compliance_score}/100
                      </span>
                    </div>
                    <ScoreBar score={b.compliance_score} />
                  </div>

                  {/* Violations + status */}
                  <div className="flex items-center gap-3 sm:w-auto">
                    <span className="text-xs text-text-secondary">{b.total_violations} violations</span>
                    <Badge color={badge.color}>{badge.label}</Badge>
                    <button className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-subtle">
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
