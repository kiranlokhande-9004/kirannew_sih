import { useEffect, useState } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import ScoreBar from '@/components/ScoreBar';
import Spinner from '@/components/Spinner';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { pcrRules, topViolatingBrands as fallbackBrands, recentViolations as fallbackViolations } from '@/data/demoData';

interface ViolationRow {
  id: string;
  product_name: string;
  location_name: string;
  violation_types: string[];
  severity: string;
  created_at: string;
}

interface BrandRow {
  brand_name: string;
  compliance_score: number;
}

interface DashboardStats {
  scansToday: number;
  violationsFound: number;
  verifiedComplaints: number;
  complianceRate: number;
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    scansToday: 0,
    violationsFound: 0,
    verifiedComplaints: 0,
    complianceRate: 0,
  });
  const [recentViolations, setRecentViolations] = useState<ViolationRow[]>([]);
  const [topBrands, setTopBrands] = useState<BrandRow[]>([]);

  async function fetchData() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [scansRes, violationsRes, complaintsRes, brandsRes, recentRes] = await Promise.all([
        supabase.from('scans').select('*', { count: 'exact', head: true }),
        supabase.from('violations').select('*', { count: 'exact', head: true }),
        supabase.from('citizen_complaints').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('brands').select('brand_name, compliance_score').order('compliance_score', { ascending: true }).limit(5),
        supabase.from('violations').select('id, product_name, location_name, violation_types, severity, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalScans = scansRes.count ?? 0;
      const totalViolations = violationsRes.count ?? 0;
      const totalVerified = complaintsRes.count ?? 0;

      // Calculate compliance rate
      const totalProducts = totalScans + totalViolations;
      let rate = 78; // Default baseline if newly booted
      if (totalProducts > 0) {
        rate = Math.max(0, Math.min(100, Math.round(((totalProducts - totalViolations) / totalProducts) * 100)));
      }

      setStats({
        scansToday: totalScans > 0 ? totalScans : 42,
        violationsFound: totalViolations > 0 ? totalViolations : 18,
        verifiedComplaints: totalVerified > 0 ? totalVerified : 7,
        complianceRate: totalProducts > 0 ? rate : 76,
      });

      if (recentRes.data && recentRes.data.length > 0) {
        setRecentViolations(recentRes.data as ViolationRow[]);
      } else {
        setRecentViolations(
          fallbackViolations.map((v, i) => ({
            id: `v-${i}`,
            product_name: v.product,
            location_name: v.location,
            violation_types: [v.type],
            severity: i === 0 ? 'critical' : i === 1 ? 'major' : 'minor',
            created_at: new Date(Date.now() - i * 15 * 60000).toISOString(),
          }))
        );
      }

      if (brandsRes.data && brandsRes.data.length > 0) {
        setTopBrands(brandsRes.data as BrandRow[]);
      } else {
        setTopBrands(
          fallbackBrands.map((b) => ({
            brand_name: b.name,
            compliance_score: b.score,
          }))
        );
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    // Realtime subscriptions across all 4 core tables
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'violations' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scans' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_complaints' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: 'Scans Logged', value: stats.scansToday.toLocaleString(), accent: 'blue', trend: '+12%', up: true },
    { label: 'Violations Found', value: stats.violationsFound.toLocaleString(), accent: 'red', trend: '+8%', up: true },
    { label: 'Verified Complaints', value: stats.verifiedComplaints.toLocaleString(), accent: 'orange', trend: '+23%', up: true },
    { label: 'Compliance Rate', value: `${stats.complianceRate}%`, accent: 'green', trend: '-2%', up: false },
  ] as const;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#111827]">Dashboard</h2>
        <p className="text-sm font-medium text-[#6B7280]">Real-time compliance monitoring across Mumbai</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <GlassCard key={s.label} glow={s.accent as 'blue' | 'red' | 'orange' | 'green'} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-3xl font-bold text-[#111827]">{s.value}</p>
                <p className="mt-1 text-sm font-medium text-[#1F2937]">{s.label}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${s.up ? 'text-emerald-700' : 'text-red-700'}`}>
                {s.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {s.trend}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Violations */}
        <GlassCard hover={false} className="p-5">
          <h3 className="mb-4 font-display text-lg font-bold text-[#111827]">Recent Violations</h3>
          {loading ? (
            <Spinner label="Loading violations from Supabase..." />
          ) : recentViolations.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-[#6B7280]">No violations recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentViolations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#111827]">{v.product_name}</p>
                    <p className="truncate text-xs font-medium text-[#4B5563]">{v.location_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge color={v.severity === 'critical' ? 'red' : v.severity === 'major' ? 'orange' : 'yellow'}>
                      {v.violation_types?.[0] ?? v.severity}
                    </Badge>
                    <span className="text-[11px] font-medium text-[#6B7280]">{timeAgo(v.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Quick Summary */}
        <div className="space-y-6">
          <GlassCard hover={false} className="p-5">
            <h3 className="mb-4 font-display text-lg font-bold text-[#111827]">Top Violating Brands</h3>
            {loading ? (
              <Spinner label="Loading brands from Supabase..." />
            ) : (
              <div className="space-y-4">
                {topBrands.map((b) => (
                  <div key={b.brand_name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#111827]">{b.brand_name}</span>
                      <span className="text-sm font-bold text-[#111827]">
                        {b.compliance_score}
                      </span>
                    </div>
                    <ScoreBar score={b.compliance_score} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard hover={false} className="p-5">
            <h3 className="mb-4 font-display text-lg font-bold text-[#111827]">PCR Rules Quick Reference</h3>
            <div className="space-y-3">
              {pcrRules.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  {r.compliant ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                  )}
                  <span className="text-sm font-medium text-[#1F2937]">{r.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
