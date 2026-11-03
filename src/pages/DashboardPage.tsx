import { Activity, BarChart3, Cable, CalendarDays, Clock, Plus, Smartphone, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import type { UsbStatus } from '@/hooks/useUsbMonitor';
import { computeServiceStats } from '@/lib/serviceStats';
import { formatDateTime } from '@/lib/format';
import { CONNECTION_MODE_INFO, type ConnectedDevice } from '@/lib/usb';
import type { LastDevice } from '@/lib/preferences';
import type { PageId } from '@/lib/navigation';
import type { ServiceRecord } from '@/lib/serviceRecords';

const STATUS_COPY: Record<UsbStatus, { title: string; description: string; tone: 'blue' | 'amber' | 'red' | 'neutral' | 'green' }> = {
  connected: { title: 'Aparelho Apple conectado', description: 'O Windows reconheceu o dispositivo pela conexão USB.', tone: 'green' },
  disconnected: { title: 'Nenhum aparelho conectado', description: 'Conecte um iPhone com cabo USB para iniciar um atendimento.', tone: 'neutral' },
  error: { title: 'Falha na leitura USB', description: 'Não foi possível consultar o Windows. Verifique a conexão e tente novamente.', tone: 'red' },
  unsupported: { title: 'Detecção USB indisponível', description: 'A leitura USB funciona no aplicativo desktop para Windows.', tone: 'amber' },
};

interface DashboardPageProps {
  usbStatus: UsbStatus;
  devices: ConnectedDevice[];
  lastDevice: LastDevice | null;
  records: ServiceRecord[];
  historyLoading: boolean;
  historyError: string | null;
  onNavigate: (page: PageId) => void;
}

function StatCard({ icon: Icon, label, value, footer }: { icon: LucideIcon; label: string; value: ReactNode; footer?: ReactNode }) {
  return (
    <Card interactive className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-graphite-300">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/12 text-electric-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-semibold tabular-nums text-white">{value}</p>
      {footer}
    </Card>
  );
}

export default function DashboardPage({
  usbStatus,
  devices,
  lastDevice,
  records,
  historyLoading,
  historyError,
  onNavigate,
}: DashboardPageProps) {
  const stats = useMemo(() => computeServiceStats(records, new Date()), [records]);
  const statusCopy = STATUS_COPY[usbStatus];
  const maxDailyCount = Math.max(1, ...stats.lastSevenDays.map((day) => day.count));
  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Acompanhe a conexão do aparelho, os atendimentos realizados e o histórico recente."
        actions={
          <Button onClick={() => onNavigate('connect')}>
            <Plus className="h-4 w-4" /> Novo atendimento
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="relative overflow-hidden xl:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-electric-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-graphite-850">
              {usbStatus === 'connected' ? (
                <Smartphone className="h-7 w-7 text-emerald-300" />
              ) : (
                <Cable className="h-7 w-7 text-graphite-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Status da conexão USB</h2>
                <Badge tone={statusCopy.tone}>{statusCopy.title}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-graphite-300">{statusCopy.description}</p>
              {usbStatus === 'connected' && devices.length > 0 && (
                <p className="text-sm text-graphite-200">
                  {devices.length === 1 ? '1 dispositivo Apple' : `${devices.length} dispositivos Apple`} reconhecido(s) pelo Windows.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-graphite-300">
            <Clock className="h-4 w-4 text-electric-400" /> Último aparelho conectado
          </div>
          {lastDevice ? (
            <div className="space-y-3">
              <p className="font-semibold text-white">{lastDevice.label}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={CONNECTION_MODE_INFO[lastDevice.mode].tone}>{CONNECTION_MODE_INFO[lastDevice.mode].label}</Badge>
              </div>
              <p className="text-xs text-graphite-400">Visto em {formatDateTime(lastDevice.seenAt)}</p>
              <p className="font-mono text-xs text-graphite-400">Série: {lastDevice.serialNumber ?? 'Não disponível'}</p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-graphite-400">Nenhum aparelho foi registrado ainda neste computador.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Activity} label="Atendimentos totais" value={stats.total} />
        <StatCard icon={CalendarDays} label="Neste mês" value={stats.thisMonth} />
        <StatCard
          icon={TriangleAlert}
          label="Recovery ou DFU"
          value={stats.attentionCases}
        />
        <StatCard
          icon={BarChart3}
          label="Últimos 7 dias"
          value={stats.lastSevenDays.reduce((sum, day) => sum + day.count, 0)}
          footer={
            <div className="flex h-12 items-end gap-1.5" aria-label="Atendimentos por dia nos últimos 7 dias">
              {stats.lastSevenDays.map((day, index) => (
                <div key={`${day.label}-${index}`} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-electric-700 to-electric-400 transition-all duration-500"
                    style={{ height: `${Math.max(6, (day.count / maxDailyCount) * 40)}px`, opacity: day.count ? 1 : 0.25 }}
                    title={`${day.label}: ${day.count}`}
                  />
                </div>
              ))}
            </div>
          }
        />
      </div>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Histórico de diagnósticos recentes</h2>
            <p className="text-sm text-graphite-400">Os cinco atendimentos mais recentes registrados.</p>
          </div>
          <Button variant="ghost" onClick={() => onNavigate('history')}>Ver histórico completo</Button>
        </div>

        {historyLoading && <p className="text-sm text-graphite-400">Carregando atendimentos...</p>}

        {!historyLoading && historyError && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{historyError}</p>
        )}

        {!historyLoading && !historyError && recentRecords.length === 0 && (
          <EmptyState
            icon={BarChart3}
            title="Nenhum diagnóstico registrado"
            description="Quando um diagnóstico for salvo, ele aparece aqui com data, modelo e resumo."
          />
        )}

        {recentRecords.length > 0 && (
          <ul className="divide-y divide-white/[0.06]">
            {recentRecords.map((record) => (
              <li key={record.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{record.deviceModel}</p>
                  <p className="truncate text-sm text-graphite-400">{record.diagnosis}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={CONNECTION_MODE_INFO[record.connectionMode].tone}>
                    {CONNECTION_MODE_INFO[record.connectionMode].label}
                  </Badge>
                  <span className="text-xs text-graphite-400">{formatDateTime(record.attendedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
