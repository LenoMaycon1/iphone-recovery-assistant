import type { ConnectedDevice } from '@/lib/usb';
import type { DeviceDetails, InspectionResult } from '@/types/desktop';

export type SessionState = 'disconnected' | 'connected' | 'recovery' | 'dfu' | 'partial' | 'trust-pending';

export interface SessionNotice {
  tone: 'amber' | 'red';
  title: string;
  message: string;
}

export interface DeviceSnapshot {
  device: ConnectedDevice;
  details: DeviceDetails | null;
}

export interface DeviceSession {
  state: SessionState;
  device: ConnectedDevice | null;
  details: DeviceDetails | null;
  notice: SessionNotice | null;
  isInspecting: boolean;
  isReleased: boolean;
  refresh: () => Promise<void>;
  release: () => void;
}

export const SESSION_STATE_INFO: Record<
  SessionState,
  { label: string; description: string; tone: 'green' | 'amber' | 'red' | 'neutral' }
> = {
  disconnected: {
    label: 'Desconectado',
    description: 'Nenhum aparelho Apple está em atendimento nesta sessão.',
    tone: 'neutral',
  },
  connected: {
    label: 'Conectado',
    description: 'O aparelho está comunicando com o Windows.',
    tone: 'green',
  },
  recovery: {
    label: 'Recovery Mode confirmado',
    description: 'O modo Recovery foi confirmado pela ferramenta de leitura.',
    tone: 'amber',
  },
  dfu: {
    label: 'DFU confirmado',
    description: 'O modo DFU foi confirmado pela ferramenta de leitura.',
    tone: 'red',
  },
  partial: {
    label: 'Identificação parcial',
    description:
      'A porta USB indica um modo de recuperação, mas a ferramenta ainda não confirmou. Não execute procedimentos com base apenas nesta identificação.',
    tone: 'amber',
  },
  'trust-pending': {
    label: 'Aguardando autorização de confiança',
    description: 'O iPhone precisa ser autorizado a confiar neste computador antes da leitura.',
    tone: 'amber',
  },
};

export function deriveSessionState(
  device: ConnectedDevice | null,
  inspection: InspectionResult | null,
): SessionState {
  if (!device) return 'disconnected';
  if (inspection?.status === 'trust-pending') return 'trust-pending';
  if (device.mode === 'recovery' || device.mode === 'dfu') {
    return inspection?.confirmedMode === device.mode ? device.mode : 'partial';
  }
  return 'connected';
}

export function noticeFromInspection(inspection: InspectionResult | null): SessionNotice | null {
  if (!inspection?.message) return null;
  switch (inspection.status) {
    case 'driver-missing':
      return { tone: 'red', title: 'Driver da Apple não encontrado', message: inspection.message };
    case 'dll-missing':
      return { tone: 'red', title: 'DLL ausente nas ferramentas', message: inspection.message };
    case 'tool-missing':
      return { tone: 'amber', title: 'Componente necessário ausente', message: inspection.message };
    case 'mode-mismatch':
      return { tone: 'red', title: 'Modo não confirmado', message: inspection.message };
    case 'read-error':
      return { tone: 'amber', title: 'Leitura indisponível', message: inspection.message };
    case 'trust-pending':
      return { tone: 'amber', title: 'Confirme no iPhone', message: inspection.message };
    case 'ok':
      return null;
  }
}
