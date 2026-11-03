import { AlertTriangle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import DeviceSessionPanel from '@/components/device/DeviceSessionPanel';
import type { UsbStatus } from '@/hooks/useUsbMonitor';
import type { DeviceSession, DeviceSnapshot } from '@/lib/deviceSession';
import { formatDateTime } from '@/lib/format';
import type { DriverServiceState } from '@/types/desktop';

const CONNECTION_STEPS = [
  'Conecte o iPhone ao computador com um cabo USB original ou certificado.',
  'Desbloqueie o aparelho e toque em "Confiar" quando ele perguntar se deve confiar no computador.',
  'Clique em ATUALIZAR DISPOSITIVOS para consultar o Windows.',
];

const DRIVER_SERVICE_INFO: Record<DriverServiceState, { label: string; tone: 'green' | 'amber' | 'red' | 'neutral' }> = {
  running: { label: 'Em execução', tone: 'green' },
  stopped: { label: 'Parado', tone: 'amber' },
  'not-installed': { label: 'Não instalado', tone: 'red' },
  unknown: { label: 'Não verificado', tone: 'neutral' },
};

interface ConnectDevicePageProps {
  usbStatus: UsbStatus;
  usbError: string | null;
  driverService: DriverServiceState;
  deviceCount: number;
  session: DeviceSession;
  isScanning: boolean;
  lastScanAt: string | null;
  onUseDevice: (snapshot: DeviceSnapshot) => void;
}

export default function ConnectDevicePage({
  usbStatus,
  usbError,
  driverService,
  deviceCount,
  session,
  isScanning,
  lastScanAt,
  onUseDevice,
}: ConnectDevicePageProps) {
  const isUnsupported = usbStatus === 'unsupported';
  const service = DRIVER_SERVICE_INFO[driverService];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Conexão"
        title="Conectar iPhone"
        description="Veja os aparelhos Apple reconhecidos pelo Windows. Os dados exibidos são apenas os que a conexão USB e as ferramentas oficiais fornecem."
        actions={
          <Button
            onClick={() => void session.refresh()}
            disabled={isUnsupported || isScanning}
            variant="secondary"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            ATUALIZAR DISPOSITIVOS
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Aparelho Apple</h2>
            {lastScanAt && (
              <span className="text-xs text-graphite-400">Última verificação: {formatDateTime(lastScanAt)}</span>
            )}
          </div>

          {isUnsupported ? (
            <EmptyState
              icon={Info}
              title="Detecção USB indisponível nesta visualização"
              description="A leitura USB funciona somente no aplicativo desktop para Windows instalado. Nenhum aparelho é exibido aqui porque não há conexão com o hardware."
            />
          ) : (
            <>
              {usbStatus === 'error' && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{usbError}</p>
                </div>
              )}
              <DeviceSessionPanel
                session={session}
                deviceCount={deviceCount}
                onRelease={session.release}
                onUseDevice={onUseDevice}
              />
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="h-fit space-y-5">
            <h2 className="text-base font-semibold text-white">Como conectar</h2>
            <ol className="space-y-4">
              {CONNECTION_STEPS.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-graphite-200">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-electric-500/15 text-xs font-semibold text-electric-300">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="rounded-xl border border-white/[0.06] bg-graphite-850/70 p-4 text-xs leading-relaxed text-graphite-400">
              Modelo, número de série e versão do iOS são lidos quando o Windows e as ferramentas oficiais liberam essas informações. O que não for lido aparece como não disponível.
            </div>
          </Card>

          {!isUnsupported && (
            <Card className="h-fit space-y-4">
              <h2 className="text-base font-semibold text-white">Componente Apple</h2>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-graphite-850/70 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-graphite-100">Serviço Apple Mobile Device</p>
                  <p className="text-xs text-graphite-400">Necessário para ler o aparelho.</p>
                </div>
                <Badge tone={service.tone}>{service.label}</Badge>
              </div>
              {driverService === 'running' ? (
                <p className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Serviço disponível para leitura.
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-graphite-400">
                  Instale o Apple Devices (Microsoft Store) ou o iTunes oficial da Apple e reinicie o computador se necessário.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
