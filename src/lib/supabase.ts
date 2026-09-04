/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In-memory / localStorage data store for when Supabase is not connected
const SEED_VIOLATIONS = [
  {
    id: 'v1',
    product_name: 'Multiple Products',
    brand: 'Various',
    location_name: 'Dadar Market',
    latitude: 19.0178,
    longitude: 72.8478,
    violation_types: ['Missing MRP'],
    severity: 'critical',
    is_verified: true,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'v2',
    product_name: 'Spice Products',
    brand: 'Local Masala Co.',
    location_name: 'Dharavi',
    latitude: 19.0422,
    longitude: 72.8553,
    violation_types: ['Wrong Unit'],
    severity: 'critical',
    is_verified: true,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'v3',
    product_name: 'Expired Products',
    brand: 'Various',
    location_name: 'Andheri West',
    latitude: 19.1197,
    longitude: 72.8468,
    violation_types: ['Expired Product'],
    severity: 'major',
    is_verified: true,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'v4',
    product_name: 'Bakery Items',
    brand: 'Britannia',
    location_name: 'Bandra',
    latitude: 19.0544,
    longitude: 72.8402,
    violation_types: ['Font Too Small'],
    severity: 'major',
    is_verified: true,
    created_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
  },
  {
    id: 'v5',
    product_name: 'Packaged Goods',
    brand: 'Various',
    location_name: 'Colaba',
    latitude: 19.0223,
    longitude: 72.8343,
    violation_types: ['Missing Batch No.'],
    severity: 'minor',
    is_verified: true,
    created_at: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
  },
];

const SEED_BRANDS = [
  { id: 'b1', brand_name: "Haldiram's", category: 'Snacks & Packaged Foods', compliance_score: 87, total_violations: 2, status: 'compliant' },
  { id: 'b2', brand_name: 'Britannia', category: 'Bakery & Dairy', compliance_score: 82, total_violations: 3, status: 'compliant' },
  { id: 'b3', brand_name: 'ITC Foods', category: 'Packaged Foods', compliance_score: 76, total_violations: 4, status: 'compliant' },
  { id: 'b4', brand_name: 'Priya Gold', category: 'Biscuits & Snacks', compliance_score: 54, total_violations: 7, status: 'watchlist' },
  { id: 'b5', brand_name: 'Local Masala Co.', category: 'Spices', compliance_score: 41, total_violations: 9, status: 'watchlist' },
  { id: 'b6', brand_name: 'Eastern Condiments', category: 'Spices & Pickles', compliance_score: 38, total_violations: 11, status: 'priority' },
  { id: 'b7', brand_name: 'Shree Traders', category: 'Grains & Pulses', compliance_score: 22, total_violations: 14, status: 'priority' },
  { id: 'b8', brand_name: 'Mehta & Sons', category: 'General Merchandise', compliance_score: 14, total_violations: 18, status: 'priority' },
];

const SEED_COMPLAINTS = [
  {
    id: 'c1',
    complaint_id: 'PCK-2847',
    product_name: 'Haldiram Aloo Bhujia 200g',
    store_name: 'Sharma Kirana Store',
    location: 'Dadar, Mumbai',
    violation_type: 'MRP Overcharge',
    mrp_on_label: 35.0,
    price_charged: 42.0,
    description: 'Store charging more than printed MRP',
    status: 'verified',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'c2',
    complaint_id: 'PCK-2846',
    product_name: 'Priya Gold Biscuits',
    store_name: 'Daily Needs Mart',
    location: 'Andheri West',
    violation_type: 'Missing Info',
    mrp_on_label: 20.0,
    price_charged: 20.0,
    description: 'No batch number on package',
    status: 'verified',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'c3',
    complaint_id: 'PCK-2845',
    product_name: 'Eastern Pickle 200g',
    store_name: 'Fresh Mart',
    location: 'Bandra',
    violation_type: 'Wrong Unit',
    mrp_on_label: 45.0,
    price_charged: 45.0,
    description: 'Weight printed in ounces instead of grams',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'c4',
    complaint_id: 'PCK-2844',
    product_name: 'Local Masala Haldi 100g',
    store_name: 'Street Vendor #34',
    location: 'Dharavi',
    violation_type: 'Expired Product',
    mrp_on_label: 15.0,
    price_charged: 12.0,
    description: 'Product expired 2 months ago still on shelf',
    status: 'verified',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

const SEED_SCANS = [
  {
    id: 's1',
    product_name: 'Priya Gold Atta 5kg',
    manufacturer: 'Priya Gold Industries',
    violations_found: [{ type: 'Missing MRP', severity: 'critical', detail: 'MRP in ₹ missing from label' }],
    is_compliant: false,
    photo_url: null,
    scanned_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 's2',
    product_name: 'Britannia Milk Bread',
    manufacturer: 'Britannia Ltd',
    violations_found: [],
    is_compliant: true,
    photo_url: null,
    scanned_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

function getStoredTable<T>(tableName: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(`packcheck_${tableName}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [...defaultData];
}

function saveStoredTable<T>(tableName: string, data: T[]) {
  try {
    localStorage.setItem(`packcheck_${tableName}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

type EventListener = (payload: { new: any; old?: any }) => void;
const channelListeners: Record<string, { event: string; table: string; callback: EventListener }[]> = {};

function notifyListeners(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', item: any) {
  Object.values(channelListeners).forEach((listeners) => {
    listeners.forEach((l) => {
      if (l.table === table && (l.event === event || l.event === '*')) {
        try {
          l.callback({ new: item });
        } catch (e) {
          console.error(e);
        }
      }
    });
  });
}

function createMockClient() {
  const store: Record<string, any[]> = {
    violations: getStoredTable('violations', SEED_VIOLATIONS),
    brands: getStoredTable('brands', SEED_BRANDS),
    citizen_complaints: getStoredTable('citizen_complaints', SEED_COMPLAINTS),
    scans: getStoredTable('scans', SEED_SCANS),
  };

  const mock = {
    from(tableName: string) {
      let currentItems = [...(store[tableName] || [])];
      let isCountOnly = false;

      const queryBuilder = {
        select(fields?: string, options?: { count?: 'exact'; head?: boolean }) {
          if (options?.count === 'exact' && options?.head) {
            isCountOnly = true;
          }
          return queryBuilder;
        },
        eq(field: string, value: any) {
          currentItems = currentItems.filter((item) => item[field] === value);
          return queryBuilder;
        },
        gte(field: string, value: any) {
          currentItems = currentItems.filter((item) => new Date(item[field]) >= new Date(value));
          return queryBuilder;
        },
        order(field: string, options?: { ascending?: boolean }) {
          const asc = options?.ascending !== false;
          currentItems.sort((a, b) => {
            const valA = a[field];
            const valB = b[field];
            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
            return 0;
          });
          return queryBuilder;
        },
        limit(count: number) {
          currentItems = currentItems.slice(0, count);
          return queryBuilder;
        },
        async insert(recordOrRecords: any) {
          const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
          const inserted: any[] = [];
          for (const r of records) {
            const newItem = {
              id: r.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              created_at: new Date().toISOString(),
              scanned_at: new Date().toISOString(),
              ...r,
            };
            store[tableName] = [newItem, ...(store[tableName] || [])];
            saveStoredTable(tableName, store[tableName]);
            inserted.push(newItem);
            notifyListeners(tableName, 'INSERT', newItem);
          }
          return {
            data: Array.isArray(recordOrRecords) ? inserted : inserted[0],
            error: null,
            select() {
              return {
                single: async () => ({ data: inserted[0], error: null }),
              };
            },
          };
        },
        then(onfulfilled?: (value: { data: any[] | null; error: null; count?: number }) => any) {
          const result = {
            data: isCountOnly ? null : currentItems,
            error: null,
            count: currentItems.length,
          };
          return Promise.resolve(result).then(onfulfilled);
        },
      };

      return queryBuilder;
    },

    channel(name: string) {
      const listeners: { event: string; table: string; callback: EventListener }[] = [];
      channelListeners[name] = listeners;

      const ch = {
        on(_type: string, filter: { event: string; schema?: string; table: string }, cb: EventListener) {
          listeners.push({ event: filter.event, table: filter.table, callback: cb });
          return ch;
        },
        subscribe() {
          return ch;
        },
      };
      return ch;
    },

    removeChannel(channelObj: any) {
      Object.keys(channelListeners).forEach((k) => {
        if (channelListeners[k] === channelObj) {
          delete channelListeners[k];
        }
      });
    },

    storage: {
      from(_bucket: string) {
        return {
          async upload(fileName: string, file: File | Blob) {
            try {
              const url = URL.createObjectURL(file);
              return { data: { path: fileName, url }, error: null };
            } catch {
              return { data: { path: fileName }, error: null };
            }
          },
          getPublicUrl(fileName: string) {
            return {
              data: {
                publicUrl: `https://mock-storage.packcheck.local/${fileName}`,
              },
            };
          },
        };
      },
    },
  };

  return mock as any;
}

function formatSupabaseUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}.supabase.co`;
}

export interface Violation {
  id: string;
  product_name: string;
  brand: string | null;
  location_name: string;
  latitude: number;
  longitude: number;
  violation_types: string[];
  severity: 'critical' | 'major' | 'minor' | string;
  description: string | null;
  clause_reference: string | null;
  status: string;
  created_at: string;
}

export interface CitizenComplaint {
  id: string;
  product_name: string;
  brand: string | null;
  complaint_type: string;
  description: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  status: string;
  created_at: string;
}

export interface Brand {
  id: string;
  brand_name: string;
  total_scans: number;
  violations: number;
  compliance_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface Scan {
  id: string;
  image_url: string | null;
  product_name: string;
  brand: string;
  is_compliant: boolean;
  compliance_score: number;
  violations: any;
  detected_text: any;
  analysis_result: any;
  created_at?: string;
}

function getSupabaseClient() {
  const formattedUrl = formatSupabaseUrl(supabaseUrl);

  if (formattedUrl && supabaseKey) {
    try {
      return createClient(formattedUrl, supabaseKey);
    } catch (e) {
      console.warn('Failed to initialize real Supabase client, using fallback:', e);
    }
  }
  return createMockClient();
}

export const supabase = getSupabaseClient();
