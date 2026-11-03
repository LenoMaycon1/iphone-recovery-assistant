import { Smartphone } from 'lucide-react';
import { NAVIGATION_ITEMS, type PageId } from '@/lib/navigation';
import type { UsbStatus } from '@/hooks/useUsbMonitor';

const USB_STATUS_LABELS: Record<UsbStatus, { label: string; dot: string }> = {
  connected: { label: 'Aparelho Apple conectado', dot: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' },
  disconnected: { label: 'Nenhum aparelho Apple', dot: 'bg-graphite-500' },
  error: { label: 'Falha na leitura USB', dot: 'bg-red-400' },
  unsupported: { label: 'Detecção USB indisponível', dot: 'bg-amber-400' },
};

interface SidebarProps {
  activePage: PageId;
  usbStatus: UsbStatus;
  onNavigate: (page: PageId) => void;
  appVersion: string;
}

export default function Sidebar({ activePage, usbStatus, onNavigate, appVersion }: SidebarProps) {
  const status = USB_STATUS_LABELS[usbStatus];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric-400 to-electric-700 shadow-glow">
          <Smartphone className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">iPhone Recovery</p>
          <p className="text-xs text-graphite-400">Assistant</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Navegação principal">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = item.id === activePage;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition duration-200 ${
                isActive
                  ? 'bg-electric-500/12 text-white'
                  : 'text-graphite-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-electric-400" />
              )}
              <Icon
                className={`h-[18px] w-[18px] transition ${isActive ? 'text-electric-400' : 'text-graphite-400 group-hover:text-graphite-200'}`}
                strokeWidth={1.75}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 space-y-3 rounded-xl border border-white/[0.08] bg-graphite-850/80 p-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {usbStatus === 'connected' && (
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/60" />
            )}
            <span className={`relative h-2.5 w-2.5 rounded-full ${status.dot}`} />
          </span>
          <p className="text-xs font-medium text-graphite-200">{status.label}</p>
        </div>
        <p className="text-[11px] text-graphite-500">Versão {appVersion}</p>
      </div>
    </div>
  );
}
