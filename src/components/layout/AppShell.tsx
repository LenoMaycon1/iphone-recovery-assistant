import { Menu, Smartphone, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { NAVIGATION_ITEMS, type PageId } from '@/lib/navigation';
import type { UsbStatus } from '@/hooks/useUsbMonitor';

interface AppShellProps {
  activePage: PageId;
  usbStatus: UsbStatus;
  appVersion: string;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
}

export default function AppShell({ activePage, usbStatus, appVersion, onNavigate, children }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const activeItem = NAVIGATION_ITEMS.find((item) => item.id === activePage);

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-graphite-900/70 backdrop-blur-xl lg:block">
        <Sidebar
          activePage={activePage}
          usbStatus={usbStatus}
          appVersion={appVersion}
          onNavigate={handleNavigate}
        />
      </aside>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/[0.08] bg-graphite-900 shadow-card animate-fade-in">
            <Sidebar
              activePage={activePage}
              usbStatus={usbStatus}
              appVersion={appVersion}
              onNavigate={handleNavigate}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-graphite-950/70 px-4 py-3 backdrop-blur-xl sm:px-8 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-graphite-200 transition hover:bg-white/5"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Smartphone className="h-4 w-4 text-electric-400" />
            {activeItem?.label}
          </div>
          <span className="w-10" />
        </header>

        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div key={activePage} className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 animate-fade-in sm:px-8 sm:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
