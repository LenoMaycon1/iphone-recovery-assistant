import Badge from '@/components/ui/Badge';
import { CONNECTION_MODE_INFO, type ConnectedDevice } from '@/lib/usb';
import type { DeviceDetails } from '@/types/desktop';
import { getIPhoneModelName } from '@/lib/iphoneModels';

const NOT_AVAILABLE = 'Não disponível nesta leitura';

interface DeviceInfoGridProps {
  device: ConnectedDevice;
  details?: DeviceDetails | null;
  deviceModel?: string;
  iosVersion?: string;
  showModeHeader?: boolean;
}

export default function DeviceInfoGrid({
  device,
  details,
  deviceModel,
  iosVersion,
  showModeHeader = true,
}: DeviceInfoGridProps) {
  const mode = CONNECTION_MODE_INFO[device.mode];

  const fields = [
    { label: 'Identificação USB', value: device.label },
    { label: 'Nome do dispositivo', value: details?.deviceName || NOT_AVAILABLE },
    { label: 'Identificador do modelo', value: details?.productType || NOT_AVAILABLE },
    { label: 'Número de série', value: details?.serialNumber || NOT_AVAILABLE },
    { label: 'Modelo do iPhone', value: deviceModel?.trim() || getIPhoneModelName(details?.productType) || NOT_AVAILABLE },
    { label: 'Versão do iOS', value: details?.iosVersion || iosVersion || NOT_AVAILABLE },
    {
      label: 'Proteção por código',
      value:
        details?.passcodeConfigured === true
          ? 'Habilitada pelo iOS (senha não pode ser lida via USB)'
          : details?.passcodeConfigured === false
            ? 'Não informada como habilitada pelo iOS'
            : NOT_AVAILABLE,
    },
    {
      label: 'Confiança deste computador',
      value:
        details?.trustedHostAttached === true
          ? 'Conexão confiável reconhecida'
          : details?.trustedHostAttached === false
            ? 'Não reconhecida nesta leitura'
            : NOT_AVAILABLE,
    },
    { label: 'Código do produto USB', value: device.productId },
  ];

  return (
    <div className="space-y-5">
      {showModeHeader && (
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={mode.tone}>{mode.label}</Badge>
          <p className="text-sm text-graphite-300">{mode.description}</p>
        </div>
      )}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-xl border border-white/[0.06] bg-graphite-850/70 p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-graphite-400">{field.label}</dt>
            <dd className="mt-1.5 break-all font-mono text-sm text-graphite-100">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
