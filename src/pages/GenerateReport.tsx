import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import { Download, Camera, Eye, ShieldCheck } from 'lucide-react';

const violationTypes = [
  'Missing MRP',
  'Wrong Unit (non-metric)',
  'Missing Batch Number',
  'Font Size Below 1mm',
  'Incomplete Manufacturer Address',
  'Expired Product on Shelf',
  'No Manufacturing Date',
  'No Best Before Date',
];

export default function GenerateReport() {
  const [checked, setChecked] = useState<string[]>(['Missing MRP', 'Missing Batch Number']);

  const toggle = (item: string) => {
    setChecked((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">Generate Inspection Report — Form 16</h2>
        <p className="text-sm text-text-secondary">Legal Metrology Department, Maharashtra</p>
      </div>

      <GlassCard hover={false} className="p-6">
        {/* Inspector details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Inspector Name</label>
            <input
              type="text"
              placeholder="Enter inspector name"
              className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Inspector ID</label>
            <input
              type="text"
              placeholder="e.g. LMD-MH-0421"
              className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Inspection Date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">District</label>
            <input
              type="text"
              placeholder="e.g. Mumbai City"
              className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Market / Area Name</label>
            <input
              type="text"
              placeholder="e.g. Dadar Market"
              className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Products Inspected</label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Violations Found</label>
              <input
                type="number"
                value={checked.length}
                readOnly
                className="w-full rounded-lg border border-brand-blue/20 bg-brand-blue-light px-4 py-2.5 text-sm font-semibold text-brand-navy outline-none"
              />
            </div>
          </div>
        </div>

        {/* Violations Summary */}
        <div className="mt-8">
          <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Violations Summary</h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {violationTypes.map((v) => (
              <button
                key={v}
                onClick={() => toggle(v)}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-subtle p-3 text-left transition-colors hover:bg-surface-base hover:border-border"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    checked.includes(v) ? 'border-brand-navy bg-brand-navy' : 'border-border-strong bg-surface-base'
                  }`}
                >
                  {checked.includes(v) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${checked.includes(v) ? 'text-text-primary' : 'text-text-secondary'}`}>{v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Evidence Attached */}
        <div className="mt-8">
          <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Evidence Attached</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-subtle transition-colors hover:border-brand-blue/30"
              >
                <Camera className="h-6 w-6 text-text-muted" />
                <span className="mt-2 text-[10px] text-text-muted">Photo {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface-base px-4 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-surface-subtle">
            <Eye className="h-4 w-4" />
            Preview Report
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-blue-hover">
            <Download className="h-4 w-4" />
            Download Form 16 PDF
          </button>
        </div>

        {/* Note */}
        <div className="mt-6 flex items-center gap-2 border-t border-border-subtle pt-4">
          <ShieldCheck className="h-4 w-4 text-semantic-success" />
          <p className="text-xs text-text-secondary">This report is digitally timestamped and tamper-proof</p>
        </div>
      </GlassCard>
    </div>
  );
}
