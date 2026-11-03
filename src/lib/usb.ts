import type { RawUsbDevice } from '@/types/desktop';

export type ConnectionMode = 'normal' | 'recovery' | 'dfu' | 'unknown';

export interface ConnectedDevice {
  id: string;
  label: string;
  productId: string;
  mode: ConnectionMode;
  detectedAt: string;
}

export const CONNECTION_MODE_INFO: Record<
  ConnectionMode,
  { label: string; description: string; tone: 'blue' | 'amber' | 'red' | 'neutral' }
> = {
  normal: {
    label: 'Modo normal',
    description: 'O aparelho é reconhecido pelo Windows e está pronto para leitura.',
    tone: 'blue',
  },
  recovery: {
    label: 'Recovery (USB)',
    description: 'Identificado pela porta USB. Aguarda confirmação da ferramenta de leitura.',
    tone: 'amber',
  },
  dfu: {
    label: 'DFU (USB)',
    description: 'Identificado pela porta USB. Aguarda confirmação da ferramenta de leitura.',
    tone: 'red',
  },
  unknown: {
    label: 'Não identificado',
    description: 'Dispositivo Apple encontrado, mas o modo não pôde ser determinado.',
    tone: 'neutral',
  },
};

const APPLE_VENDOR_PATTERN = /VID_05AC&PID_([0-9A-F]{4})/i;
const DFU_PRODUCT_IDS = ['1227'];
const RECOVERY_PRODUCT_IDS = ['1281'];
const DFU_NAME_PATTERN = /\bdfu\b/i;
const RECOVERY_NAME_PATTERN = /recovery/i;
const MOBILE_NAME_PATTERN = /iphone|ipad|ipod|apple mobile device/i;
const ACCESSORY_NAME_PATTERN = /keyboard|trackpad|mouse|ethernet|internet sharing|hub|headset|audio|camera|bluetooth|wireless/i;

export function classifyUsbDevice(raw: RawUsbDevice, detectedAt: string): ConnectedDevice | null {
  if (raw.instanceId.toUpperCase().includes('&MI_')) return null;

  const match = APPLE_VENDOR_PATTERN.exec(raw.instanceId);
  if (!match) return null;

  const productId = match[1].toUpperCase();
  const name = raw.friendlyName;
  const dfuSignal = DFU_PRODUCT_IDS.includes(productId) || DFU_NAME_PATTERN.test(name);
  const recoverySignal = RECOVERY_PRODUCT_IDS.includes(productId) || RECOVERY_NAME_PATTERN.test(name);
  const mobileSignal = MOBILE_NAME_PATTERN.test(name) || dfuSignal || recoverySignal;

  if (!mobileSignal || ACCESSORY_NAME_PATTERN.test(name)) return null;

  let mode: ConnectionMode;
  if (dfuSignal && recoverySignal) {
    mode = 'unknown';
  } else if (dfuSignal) {
    mode = 'dfu';
  } else if (recoverySignal) {
    mode = 'recovery';
  } else if (MOBILE_NAME_PATTERN.test(name)) {
    mode = 'normal';
  } else {
    mode = 'unknown';
  }

  return {
    id: raw.instanceId,
    label: name || 'Dispositivo Apple',
    productId,
    mode,
    detectedAt,
  };
}
