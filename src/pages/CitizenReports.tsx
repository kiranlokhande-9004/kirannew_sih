import { useEffect, useState, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { MapPin, Upload, Send, CheckCircle2, Clock, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const violationTypes = ['MRP Overcharge', 'Expired Product', 'Wrong Unit', 'Missing Info', 'Other'];

interface ComplaintRow {
  id: string;
  complaint_id: string;
  product_name: string;
  store_name: string | null;
  location: string | null;
  violation_type: string | null;
  status: string;
  created_at: string;
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
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComplaints();

    const channel = supabase
      .channel('citizen-complaints')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'citizen_complaints' }, (payload) => {
        setComplaints((prev) => [payload.new as ComplaintRow, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'citizen_complaints' }, (payload) => {
        const updated = payload.new as ComplaintRow;
        setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchComplaints() {
    try {
      const { data } = await supabase
        .from('citizen_complaints')
        .select('id, complaint_id, product_name, store_name, location, violation_type, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      setComplaints((data ?? []) as ComplaintRow[]);
    } catch {
      // silent
    } finally {
      setLoadingComplaints(false);
    }
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  }

  async function handleSubmit() {
    if (!form.product || !form.type) {
      showToast('Please fill in product name and violation type', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const complaintId = `PCK-${Date.now().toString().slice(-4)}`;

      let photoUrl: string | null = null;
      if (photoFile) {
        const fileName = `complaint-${complaintId}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('complaint-photos')
          .upload(fileName, photoFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('complaint-photos').getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('citizen_complaints').insert({
        complaint_id: complaintId,
        product_name: form.product,
        store_name: form.store || null,
        location: form.location || null,
        violation_type: form.type,
        mrp_on_label: form.mrp ? parseFloat(form.mrp) : null,
        price_charged: form.charged ? parseFloat(form.charged) : null,
        description: form.description || null,
        photo_url: photoUrl,
        status: 'pending',
      });

      if (error) throw error;

      showToast(`Complaint ${complaintId} submitted successfully`, 'success');

      setForm({ product: '', store: '', location: '', type: '', mrp: '', charged: '', description: '' });
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      showToast('Something went wrong. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">Citizen Reports</h2>
        <p className="text-sm text-text-secondary">Submit and track consumer compliance complaints</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — Form */}
        <GlassCard hover={false} className="p-6">
          <h3 className="mb-5 font-display text-lg font-semibold text-text-primary">Submit a Complaint</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Product Name</label>
              <input
                type="text"
                value={form.product}
                onChange={(e) => handleChange('product', e.target.value)}
                placeholder="e.g. Haldiram Aloo Bhujia 200g"
                className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Store Name</label>
              <input
                type="text"
                value={form.store}
                onChange={(e) => handleChange('store', e.target.value)}
                placeholder="e.g. Sharma Kirana Store"
                className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Dadar, Mumbai"
                  className="w-full rounded-lg border border-border bg-surface-subtle py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Violation Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
              >
                <option value="" className="bg-surface-base">Select violation type...</option>
                {violationTypes.map((t) => (
                  <option key={t} value={t} className="bg-surface-base">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">MRP on Label</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">₹</span>
                  <input
                    type="number"
                    value={form.mrp}
                    onChange={(e) => handleChange('mrp', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-surface-subtle py-2.5 pl-8 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Price Charged</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">₹</span>
                  <input
                    type="number"
                    value={form.charged}
                    onChange={(e) => handleChange('charged', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-surface-subtle py-2.5 pl-8 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Describe the violation in detail..."
                className="w-full resize-none rounded-lg border border-border bg-surface-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-brand-blue focus:bg-surface-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Upload Photo</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-subtle py-6 transition-colors hover:border-brand-blue/40 hover:bg-brand-blue-light/30"
              >
                <Upload className="h-6 w-6 text-text-secondary" />
                <p className="mt-2 text-xs text-text-secondary">
                  {photoFile ? photoFile.name : 'Click or drag to upload evidence'}
                </p>
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Spinner label="" className="py-0" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Report Violation
                </>
              )}
            </button>
          </div>
        </GlassCard>

        {/* RIGHT — Recent complaints */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-semibold text-text-primary">Recent Verified Complaints</h3>
            <Badge color="green">
              <CheckCircle2 className="h-3 w-3" />
              AI Verified
            </Badge>
          </div>

          {loadingComplaints ? (
            <Spinner label="Loading complaints..." />
          ) : complaints.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">No complaints yet</p>
          ) : (
            complaints.map((c) => (
              <GlassCard key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-text-muted">#{c.complaint_id}</span>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{c.product_name}</p>
                    <p className="text-xs text-text-secondary">{c.store_name ?? '—'} · {c.location ?? '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge color={c.violation_type === 'MRP Overcharge' ? 'red' : c.violation_type === 'Expired Product' ? 'orange' : c.violation_type === 'Wrong Unit' ? 'violet' : 'blue'}>
                      {c.violation_type ?? 'Other'}
                    </Badge>
                    {c.status === 'verified' ? (
                      <Badge color="green">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified — Sent to Inspector
                      </Badge>
                    ) : c.status === 'rejected' ? (
                      <Badge color="red">
                        <Clock className="h-3 w-3" />
                        Rejected
                      </Badge>
                    ) : (
                      <Badge color="orange">
                        <Clock className="h-3 w-3" />
                        Under Review
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-text-muted">{timeAgo(c.created_at)}</p>
              </GlassCard>
            ))
          )}

          <div className="flex items-start gap-3 rounded-lg border border-brand-blue/20 bg-brand-blue-light p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" />
            <p className="text-sm text-text-secondary">
              AI validates each complaint before forwarding to inspectors — reducing false reports by{' '}
              <span className="font-semibold text-brand-navy">78%</span>
            </p>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
