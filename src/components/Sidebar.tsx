import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ScanLine, Map, Flag, BarChart3, FileText, ShieldCheck } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scanner', label: 'Label Scanner', icon: ScanLine },
  { to: '/map', label: 'Mumbai Violations Map', icon: Map },
  { to: '/reports', label: 'Citizen Reports', icon: Flag },
  { to: '/brands', label: 'Brand Scores', icon: BarChart3 },
  { to: '/report-form', label: 'Generate Report', icon: FileText },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 shadow-sm">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight text-[#111827]">PackCheck</h1>
          <p className="text-[11px] font-medium text-[#6B7280]">PCR Compliance Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gray-100 text-[#111827] font-semibold border border-gray-200'
                    : 'text-[#1F2937] hover:bg-gray-50 hover:text-[#111827] border border-transparent'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <p className="text-[11px] font-medium text-[#4B5563]">SIH 2026 · Legal Metrology Dept.</p>
        <p className="text-[10px] text-[#6B7280]">Government of Maharashtra</p>
      </div>
    </aside>
  );
}
