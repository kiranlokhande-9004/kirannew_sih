import { useEffect, useState, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { MapPin, Upload, Send, CheckCircle2, Clock, Info } from 'lucide-react';
import { supabase, type CitizenComplaint } from '@/lib/supabase';

const complaintTypes = [
  'MRP Overcharge',
  'Expired Product',
  'Wrong Unit (non-metric)',
  'Missing Mandatory Information',
  'Incomplete Manufacturer Details',
  'Net Quantity Deficit',
  'Other PCR Violation'
];

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function CitizenReports() {
  const { toasts, showToast, closeToast } = useToast();
  const [form, setForm] = useState({
    product: '',
    store: '',
    location: '',
    type: '',
    mrp: '',
    charged: '',
    description: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<CitizenComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchComplaints() {
    try {
      const { data, error } = await supabase
        .from('citizen_complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching citizen complaints:', error);
        return;
      }
      setComplaints((data ?? []) as CitizenComplaint[]);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  }

  useEffect(() => {
    fetchComplaints();

    const channel = supabase
      .channel('citizen-complaints-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_complaints' }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  }

  async function handleSubmit() {
    if (!form.product.trim() || !form.type) {
      showToast('Please fill in product name and complaint type', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `complaint-${Date.now()}.${fileExt}`;
        try {
          const { error: uploadError } = await supabase.storage
            .from('complaint-photos')
            .upload(fileName, photoFile);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('complaint-photos')
              .getPublicUrl(fileName);
            photoUrl = urlData?.publicUrl || null;
          }
        } catch {
          // If bucket doesn't exist yet, proceed gracefully
          photoUrl = null;
        }
      }

      let fullDesc = form.description.trim();
      if (form.mrp || form.charged) {
        const priceInfo = `[MRP: ₹${form.mrp || 'N/A'}, Price Charged: ₹${form.charged || 'N/A'}]`;
        fullDesc = fullDesc ? `${priceInfo} ${fullDesc}` : priceInfo;
      }

      const payload = {
        product_name: form.product.trim(),
        brand: form.store.trim() || null,
        complaint_type: form.type,
        description: fullDesc || null,
        location_name: form.location.trim() || null,
        image_url: photoUrl,
        status: 'pending',
      };

      const { error } = await supabase.from('citizen_complaints').insert(payload);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      showToast('Consumer complaint registered successfully', 'success');

      setForm({ product: '', store: '', location: '', type: '', mrp: '', charged: '', description: '' });
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchComplaints();
    } catch (err) {
      console.error('Submit failed:', err);
      showToast('Failed to submit complaint. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#111827]">Citizen Reports</h2>
        <p className="text-sm font-medium text-[#6B7280]">Submit and track consumer Legal Metrology compliance complaints</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — Form */}
        <GlassCard hover={false} className="p-6">
          <h3 className="mb-5 font-display text-lg font-bold text-[#111827]">Submit a Complaint</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Product Name *</label>
              <input
                type="text"
                value={form.product}
                onChange={(e) => handleChange('product', e.target.value)}
                placeholder="e.g. Packaged Drinking Water 1L"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Brand / Retailer Store Name</label>
              <input
                type="text"
                value={form.store}
                onChange={(e) => handleChange('store', e.target.value)}
                placeholder="e.g. QuickMart / Demo Brand A"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Location / Market</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Dadar West Market, Mumbai"
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Complaint Type *</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select violation type...</option>
                {complaintTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">MRP on Label</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6B7280]">₹</span>
                  <input
                    type="number"
                    value={form.mrp}
                    onChange={(e) => handleChange('mrp', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-8 pr-4 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Price Charged</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6B7280]">₹</span>
                  <input
                    type="number"
                    value={form.charged}
                    onChange={(e) => handleChange('charged', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-8 pr-4 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Description & Evidence</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Describe the violation in detail (e.g. retailer charged ₹5 extra over printed MRP)..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1F2937]">Upload Photo Evidence (Optional)</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-5 transition-colors hover:border-blue-500 hover:bg-blue-50/30"
              >
                <Upload className="h-5 w-5 text-[#6B7280]" />
                <p className="mt-2 text-xs font-medium text-[#4B5563]">
                  {photoFile ? photoFile.name : 'Click to select label or receipt photo'}
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Spinner label="" className="py-0" />
                  Submitting to Supabase...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Report Violation to Inspectorate
                </>
              )}
            </button>
          </div>
        </GlassCard>

        {/* RIGHT — Complaints from Supabase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[#111827]">Recent Complaints</h3>
            <Badge color="blue">
              Realtime Supabase Live
            </Badge>
          </div>

          {loadingComplaints ? (
            <Spinner label="Loading citizen complaints from Supabase..." />
          ) : complaints.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-sm font-medium text-[#6B7280]">No citizen complaints registered yet.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Complaints submitted on the left appear here in realtime.</p>
            </GlassCard>
          ) : (
            complaints.map((c) => {
              const badgeColor =
                c.status === 'verified'
                  ? 'green'
                  : c.status === 'rejected'
                  ? 'red'
                  : c.status === 'investigating'
                  ? 'violet'
                  : 'orange';

              return (
                <GlassCard key={c.id} className="p-4 border border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-blue-700">
                          #{c.id.slice(0, 8)}
                        </span>
                        <Badge color={c.complaint_type?.includes('MRP') ? 'red' : 'blue'}>
                          {c.complaint_type}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-[#111827]">{c.product_name}</p>
                      <p className="text-xs font-medium text-[#4B5563]">
                        {c.brand ? `${c.brand} · ` : ''}{c.location_name ?? 'Location not specified'}
                      </p>
                      {c.description && (
                        <p className="mt-1 text-xs text-[#374151] bg-gray-50 rounded-lg p-2 border border-gray-100">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge color={badgeColor}>
                        {c.status === 'verified' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : c.status === 'investigating' ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Investigating
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {c.status || 'Pending'}
                          </span>
                        )}
                      </Badge>
                      <span className="text-[10px] font-medium text-[#6B7280]">
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}

          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <p className="text-sm font-medium text-[#1F2937]">
              Legal Metrology Inspectors cross-check citizen reports against registered packaged commodity standards before issuing inspection notices under the PCR 2011.
            </p>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
