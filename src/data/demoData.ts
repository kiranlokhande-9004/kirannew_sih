export type Severity = 'critical' | 'major' | 'minor';

export interface Violation {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export interface RecentViolation {
  product: string;
  type: string;
  location: string;
  time: string;
}

export interface BrandScore {
  name: string;
  category: string;
  score: number;
  violations: number;
  status: 'Compliant' | 'Watch List' | 'Priority Inspection';
}

export interface Complaint {
  id: string;
  product: string;
  store: string;
  location: string;
  type: string;
  status: 'verified' | 'review';
  time: string;
}

export const recentViolations: RecentViolation[] = [
  { product: 'Haldiram Aloo Bhujia 200g', type: 'Wrong Unit', location: 'Dadar, Mumbai', time: '2 min ago' },
  { product: 'Priya Gold Atta 5kg', type: 'Missing MRP', location: 'Andheri West', time: '8 min ago' },
  { product: 'Local Masala Co. Haldi 100g', type: 'Font Too Small', location: 'Dharavi', time: '15 min ago' },
  { product: 'Britannia Bread 400g', type: 'Missing Batch No.', location: 'Bandra', time: '23 min ago' },
  { product: 'Eastern Condiments Pickle 200g', type: 'Wrong Unit', location: 'Colaba', time: '31 min ago' },
];

export const topViolatingBrands: { name: string; score: number }[] = [
  { name: 'Mehta & Sons', score: 14 },
  { name: 'Shree Traders', score: 22 },
  { name: 'Eastern Condiments', score: 38 },
  { name: 'Local Masala Co.', score: 41 },
  { name: 'Priya Gold', score: 54 },
];

export const pcrRules = [
  { label: 'MRP in ₹ format mandatory', compliant: true },
  { label: 'Weight in grams/ml only', compliant: true },
  { label: 'Missing batch number (most common)', compliant: false },
  { label: 'Font size below 1mm (second most common)', compliant: false },
];

export const demoViolations: Violation[] = [
  {
    id: 'v1',
    severity: 'critical',
    title: 'Weight unit non-compliant',
    detail: "Printed as '5 lbs' — PCR 2011 mandates metric units (kg/g) only",
  },
  {
    id: 'v2',
    severity: 'major',
    title: 'Manufacturer address incomplete',
    detail: 'State and PIN code missing from address field',
  },
  {
    id: 'v3',
    severity: 'minor',
    title: 'Font size below legal minimum',
    detail: 'MRP text measured at 0.6mm — minimum required is 1mm',
  },
];

export const brands: BrandScore[] = [
  { name: "Haldiram's", category: 'Snacks & Packaged Foods', score: 87, violations: 2, status: 'Compliant' },
  { name: 'Britannia', category: 'Bakery & Dairy', score: 82, violations: 3, status: 'Compliant' },
  { name: 'ITC Foods', category: 'Packaged Foods', score: 76, violations: 4, status: 'Compliant' },
  { name: 'Priya Gold', category: 'Biscuits & Snacks', score: 54, violations: 7, status: 'Watch List' },
  { name: 'Local Masala Co.', category: 'Spices', score: 41, violations: 9, status: 'Watch List' },
  { name: 'Eastern Condiments', category: 'Spices & Pickles', score: 38, violations: 11, status: 'Priority Inspection' },
  { name: 'Shree Traders', category: 'Grains & Pulses', score: 22, violations: 14, status: 'Priority Inspection' },
  { name: 'Mehta & Sons', category: 'General Merchandise', score: 14, violations: 18, status: 'Priority Inspection' },
];

export const complaints: Complaint[] = [
  {
    id: 'PCK-2847',
    product: 'Haldiram Aloo Bhujia 200g',
    store: 'Sharma Kirana Store',
    location: 'Dadar, Mumbai',
    type: 'MRP Overcharge',
    status: 'verified',
    time: '12 min ago',
  },
  {
    id: 'PCK-2846',
    product: 'Priya Gold Biscuits',
    store: 'Daily Needs Mart',
    location: 'Andheri West',
    type: 'Missing Info',
    status: 'verified',
    time: '34 min ago',
  },
  {
    id: 'PCK-2845',
    product: 'Eastern Pickle 200g',
    store: 'Fresh Mart',
    location: 'Bandra',
    type: 'Wrong Unit',
    status: 'review',
    time: '1 hr ago',
  },
  {
    id: 'PCK-2844',
    product: 'Local Masala Haldi 100g',
    store: 'Street Vendor #34',
    location: 'Dharavi',
    type: 'Expired Product',
    status: 'verified',
    time: '2 hr ago',
  },
];

export const mapPins = [
  {
    id: 1,
    name: 'Dadar Market',
    coords: [19.0178, 72.8478] as [number, number],
    color: '#ef4444',
    count: 23,
    detail: 'Missing MRP on 12 products',
  },
  {
    id: 2,
    name: 'Dharavi',
    coords: [19.0422, 72.8553] as [number, number],
    color: '#ef4444',
    count: 18,
    detail: 'Wrong unit labels on spices',
  },
  {
    id: 3,
    name: 'Andheri West',
    coords: [19.1197, 72.8468] as [number, number],
    color: '#f97316',
    count: 9,
    detail: 'Expired products still shelved',
  },
  {
    id: 4,
    name: 'Bandra',
    coords: [19.0544, 72.8402] as [number, number],
    color: '#f97316',
    count: 7,
    detail: 'Font size non-compliance',
  },
  {
    id: 5,
    name: 'Colaba',
    coords: [19.0223, 72.8343] as [number, number],
    color: '#eab308',
    count: 3,
    detail: 'Batch number missing',
  },
];
