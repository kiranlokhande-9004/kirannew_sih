import { useEffect, useState, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import ScoreBar from '@/components/ScoreBar';
import Spinner from '@/components/Spinner';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { Camera, Upload, CheckCircle2, XCircle, AlertTriangle, AlertCircle, Info, ImageIcon, Sparkles, BookOpen } from 'lucide-react';
import { supabase, type Scan } from '@/lib/supabase';
import { analyzeLabel, type LabelAnalysis, type LabelViolation } from '@/lib/gemini';

const severityConfig = {
  critical: { color: 'red' as const, icon: AlertTriangle, label: 'CRITICAL' },
  major: { color: 'orange' as const, icon: AlertCircle, label: 'MAJOR' },
  minor: { color: 'yellow' as const, icon: Info, label: 'MINOR' },
};

function getSanitizedStoragePath(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  const namePart = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
  const extPart = dotIndex !== -1 ? filename.slice(dotIndex + 1).toLowerCase() : 'jpg';

  // Replace whitespace with hyphens and encode for URL safety
  const cleanName = namePart.trim().replace(/\s+/g, '-');
  const encodedName = encodeURIComponent(cleanName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);

  return `scans/${timestamp}_${randomSuffix}_${encodedName}.${extPart}`;
}

function getLocalImageCache(key: string): string | null {
  try {
    return localStorage.getItem(`packcheck_img_${key}`);
  } catch {
    return null;
  }
}

function saveLocalImageCache(key: string, dataUrl: string) {
  try {
    if (dataUrl && dataUrl.length < 2000000) {
      localStorage.setItem(`packcheck_img_${key}`, dataUrl);
    }
  } catch {
    // ignore quota error
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export default function LabelScanner() {
  const { toasts, showToast, closeToast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LabelAnalysis | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentResultImageUrl, setCurrentResultImageUrl] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchRecentScans() {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.warn('Could not fetch scans from Supabase:', error.message);
        return;
      }
      setRecentScans((data ?? []) as Scan[]);
    } catch (err) {
      console.warn('Failed to load recent scans:', err);
    } finally {
      setLoadingRecent(false);
    }
  }

  useEffect(() => {
    fetchRecentScans();

    const channel = supabase
      .channel('scans-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scans' }, () => {
        fetchRecentScans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image (JPG, PNG, WebP)', 'error');
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setCurrentResultImageUrl(objectUrl);

    const startTime = Date.now();

    try {
      // 1. Generate safe storage file path with proper URL encoding for spaces and special characters
      const filePath = getSanitizedStoragePath(file.name);
      const dataUrl = await fileToDataUrl(file);

      // 2. Upload to Supabase Storage bucket "label-images"
      try {
        const { error: uploadError } = await supabase.storage
          .from('label-images')
          .upload(filePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.warn('Supabase storage upload notice:', uploadError.message);
        }
      } catch (storageErr) {
        console.warn('Storage bucket upload caught:', storageErr);
      }

      // 3. Generate public URL from Supabase Storage
      const { data: urlData } = supabase.storage
        .from('label-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || null;

      // Cache image data URL locally for resilient offline/fallback rendering
      if (dataUrl) {
        if (publicUrl) saveLocalImageCache(publicUrl, dataUrl);
        saveLocalImageCache(filePath, dataUrl);
      }

      if (publicUrl) {
        setCurrentResultImageUrl(publicUrl);
      }

      // 4. Call AI Analysis service (Rule 6 of PCR 2011)
      const aiResult = await analyzeLabel(file, filePath);

      // 5. Ensure loading spinner shows for AT LEAST 2 seconds (as requested)
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }

      setAnalysis(aiResult);

      // 6. Save full public URL into scans.image_url
      const newScan: Partial<Scan> = {
        image_url: publicUrl,
        product_name: aiResult.product_name,
        brand: aiResult.brand,
        is_compliant: aiResult.is_compliant,
        compliance_score: aiResult.compliance_score,
        violations: aiResult.violations,
        detected_text: aiResult.detected_text,
        analysis_result: {
          summary: aiResult.summary,
          violations: aiResult.violations,
        },
        created_at: new Date().toISOString(),
      };

      try {
        const { data: inserted, error: insertError } = await supabase
          .from('scans')
          .insert(newScan)
          .select();

        if (insertError) {
          console.warn('Notice: scans insert restricted by Supabase RLS policy:', insertError.message);
          const localId = `local-${Date.now()}`;
          if (dataUrl) saveLocalImageCache(localId, dataUrl);
          setRecentScans((prev) => [
            {
              id: localId,
              image_url: publicUrl,
              product_name: aiResult.product_name,
              brand: aiResult.brand,
              is_compliant: aiResult.is_compliant,
              compliance_score: aiResult.compliance_score,
              violations: aiResult.violations,
              detected_text: aiResult.detected_text,
              analysis_result: { summary: aiResult.summary },
              created_at: new Date().toISOString(),
            },
            ...prev.slice(0, 4),
          ]);
        } else if (inserted && inserted[0]) {
          const saved = inserted[0] as Scan;
          if (dataUrl && saved.id) saveLocalImageCache(saved.id, dataUrl);
          setRecentScans((prev) => [saved, ...prev.filter((p) => p.id !== saved.id).slice(0, 4)]);
        }
      } catch (insertErr) {
        console.warn('Insert scan exception:', insertErr);
      }

      showToast('Label analyzed successfully', 'success');
    } catch (err: unknown) {
      console.error('Scan failed:', err);
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }
      const errMsg = err instanceof Error ? err.message : 'Failed to analyze label image. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSelectRecent(scan: Scan) {
    setAnalysis({
      product_name: scan.product_name || 'Scanned Commodity',
      brand: scan.brand || 'Unspecified Brand',
      is_compliant: scan.is_compliant ?? true,
      compliance_score: scan.compliance_score ?? 100,
      violations: (scan.violations as LabelViolation[]) || [],
      detected_text: (scan.detected_text as Record<string, unknown>) || {},
      summary: (scan.analysis_result as { summary?: string })?.summary || 'Historical inspection record loaded from Supabase.',
    });
    if (scan.image_url) {
      setCurrentResultImageUrl(scan.image_url);
      setPreviewUrl(scan.image_url);
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
        <h2 className="font-display text-2xl font-bold text-[#111827]">AI Label Scanner</h2>
        <p className="text-sm font-medium text-[#6B7280]">
          Instant inspection and Legal Metrology (Packaged Commodities) Rules, 2011 compliance analysis
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          <GlassCard hover={false} className="p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-[#111827]">Upload Commodity Label</h3>

            <div
              onClick={() => !analyzing && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all p-8 cursor-pointer ${
                analyzing
                  ? 'border-blue-400 bg-blue-50/40 cursor-wait'
                  : 'border-gray-300 bg-gray-50/60 hover:border-blue-500 hover:bg-blue-50/30'
              }`}
            >
              {previewUrl && analyzing ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <img
                    src={previewUrl}
                    alt="Label preview"
                    className="max-h-44 max-w-full rounded-xl object-contain shadow-sm border border-gray-200"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Spinner label="Checking PCR 2011 declarations with Gemini..." />
                    <p className="text-xs font-medium text-[#4B5563]">Analyzing MRP, Net Qty, USP, and Manufacturer details</p>
                  </div>
                </div>
              ) : previewUrl && !analyzing ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <img
                    src={previewUrl}
                    alt="Label preview"
                    className="max-h-44 max-w-full rounded-xl object-contain shadow-sm border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 rounded-xl bg-white border border-gray-300 px-4 py-2 text-xs font-semibold text-[#111827] shadow-xs hover:bg-gray-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Different Label
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                    <Camera className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-[#111827]">Click or drag packaging label photo</p>
                  <p className="mt-1 text-xs font-medium text-[#6B7280]">
                    Uploads to Supabase Storage bucket <span className="font-mono text-blue-700 font-semibold">label-images</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Image File
                  </button>
                </>
              )}
            </div>
          </GlassCard>

          {/* RECENTLY SCANNED */}
          <GlassCard hover={false} className="p-6">
            <h3 className="mb-4 font-display text-lg font-bold text-[#111827]">Recently Scanned Packages</h3>
            {loadingRecent ? (
              <Spinner label="Loading recent scans from Supabase..." />
            ) : recentScans.length === 0 ? (
              <p className="py-6 text-center text-sm font-medium text-[#6B7280]">No recent scans found</p>
            ) : (
              <div className="space-y-3">
                {recentScans.map((scan) => {
                  const hasFailed = failedImageIds.has(scan.id);
                  const cachedFallback = getLocalImageCache(scan.id) || (scan.image_url ? getLocalImageCache(scan.image_url) : null);
                  const activeSrc = hasFailed ? cachedFallback : (scan.image_url || cachedFallback);

                  return (
                    <div
                      key={scan.id}
                      onClick={() => handleSelectRecent(scan)}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      title="Click to view inspection details"
                    >
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                        {activeSrc ? (
                          <img
                            src={activeSrc}
                            alt={scan.product_name || 'Scanned Commodity'}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={() => {
                              setFailedImageIds((prev) => new Set(prev).add(scan.id));
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-[#4B5563]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#111827]">{scan.product_name || 'Scanned Commodity'}</p>
                        <p className="truncate text-xs font-medium text-[#4B5563]">
                          {scan.brand || 'Unspecified Brand'} · Score: {scan.compliance_score}%
                        </p>
                      </div>
                      <Badge color={scan.is_compliant ? 'green' : 'red'}>
                        {scan.is_compliant ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* RIGHT PANEL: AI ANALYSIS RESULT */}
        <GlassCard hover={false} className="p-6">
          {analyzing && !analysis ? (
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center">
              <Spinner label="Analyzing PCR 2011 declarations..." />
              <p className="mt-3 text-xs font-semibold text-[#4B5563]">
                Checking against Indian Legal Metrology Rules, 2011
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-5">
              {/* Top Verdict Header */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-4">
                <div className="flex items-start gap-3">
                  {(currentResultImageUrl || previewUrl) && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-xs">
                      <img
                        src={currentResultImageUrl || previewUrl || ''}
                        alt={analysis.product_name || 'Inspected label'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const fallback = previewUrl || (currentResultImageUrl ? getLocalImageCache(currentResultImageUrl) : null);
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          } else {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-900">AI Inspection Result</span>
                    </div>
                    <h3 className="mt-1 font-display text-xl font-bold text-[#111827]">
                      {analysis.product_name}
                    </h3>
                    <p className="text-xs font-semibold text-[#4B5563]">
                      Brand / Manufacturer: <span className="font-bold text-[#111827]">{analysis.brand}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  {isCompliant ? (
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      STATUS: PASS
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-red-900 font-bold text-sm">
                      <XCircle className="h-4 w-4 text-red-700" />
                      STATUS: FAIL
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-[#4B5563] mt-1">
                    {violationCount === 0 ? 'Compliant' : `${violationCount} Violation${violationCount > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Compliance Score Bar */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#1F2937]">PCR Compliance Score</span>
                  <span className="text-base font-extrabold text-[#111827]">{analysis.compliance_score}/100</span>
                </div>
                <ScoreBar score={analysis.compliance_score} />
                <p className="mt-2 text-xs font-medium text-[#4B5563]">{analysis.summary}</p>
              </div>

              {/* Detected Declarations */}
              {analysis.detected_text && Object.keys(analysis.detected_text).length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] mb-2.5">
                    Extracted Mandatory Declarations
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(analysis.detected_text).map(([key, val]) => (
                      <div key={key} className="rounded-lg bg-gray-50 p-2 border border-gray-100">
                        <span className="font-semibold text-[#4B5563] capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <p className="font-bold text-[#111827] truncate mt-0.5">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Violations List with Legal Metrology Clause Reference */}
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  Violations & Legal Metrology Clause References
                </h4>

                {violationCount === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
                    <p className="mt-2 text-sm font-bold text-emerald-950">No Non-Compliances Detected</p>
                    <p className="mt-1 text-xs font-medium text-emerald-800">
                      The scanned label complies with Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysis.violations.map((v: LabelViolation, idx: number) => {
                      const cfg = severityConfig[v.severity as keyof typeof severityConfig] ?? severityConfig.minor;
                      const Icon = cfg.icon;

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border border-gray-200 border-l-4 bg-white p-4 shadow-2xs ${
                            v.severity === 'critical'
                              ? 'border-l-red-600'
                              : v.severity === 'major'
                              ? 'border-l-orange-500'
                              : 'border-l-amber-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="text-sm font-bold text-[#111827]">{v.type}</span>
                            </div>
                            <Badge color={cfg.color}>{cfg.label}</Badge>
                          </div>

                          <p className="text-xs font-medium text-[#374151] mb-2">{v.description}</p>

                          {v.clause_reference && (
                            <div className="flex items-start gap-1.5 rounded-lg bg-blue-50/80 px-2.5 py-1.5 border border-blue-200/70 text-xs text-blue-900 font-semibold">
                              <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-700" />
                              <span>{v.clause_reference}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700 mb-3">
                <Camera className="h-7 w-7" />
              </div>
              <p className="text-base font-bold text-[#111827]">Awaiting Label Scan</p>
              <p className="mt-1 max-w-xs text-xs font-medium text-[#6B7280]">
                Upload an FMCG or packaged goods label on the left to review automated PCR 2011 compliance scoring.
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
