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

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // Step 1: Upload photo to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('label-scans').upload(fileName, file);

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
        <h2 className="font-display text-2xl font-bold text-[#111827]">Label Scanner</h2>
        <p className="text-sm font-medium text-[#6B7280]">Upload a product label photo for AI-powered compliance analysis</p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/heic" onChange={handleFileSelect} className="hidden" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          <GlassCard hover={false} className="p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-[#111827]">Scan Product Label</h3>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-12 transition-colors hover:border-blue-500 hover:bg-blue-50/30">
              {previewUrl && analyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={previewUrl} alt="Label preview" className="max-h-32 rounded-lg object-contain" />
                  <Spinner label="AI analyzing label..." />
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Camera className="h-8 w-8 text-[#4B5563]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#1F2937]">Point camera at label or upload photo</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                  <p className="mt-3 text-xs font-medium text-[#6B7280]">Accepted: JPG, PNG, HEIC</p>
                </>
              )}
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-[#111827]">Recently Scanned</h3>
            {loadingRecent ? (
              <Spinner label="Loading recent scans..." />
            ) : recentScans.length === 0 ? (
              <p className="py-4 text-center text-sm font-medium text-[#6B7280]">No scans yet</p>
            ) : (
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <ImageIcon className="h-5 w-5 text-[#4B5563]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#111827]">{scan.product_name ?? 'Unknown product'}</p>
                      <p className="truncate text-xs font-medium text-[#4B5563]">{scan.manufacturer ?? 'Unknown manufacturer'}</p>
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
                  <h3 className="font-display text-lg font-bold text-[#111827]">Compliance Analysis</h3>
                  <p className="text-sm font-semibold text-[#1F2937]">Product: <span className="font-bold text-[#111827]">{analysis.product_name}</span></p>
                  <p className="text-xs font-medium text-[#4B5563]">Manufacturer: {analysis.manufacturer}</p>
                </div>
                <div
                  className={`rounded-xl border px-3 py-1.5 text-right ${
                    isCompliant
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-red-300 bg-red-50 text-red-900'
                  }`}
                >
                  <p className="text-xs font-bold">
                    {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </p>
                  <p className="text-[10px] font-semibold">
                    {violationCount} Violation{violationCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {violationCount > 0 && (
                <>
                  <h4 className="mb-3 text-sm font-bold text-[#111827] uppercase tracking-wide">Violations Detected</h4>
                  <div className="space-y-3">
                    {analysis.violations.map((v: LabelViolation, i: number) => {
                      const cfg = severityConfig[v.severity] ?? severityConfig.minor;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border border-gray-200 border-l-4 bg-white p-4 ${
                            v.severity === 'critical' ? 'border-l-red-600' : v.severity === 'major' ? 'border-l-orange-500' : 'border-l-amber-500'
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${v.severity === 'critical' ? 'text-red-700' : v.severity === 'major' ? 'text-orange-700' : 'text-amber-700'}`} />
                            <Badge color={cfg.color}>{cfg.label}</Badge>
                          </div>
                          <p className="text-sm font-bold text-[#111827]">{v.type}</p>
                          <p className="mt-1 text-xs font-medium text-[#4B5563]">{v.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {violationCount === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-700" />
                  <p className="mt-3 text-sm font-bold text-emerald-900">No violations detected</p>
                  <p className="mt-1 text-xs font-medium text-[#4B5563]">This label appears to be PCR 2011 compliant</p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800">
                  <FileText className="h-4 w-4" />
                  Generate Form 16 Report
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition-all hover:bg-gray-50">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Compliant
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <Camera className="h-12 w-12 text-[#6B7280]" />
              <p className="mt-4 text-sm font-semibold text-[#1F2937]">Upload a label to see AI compliance analysis</p>
              <p className="mt-1 text-xs font-medium text-[#6B7280]">Results powered by Google Gemini Vision</p>
            </div>
          )}
        </GlassCard>
      </div>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
