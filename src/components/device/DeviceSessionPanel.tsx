import { AlertTriangle, Cable, Loader2, Smartphone, Unplug } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import DeviceInfoGrid from '@/components/device/DeviceInfoGrid';
import { SESSION_STATE_INFO, type DeviceSession, type DeviceSnapshot, type SessionNotice } from '@/lib/deviceSession';
import { formatDateTime } from '@/lib/format';

const NOTICE_TONE_CLASSES: Record<SessionNotice['tone'], string> = {
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  red: 'border-red-500/30 bg-red-500/10 text-red-100',
};

interface DeviceSessionPanelProps {
  session: DeviceSession;
  deviceCount: number;
  onRelease: () => void;
  onUseDevice: (snapshot: DeviceSnapshot) => void;
}

export default function DeviceSessionPanel({ session, deviceCount, onRelease, onUseDevice }: DeviceSessionPanelProps) {
  const { device, details, notice, state, isInspecting, isReleased } = session;

  if (!device) {
    return isReleased ? (
      <EmptyState
        icon={Unplug}
        title="Sessão encerrada"
        description="O aplicativo deixou de ler este aparelho. Ele pode continuar ligado ao Windows. Use ATUALIZAR DISPOSITIVOS para consultá-lo novamente."
      />
    ) : (
      <EmptyState
        icon={Cable}
        title="Nenhum aparelho Apple encontrado"
        description="Conecte o iPhone com cabo USB e confirme a permissão no aparelho. Depois clique em ATUALIZAR DISPOSITIVOS."
      />
    );
  }

  const info = SESSION_STATE_INFO[state];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-electric-500/15 text-electric-300">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">{device.label}</p>
            <p className="text-xs text-graphite-400">Detectado em {formatDateTime(device.detectedAt)}</p>
          </div>
        </div>
        <Badge tone={info.tone}>{info.label}</Badge>
      </div>

      <p className="text-sm leading-relaxed text-graphite-300">{info.description}</p>

      {isInspecting && (
        <p className="flex items-center gap-2 text-xs text-graphite-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Lendo informações do aparelho...
        </p>
      )}

      {notice && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${NOTICE_TONE_CLASSES[notice.tone]}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{notice.title}</p>
            <p className="mt-1">{notice.message}</p>
          </div>
        </div>
      )}

      {deviceCount > 1 && (
        <p className="rounded-xl border border-white/[0.06] bg-graphite-850/70 p-4 text-xs leading-relaxed text-graphite-400">
          Vários aparelhos Apple estão conectados. Apenas o primeiro é lido. Desconecte os demais para atender um aparelho por vez.
        </p>
      )}

      <DeviceInfoGrid device={device} details={details} showModeHeader={false} />

      <div className="flex flex-col gap-4 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-graphite-400">
          DESCONECTAR encerra a leitura deste aparelho no aplicativo. O cabo continua ligado; para desconectar fisicamente, retire o cabo.
        </p>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button variant="secondary" onClick={onRelease}>
            <Unplug className="h-4 w-4" />
            DESCONECTAR
          </Button>
          <Button onClick={() => onUseDevice({ device, details })}>Usar neste atendimento</Button>
        </div>
      </div>
    </div>
  );
}
