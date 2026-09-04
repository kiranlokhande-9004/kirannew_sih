import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GlassCard from '@/components/GlassCard';
import Spinner from '@/components/Spinner';
import { supabase } from '@/lib/supabase';

interface MapViolation {
  id: string;
  product_name: string;
  brand: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  violation_types: string[] | null;
  severity: 'critical' | 'major' | 'minor' | string;
  description: string | null;
  clause_reference: string | null;
  status: string;
  created_at: string;
}

const severityColor: Record<string, string> = {
  critical: '#ef4444', // red
  major: '#f97316',    // orange
  minor: '#eab308',    // yellow
};

function createPinIcon(color: string, severity: string) {
  const size = 32;
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    ">${severity[0]?.toUpperCase() || '!'}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const filterPills = ['All', 'Critical', 'Major', 'Minor'];

export default function ViolationsMap() {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [pins, setPins] = useState<MapViolation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [mostAffected, setMostAffected] = useState('—');
  const [mostCommon, setMostCommon] = useState('—');

  async function fetchViolations() {
    try {
      const { data, error } = await supabase
        .from('violations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching violations:', error);
        return;
      }

      const rows = (data ?? []) as MapViolation[];
      setPins(rows);
      setTotalCount(rows.length);

      // Most affected area calculation
      const areaCounts: Record<string, number> = {};
      rows.forEach((r) => {
        if (r.location_name) {
          areaCounts[r.location_name] = (areaCounts[r.location_name] ?? 0) + 1;
        }
      });
      const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];
      if (topArea) setMostAffected(topArea[0]);

      // Most common violation calculation
      const typeCounts: Record<string, number> = {};
      rows.forEach((r) => {
        const types = Array.isArray(r.violation_types)
          ? r.violation_types
          : r.violation_types
          ? [String(r.violation_types)]
          : [];
        types.forEach((t) => {
          typeCounts[t] = (typeCounts[t] ?? 0) + 1;
        });
      });
      const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      if (topType) setMostCommon(topType[0]);
    } catch (err) {
      console.error('Failed to load violations map data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchViolations();

    // Supabase realtime for violations so new violations appear without manually refreshing
    const channel = supabase
      .channel('map-violations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'violations' }, () => {
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

  const filteredPins = pins.filter((p) => {
    if (activeFilter === 'All') return true;
    return p.severity.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#111827]">Mumbai Violation Heatmap</h2>
          <p className="text-sm font-medium text-[#4B5563]">Geographic distribution of Legal Metrology compliance violations</p>
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
            Live Supabase Data
          </span>
        </div>
      </div>

      {/* Map Card */}
      <GlassCard hover={false} className="overflow-hidden p-0 border border-gray-200">
        <div style={{ height: '520px', width: '100%' }}>
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner label="Loading live violations..." />
            </div>
          ) : (
            <MapContainer
              center={[19.0760, 72.8777]}
              zoom={11}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredPins.map((pin) => {
                const color = severityColor[pin.severity.toLowerCase()] ?? '#eab308';
                const violationList = Array.isArray(pin.violation_types)
                  ? pin.violation_types.join(', ')
                  : pin.violation_types || pin.description || 'Non-compliant declaration';

                return (
                  <Marker
                    key={pin.id}
                    position={[pin.latitude, pin.longitude]}
                    icon={createPinIcon(color, pin.severity)}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-1" style={{ minWidth: '220px', maxWidth: '280px' }}>
                        {/* Header: Product & Severity */}
                        <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-2">
                          <div>
                            <h4 className="font-bold text-sm text-[#111827] leading-snug">
                              {pin.product_name || 'Unspecified Commodity'}
                            </h4>
                            <p className="text-xs font-semibold text-[#4B5563]">
                              Brand: <span className="text-[#111827] font-bold">{pin.brand || 'Unbranded / Local'}</span>
                            </p>
                          </div>
                          <span
                            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: color }}
                          >
                            {pin.severity}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mt-2 space-y-1.5 text-xs">
                          <div>
                            <span className="font-semibold text-[#4B5563]">Location: </span>
                            <span className="font-medium text-[#111827]">{pin.location_name}</span>
                          </div>

                          <div>
                            <span className="font-semibold text-[#4B5563]">Violation: </span>
                            <span className="font-medium text-[#DC2626] font-semibold">{violationList}</span>
                          </div>

                          {pin.clause_reference && (
                            <div className="rounded bg-blue-50/80 p-1.5 border border-blue-200/60 mt-1">
                              <span className="font-semibold text-blue-900 block text-[11px]">PCR 2011 Clause:</span>
                              <span className="text-[11px] text-blue-800 font-medium">{pin.clause_reference}</span>
                            </div>
                          )}

                          {pin.description && pin.description !== violationList && (
                            <p className="text-[11px] text-[#4B5563] italic mt-1 border-t border-gray-100 pt-1">
                              {pin.description}
                            </p>
                          )}
                        </div>
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
          <p className="mt-1 text-sm font-medium text-[#1F2937]">Active Violations on Map</p>
        </GlassCard>
        <GlassCard glow="orange" className="p-5">
          <p className="font-display text-2xl font-bold text-[#111827] truncate">{mostAffected}</p>
          <p className="mt-1 text-sm font-medium text-[#1F2937]">Most Affected Area</p>
        </GlassCard>
        <GlassCard glow="blue" className="p-5">
          <p className="font-display text-2xl font-bold text-[#111827] truncate">{mostCommon}</p>
          <p className="mt-1 text-sm font-medium text-[#1F2937]">Most Common Violation</p>
        </GlassCard>
      </div>
    </div>
  );
}
