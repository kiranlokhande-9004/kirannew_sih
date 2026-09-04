import { useEffect, useState } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import ScoreBar from '@/components/ScoreBar';
import Spinner from '@/components/Spinner';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { pcrRules } from '@/data/demoData';

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

const accentText: Record<string, string> = {
  blue: 'text-brand-blue',
  red: 'text-semantic-error',
  orange: 'text-semantic-warning',
  green: 'text-semantic-success',
};

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

  useEffect(() => {
    async function fetchData() {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [scansRes, violationsRes, complaintsRes, brandsRes, recentRes] = await Promise.all([
          supabase.from('scans').select('*', { count: 'exact', head: true }).gte('scanned_at', todayStart.toISOString()),
          supabase.from('violations').select('*', { count: 'exact', head: true }),
          supabase.from('citizen_complaints').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
          supabase.from('brands').select('brand_name, compliance_score').order('compliance_score', { ascending: true }).limit(5),
          supabase.from('violations').select('id, product_name, location_name, violation_types, severity, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        const totalScans = scansRes.count ?? 0;
        const totalViolations = violationsRes.count ?? 0;
        const totalVerified = complaintsRes.count ?? 0;
        const totalProducts = totalScans + totalViolations;
        const rate = totalProducts > 0 ? Math.round(((totalProducts - totalViolations) / totalProducts) * 100) : 0;

        setStats({
          scansToday: totalScans,
          violationsFound: totalViolations,
          verifiedComplaints: totalVerified,
          complianceRate: rate,
        });
        setRecentViolations((recentRes.data ?? []) as ViolationRow[]);
        setTopBrands((brandsRes.data ?? []) as BrandRow[]);
      } catch {
        // silent fail — keep zeros
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Realtime: refresh recent violations when new ones are inserted
    const channel = supabase
      .channel('dashboard-violations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'citizen_complaints' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: 'Scans Today', value: stats.scansToday.toLocaleString(), accent: 'blue', trend: '+12%', up: true },
    { label: 'Violations Found', value: stats.violationsFound.toLocaleString(), accent: 'red', trend: '+8%', up: true },
    { label: 'Verified Complaints', value: stats.verifiedComplaints.toLocaleString(), accent: 'orange', trend: '+23%', up: true },
    { label: 'Compliance Rate', value: `${stats.complianceRate}%`, accent: 'green', trend: '-2%', up: false },
  ] as const;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">Dashboard</h2>
        <p className="text-sm text-text-secondary">Real-time compliance monitoring across Mumbai</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <GlassCard key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className={`font-display text-3xl font-bold ${accentText[s.accent]}`}>{s.value}</p>
                <p className="mt-1 text-sm text-text-secondary">{s.label}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${s.up ? 'text-semantic-success' : 'text-semantic-error'}`}>
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
          <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">Recent Violations</h3>
          {loading ? (
            <Spinner label="Loading violations..." />
          ) : recentViolations.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">No violations recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentViolations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-subtle p-3 transition-colors hover:bg-surface-base hover:border-border"
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-semantic-error opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-semantic-error" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{v.product_name}</p>
                    <p className="truncate text-xs text-text-secondary">{v.location_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge color={v.severity === 'critical' ? 'red' : v.severity === 'major' ? 'orange' : 'yellow'}>
                      {v.violation_types[0] ?? v.severity}
                    </Badge>
                    <span className="text-[11px] text-text-muted">{timeAgo(v.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Quick Summary */}
        <div className="space-y-6">
          <GlassCard hover={false} className="p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">Top Violating Brands</h3>
            {loading ? (
              <Spinner label="Loading brands..." />
            ) : (
              <div className="space-y-4">
                {topBrands.map((b) => (
                  <div key={b.brand_name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{b.brand_name}</span>
                      <span className="text-sm font-bold text-text-primary">{b.compliance_score}</span>
                    </div>
                    <ScoreBar score={b.compliance_score} />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard hover={false} className="p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">PCR Rules Quick Reference</h3>
            <div className="space-y-3">
              {pcrRules.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  {r.compliant ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-semantic-success" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-semantic-error" />
                  )}
                  <span className={`text-sm ${r.compliant ? 'text-text-primary' : 'text-text-secondary'}`}>{r.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
