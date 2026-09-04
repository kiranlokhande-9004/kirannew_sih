import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GlassCard from '@/components/GlassCard';
import Spinner from '@/components/Spinner';
import { supabase } from '@/lib/supabase';

interface MapViolation {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  violation_types: string[];
  severity: string;
}

const severityColor: Record<string, string> = {
  critical: '#ef4444',
  major: '#f97316',
  minor: '#eab308',
};

function createPinIcon(color: string, count: number) {
  const size = count > 15 ? 44 : count > 5 ? 38 : 32;
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="width:${size}px;height:${size}px;background:${color};font-size:${count > 9 ? '13px' : '15px'}">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const filterPills = ['All', 'Food', 'Medicine', 'Cosmetics'];

export default function ViolationsMap() {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [pins, setPins] = useState<MapViolation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [mostAffected, setMostAffected] = useState('—');
  const [mostCommon, setMostCommon] = useState('—');

  useEffect(() => {
    async function fetchViolations() {
      try {
        const { data, error } = await supabase
          .from('violations')
          .select('id, location_name, latitude, longitude, violation_types, severity')
          .order('created_at', { ascending: false });

        if (error) return;

        const rows = (data ?? []) as MapViolation[];
        setPins(rows);
        setTotalCount(rows.length);

        // Most affected area
        const areaCounts: Record<string, number> = {};
        rows.forEach((r) => {
          areaCounts[r.location_name] = (areaCounts[r.location_name] ?? 0) + 1;
        });
        const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];
        if (topArea) setMostAffected(topArea[0]);

        // Most common violation type
        const typeCounts: Record<string, number> = {};
        rows.forEach((r) => {
          r.violation_types?.forEach((t) => {
            typeCounts[t] = (typeCounts[t] ?? 0) + 1;
          });
        });
        const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
        if (topType) setMostCommon(topType[0]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    fetchViolations();

    const channel = supabase
      .channel('map-violations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations' }, () => {
        fetchViolations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#111827]">Mumbai Violation Heatmap</h2>
          <p className="text-sm font-medium text-[#4B5563]">Geographic distribution of compliance violations</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setActiveFilter(pill)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeFilter === pill
                  ? 'bg-blue-50 text-blue-900 border border-blue-300 shadow-xs'
                  : 'bg-white text-[#1F2937] border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pill}
            </button>
          ))}
          <span className="ml-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-[#4B5563]">
            Last 30 days
          </span>
        </div>
      </div>

      {/* Map */}
      <GlassCard hover={false} className="overflow-hidden p-0 border border-gray-200">
        <div style={{ height: '500px', width: '100%' }}>
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner label="Loading violation data..." />
            </div>
          ) : (
            <MapContainer
              center={[19.076, 72.8777]}
              zoom={12}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {pins.map((pin) => {
                const color = severityColor[pin.severity] ?? '#eab308';
                return (
                  <Marker
                    key={pin.id}
                    position={[pin.latitude, pin.longitude]}
                    icon={createPinIcon(color, 1)}
                  >
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#111827' }}>
                          {pin.location_name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
                          {pin.violation_types?.length ?? 0} violation type(s)
                        </p>
                        <p style={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>
                          Last: {pin.violation_types?.[0] ?? 'Unknown'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </GlassCard>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard glow="red" className="p-5">
          <p className="font-display text-3xl font-bold text-[#111827]">{totalCount}</p>
          <p className="mt-1 text-sm font-medium text-[#1F2937]">Total Violations This Month</p>
        </GlassCard>
        <GlassCard glow="orange" className="p-5">
          <p className="font-display text-2xl font-bold text-[#111827]">{mostAffected}</p>
          <p className="mt-1 text-sm font-medium text-[#1F2937]">Most Affected Area</p>
        </GlassCard>
        <GlassCard glow="blue" className="p-5">
          <p className="font-display text-2xl font-bold text-[#111827]">{mostCommon}</p>
          <p className="mt-1 text-sm font-medium text-[#1F2937]">Most Common Violation</p>
        </GlassCard>
      </div>
    </div>
  );
}
