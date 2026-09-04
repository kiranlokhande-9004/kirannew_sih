import { useEffect, useState, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { Camera, Upload, CheckCircle2, FileText, AlertTriangle, AlertCircle, Info, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { analyzeLabel, type LabelAnalysis, type LabelViolation } from '@/lib/gemini';

const severityConfig = {
  critical: { color: 'red' as const, icon: AlertTriangle, label: 'CRITICAL' },
  major: { color: 'orange' as const, icon: AlertCircle, label: 'MAJOR' },
  minor: { color: 'yellow' as const, icon: Info, label: 'MINOR' },
};

interface RecentScan {
  id: string;
  product_name: string | null;
  manufacturer: string | null;
  is_compliant: boolean;
  scanned_at: string;
}

export default function LabelScanner() {
  const { toasts, showToast, closeToast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LabelAnalysis | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRecentScans();
  }, []);

  async function fetchRecentScans() {
    try {
      const { data } = await supabase
        .from('scans')
        .select('id, product_name, manufacturer, is_compliant, scanned_at')
        .order('scanned_at', { ascending: false })
        .limit(3);
      setRecentScans((data ?? []) as RecentScan[]);
    } catch {
      // silent
    } finally {
      setLoadingRecent(false);
    }
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPG, PNG, HEIC)', 'error');
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Step 1: Upload to Supabase Storage
      const fileName = `scan-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('label-scans')
        .upload(fileName, file);

      let photoUrl: string | null = null;
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('label-scans').getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      // Step 2: Analyze with Gemini
      const result = await analyzeLabel(file);
      setAnalysis(result);

      // Step 3: Save scan result to Supabase
      await supabase.from('scans').insert({
        product_name: result.product_name,
        manufacturer: result.manufacturer,
        violations_found: result.violations,
        is_compliant: result.is_compliant,
        photo_url: photoUrl,
      });

      showToast('Label analyzed successfully', 'success');
      fetchRecentScans();
    } catch {
      showToast('Something went wrong. Try again.', 'error');
      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const violationCount = analysis?.violations.length ?? 0;
  const isCompliant = analysis?.is_compliant ?? false;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">Label Scanner</h2>
        <p className="text-sm text-text-muted">Upload a product label photo for AI-powered compliance analysis</p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/heic" onChange={handleFileSelect} className="hidden" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          <GlassCard hover={false} className="p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">Scan Product Label</h3>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] py-12 transition-colors hover:border-brand-blue/40 hover:bg-brand-blue/[0.03]">
              {previewUrl && analyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={previewUrl} alt="Label preview" className="max-h-32 rounded-lg object-contain opacity-60" />
                  <Spinner label="AI analyzing label..." />
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <Camera className="h-8 w-8 text-text-muted" />
                  </div>
                  <p className="mt-4 text-sm text-text-muted">Point camera at label or upload photo</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/30 transition-all hover:bg-brand-blue/90 hover:shadow-brand-blue/40 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                  <p className="mt-3 text-xs text-text-muted/60">Accepted: JPG, PNG, HEIC</p>
                </>
              )}
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">Recently Scanned</h3>
            {loadingRecent ? (
              <Spinner label="Loading recent scans..." />
            ) : recentScans.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-muted">No scans yet</p>
            ) : (
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                      <ImageIcon className="h-5 w-5 text-text-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{scan.product_name ?? 'Unknown product'}</p>
                      <p className="truncate text-xs text-text-muted">{scan.manufacturer ?? 'Unknown manufacturer'}</p>
                    </div>
                    <Badge color={scan.is_compliant ? 'green' : 'red'}>
                      {scan.is_compliant ? 'Compliant' : 'Flagged'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* RIGHT PANEL */}
        <GlassCard hover={false} className="p-6">
          {analyzing && !analysis ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Spinner label="Running AI compliance check..." />
            </div>
          ) : analysis ? (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-text-primary">Compliance Analysis</h3>
                  <p className="text-sm text-text-muted">Product: {analysis.product_name}</p>
                  <p className="text-xs text-text-muted/70">Manufacturer: {analysis.manufacturer}</p>
                </div>
                <div
                  className={`rounded-xl border px-3 py-1.5 text-right ${
                    isCompliant
                      ? 'border-brand-green/30 bg-brand-green/15'
                      : 'border-brand-red/30 bg-brand-red/15'
                  }`}
                >
                  <p className={`text-xs font-bold ${isCompliant ? 'text-brand-green' : 'text-brand-red'}`}>
                    {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </p>
                  <p className={`text-[10px] ${isCompliant ? 'text-brand-green/80' : 'text-brand-red/80'}`}>
                    {violationCount} Violation{violationCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {violationCount > 0 && (
                <>
                  <h4 className="mb-3 text-sm font-semibold text-text-muted uppercase tracking-wide">Violations Detected</h4>
                  <div className="space-y-3">
                    {analysis.violations.map((v: LabelViolation, i: number) => {
                      const cfg = severityConfig[v.severity] ?? severityConfig.minor;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border-l-4 bg-white/[0.03] p-4 ${
                            v.severity === 'critical' ? 'border-l-brand-red' : v.severity === 'major' ? 'border-l-brand-orange' : 'border-l-brand-yellow'
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${v.severity === 'critical' ? 'text-brand-red' : v.severity === 'major' ? 'text-brand-orange' : 'text-brand-yellow'}`} />
                            <Badge color={cfg.color}>{cfg.label}</Badge>
                          </div>
                          <p className="text-sm font-semibold text-text-primary">{v.type}</p>
                          <p className="mt-1 text-xs text-text-muted">{v.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {violationCount === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-brand-green" />
                  <p className="mt-3 text-sm font-medium text-brand-green">No violations detected</p>
                  <p className="mt-1 text-xs text-text-muted">This label appears to be PCR 2011 compliant</p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/30 transition-all hover:bg-brand-blue/90">
                  <FileText className="h-4 w-4" />
                  Generate Form 16 Report
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-text-primary transition-all hover:bg-white/5">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Compliant
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <Camera className="h-12 w-12 text-text-muted/40" />
              <p className="mt-4 text-sm text-text-muted">Upload a label to see AI compliance analysis</p>
              <p className="mt-1 text-xs text-text-muted/60">Results powered by Google Gemini Vision</p>
            </div>
          )}
        </GlassCard>
      </div>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
