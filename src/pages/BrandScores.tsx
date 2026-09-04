import { useEffect, useState } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import ScoreBar from '@/components/ScoreBar';
import Spinner from '@/components/Spinner';
import { Search, ShoppingBag } from 'lucide-react';
import { supabase, type Brand } from '@/lib/supabase';

function getBrandStatus(score: number): { key: 'compliant' | 'watchlist' | 'priority'; label: string; color: 'green' | 'orange' | 'red' } {
  if (score >= 90) {
    return { key: 'compliant', label: 'Compliant', color: 'green' };
  } else if (score >= 80) {
    return { key: 'watchlist', label: 'Watch List', color: 'orange' };
  } else {
    return { key: 'priority', label: 'Priority Inspection', color: 'red' };
  }
}

export default function BrandScores() {
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBrands() {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('compliance_score', { ascending: false });

      if (error) {
        console.error('Error fetching brands:', error);
        return;
      }
      setBrands((data ?? []) as Brand[]);
    } catch (err) {
      console.error('Failed to load brands:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBrands();

    const channel = supabase
      .channel('brands-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
        fetchBrands();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = brands.filter((b) =>
    b.brand_name.toLowerCase().includes(search.toLowerCase())
  );

  const summary = {
    compliant: brands.filter((b) => getBrandStatus(b.compliance_score).key === 'compliant').length,
    watchlist: brands.filter((b) => getBrandStatus(b.compliance_score).key === 'watchlist').length,
    priority: brands.filter((b) => getBrandStatus(b.compliance_score).key === 'priority').length,
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
        <p className="text-sm font-medium text-[#6B7280]">
          Legal Metrology compliance ratings based on packaging verification scans
        </p>
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
          placeholder="Search brand name..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Brand list */}
      <div className="space-y-3">
        {loading ? (
          <Spinner label="Loading brand scores from Supabase..." />
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm font-medium text-[#6B7280]">
            {search ? `No brands found matching "${search}"` : 'No brand records in database'}
          </div>
        ) : (
          filtered.map((b) => {
            const status = getBrandStatus(b.compliance_score);
            return (
              <GlassCard key={b.id} className="p-4 border border-gray-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Brand info */}
                  <div className="flex items-center gap-3 sm:w-64">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                      <ShoppingBag className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#111827]">{b.brand_name}</p>
                      <p className="truncate text-xs font-medium text-[#4B5563]">
                        {b.total_scans} total scans recorded
                      </p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1F2937]">PCR Compliance Score</span>
                      <span className="text-sm font-bold text-[#111827]">
                        {Math.round(b.compliance_score)}%
                      </span>
                    </div>
                    <ScoreBar score={b.compliance_score} />
                  </div>

                  {/* Violations + status */}
                  <div className="flex items-center gap-3 sm:w-auto shrink-0">
                    <span className="text-xs font-semibold text-[#DC2626] bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                      {b.violations} violations
                    </span>
                    <Badge color={status.color}>{status.label}</Badge>
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
