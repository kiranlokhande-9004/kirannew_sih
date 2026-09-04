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
        <h2 className="font-display text-2xl font-bold text-[#111827]">Generate Inspection Report — Form 16</h2>
        <p className="text-sm font-medium text-[#6B7280]">Legal Metrology Department, Maharashtra</p>
      </div>

      <GlassCard hover={false} className="p-6 border border-gray-200">
        {/* Inspector details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Inspector Name</label>
            <input
              type="text"
              placeholder="Enter inspector name"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Inspector ID</label>
            <input
              type="text"
              placeholder="e.g. LMD-MH-0421"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Inspection Date</label>
            <input
              type="date"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">District</label>
            <input
              type="text"
              placeholder="e.g. Mumbai City"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Market / Area Name</label>
            <input
              type="text"
              placeholder="e.g. Dadar Market"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Products Inspected</label>
              <input
                type="number"
                placeholder="0"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Violations Found</label>
              <input
                type="number"
                value={checked.length}
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-bold text-[#111827] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Violations Summary */}
        <div className="mt-8">
          <h3 className="mb-4 font-display text-base font-bold text-[#111827]">Violations Summary</h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {violationTypes.map((v) => {
              const isChecked = checked.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(v)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    isChecked
                      ? 'border-blue-300 bg-blue-50/60'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isChecked ? 'border-blue-700 bg-blue-700' : 'border-gray-400 bg-white'
                    }`}
                  >
                    {isChecked && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${isChecked ? 'font-bold text-[#111827]' : 'font-medium text-[#1F2937]'}`}>
                    {v}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Evidence Attached */}
        <div className="mt-8">
          <h3 className="mb-4 font-display text-base font-bold text-[#111827]">Evidence Attached</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 transition-colors hover:border-blue-500"
              >
                <Camera className="h-6 w-6 text-[#6B7280]" />
                <span className="mt-2 text-[10px] font-semibold text-[#6B7280]">Photo {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition-all hover:bg-gray-50">
            <Eye className="h-4 w-4" />
            Preview Report
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800">
            <Download className="h-4 w-4" />
            Download Form 16 PDF
          </button>
        </div>

        {/* Note */}
        <div className="mt-6 flex items-center gap-2 border-t border-gray-200 pt-4">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <p className="text-xs font-medium text-[#4B5563]">This report is digitally timestamped and tamper-proof</p>
        </div>
      </GlassCard>
    </div>
  );
}
