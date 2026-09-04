import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-slide-up">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border bg-surface-base px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-text-primary">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display text-sm font-bold text-text-primary">PackCheck</span>
          <div className="w-6" />
        </div>

        <main className="flex-1 overflow-y-auto bg-surface-subtle p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
